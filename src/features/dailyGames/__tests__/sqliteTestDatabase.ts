/* eslint-disable @typescript-eslint/no-require-imports -- Node-only real SQLite test adapter. */
const { createRequire } = require("node:module");
const { join } = require("node:path");
const { DatabaseSync } = createRequire(join(process.cwd(), "package.json"))("node:sqlite");
import type { RuntimeDatabase } from "../../lessonRuntime/runtimeRepository";

export class TestDailyDatabase implements RuntimeDatabase {
  readonly connection = new DatabaseSync(":memory:");
  afterOutbox: (() => void) | null = null;
  async execAsync(sql: string) {
    this.connection.exec(sql);
  }
  async runAsync(sql: string, params: (string | number | null)[]) {
    const result = this.connection.prepare(sql).run(...params) as { changes: number };
    if (sql.startsWith("INSERT INTO daily_checkpoint_outbox")) this.afterOutbox?.();
    return result;
  }
  async getFirstAsync<T>(sql: string, params: (string | number | null)[]) {
    return (this.connection.prepare(sql).get(...params) ?? null) as T | null;
  }
  async getAllAsync<T>(sql: string, params: (string | number | null)[]) {
    return this.connection.prepare(sql).all(...params) as T[];
  }
  async withTransactionAsync(task: () => Promise<void>) {
    this.connection.exec("BEGIN IMMEDIATE");
    try {
      await task();
      this.connection.exec("COMMIT");
    } catch (error) {
      this.connection.exec("ROLLBACK");
      throw error;
    }
  }
  close() {
    this.connection.close();
  }
}
