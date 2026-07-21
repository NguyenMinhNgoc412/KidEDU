import type { KidEduDatabase } from "@/data/database";
import { defaultLearningSettings } from "@/data/learningSettings";
import { SQLiteKidEduRepository } from "@/data/repository";
import { learningSettingKeys, seedCategories, seedDecks, seedLearningItems } from "@/data/seedData";
import type { PrivacyDataSummary } from "@/data/types";

interface PrivacySummaryRow {
  learning_item_count: number;
  deck_count: number;
  practice_session_count: number;
  practice_event_count: number;
  learning_progress_count: number;
  personalized_media_count: number;
  personalized_media_bytes: number | null;
}

interface ForeignKeyViolation {
  table: string;
  rowid: number | null;
  parent: string;
  fkid: number;
}

class FakePrivacyDatabase {
  readonly getAllQueries: string[] = [];
  readonly getFirstQueries: string[] = [];
  readonly runCalls: Array<{ sql: string; params: unknown[] }> = [];
  committedTransactions = 0;
  rolledBackTransactions = 0;
  maxActiveTransactions = 0;
  private activeTransactions = 0;

  constructor(
    private readonly options: {
      foreignKeyViolations?: ForeignKeyViolation[];
      mediaUris?: string[];
      summary?: PrivacySummaryRow | null;
      throwOnSql?: string;
    } = {}
  ) {}

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    this.getFirstQueries.push(sql);

    if (sql.includes("AS learning_item_count")) {
      return (this.options.summary ?? null) as T | null;
    }

    throw new Error(`Unexpected first query: ${sql}`);
  }

  async getAllAsync<T>(sql: string): Promise<T[]> {
    this.getAllQueries.push(sql);

    if (sql.includes("PRAGMA foreign_key_check")) {
      return (this.options.foreignKeyViolations ?? []) as T[];
    }

    if (sql.includes("SELECT DISTINCT uri") && sql.includes("FROM media_assets")) {
      return (this.options.mediaUris ?? []).map((uri) => ({ uri })) as T[];
    }

    throw new Error(`Unexpected all query: ${sql}`);
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    this.runCalls.push({ sql, params });

    if (this.options.throwOnSql && normalizeSql(sql).includes(this.options.throwOnSql)) {
      throw new Error("forced mutation failure");
    }
  }

  async withExclusiveTransactionAsync(
    callback: (transaction: KidEduDatabase) => Promise<void>
  ): Promise<void> {
    await this.runTransaction(() => callback(this as unknown as KidEduDatabase));
  }

  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    await this.runTransaction(callback);
  }

  private async runTransaction(callback: () => Promise<void>): Promise<void> {
    this.activeTransactions += 1;
    this.maxActiveTransactions = Math.max(this.maxActiveTransactions, this.activeTransactions);

    try {
      await Promise.resolve();
      await callback();
      this.committedTransactions += 1;
    } catch (error) {
      this.rolledBackTransactions += 1;
      throw error;
    } finally {
      this.activeTransactions -= 1;
    }
  }
}

