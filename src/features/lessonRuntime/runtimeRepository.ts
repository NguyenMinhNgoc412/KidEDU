import type { LessonEvent, LessonSession } from "./sessionEngine";
import { restoreSession } from "./restoreSession";

export interface RuntimeDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: (string | number | null)[]): Promise<{ changes: number }>;
  getFirstAsync<T>(sql: string, params: (string | number | null)[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params: (string | number | null)[]): Promise<T[]>;
  withTransactionAsync(callback: () => Promise<void>): Promise<void>;
  withExclusiveTransactionAsync?(callback: (db: RuntimeDatabase) => Promise<void>): Promise<void>;
}

export const runtimeSchemaSql = `
CREATE TABLE IF NOT EXISTS runtime_meta (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL);
INSERT OR IGNORE INTO runtime_meta VALUES (1,1);
CREATE TABLE IF NOT EXISTS runtime_account (id INTEGER PRIMARY KEY CHECK(id=1), account_id TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS lesson_sessions (
  id TEXT PRIMARY KEY, child_id TEXT NOT NULL, generation TEXT NOT NULL,
  revision INTEGER NOT NULL, phase TEXT NOT NULL, document TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS observations (
  event_id TEXT PRIMARY KEY, child_id TEXT NOT NULL, session_id TEXT NOT NULL,
  activity_id TEXT NOT NULL, lesson_id TEXT NOT NULL, generation TEXT NOT NULL,
  document TEXT NOT NULL, FOREIGN KEY(session_id) REFERENCES lesson_sessions(id)
);
CREATE TABLE IF NOT EXISTS outbox (
  event_id TEXT PRIMARY KEY, child_id TEXT NOT NULL, document TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('pending','rejected')), error_code TEXT,
  FOREIGN KEY(event_id) REFERENCES observations(event_id)
);
`;

