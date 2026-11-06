import { getDevelopmentLesson, developmentLessonGraph } from "../developmentLesson";
import { prepareDevelopmentLesson } from "../prepareLesson";
import { permitsLocalFixture } from "../fixtureBoundary";
import { createLessonSession, recordObservation, transition } from "../sessionEngine";
import { restoreSession } from "../restoreSession";
import { prepareSampleLesson } from "../lessonCatalog";

const childId = "10000000-0000-4000-8000-000000000011";
function waiting() {
  let session = createLessonSession("test_session", childId, getDevelopmentLesson(true));
  session = transition(session, { type: "start" });
  return transition(session, { type: "begin_wait" });
}
test("preparation rejects production and missing required media; freezes lesson snapshot", () => {
  expect(() => getDevelopmentLesson(false)).toThrow("FIXTURE_NOT_ALLOWED");
  const graph = structuredClone(developmentLessonGraph);
  graph.activities[0]!.assets.required.push({
    assetId: "missing_visual",
    role: "semantic_visual"
  } as never);
  expect(() => prepareDevelopmentLesson(graph, true)).toThrow("ACTIVITY_NOT_PREPARED");
  expect(Object.isFrozen(getDevelopmentLesson(true).activities[0])).toBe(true);
});
test("wait blocks early prompt/observation and pause never advances automatically", () => {
  const session = waiting();
  expect(transition(session, { type: "observe" })).toBe(session);
  expect(transition(session, { type: "prompt" })).toBe(session);
  const paused = transition(session, { type: "pause" });
  expect(transition(paused, { type: "elapsed", ms: 5000 })).toBe(paused);
  const resumed = transition(paused, { type: "resume" });
  expect(resumed.waitRemainingMs).toBe(3000);
  const ready = transition(resumed, { type: "elapsed", ms: 3000 });
  expect(transition(ready, { type: "observe" }).phase).toBe("observation");
});
test("replay is bounded and never produces observation; prompt retains highest used level", () => {
  let session = waiting();
  for (let i = 0; i < 2; i++) {
    session = transition(session, { type: "replay" });
    session = transition(session, { type: "begin_wait" });
  }
  expect(transition(session, { type: "replay" })).toBe(session);
  session = transition(session, { type: "elapsed", ms: 3000 });
  session = transition(session, { type: "prompt" });
  session = transition(session, { type: "elapsed", ms: 3000 });
  session = transition(session, { type: "observe" });
  expect(transition(session, { type: "confirm_prompt", level: 0 })).toBe(session);
  expect(() => recordObservation(session, "independent", new Date().toISOString(), true)).toThrow(
    "PROMPT_RESULT_CONFLICT"
  );
});
test("parent observation advances exactly one activity; transfer has distinct context", () => {
  let session = transition(transition(waiting(), { type: "elapsed", ms: 3000 }), {
    type: "observe"
  });
  expect(() => recordObservation(session, "independent", new Date().toISOString(), false)).toThrow(
    "PARENT_OBSERVATION_REQUIRED"
  );
  const first = recordObservation(session, "independent", "2026-10-12T00:00:00Z", true);
  expect(first.event.payload.context).toBe("in_app");
  session = transition(first.next, { type: "defer" });
  expect(() => recordObservation(session, "not_yet", "2026-10-12T00:00:00Z", true)).toThrow(
    "DEFERRED_NOT_OBSERVED"
  );
  const last = recordObservation(session, "not_observed", "2026-10-12T00:00:00Z", true);
  expect(last.next.phase).toBe("finished");
  expect(last.event.payload.context).toBe("parent_guided");
  expect(last.event.payload.promptLevel).toBeNull();
  expect(last.event.eventId).not.toBe(first.event.eventId);
});
test("cold restore pauses; corrupt or cross-child checkpoint cannot resume", () => {
  const session = waiting();
  expect(restoreSession(JSON.stringify(session), childId).phase).toBe("paused");
  expect(() =>
    restoreSession(JSON.stringify(session), "20000000-0000-4000-8000-000000000011")
  ).toThrow("INVALID_CHECKPOINT");
  expect(() => restoreSession(JSON.stringify({ ...session, index: 99 }), childId)).toThrow(
    "INVALID_CHECKPOINT"
  );
});
test("fixture cannot run against production or Supabase accounts", () => {
  expect(permitsLocalFixture(true, "http://localhost:3000")).toBe(true);
  expect(permitsLocalFixture(false, "http://localhost:3000")).toBe(false);
  expect(permitsLocalFixture(true, "https://api.example.com")).toBe(false);
  expect(permitsLocalFixture(true, "http://localhost:3000", "https://example.supabase.co")).toBe(
    false
  );
});

test("real-object commands persist parent-guided observations and restore without replay", () => {
  let session = createLessonSession(
    "command_session",
    childId,
    prepareSampleLesson(true, "fixture_lesson_two_steps")
  );
  session = transition(session, { type: "start" });
  session = transition(session, { type: "begin_wait" });
  expect(restoreSession(JSON.stringify(session), childId).phase).toBe("paused");
  session = transition(session, { type: "elapsed", ms: 3000 });
  session = transition(session, { type: "observe" });
  session = transition(session, { type: "confirm_prompt", level: 1 });
  const { event } = recordObservation(session, "supported", "2026-11-03T00:00:00Z", true);
  expect(event.payload).toMatchObject({
    activityType: "command",
    context: "parent_guided",
    promptLevel: 1
  });
});

test("observation interprets prompt meaning rather than assuming index zero is independent", () => {
  const graph = structuredClone(developmentLessonGraph);
  graph.activities[0]!.promptLadder = [graph.activities[0]!.promptLadder[2]!];
  let session = createLessonSession(
    "model_session",
    childId,
    prepareDevelopmentLesson(graph, true)
  );
  session = transition(session, { type: "start" });
  session = transition(session, { type: "begin_wait" });
  session = transition(session, { type: "elapsed", ms: 3000 });
  session = transition(session, { type: "observe" });
  expect(() => recordObservation(session, "independent", "2026-11-03T00:00:00Z", true)).toThrow(
    "PROMPT_RESULT_CONFLICT"
  );
  expect(
    recordObservation(session, "supported", "2026-11-03T00:00:00Z", true).event.payload.promptLevel
  ).toBe(3);
});

test("preparation and restore reject prompt order that could erase assistance within an attempt", () => {
  const graph = structuredClone(developmentLessonGraph);
  graph.activities[0]!.promptLadder.reverse();
  expect(() => prepareDevelopmentLesson(graph, true)).toThrow("ACTIVITY_NOT_PREPARED");
  const session = waiting();
  const saved = JSON.parse(JSON.stringify(session));
  saved.prepared.activities[0].promptLadder.reverse();
  expect(() => restoreSession(JSON.stringify(saved), childId)).toThrow("INVALID_CHECKPOINT");
});