describe("SQLiteKidEduRepository privacy data controls", () => {
  it("returns a consistent summary of learning, history, and personalized media data", async () => {
    const expected: PrivacyDataSummary = {
      learningItemCount: 31,
      deckCount: 6,
      practiceSessionCount: 4,
      practiceEventCount: 17,
      learningProgressCount: 3,
      personalizedMediaCount: 5,
      personalizedMediaBytes: 12_345_678
    };
    const db = new FakePrivacyDatabase({
      summary: {
        learning_item_count: expected.learningItemCount,
        deck_count: expected.deckCount,
        practice_session_count: expected.practiceSessionCount,
        practice_event_count: expected.practiceEventCount,
        learning_progress_count: expected.learningProgressCount,
        personalized_media_count: expected.personalizedMediaCount,
        personalized_media_bytes: expected.personalizedMediaBytes
      }
    });
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.getPrivacyDataSummary()).resolves.toEqual(expected);

    const query = db.getFirstQueries[0];
    expect(query).toContain("COUNT(*) FROM learning_progress");
    expect(query).toContain("source IN ('custom', 'generated')");
    expect(query).toContain("COALESCE(SUM(size_bytes), 0)");
    expect(db.committedTransactions).toBe(1);
  });

  it("returns zeroes when the summary query has no row", async () => {
    const db = new FakePrivacyDatabase({ summary: null });
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.getPrivacyDataSummary()).resolves.toEqual({
      learningItemCount: 0,
      deckCount: 0,
      practiceSessionCount: 0,
      practiceEventCount: 0,
      learningProgressCount: 0,
      personalizedMediaCount: 0,
      personalizedMediaBytes: 0
    });
  });

  it("clears history in foreign-key order and resets every item learning status", async () => {
    const db = new FakePrivacyDatabase();
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await repository.clearLearningHistory();

    expect(db.runCalls.map((call) => normalizeSql(call.sql))).toEqual([
      "DELETE FROM practice_events",
      "DELETE FROM learning_progress",
      "DELETE FROM practice_sessions",
      "UPDATE learning_items SET learning_status = 'new', updated_at = ? WHERE learning_status != 'new'"
    ]);
    expect(db.runCalls[3]?.params).toEqual([expect.any(String)]);
    expect(db.committedTransactions).toBe(1);
  });

  it("rolls back the full history clear when a mutation fails", async () => {
    const db = new FakePrivacyDatabase({ throwOnSql: "DELETE FROM practice_sessions" });
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.clearLearningHistory()).rejects.toThrow("forced mutation failure");
    expect(db.committedTransactions).toBe(0);
    expect(db.rolledBackTransactions).toBe(1);
  });

  it("unlinks personalized assets safely and returns distinct file and blob URIs", async () => {
    const mediaUris = [
      "blob:kidedu/custom-audio",
      "file:///media/audio/custom/voice.m4a",
      "file:///media/audio/custom/voice.m4a"
    ];
    const db = new FakePrivacyDatabase({ mediaUris });
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.deleteAllPersonalizedMedia()).resolves.toEqual([
      "blob:kidedu/custom-audio",
      "file:///media/audio/custom/voice.m4a"
    ]);

    const mutations = db.runCalls.map((call) => normalizeSql(call.sql));
    expect(mutations[0]).toMatch(/^UPDATE children SET avatar_asset_id = NULL/);
    expect(mutations[1]).toMatch(/^DELETE FROM learning_item_media/);
    expect(mutations[2]).toMatch(/^UPDATE media_assets SET thumbnail_asset_id = NULL/);
    expect(mutations[3]).toBe("DELETE FROM media_assets WHERE source IN ('custom', 'generated')");
    expect(db.getAllQueries.some((query) => query.includes("PRAGMA foreign_key_check"))).toBe(true);
    expect(db.committedTransactions).toBe(1);
  });

  it("resets all data in one transaction and reseeds canonical fresh-install settings", async () => {
    const mediaUris = [
      "blob:kidedu/photo",
      "file:///media/images/custom/photo.jpg",
      "file:///media/images/custom/photo.jpg"
    ];
    const db = new FakePrivacyDatabase({ mediaUris });
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.resetAllLocalData()).resolves.toEqual([
      "blob:kidedu/photo",
      "file:///media/images/custom/photo.jpg"
    ]);

    const normalizedCalls = db.runCalls.map((call) => normalizeSql(call.sql));
    const deletedTables = normalizedCalls
      .map((sql) => sql.match(/^DELETE FROM ([a-z_]+)$/)?.[1])
      .filter((table): table is string => Boolean(table));
    expect(deletedTables).toEqual([
      "practice_events",
      "learning_progress",
      "practice_sessions",
      "deck_items",
      "learning_item_media",
      "learning_items",
      "decks",
      "children",
      "categories",
      "media_assets",
      "settings"
    ]);
    expect(normalizedCalls.some((sql) => sql.includes("schema_versions"))).toBe(false);

    expect(
      normalizedCalls.filter((sql) => sql.startsWith("INSERT OR IGNORE INTO categories"))
    ).toHaveLength(seedCategories.length);
    expect(
      normalizedCalls.filter((sql) => sql.startsWith("INSERT OR IGNORE INTO learning_items"))
    ).toHaveLength(seedLearningItems.length);
    expect(
      normalizedCalls.filter((sql) => sql.startsWith("INSERT OR IGNORE INTO decks"))
    ).toHaveLength(seedDecks.length);
    expect(
      normalizedCalls.filter((sql) => sql.startsWith("INSERT OR IGNORE INTO deck_items"))
    ).toHaveLength(seedDecks.reduce((count, deck) => count + deck.itemIds.length, 0));

    const seededSettings = new Map(
      db.runCalls
        .filter((call) => normalizeSql(call.sql).startsWith("INSERT OR IGNORE INTO settings"))
        .map((call) => [call.params[0] as string, call.params[1] as string])
    );
    expect(seededSettings).toEqual(
      new Map([
        [learningSettingKeys.speedPreset, defaultLearningSettings.speedPreset],
        [learningSettingKeys.playbackSpeed, String(defaultLearningSettings.playbackSpeed)],
        [learningSettingKeys.loopMode, defaultLearningSettings.loopMode],
        [learningSettingKeys.loopCount, String(defaultLearningSettings.loopCount)],
        [
          learningSettingKeys.reinforcementEnabled,
          defaultLearningSettings.reinforcementEnabled ? "true" : "false"
        ],
        [learningSettingKeys.sfxEnabled, defaultLearningSettings.sfxEnabled ? "true" : "false"]
      ])
    );
    expect(db.getFirstQueries).toEqual([]);
    expect(db.maxActiveTransactions).toBe(1);
    expect(db.committedTransactions).toBe(1);
  });

  it("rolls back the reset if reseeding fails after old rows were deleted", async () => {
    const db = new FakePrivacyDatabase({ throwOnSql: "INSERT OR IGNORE INTO learning_items" });
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.resetAllLocalData()).rejects.toThrow("forced mutation failure");
    expect(db.committedTransactions).toBe(0);
    expect(db.rolledBackTransactions).toBe(1);
  });

  it("serializes privacy reads and destructive writes through one queue", async () => {
    const db = new FakePrivacyDatabase({
      summary: {
        learning_item_count: 0,
        deck_count: 0,
        practice_session_count: 0,
        practice_event_count: 0,
        learning_progress_count: 0,
        personalized_media_count: 0,
        personalized_media_bytes: 0
      }
    });
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await Promise.all([repository.getPrivacyDataSummary(), repository.clearLearningHistory()]);

    expect(db.maxActiveTransactions).toBe(1);
    expect(db.committedTransactions).toBe(2);
  });
});

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}