/** Dedicated account DB, serialized writes; no progress conversion from legacy cards. */
export class LessonRuntimeRepository {
  private queue: Promise<unknown> = Promise.resolve();
  private closed = false;
  constructor(
    private readonly db: RuntimeDatabase,
    readonly accountId: string
  ) {}
  private assertOpen() {
    if (this.closed) throw new Error("NAMESPACE_CLOSED");
  }
  private write<T>(task: (db: RuntimeDatabase) => Promise<T>): Promise<T> {
    const operation = this.queue.then(async () => {
      this.assertOpen();
      let result!: T;
      if (this.db.withExclusiveTransactionAsync && !("document" in globalThis)) {
        await this.db.withExclusiveTransactionAsync(async (tx) => {
          result = await task(tx);
        });
      } else {
        await this.db.withTransactionAsync(async () => {
          result = await task(this.db);
        });
      }
      return result;
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }
  async initialize() {
    await this.write(async (db) => {
      await db.execAsync(runtimeSchemaSql);
      const row = await db.getFirstAsync<{ version: number }>(
        "SELECT version FROM runtime_meta WHERE id=1",
        []
      );
      if (row?.version !== 1 && row?.version !== 2) throw new Error("UNSUPPORTED_RUNTIME_SCHEMA");
      await db.runAsync("INSERT OR IGNORE INTO runtime_account VALUES (1,?)", [this.accountId]);
      const owner = await db.getFirstAsync<{ account_id: string }>(
        "SELECT account_id FROM runtime_account WHERE id=1",
        []
      );
      if (owner?.account_id !== this.accountId) throw new Error("RUNTIME_ACCOUNT_MISMATCH");
      // Additive local-fixture migration: keep each lesson's paused session and chosen lesson.
      await db.execAsync(`
        DROP INDEX IF EXISTS one_open_lesson_per_child;
        CREATE UNIQUE INDEX IF NOT EXISTS one_open_generation_per_child
          ON lesson_sessions(child_id,generation) WHERE phase != 'finished';
        CREATE TABLE IF NOT EXISTS lesson_selection (child_id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL);
        UPDATE runtime_meta SET version=2 WHERE id=1;
      `);
    });
  }
  async load(childId: string, generation?: string): Promise<LessonSession | null> {
    await this.queue;
    this.assertOpen();
    const row = await this.db.getFirstAsync<{ document: string }>(
      `SELECT document FROM lesson_sessions WHERE child_id=? AND phase != 'finished'${generation ? " AND generation=?" : ""} ORDER BY rowid DESC LIMIT 1`,
      generation ? [childId, generation] : [childId]
    );
    if (!row) return null;
    return restoreSession(row.document, childId);
  }
  async selectedLesson(childId: string): Promise<string | null> {
    await this.queue;
    this.assertOpen();
    const row = await this.db.getFirstAsync<{ lesson_id: string }>(
      "SELECT lesson_id FROM lesson_selection WHERE child_id=?",
      [childId]
    );
    return row?.lesson_id ?? null;
  }
  async selectLesson(childId: string, lessonId: string) {
    await this.write(async (db) => {
      await db.runAsync(
        "INSERT INTO lesson_selection VALUES (?,?) ON CONFLICT(child_id) DO UPDATE SET lesson_id=excluded.lesson_id",
        [childId, lessonId]
      );
    });
  }
  async start(session: LessonSession) {
    await this.write(async (db) => {
      await db.runAsync("INSERT INTO lesson_sessions VALUES (?,?,?,?,?,?)", [
        session.id,
        session.childId,
        session.prepared.generation,
        session.revision,
        session.phase,
        JSON.stringify(session)
      ]);
    });
  }
  async checkpoint(previousRevision: number, next: LessonSession) {
    await this.write((db) => this.update(db, previousRevision, next));
  }
  private async update(db: RuntimeDatabase, previousRevision: number, next: LessonSession) {
    if (next.revision !== previousRevision + 1) throw new Error("INVALID_CHECKPOINT_REVISION");
    const changed = await db.runAsync(
      "UPDATE lesson_sessions SET revision=?,phase=?,document=? WHERE id=? AND child_id=? AND revision=? AND generation=?",
      [
        next.revision,
        next.phase,
        JSON.stringify(next),
        next.id,
        next.childId,
        previousRevision,
        next.prepared.generation
      ]
    );
    if (changed.changes !== 1) throw new Error("STALE_CHECKPOINT");
  }
  async commitObservation(previous: LessonSession, next: LessonSession, event: LessonEvent) {
    const activity = previous.prepared.activities[previous.index];
    if (
      !activity ||
      event.childId !== previous.childId ||
      event.payload.sessionId !== previous.id ||
      event.eventId !== `${previous.id}:${previous.index}` ||
      next.id !== previous.id ||
      next.childId !== previous.childId ||
      next.index !== previous.index + 1 ||
      next.revision !== previous.revision + 1
    )
      throw new Error("INVALID_OBSERVATION_COMMIT");
    await this.write(async (db) => {
      await this.update(db, previous.revision, next);
      await db.runAsync("INSERT INTO observations VALUES (?,?,?,?,?,?,?)", [
        event.eventId,
        event.childId,
        previous.id,
        activity.id,
        previous.prepared.lesson.id,
        previous.prepared.generation,
        JSON.stringify(event)
      ]);
      await db.runAsync("INSERT INTO outbox VALUES (?,?,?,'pending',NULL)", [
        event.eventId,
        event.childId,
        JSON.stringify(event)
      ]);
    });
  }
  async pending(childId: string): Promise<LessonEvent[]> {
    await this.queue;
    this.assertOpen();
    const rows = await this.db.getAllAsync<{ document: string }>(
      "SELECT document FROM outbox WHERE child_id=? AND state='pending' ORDER BY rowid LIMIT 50",
      [childId]
    );
    return rows.map((row) => JSON.parse(row.document) as LessonEvent);
  }
  async history(
    childId: string
  ): Promise<{ event: LessonEvent; syncState: "synced" | "pending" | "rejected" }[]> {
    await this.queue;
    this.assertOpen();
    const rows = await this.db.getAllAsync<{
      document: string;
      state: "pending" | "rejected" | null;
    }>(
      "SELECT o.document, b.state FROM observations o LEFT JOIN outbox b ON b.event_id=o.event_id WHERE o.child_id=? ORDER BY o.rowid DESC LIMIT 100",
      [childId]
    );
    return rows.map((row) => ({
      event: JSON.parse(row.document) as LessonEvent,
      syncState: row.state ?? "synced"
    }));
  }
  async acknowledge(
    childId: string,
    sentIds: string[],
    results: { eventId: string | null; status: string; code?: string }[]
  ) {
    await this.write(async (db) => {
      for (const result of results) {
        if (!result.eventId || !sentIds.includes(result.eventId)) continue;
        if (result.status === "accepted" || result.status === "duplicate") {
          await db.runAsync("DELETE FROM outbox WHERE child_id=? AND event_id=?", [
            childId,
            result.eventId
          ]);
        } else if (result.status === "rejected") {
          await db.runAsync(
            "UPDATE outbox SET state='rejected',error_code=? WHERE child_id=? AND event_id=?",
            [result.code ?? "REJECTED", childId, result.eventId]
          );
        }
      }
    });
  }
  async close() {
    this.closed = true;
    await this.queue;
  }
}
