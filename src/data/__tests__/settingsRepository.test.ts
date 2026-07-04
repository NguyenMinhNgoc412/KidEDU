import type { KidEduDatabase } from "@/data/database";
import { SQLiteKidEduRepository } from "@/data/repository";
import { learningSettingKeys } from "@/data/seedData";
import type { LearningSettings } from "@/data/types";

interface SettingRecord {
  key: string;
  value: string;
  updated_at: string;
}

class FakeSettingsDatabase {
  constructor(private readonly rows: SettingRecord[]) {}

  async getAllAsync<T>(sql: string): Promise<T[]> {
    if (!sql.includes("FROM settings")) {
      throw new Error(`Unexpected query: ${sql}`);
    }

    const orderedRows = sql.includes("ORDER BY updated_at ASC")
      ? [...this.rows].sort((left, right) => left.updated_at.localeCompare(right.updated_at))
      : [...this.rows];

    return orderedRows.map(({ key, value }) => ({ key, value })) as T[];
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    const normalizedSql = sql.replace(/\s+/g, " ").trim();

    if (normalizedSql.startsWith("UPDATE settings SET value")) {
      const [value, updatedAt, key] = params as [string, string, string];
      for (const row of this.rows) {
        if (row.key === key) {
          row.value = value;
          row.updated_at = updatedAt;
        }
      }
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO settings")) {
      const [key, value, updatedAt] = params as [string, string, string, string];
      if (!this.rows.some((row) => row.key === key)) {
        this.rows.push({ key, value, updated_at: updatedAt });
      }
      return;
    }

    throw new Error(`Unexpected mutation: ${sql}`);
  }

  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    await callback();
  }

  getRows(key: string): SettingRecord[] {
    return this.rows.filter((row) => row.key === key);
  }
}

class TransactionGuardSettingsDatabase extends FakeSettingsDatabase {
  maxActiveTransactions = 0;
  private activeTransactions = 0;

  override async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    await Promise.resolve();
    await super.runAsync(sql, params);
  }

  override async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    if (this.activeTransactions > 0) {
      throw new Error("cannot start a transaction within a transaction");
    }

    this.activeTransactions += 1;
    this.maxActiveTransactions = Math.max(this.maxActiveTransactions, this.activeTransactions);

    try {
      await Promise.resolve();
      await callback();
    } finally {
      this.activeTransactions -= 1;
    }
  }
}

const threeLoopSettings: LearningSettings = {
  speedPreset: "fast",
  playbackSpeed: 1.15,
  loopMode: "three_times",
  loopCount: 3,
  reinforcementEnabled: false,
  sfxEnabled: true
};

describe("SQLiteKidEduRepository settings", () => {
  it("reads the newest duplicated setting row so old local data cannot override loop mode", async () => {
    const db = new FakeSettingsDatabase([
      { key: learningSettingKeys.loopMode, value: "once", updated_at: "2026-07-01T00:00:00.000Z" },
      { key: learningSettingKeys.speedPreset, value: "normal", updated_at: "2026-07-01T00:00:00.000Z" },
      { key: learningSettingKeys.loopMode, value: "three_times", updated_at: "2026-07-04T00:00:00.000Z" }
    ]);
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.getLearningSettings()).resolves.toMatchObject({
      loopMode: "three_times",
      loopCount: 3,
      playbackSpeed: 1,
      speedPreset: "normal"
    });
  });

  it("persists loop count and playback speed while updating every duplicated local setting row", async () => {
    const db = new FakeSettingsDatabase([
      { key: learningSettingKeys.loopMode, value: "once", updated_at: "2026-07-01T00:00:00.000Z" },
      { key: learningSettingKeys.loopMode, value: "continuous", updated_at: "2026-07-02T00:00:00.000Z" }
    ]);
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await repository.updateLearningSettings(threeLoopSettings);

    await expect(repository.getLearningSettings()).resolves.toEqual(threeLoopSettings);
    expect(db.getRows(learningSettingKeys.loopMode).map((row) => row.value)).toEqual(["three_times", "three_times"]);
    expect(db.getRows(learningSettingKeys.loopCount).map((row) => row.value)).toEqual(["3"]);
    expect(db.getRows(learningSettingKeys.playbackSpeed).map((row) => row.value)).toEqual(["1.15"]);
  });

  it("serializes concurrent settings writes so SQLite transactions are not nested", async () => {
    const db = new TransactionGuardSettingsDatabase([]);
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);
    const slowSettings: LearningSettings = {
      speedPreset: "slow",
      playbackSpeed: 0.85,
      loopMode: "once",
      loopCount: 1,
      reinforcementEnabled: true,
      sfxEnabled: false
    };

    await expect(Promise.all([
      repository.updateLearningSettings(threeLoopSettings),
      repository.updateLearningSettings(slowSettings)
    ])).resolves.toEqual([undefined, undefined]);
    expect(db.maxActiveTransactions).toBe(1);
  });

  it("prefers saved canonical loop count and playback speed over legacy defaults", async () => {
    const db = new FakeSettingsDatabase([
      { key: learningSettingKeys.speedPreset, value: "normal", updated_at: "2026-07-01T00:00:00.000Z" },
      { key: learningSettingKeys.playbackSpeed, value: "0.85", updated_at: "2026-07-04T00:00:00.000Z" },
      { key: learningSettingKeys.loopMode, value: "once", updated_at: "2026-07-01T00:00:00.000Z" },
      { key: learningSettingKeys.loopCount, value: "3", updated_at: "2026-07-04T00:00:00.000Z" }
    ]);
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.getLearningSettings()).resolves.toMatchObject({
      speedPreset: "slow",
      playbackSpeed: 0.85,
      loopMode: "three_times",
      loopCount: 3
    });
  });

  it("does not let newly seeded canonical defaults override older customized legacy settings", async () => {
    const db = new FakeSettingsDatabase([
      { key: learningSettingKeys.speedPreset, value: "fast", updated_at: "2026-07-01T00:00:00.000Z" },
      { key: learningSettingKeys.playbackSpeed, value: "1", updated_at: "2026-07-04T00:00:00.000Z" },
      { key: learningSettingKeys.loopMode, value: "three_times", updated_at: "2026-07-01T00:00:00.000Z" },
      { key: learningSettingKeys.loopCount, value: "1", updated_at: "2026-07-04T00:00:00.000Z" }
    ]);
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.getLearningSettings()).resolves.toMatchObject({
      speedPreset: "fast",
      playbackSpeed: 1.15,
      loopMode: "three_times",
      loopCount: 3
    });
  });
});
