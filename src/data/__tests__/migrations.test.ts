import { migrateKidEduDatabase, type MigrationBindParams } from "@/data/migrations";
import { createSchemaSql, schemaVersion } from "@/data/schema";

class FakeMigrationDatabase {
  execSql: string[] = [];
  runCalls: Array<{ sql: string; params: MigrationBindParams }> = [];
  transactionCount = 0;

  constructor(private version: number | null) {}

  async execAsync(sql: string): Promise<void> {
    this.execSql.push(sql);
  }

  async getFirstAsync<T>(sql: string, params: MigrationBindParams): Promise<T | null> {
    void params;

    if (!sql.includes("FROM schema_versions")) {
      throw new Error(`Unexpected query: ${sql}`);
    }

    return this.version === null ? null : ({ version: this.version } as T);
  }

  async runAsync(sql: string, params: MigrationBindParams): Promise<void> {
    this.runCalls.push({ sql, params });

    if (sql.includes("INSERT INTO schema_versions")) {
      const [version] = params as [number];
      this.version = version;
      return;
    }

    throw new Error(`Unexpected mutation: ${sql}`);
  }

  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    this.transactionCount += 1;
    await callback();
  }

  get currentVersion(): number | null {
    return this.version;
  }
}

describe("migrateKidEduDatabase", () => {
  it("applies the initial schema and records the schema version on first install", async () => {
    const db = new FakeMigrationDatabase(null);

    await migrateKidEduDatabase(db);

    expect(db.execSql).toContain(createSchemaSql);
    expect(db.currentVersion).toBe(schemaVersion);
    expect(db.transactionCount).toBe(1);
  });

  it("does not rerun schema migrations when the local database is already current", async () => {
    const db = new FakeMigrationDatabase(schemaVersion);

    await migrateKidEduDatabase(db);

    expect(db.execSql).not.toContain(createSchemaSql);
    expect(db.runCalls).toEqual([]);
    expect(db.currentVersion).toBe(schemaVersion);
  });

  it("stops when local data comes from a newer app schema", async () => {
    const db = new FakeMigrationDatabase(schemaVersion + 1);

    await expect(migrateKidEduDatabase(db)).rejects.toThrow("newer than app schema version");
    expect(db.execSql).not.toContain(createSchemaSql);
    expect(db.runCalls).toEqual([]);
  });

  it("fails fast when the app target version has no complete migration path", async () => {
    const db = new FakeMigrationDatabase(schemaVersion);

    await expect(migrateKidEduDatabase(db, schemaVersion + 1)).rejects.toThrow(
      `Missing KidEDU local database migration v${schemaVersion + 1}`
    );
    expect(db.currentVersion).toBe(schemaVersion);
  });
});
