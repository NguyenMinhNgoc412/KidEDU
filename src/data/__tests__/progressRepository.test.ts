import type { KidEduDatabase } from "@/data/database";
import { SQLiteKidEduRepository } from "@/data/repository";

class TransactionGuardProgressDatabase {
  maxActiveWrites = 0;
  readonly writeCalls: Array<{ sql: string; params: unknown[] }> = [];
  private activeWrites = 0;
  private transactionDepth = 0;

  async runAsync(sql = "", params: unknown[] = []): Promise<void> {
    this.writeCalls.push({ sql, params });

    if (this.transactionDepth > 0) {
      await Promise.resolve();
      return;
    }

    await this.runIsolatedWrite();
  }

  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    if (this.activeWrites > 0) {
      throw new Error("database is locked");
    }

    this.activeWrites += 1;
    this.transactionDepth += 1;
    this.maxActiveWrites = Math.max(this.maxActiveWrites, this.activeWrites);

    try {
      await Promise.resolve();
      await callback();
    } finally {
      this.transactionDepth -= 1;
      this.activeWrites -= 1;
    }
  }

  private async runIsolatedWrite(): Promise<void> {
    if (this.activeWrites > 0) {
      throw new Error("database is locked");
    }

    this.activeWrites += 1;
    this.maxActiveWrites = Math.max(this.maxActiveWrites, this.activeWrites);

    try {
      await Promise.resolve();
    } finally {
      this.activeWrites -= 1;
    }
  }
}

describe("SQLiteKidEduRepository progress writes", () => {
  it("marks unfinished sessions as interrupted before the app exposes learning data", async () => {
    const db = new TransactionGuardProgressDatabase();
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await repository.recoverActivePracticeSessions();

    expect(db.writeCalls).toHaveLength(1);
    expect(db.writeCalls[0]?.sql.replace(/\s+/g, " ").trim()).toBe(
      "UPDATE practice_sessions SET status = 'interrupted', ended_at = ? WHERE status = 'active'"
    );
    expect(db.writeCalls[0]?.params).toHaveLength(1);
    expect(db.writeCalls[0]?.params[0]).toEqual(expect.any(String));
  });

  it("serializes concurrent session and progress writes so SQLite is not locked", async () => {
    const db = new TransactionGuardProgressDatabase();
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(
      Promise.all([
        repository.startPracticeSession({ mode: "single_item", deckId: null }),
        repository.recordPracticeEvent({
          sessionId: "session-existing",
          learningItemId: "item-1",
          eventType: "viewed"
        }),
        repository.finishPracticeSession({ sessionId: "session-existing", status: "completed" })
      ])
    ).resolves.toHaveLength(3);

    expect(db.maxActiveWrites).toBe(1);
  });
});
