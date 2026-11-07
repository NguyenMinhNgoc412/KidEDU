import { z } from "zod";
import type { components } from "../../api/generated";
import type { RuntimeDatabase } from "../lessonRuntime/runtimeRepository";
import {
  dailyGamePlanSchemaV1,
  validateDailyGameCheckpoint
} from "../../content/contracts/dailyGame";
import { advanceDailyGame, type DailyGameAction } from "./sessionEngine";

type ServerSession = components["schemas"]["DailyGameSession"];
const snapshotSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.uuid(),
  playDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  resetAt: z.iso.datetime(),
  revision: z.number().int().positive(),
  completedAt: z.iso.datetime().nullable(),
  plan: dailyGamePlanSchemaV1,
  checkpoint: z.unknown()
});
function snapshot(input: unknown): ServerSession {
  const value = snapshotSchema.parse(input);
  return { ...value, checkpoint: validateDailyGameCheckpoint(value.plan, value.checkpoint) };
}
type Row = { child_id: string; document: string; local_revision: number; server_revision: number };
export type PendingDailyCheckpoint = {
  sessionId: string;
  childId: string;
  localRevision: number;
  expectedRevision: number;
  checkpoint: ServerSession["checkpoint"];
};

/** Separate account database. Stores references/checkpoints only, never decrypted assets.
 * Caller obtains a server reservation before install and a trusted-time/access boundary
 * before applying actions; no local start, entitlement or reward authority exists here.
 */
