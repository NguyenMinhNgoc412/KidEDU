/* eslint-disable @typescript-eslint/no-require-imports -- Real SQLite test bridge; no Node imports in mobile runtime. */
const { createRequire } = require("node:module");
const { join } = require("node:path");
const { mkdtempSync, unlinkSync, rmdirSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { DatabaseSync } = createRequire(join(process.cwd(), "package.json"))("node:sqlite");
import { DailyGameLocalRepository } from "../localRepository";
import { initialDailyGameCheckpoint } from "../sessionEngine";
import { flushDailyCheckpoint } from "../flushCheckpoint";
import { ApiRequestError } from "../../../api/localClient";
import type { RuntimeDatabase } from "../../lessonRuntime/runtimeRepository";
import type { DailyGamePlanV1 } from "../../../content/contracts/dailyGame";

class DB implements RuntimeDatabase {
  connection;
  failOutbox = false;
  constructor(path = ":memory:") {
    this.connection = new DatabaseSync(path);
  }
  async execAsync(sql: string) {
    this.connection.exec(sql);
  }
  async runAsync(sql: string, params: (string | number | null)[]) {
    if (this.failOutbox && sql.startsWith("INSERT INTO daily_checkpoint_outbox"))
      throw new Error("DISK_FAILURE");
    return this.connection.prepare(sql).run(...params) as { changes: number };
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
const plan: DailyGamePlanV1 = {
  schemaVersion: 1,
  kind: "daily_game",
  contentVersion: "synthetic_local_v1",
  tier: "basic",
  shadowScreens: [0, 1].map((i) => ({
    id: `shadow_${i}`,
    targetIds: ["target_a", "target_b", "target_c"]
  })),
  listenRounds: [0, 1, 2, 3, 4].map((i) => ({
    id: `listen_${i}`,
    targetId: `target_${i}`,
    optionTargetIds: [`target_${i}`, "other_a", "other_b"]
  })),
  memoryTargetIds: ["target_0", "target_1", "target_2", "target_3", "target_4"]
};
const session = {
  schemaVersion: 1 as const,
  id: "11111111-1111-4111-8111-111111111111",
  playDay: "2026-11-06",
  resetAt: "2026-11-06T17:00:00.000Z",
  revision: 1,
  completedAt: null,
  plan,
  checkpoint: initialDailyGameCheckpoint(plan)
};
const place = (targetId: string) => ({
  type: "place_shadow" as const,
  roundId: "shadow_0",
  targetId,
  slotTargetId: targetId
});
// Explicit synthetic permission for storage-only tests; never used by app runtime.
const syntheticPermit = () => undefined;

it("archives a completed fullaccess test day index while retaining its document and rejecting ordinary replacement", async () => {
  const db = new DB();
  const repo = new DailyGameLocalRepository(db, "00000000-0000-4000-8000-000000000002");
  const next = { ...session, id: "22222222-2222-4222-8222-222222222222" };
  try {
    await repo.initialize();
    await repo.install("child-a", session);
    await expect(repo.install("child-a", next, true)).rejects.toThrow(
      "UNEXPECTED_SESSION_REPLACEMENT"
    );
    await repo.install("child-a", { ...session, completedAt: "2026-11-06T16:00:00.000Z" });
    await expect(repo.install("child-a", next)).rejects.toThrow("UNEXPECTED_SESSION_REPLACEMENT");
    await repo.install("child-a", next, true);
    expect((await repo.load("child-a", session.id))?.session.completedAt).toBeTruthy();
    expect((await repo.load("child-a", next.id))?.session.completedAt).toBeNull();
    expect((await repo.load("child-a", session.id))?.session.playDay).toBe(session.playDay);
  } finally {
    db.close();
  }
});

it("retries a lost ACK without losing newer progress and retains conflicts for reconciliation", async () => {
  const db = new DB();
  const repo = new DailyGameLocalRepository(db, "synthetic-account");
  try {
    await repo.initialize();
    await repo.install("child-a", session);
    await repo.apply("child-a", session.id, 1, place("target_a"), syntheticPermit);
    const sent = (await repo.pending("child-a"))[0]!;
    const api = { saveDailyGameCheckpoint: jest.fn() };
    api.saveDailyGameCheckpoint.mockRejectedValueOnce(new Error("ACK_LOST"));
    expect(await flushDailyCheckpoint(repo, "child-a", session.id, api)).toBe("retry");
    await repo.apply("child-a", session.id, 2, place("target_b"), syntheticPermit);
    api.saveDailyGameCheckpoint.mockResolvedValueOnce({
      schemaVersion: 1,
      sessionId: session.id,
      revision: 2,
      checkpoint: sent.checkpoint,
      completedAt: null
    });
    api.saveDailyGameCheckpoint.mockImplementationOnce(
      async (_child, _session, revision, checkpoint) => ({
        schemaVersion: 1,
        sessionId: session.id,
        revision: revision + 1,
        checkpoint,
        completedAt: null
      })
    );
    expect(await flushDailyCheckpoint(repo, "child-a", session.id, api)).toBe("synced");
    expect(api.saveDailyGameCheckpoint.mock.calls[1]![3]).toEqual(sent.checkpoint);
    expect((await repo.load("child-a", session.id))?.session.checkpoint.placedTargetIds).toEqual([
      "target_a",
      "target_b"
    ]);
    await repo.apply("child-a", session.id, 3, place("target_c"), syntheticPermit);
    api.saveDailyGameCheckpoint.mockRejectedValueOnce(new ApiRequestError(409, "CONFLICT"));
    expect(await flushDailyCheckpoint(repo, "child-a", session.id, api)).toBe("conflict");
    expect(await repo.pending("child-a")).toHaveLength(1);
    api.saveDailyGameCheckpoint.mockRejectedValueOnce(new ApiRequestError(410, "EXPIRED"));
    expect(await flushDailyCheckpoint(repo, "child-a", session.id, api)).toBe("expired");
    expect(await repo.pending("child-a")).toHaveLength(1);
  } finally {
    await repo.close();
    db.close();
  }
});

it("reconciles another device's checkpoint atomically without merging or losing the local branch", async () => {
  const db = new DB();
  const repo = new DailyGameLocalRepository(db, "synthetic-account");
  try {
    await repo.initialize();
    await repo.install("child-a", session);
    await repo.apply("child-a", session.id, 1, place("target_a"), syntheticPermit);
    const remote = {
      ...session,
      revision: 2,
      checkpoint: {
        ...session.checkpoint,
        placedTargetIds: ["target_b"]
      }
    };
    await expect(repo.reconcile("child-b", 2, remote)).rejects.toThrow("DAILY_SESSION_NOT_FOUND");
    await expect(repo.reconcile("child-a", 1, remote)).rejects.toThrow("LOCAL_REVISION_CONFLICT");
    await expect(repo.reconcile("child-a", 2, session)).rejects.toThrow("STALE_SERVER_SNAPSHOT");
    expect(await repo.pending("child-a")).toHaveLength(1);
    const result = await repo.reconcile("child-a", 2, remote);
    expect(result.localRevision).toBe(3);
    expect(result.session.checkpoint.placedTargetIds).toEqual(["target_b"]);
    expect(await repo.pending("child-a")).toEqual([]);
    const archived = await db.getFirstAsync<{ document: string }>(
      "SELECT document FROM daily_checkpoint_conflicts WHERE session_id=?",
      [session.id]
    );
    expect(JSON.parse(archived!.document).checkpoint.placedTargetIds).toEqual(["target_a"]);
    // A delayed response from the retired local branch cannot overwrite the remote state.
    await expect(repo.reconcile("child-a", 2, remote)).rejects.toThrow("LOCAL_REVISION_CONFLICT");
    await repo.apply("child-a", session.id, 3, place("target_c"), syntheticPermit);
    expect((await repo.pending("child-a"))[0]!.expectedRevision).toBe(2);
  } finally {
    await repo.close();
    db.close();
  }
});

it("rolls back progress if outbox write fails and rejects closed/foreign namespaces", async () => {
  const db = new DB();
  const repo = new DailyGameLocalRepository(db, "synthetic-account");
  try {
    await repo.initialize();
    await repo.install("child-a", session);
    db.failOutbox = true;
    await expect(
      repo.apply("child-a", session.id, 1, place("target_a"), syntheticPermit)
    ).rejects.toThrow("DISK_FAILURE");
    expect((await repo.load("child-a", session.id))?.session.checkpoint.placedTargetIds).toEqual(
      []
    );
    expect(await repo.pending("child-a")).toEqual([]);
    expect(await repo.load("child-b", session.id)).toBeNull();
    await expect(new DailyGameLocalRepository(db, "other-account").initialize()).rejects.toThrow(
      "DAILY_NAMESPACE_MISMATCH"
    );
    await repo.close();
    await expect(repo.load("child-a", session.id)).rejects.toThrow("NAMESPACE_CLOSED");
  } finally {
    db.close();
  }
});

it("survives SQLite reopen and preserves progress made while a sync response is in flight", async () => {
  const directory = mkdtempSync(join(tmpdir(), "kidedu-c50-daily-"));
  const file = join(directory, "synthetic.db");
  let db = new DB(file);
  let repo = new DailyGameLocalRepository(db, "synthetic-account");
  try {
    await repo.initialize();
    await repo.install("child-a", session);
    await repo.apply("child-a", session.id, 1, place("target_a"), syntheticPermit);
    const sent = (await repo.pending("child-a"))[0]!;
    await repo.apply("child-a", session.id, 2, place("target_b"), syntheticPermit);
    await expect(repo.install("child-a", session)).rejects.toThrow("UNSYNCED_CHECKPOINT");
    await repo.close();
    db.close();
    db = new DB(file);
    repo = new DailyGameLocalRepository(db, "synthetic-account");
    await repo.initialize();
    expect((await repo.load("child-a", session.id))?.session.checkpoint.placedTargetIds).toEqual([
      "target_a",
      "target_b"
    ]);
    // A lost ACK must resend the exact original payload, not newer local progress
    // with the old base revision. Otherwise the server correctly reports conflict.
    expect((await repo.pending("child-a"))[0]).toEqual(sent);
    const ack = {
      schemaVersion: 1 as const,
      sessionId: session.id,
      revision: 2,
      checkpoint: sent.checkpoint,
      completedAt: null
    };
    expect(await repo.acknowledge(sent, ack)).toBe(true);
    const next = (await repo.pending("child-a"))[0]!;
    expect(next.expectedRevision).toBe(2);
    expect(next.checkpoint.placedTargetIds).toEqual(["target_a", "target_b"]);
    expect(await repo.acknowledge(sent, ack)).toBe(false);
    expect(await repo.acknowledge(next, { ...ack, revision: 3, checkpoint: next.checkpoint })).toBe(
      true
    );
    expect(await repo.pending("child-a")).toEqual([]);
    expect((await repo.load("child-a", session.id))?.session.revision).toBe(3);
  } finally {
    await repo.close();
    db.close();
    unlinkSync(file);
    rmdirSync(directory);
  }
});
