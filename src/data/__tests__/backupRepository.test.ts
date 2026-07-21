import type { BackupDatabaseSnapshot } from "@/data/backupSnapshot";
import type { KidEduDatabase } from "@/data/database";
import { SQLiteKidEduRepository } from "@/data/repository";
import { schemaVersion } from "@/data/schema";

interface ForeignKeyViolation {
  table: string;
  rowid: number | null;
  parent: string;
  fkid: number;
}

class FakeBackupDatabase {
  readonly getAllQueries: string[] = [];
  readonly runCalls: Array<{ sql: string; params: unknown[] }> = [];
  committedTransactions = 0;
  rolledBackTransactions = 0;
  maxActiveTransactions = 0;
  private activeTransactions = 0;

  constructor(
    private readonly options: {
      foreignKeyViolations?: ForeignKeyViolation[];
      previousMediaUris?: string[];
      snapshotRows?: Partial<BackupDatabaseSnapshot>;
      storedSchemaVersion?: number;
    } = {}
  ) {}

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    if (!sql.includes("FROM schema_versions")) {
      throw new Error(`Unexpected first query: ${sql}`);
    }

    return { version: this.options.storedSchemaVersion ?? schemaVersion } as T;
  }

  async getAllAsync<T>(sql: string): Promise<T[]> {
    this.getAllQueries.push(sql);

    if (sql.includes("PRAGMA foreign_key_check")) {
      return (this.options.foreignKeyViolations ?? []) as T[];
    }

    if (sql.includes("SELECT DISTINCT uri") && sql.includes("FROM media_assets")) {
      return (this.options.previousMediaUris ?? []).map((uri) => ({ uri })) as T[];
    }

    const rows = this.options.snapshotRows;
    if (sql.includes("FROM children") && !sql.includes("JOIN media_assets")) {
      return (rows?.children ?? []) as T[];
    }
    if (sql.includes("FROM categories")) {
      return (rows?.categories ?? []) as T[];
    }
    if (sql.includes("FROM learning_items")) {
      return (rows?.learning_items ?? []) as T[];
    }
    if (sql.includes("FROM media_assets ma")) {
      return (rows?.media_assets ?? []) as T[];
    }
    if (sql.includes("FROM learning_item_media lim")) {
      return (rows?.learning_item_media ?? []) as T[];
    }
    if (sql.includes("FROM decks")) {
      return (rows?.decks ?? []) as T[];
    }
    if (sql.includes("FROM deck_items")) {
      return (rows?.deck_items ?? []) as T[];
    }
    if (sql.includes("FROM practice_sessions")) {
      return (rows?.practice_sessions ?? []) as T[];
    }
    if (sql.includes("FROM practice_events")) {
      return (rows?.practice_events ?? []) as T[];
    }
    if (sql.includes("FROM learning_progress")) {
      return (rows?.learning_progress ?? []) as T[];
    }
    if (sql.includes("FROM settings")) {
      return (rows?.settings ?? []) as T[];
    }

    throw new Error(`Unexpected all query: ${sql}`);
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    this.runCalls.push({ sql, params });
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

describe("SQLiteKidEduRepository local backup", () => {
  it("creates a deterministic logical snapshot and prunes stale personalized media", async () => {
    const activeSession = {
      id: "session-active",
      child_id: "child-default",
      mode: "single_item" as const,
      deck_id: null,
      started_at: "2026-07-20T08:00:00.000Z",
      ended_at: null,
      status: "active" as const
    };
    const defaultAsset = makeMediaAsset("media-default", "default", "bundle://default/ba");
    const customAsset = makeMediaAsset(
      "media-custom",
      "custom",
      "file:///media/videos/custom/ba.mp4"
    );
    const customThumbnail = makeMediaAsset(
      "media-custom-thumb",
      "custom",
      "file:///media/thumbnails/custom/ba.jpg"
    );
    const db = new FakeBackupDatabase({
      snapshotRows: {
        media_assets: [defaultAsset, customAsset, customThumbnail],
        learning_item_media: [
          makeMediaMapping("map-default", "media-default", 0),
          makeMediaMapping("map-custom", "media-custom", 1)
        ],
        practice_sessions: [activeSession]
      }
    });
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    const snapshot = await repository.createBackupSnapshot();

    expect(snapshot.schemaVersion).toBe(schemaVersion);
    expect(snapshot.media_assets.map((asset) => asset.id)).toEqual([
      "media-default",
      "media-custom",
      "media-custom-thumb"
    ]);
    expect(snapshot.learning_item_media.map((mapping) => mapping.id)).toEqual([
      "map-default",
      "map-custom"
    ]);
    expect(snapshot.practice_sessions).toEqual([
      {
        ...activeSession,
        ended_at: snapshot.createdAt,
        status: "interrupted"
      }
    ]);

    const mediaQuery = db.getAllQueries.find((sql) => sql.includes("FROM media_assets ma"));
    expect(mediaQuery).toContain("ma.source = 'default'");
    expect(mediaQuery).toContain("lim.is_active = 1");
    expect(mediaQuery).toContain("avatar_asset_id");
    expect(mediaQuery).toContain("mapped_asset.thumbnail_asset_id");

    const mappingQuery = db.getAllQueries.find((sql) =>
      sql.includes("FROM learning_item_media lim")
    );
    expect(mappingQuery).toContain("ma.source = 'default'");
    expect(mappingQuery).toContain("lim.is_active = 1");
    expect(db.committedTransactions).toBe(1);
  });

  it("serializes backup reads through the same repository transaction queue", async () => {
    const db = new FakeBackupDatabase();
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await Promise.all([repository.createBackupSnapshot(), repository.createBackupSnapshot()]);

    expect(db.maxActiveTransactions).toBe(1);
    expect(db.committedTransactions).toBe(2);
  });

  it("replaces all data in foreign-key order and returns previous managed media URIs", async () => {
    const oldUris = ["file:///media/audio/custom/old.m4a", "file:///media/videos/custom/old.mp4"];
    const db = new FakeBackupDatabase({ previousMediaUris: oldUris });
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);
    const snapshot = makeCompleteSnapshot();

    await expect(repository.replaceFromBackup(snapshot)).resolves.toEqual(oldUris);

    const deletedTables = db.runCalls
      .map((call) => normalizeSql(call.sql).match(/^DELETE FROM ([a-z_]+)$/)?.[1])
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

    const insertedTables = db.runCalls
      .map((call) => normalizeSql(call.sql).match(/^INSERT INTO ([a-z_]+)/)?.[1])
      .filter((table): table is string => Boolean(table));
    expect(insertedTables).toEqual([
      "categories",
      "media_assets",
      "children",
      "learning_items",
      "decks",
      "settings",
      "learning_item_media",
      "deck_items",
      "practice_sessions",
      "practice_events",
      "learning_progress"
    ]);

    const sessionInsert = db.runCalls.find((call) =>
      normalizeSql(call.sql).startsWith("INSERT INTO practice_sessions")
    );
    expect(sessionInsert?.params.slice(-2)).toEqual([snapshot.createdAt, "interrupted"]);
    expect(db.committedTransactions).toBe(1);
    expect(db.rolledBackTransactions).toBe(0);
  });

  it("rejects a different schema before opening a destructive transaction", async () => {
    const db = new FakeBackupDatabase();
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);
    const snapshot = { ...makeCompleteSnapshot(), schemaVersion: schemaVersion + 1 };

    await expect(repository.replaceFromBackup(snapshot)).rejects.toThrow(
      "Unsupported KidEDU backup schema version"
    );
    expect(db.committedTransactions).toBe(0);
    expect(db.rolledBackTransactions).toBe(0);
    expect(db.runCalls).toEqual([]);
  });

  it("throws inside the transaction so a foreign-key violation rolls back the replace", async () => {
    const db = new FakeBackupDatabase({
      foreignKeyViolations: [{ table: "deck_items", rowid: 1, parent: "decks", fkid: 0 }]
    });
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.replaceFromBackup(makeCompleteSnapshot())).rejects.toThrow(
      "violates a foreign key in deck_items"
    );
    expect(db.committedTransactions).toBe(0);
    expect(db.rolledBackTransactions).toBe(1);
  });
});

