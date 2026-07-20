import type { KidEduDatabase } from "@/data/database";
import { SQLiteKidEduRepository } from "@/data/repository";

class TransactionGuardProgressDatabase {
  maxActiveWrites = 0;
  private activeWrites = 0;
  private transactionDepth = 0;

  async runAsync(): Promise<void> {
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