export class DailyGameLocalRepository {
  private queue: Promise<unknown> = Promise.resolve();
  private closed = false;
  constructor(
    private readonly db: RuntimeDatabase,
    readonly accountId: string
  ) {}
  private write<T>(action: (db: RuntimeDatabase) => Promise<T>): Promise<T> {
    const task = this.queue.then(async () => {
      if (this.closed) throw new Error("NAMESPACE_CLOSED");
      let result!: T;
      const run = async (db: RuntimeDatabase) => {
        result = await action(db);
      };
      if (this.db.withExclusiveTransactionAsync && !("document" in globalThis))
        await this.db.withExclusiveTransactionAsync(run);
      else await this.db.withTransactionAsync(() => run(this.db));
      return result;
    });
    this.queue = task.catch(() => undefined);
    return task;
  }
  async initialize() {
    await this.write(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS daily_meta (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL, account_id TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS daily_sessions (
          id TEXT PRIMARY KEY, child_id TEXT NOT NULL, play_day TEXT NOT NULL,
          server_revision INTEGER NOT NULL, local_revision INTEGER NOT NULL,
          document TEXT NOT NULL, UNIQUE(child_id, play_day));
        CREATE TABLE IF NOT EXISTS daily_checkpoint_outbox (
          session_id TEXT PRIMARY KEY REFERENCES daily_sessions(id),
          child_id TEXT NOT NULL, local_revision INTEGER NOT NULL,
          expected_revision INTEGER NOT NULL, checkpoint TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS daily_checkpoint_conflicts (
          session_id TEXT NOT NULL REFERENCES daily_sessions(id),
          local_revision INTEGER NOT NULL, document TEXT NOT NULL,
          pending_checkpoint TEXT NOT NULL, resolved_server_revision INTEGER NOT NULL,
          PRIMARY KEY(session_id, local_revision));
        CREATE TABLE IF NOT EXISTS daily_reward_choices (
          session_id TEXT PRIMARY KEY, child_id TEXT NOT NULL,
          box_index INTEGER NOT NULL CHECK(box_index BETWEEN 0 AND 3));
      `);
      await db.runAsync("INSERT OR IGNORE INTO daily_meta VALUES (1,1,?)", [this.accountId]);
      const meta = await db.getFirstAsync<{ version: number; account_id: string }>(
        "SELECT version,account_id FROM daily_meta WHERE id=1",
        []
      );
      if (meta?.version !== 1 || meta.account_id !== this.accountId)
        throw new Error("DAILY_NAMESPACE_MISMATCH");
    });
  }
  /** Persist before sending a claim. A lost acknowledgment or process restart
   * must retry the same box, never offer another local draw. */
  async chooseRewardBox(childId: string, sessionId: string, boxIndex: number) {
    z.uuid().parse(childId);
    z.uuid().parse(sessionId);
    z.number().int().min(0).max(3).parse(boxIndex);
    return this.write(async (db) => {
      await db.runAsync("INSERT OR IGNORE INTO daily_reward_choices VALUES (?,?,?)", [
        sessionId,
        childId,
        boxIndex
      ]);
      const choice = await db.getFirstAsync<{ child_id: string; box_index: number }>(
        "SELECT child_id,box_index FROM daily_reward_choices WHERE session_id=?",
        [sessionId]
      );
      if (!choice || choice.child_id !== childId) throw new Error("CHILD_MISMATCH");
      return choice.box_index;
    });
  }
  async rewardBoxChoice(childId: string, sessionId: string) {
    return this.write(async (db) => {
      const choice = await db.getFirstAsync<{ box_index: number }>(
        "SELECT box_index FROM daily_reward_choices WHERE session_id=? AND child_id=?",
        [sessionId, childId]
      );
      return choice?.box_index ?? null;
    });
  }
  async install(childId: string, input: unknown, localTestReplacement = false) {
    const session = snapshot(input);
    return this.write(async (db) => {
      const existing = await db.getFirstAsync<Row>("SELECT * FROM daily_sessions WHERE id=?", [
        session.id
      ]);
      if (existing) {
        if (existing.child_id !== childId) throw new Error("CHILD_MISMATCH");
        const pending = await db.getFirstAsync(
          "SELECT session_id FROM daily_checkpoint_outbox WHERE session_id=?",
          [session.id]
        );
        if (pending) throw new Error("UNSYNCED_CHECKPOINT");
        if (existing.server_revision > session.revision) throw new Error("STALE_SERVER_SNAPSHOT");
        const old = snapshot(JSON.parse(existing.document));
        if (
          JSON.stringify(old.plan) !== JSON.stringify(session.plan) ||
          old.resetAt !== session.resetAt ||
          old.playDay !== session.playDay
        )
          throw new Error("PINNED_SESSION_CHANGED");
        await db.runAsync(
          "UPDATE daily_sessions SET document=?,server_revision=?,local_revision=local_revision+1 WHERE id=?",
          [JSON.stringify(session), session.revision, session.id]
        );
      } else {
        const previous = await db.getFirstAsync<Row & { id: string }>(
          "SELECT * FROM daily_sessions WHERE child_id=? AND play_day=?",
          [childId, session.playDay]
        );
        if (previous) {
          const pending = await db.getFirstAsync(
            "SELECT session_id FROM daily_checkpoint_outbox WHERE session_id=?",
            [previous.id]
          );
          if (
            !localTestReplacement ||
            this.accountId !== "00000000-0000-4000-8000-000000000002" ||
            !snapshot(JSON.parse(previous.document)).completedAt ||
            pending
          )
            throw new Error("UNEXPECTED_SESSION_REPLACEMENT");
          // Keep the old document, choices and archives readable by ID. Only retire its day index.
          await db.runAsync("UPDATE daily_sessions SET play_day=? WHERE id=?", [
            `local-test-archive:${previous.id}`,
            previous.id
          ]);
        }
        await db.runAsync("INSERT INTO daily_sessions VALUES (?,?,?,?,?,?)", [
          session.id,
          childId,
          session.playDay,
          session.revision,
          1,
          JSON.stringify(session)
        ]);
      }
      return session;
    });
  }
  async load(childId: string, sessionId: string) {
    return this.write(async (db) => {
      const row = await db.getFirstAsync<Row>(
        "SELECT * FROM daily_sessions WHERE id=? AND child_id=?",
        [sessionId, childId]
      );
      return row
        ? { session: snapshot(JSON.parse(row.document)), localRevision: row.local_revision }
        : null;
    });
  }
  /** Explicit server-wins reconciliation at a paused boundary. Preserve the local
   * branch before retiring its outbox; never merge two devices' answers or rewards.
   * Caller must fetch this snapshot through the authenticated start/resume API.
   */
  async reconcile(childId: string, expectedLocalRevision: number, input: unknown) {
    const session = snapshot(input);
    return this.write(async (db) => {
      const row = await db.getFirstAsync<Row>(
        "SELECT * FROM daily_sessions WHERE id=? AND child_id=?",
        [session.id, childId]
      );
      if (!row) throw new Error("DAILY_SESSION_NOT_FOUND");
      if (row.local_revision !== expectedLocalRevision) throw new Error("LOCAL_REVISION_CONFLICT");
      if (session.revision <= row.server_revision) throw new Error("STALE_SERVER_SNAPSHOT");
      const old = snapshot(JSON.parse(row.document));
      if (
        JSON.stringify(old.plan) !== JSON.stringify(session.plan) ||
        old.resetAt !== session.resetAt ||
        old.playDay !== session.playDay
      )
        throw new Error("PINNED_SESSION_CHANGED");
      const pending = await db.getFirstAsync<{ checkpoint: string }>(
        "SELECT checkpoint FROM daily_checkpoint_outbox WHERE session_id=? AND child_id=?",
        [session.id, childId]
      );
      if (!pending) throw new Error("NO_CONFLICT_TO_RECONCILE");
      await db.runAsync("INSERT INTO daily_checkpoint_conflicts VALUES (?,?,?,?,?)", [
        session.id,
        row.local_revision,
        row.document,
        pending.checkpoint,
        session.revision
      ]);
      await db.runAsync(
        "UPDATE daily_sessions SET document=?,server_revision=?,local_revision=local_revision+1 WHERE id=?",
        [JSON.stringify(session), session.revision, session.id]
      );
      await db.runAsync("DELETE FROM daily_checkpoint_outbox WHERE session_id=?", [session.id]);
      return { session, localRevision: row.local_revision + 1 };
    });
  }
  async apply(
    childId: string,
    sessionId: string,
    expectedLocalRevision: number,
    action: DailyGameAction,
    assertUsable: () => void
  ) {
    return this.write(async (db) => {
      if (typeof assertUsable !== "function") throw new Error("DAILY_ACCESS_BOUNDARY_REQUIRED");
      assertUsable();
      const row = await db.getFirstAsync<Row>(
        "SELECT * FROM daily_sessions WHERE id=? AND child_id=?",
        [sessionId, childId]
      );
      if (!row) throw new Error("DAILY_SESSION_NOT_FOUND");
      if (row.local_revision !== expectedLocalRevision) throw new Error("LOCAL_REVISION_CONFLICT");
      const session = snapshot(JSON.parse(row.document));
      const result = advanceDailyGame(session.plan, session.checkpoint, action);
      if (JSON.stringify(result.checkpoint) === JSON.stringify(session.checkpoint))
        return { ...result, localRevision: row.local_revision };
      const localRevision = row.local_revision + 1;
      session.checkpoint = result.checkpoint;
      await db.runAsync("UPDATE daily_sessions SET document=?,local_revision=? WHERE id=?", [
        JSON.stringify(session),
        localRevision,
        sessionId
      ]);
      await db.runAsync(
        `INSERT INTO daily_checkpoint_outbox VALUES (?,?,?,?,?)
        ON CONFLICT(session_id) DO NOTHING`,
        [sessionId, childId, localRevision, row.server_revision, JSON.stringify(result.checkpoint)]
      );
      // Re-check after asynchronous disk writes; throwing rolls back both writes.
      assertUsable();
      return { ...result, localRevision };
    });
  }
  async pending(childId: string): Promise<PendingDailyCheckpoint[]> {
    return this.write(async (db) => {
      const rows = await db.getAllAsync<{
        session_id: string;
        child_id: string;
        local_revision: number;
        expected_revision: number;
        checkpoint: string;
      }>("SELECT * FROM daily_checkpoint_outbox WHERE child_id=? ORDER BY session_id", [childId]);
      return rows.map((row) => ({
        sessionId: row.session_id,
        childId: row.child_id,
        localRevision: row.local_revision,
        expectedRevision: row.expected_revision,
        checkpoint: JSON.parse(row.checkpoint)
      }));
    });
  }
  async acknowledge(
    sent: PendingDailyCheckpoint,
    ack: components["schemas"]["DailyGameCheckpointAck"]
  ) {
    if (
      ack.schemaVersion !== 1 ||
      ack.sessionId !== sent.sessionId ||
      ack.revision !== sent.expectedRevision + 1 ||
      !z.iso.datetime().nullable().safeParse(ack.completedAt).success
    )
      throw new Error("INVALID_SYNC_ACK");
    return this.write(async (db) => {
      const row = await db.getFirstAsync<Row>(
        "SELECT * FROM daily_sessions WHERE id=? AND child_id=?",
        [sent.sessionId, sent.childId]
      );
      if (!row || row.server_revision !== sent.expectedRevision) return false;
      const session = snapshot(JSON.parse(row.document));
      const received = validateDailyGameCheckpoint(session.plan, ack.checkpoint);
      const transmitted = validateDailyGameCheckpoint(session.plan, sent.checkpoint);
      if (JSON.stringify(received) !== JSON.stringify(transmitted))
        throw new Error("INVALID_SYNC_ACK");
      session.revision = ack.revision;
      session.completedAt = ack.completedAt;
      await db.runAsync("UPDATE daily_sessions SET server_revision=?,document=? WHERE id=?", [
        ack.revision,
        JSON.stringify(session),
        sent.sessionId
      ]);
      if (row.local_revision === sent.localRevision)
        await db.runAsync("DELETE FROM daily_checkpoint_outbox WHERE session_id=?", [
          sent.sessionId
        ]);
      else
        await db.runAsync(
          "UPDATE daily_checkpoint_outbox SET expected_revision=?,local_revision=?,checkpoint=? WHERE session_id=?",
          [ack.revision, row.local_revision, JSON.stringify(session.checkpoint), sent.sessionId]
        );
      return true;
    });
  }
  async close() {
    this.closed = true;
    await this.queue;
  }
}