function makeCompleteSnapshot(): BackupDatabaseSnapshot {
  const createdAt = "2026-07-20T09:00:00.000Z";

  return {
    schemaVersion,
    createdAt,
    children: [
      {
        id: "child-default",
        name: "Con",
        avatar_asset_id: null,
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    categories: [{ id: "cat-1", name: "Nhóm", sort_order: 1, is_default: 0 }],
    learning_items: [
      {
        id: "item-1",
        title: "mẹ",
        category_id: "cat-1",
        status: "active",
        learning_status: "practicing",
        note: null,
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    media_assets: [makeMediaAsset("media-1", "custom", "file:///media/audio/custom/new.m4a")],
    learning_item_media: [makeMediaMapping("mapping-1", "media-1", 1)],
    decks: [
      {
        id: "deck-1",
        title: "Bộ của con",
        description: null,
        status: "active",
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    deck_items: [
      { id: "deck-item-1", deck_id: "deck-1", learning_item_id: "item-1", sort_order: 1 }
    ],
    practice_sessions: [
      {
        id: "session-1",
        child_id: "child-default",
        mode: "auto_play_deck",
        deck_id: "deck-1",
        started_at: "2026-07-20T08:59:00.000Z",
        ended_at: null,
        status: "active"
      }
    ],
    practice_events: [
      {
        id: "event-1",
        session_id: "session-1",
        learning_item_id: "item-1",
        event_type: "viewed",
        created_at: "2026-07-20T08:59:10.000Z"
      }
    ],
    learning_progress: [
      {
        id: "progress-1",
        child_id: "child-default",
        learning_item_id: "item-1",
        view_count: 1,
        practice_count: 0,
        last_practiced_at: "2026-07-20T08:59:10.000Z",
        parent_mark: "practicing"
      }
    ],
    settings: [{ key: "learning.loopCount", value: "1", updated_at: createdAt }]
  };
}

function makeMediaAsset(
  id: string,
  source: "default" | "custom" | "generated",
  uri: string
): BackupDatabaseSnapshot["media_assets"][number] {
  return {
    id,
    type: uri.endsWith(".jpg") ? "thumbnail" : uri.endsWith(".m4a") ? "audio" : "video",
    source,
    uri,
    thumbnail_asset_id: id === "media-custom" ? "media-custom-thumb" : null,
    duration_ms: null,
    size_bytes: null,
    mime_type: null,
    status: "active",
    created_at: "2026-07-20T08:00:00.000Z",
    updated_at: "2026-07-20T08:00:00.000Z"
  };
}

function makeMediaMapping(
  id: string,
  mediaAssetId: string,
  isActive: number
): BackupDatabaseSnapshot["learning_item_media"][number] {
  return {
    id,
    learning_item_id: "item-1",
    media_asset_id: mediaAssetId,
    role: "mouth_video",
    priority: mediaAssetId === "media-default" ? 10 : 100,
    is_active: isActive,
    created_at: "2026-07-20T08:00:00.000Z"
  };
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}
