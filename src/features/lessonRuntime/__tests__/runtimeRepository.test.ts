/* eslint-disable @typescript-eslint/no-require-imports -- Node-only SQLite test bridge; no Node dependency in mobile runtime. */
const { createRequire } = require("node:module");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, dirname, resolve } = require("node:path");

import { getDevelopmentLesson } from "../developmentLesson";
import { prepareSampleLesson } from "../lessonCatalog";
import { flushOutbox } from "../flushOutbox";
import { LessonRuntimeRepository, type RuntimeDatabase } from "../runtimeRepository";
import { createLessonSession, recordObservation, transition } from "../sessionEngine";

// Load Node's actual SQLite outside Jest's mock resolver. Test real SQL and rollback.
const { DatabaseSync } = createRequire(join(process.cwd(), "package.json"))("node:sqlite");
class SQLiteAdapter implements RuntimeDatabase {
  private connection;
  failOutbox = false;
  constructor(filename = ":memory:") {
    this.connection = new DatabaseSync(filename);
    this.connection.exec("PRAGMA foreign_keys=ON");
  }
  async execAsync(sql: string) {
    this.connection.exec(sql);
  }
  async runAsync(sql: string, params: (string | number | null)[]) {
    if (this.failOutbox && sql.startsWith("INSERT INTO outbox")) throw new Error("DISK_FAILURE");
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
const child = "10000000-0000-4000-8000-000000000011";
const otherChild = "20000000-0000-4000-8000-000000000011";
function observed() {
  let session = createLessonSession("test_session", child, getDevelopmentLesson(true));
  session = transition(session, { type: "start" });
  session = transition(session, { type: "begin_wait" });
  session = transition(session, { type: "elapsed", ms: 3000 });
  return transition(session, { type: "observe" });
}
async function setup(filename?: string) {
  const db = new SQLiteAdapter(filename);
  const repository = new LessonRuntimeRepository(db, "test-account");
  await repository.initialize();
  const previous = observed();
  await repository.start(previous);
  const committed = recordObservation(previous, "independent", "2026-10-12T00:00:00Z", true);
  return { db, repository, previous, ...committed };
}
test("disk failure rolls back observation, outbox and checkpoint together", async () => {
  const { db, repository, previous, next, event } = await setup();
  db.failOutbox = true;
  await expect(repository.commitObservation(previous, next, event)).rejects.toThrow("DISK_FAILURE");
  expect((await repository.load(child))?.revision).toBe(previous.revision);
  expect(await db.getAllAsync("SELECT * FROM observations", [])).toEqual([]);
  expect(await repository.pending(child)).toEqual([]);
  db.failOutbox = false;
  await repository.commitObservation(previous, next, event);
  expect(await repository.pending(child)).toEqual([event]);
  db.close();
});
test("committed data survives connection close/reopen and preserves immutable generation", async () => {
  const folder = mkdtempSync(join(tmpdir(), "kidedu-runtime-"));
  try {
    const filename = join(folder, "account.db");
    const { db, repository, previous, next, event } = await setup(filename);
    await repository.commitObservation(previous, next, event);
    await repository.selectLesson(child, "fixture_lesson_ball");
    await repository.close();
    db.close();
    const reopened = new SQLiteAdapter(filename);
    const restored = new LessonRuntimeRepository(reopened, "test-account");
    await restored.initialize();
    expect(await restored.selectedLesson(child)).toBe("fixture_lesson_ball");
    expect((await restored.load(child))?.phase).toBe("paused");
    expect((await restored.load(child))?.index).toBe(1);
    expect((await restored.load(child))?.prepared.generation).toBe(next.prepared.generation);
    expect(await restored.pending(child)).toEqual([event]);
    reopened.close();
  } finally {
    if (dirname(resolve(folder)) === resolve(tmpdir()) && folder.includes("kidedu-runtime-")) {
      rmSync(folder, { recursive: true, force: true });
    }
  }
});
test("concurrent duplicate commits have one winner and one durable event", async () => {
  const { db, repository, previous, next, event } = await setup();
  const outcomes = await Promise.allSettled([
    repository.commitObservation(previous, next, event),
    repository.commitObservation(previous, next, event)
  ]);
  expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
  expect(await repository.pending(child)).toEqual([event]);
  db.close();
});
test("lost server acknowledgement retries same event; duplicate ack clears only outbox", async () => {
  const { db, repository, previous, next, event } = await setup();
  await repository.commitObservation(previous, next, event);
  const transport = {
    ingestObservations: jest
      .fn()
      .mockRejectedValueOnce(new Error("NETWORK"))
      .mockResolvedValue({ results: [{ eventId: event.eventId, status: "duplicate" }] })
  };
  await expect(flushOutbox(repository, child, transport)).rejects.toThrow("NETWORK");
  expect(await repository.pending(child)).toEqual([event]);
  await flushOutbox(repository, child, transport);
  expect(transport.ingestObservations.mock.calls[0]).toEqual(
    transport.ingestObservations.mock.calls[1]
  );
  expect(await repository.pending(child)).toEqual([]);
  expect(await db.getAllAsync("SELECT * FROM observations", [])).toHaveLength(1);
  db.close();
});
test("cross-child acknowledgements cannot erase events; rejected event remains inspectable", async () => {
  const { db, repository, previous, next, event } = await setup();
  await repository.commitObservation(previous, next, event);
  expect(await repository.load(otherChild)).toBeNull();
  expect(await repository.pending(otherChild)).toEqual([]);
  await repository.acknowledge(
    otherChild,
    [event.eventId],
    [{ eventId: event.eventId, status: "accepted" }]
  );
  expect(await repository.pending(child)).toEqual([event]);
  await repository.acknowledge(
    child,
    [event.eventId],
    [{ eventId: event.eventId, status: "rejected", code: "BAD_EVENT" }]
  );
  expect(await repository.pending(child)).toEqual([]);
  expect(await db.getAllAsync("SELECT * FROM outbox WHERE state='rejected'", [])).toHaveLength(1);
  db.close();
});
test("closed account handles reject reads/writes and preserve unsynced data", async () => {
  const { db, repository, previous, next, event } = await setup();
  await repository.commitObservation(previous, next, event);
  await repository.close();
  await expect(repository.pending(child)).rejects.toThrow("NAMESPACE_CLOSED");
  await expect(
    repository.checkpoint(next.revision, { ...next, revision: next.revision + 1 })
  ).rejects.toThrow("NAMESPACE_CLOSED");
  expect(await db.getAllAsync("SELECT * FROM outbox", [])).toHaveLength(1);
  db.close();
});

test("copied database cannot be adopted by another account", async () => {
  const { db } = await setup();
  const other = new LessonRuntimeRepository(db, "another-account");
  await expect(other.initialize()).rejects.toThrow("RUNTIME_ACCOUNT_MISMATCH");
  db.close();
});

test("legacy single-open index migrates without losing observations; lesson choices and resumes are child-specific", async () => {
  const { db, repository, previous, next, event } = await setup();
  await repository.commitObservation(previous, next, event);
  await db.execAsync(
    "CREATE UNIQUE INDEX one_open_lesson_per_child ON lesson_sessions(child_id) WHERE phase != 'finished'"
  );
  await db.execAsync("UPDATE runtime_meta SET version=1 WHERE id=1; DROP TABLE lesson_selection;");
  await repository.initialize();
  expect(await db.getFirstAsync("SELECT version FROM runtime_meta WHERE id=1", [])).toEqual({
    version: 2
  });
  const ball = createLessonSession(
    "ball_session",
    child,
    prepareSampleLesson(true, "fixture_lesson_ball")
  );
  await repository.start(ball);
  await repository.selectLesson(child, "fixture_lesson_ball");
  expect(await repository.selectedLesson(child)).toBe("fixture_lesson_ball");
  expect(await repository.selectedLesson(otherChild)).toBeNull();
  expect((await repository.load(child, next.prepared.generation))?.index).toBe(1);
  expect((await repository.load(child, ball.prepared.generation))?.index).toBe(0);
  expect(await repository.pending(child)).toEqual([event]);
  await expect(repository.start({ ...ball, id: "duplicate_ball" })).rejects.toThrow();
  await repository.selectLesson(child, previous.prepared.lesson.id);
  expect(await repository.selectedLesson(child)).toBe(previous.prepared.lesson.id);
  expect((await repository.load(child, next.prepared.generation))?.prepared.lesson.id).toBe(
    previous.prepared.lesson.id
  );
  db.close();
});
