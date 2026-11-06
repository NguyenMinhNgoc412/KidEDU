import { prepareSampleLesson } from "@/features/lessonRuntime/lessonCatalog";
import {
  createLessonSession,
  recordObservation,
  sessionActivity,
  transition
} from "@/features/lessonRuntime/sessionEngine";
import { restoreSession } from "@/features/lessonRuntime/restoreSession";
import { combinePracticeLessons } from "../preparePracticeCourse";
import { practiceCheckpoint, restorePracticeCheckpoint } from "../practiceCheckpoint";

const childId = "22222222-2222-4222-8222-222222222222";
const prepared = combinePracticeLessons(
  ["fixture_lesson_ball", "fixture_lesson_choice", "fixture_lesson_refusal"].map((id) =>
    prepareSampleLesson(true, id)
  )
);
function learned() {
  let state = transition(createLessonSession("practice_course_test", childId, prepared), {
    type: "start"
  });
  for (let index = 0; index < 3; index++) {
    state = transition(state, { type: "begin_wait" });
    state = transition(state, { type: "elapsed", ms: 30000 });
    state = transition(state, index === 1 ? { type: "defer" } : { type: "observe" });
    expect(state.phase).toBe(index === 2 ? "observation" : "presenting");
  }
  return state;
}
test("one session learns every lesson before any parent review and excludes transfer from invented results", () => {
  let state = learned();
  expect(state.course!.attempts.map((item) => item.deferred)).toEqual([false, true, false]);
  expect(state.course!.reviewIndex).toBe(0);
  expect(sessionActivity(state)!.id).toBe(prepared.activities[0]!.id);
  expect(() => recordObservation(state, "independent", new Date().toISOString(), false)).toThrow(
    "PARENT_OBSERVATION_REQUIRED"
  );
  const first = recordObservation(state, "independent", new Date().toISOString(), true);
  expect(first.event.eventId).toBe("practice_course_test:0");
  expect(first.event.occurredAt).toBe(state.course!.attempts[0]!.occurredAt);
  state = first.next;
  expect(state.phase).toBe("observation");
  expect(state.deferred).toBe(true);
  expect(() => recordObservation(state, "independent", new Date().toISOString(), true)).toThrow(
    "DEFERRED_NOT_OBSERVED"
  );
  const skipped = recordObservation(state, "not_observed", new Date().toISOString(), true);
  expect(skipped.event.eventId).toBe("practice_course_test:1");
  const last = recordObservation(skipped.next, "not_yet", new Date().toISOString(), true);
  expect(last.event.eventId).toBe("practice_course_test:2");
  expect(last.next.phase).toBe("finished");
  expect(last.next.course!.reviewIndex).toBe(3);
});
test("learning and partially completed parent review restore paused without losing per-lesson evidence", () => {
  const state = learned();
  const reviewing = recordObservation(state, "not_yet", new Date().toISOString(), true).next;
  const restored = restoreSession(JSON.stringify(reviewing), childId);
  expect(restored.phase).toBe("paused");
  expect(restored.resumePhase).toBe("observation");
  expect(restored.course!.reviewIndex).toBe(1);
  expect(restored.deferred).toBe(true);
  expect(
    restorePracticeCheckpoint(restored.id, childId, prepared, practiceCheckpoint(restored))
  ).toEqual(restored);
  expect(() =>
    restoreSession(
      JSON.stringify({ ...reviewing, course: { ...reviewing.course, attempts: [] } }),
      childId
    )
  ).toThrow("INVALID_CHECKPOINT");
});
test("learning an individual lesson cannot emit a parent observation", () => {
  const state = transition(createLessonSession("practice_course_test", childId, prepared), {
    type: "start"
  });
  expect(() => recordObservation(state, "independent", new Date().toISOString(), true)).toThrow(
    "PARENT_OBSERVATION_REQUIRED"
  );
  const next = transition(state, { type: "defer" });
  const restored = restoreSession(JSON.stringify(next), childId);
  expect(restored.index).toBe(1);
  expect(restored.course!.attempts.length).toBe(1);
  expect(restored.resumePhase).toBe("presenting");
});
