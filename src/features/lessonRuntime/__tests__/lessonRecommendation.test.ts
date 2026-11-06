import { recommendPractice } from "../lessonRecommendation";
import type { LessonEvent, ObservationResult } from "../sessionEngine";

const scope = { childId: "child_a", goalId: "goal_a", targetId: "target_a" };
function event(
  result: ObservationResult,
  context: "in_app" | "parent_guided" = "in_app",
  day = 1
): LessonEvent {
  return {
    schemaVersion: 1,
    eventType: "observation.recorded",
    eventId: `${context}_${day}`,
    childId: scope.childId,
    occurredAt: `2026-11-${String(day).padStart(2, "0")}T00:00:00Z`,
    payload: {
      goalId: scope.goalId,
      targetId: scope.targetId,
      activityType: "functional_communication",
      contentVersion: 1,
      result,
      promptLevel: result === "supported" ? 2 : 0,
      context,
      sessionId: "session"
    }
  };
}
test("skips never erase a valid observation or count as failure", () => {
  expect(recommendPractice([], scope).reasonCode).toBe("observe_first");
  expect(recommendPractice([event("not_observed")], scope).reasonCode).toBe("observe_again");
  expect(
    recommendPractice([event("supported"), event("not_observed", "in_app", 2)], scope).reasonCode
  ).toBe("fade_prompt");
});
test("independent within app does not override support needed outside app", () => {
  expect(
    recommendPractice(
      [event("supported", "parent_guided"), event("independent", "in_app", 2)],
      scope
    ).reasonCode
  ).toBe("transfer_gap");
  expect(recommendPractice([event("independent")], scope)).toMatchObject({
    reasonCode: "vary_context"
  });
  expect(recommendPractice([event("not_yet")], scope).reasonCode).toBe("support_response");
});
test("only the selected child, goal and target contribute; event order does not change result", () => {
  const events = [event("supported"), event("not_yet", "in_app", 2)];
  expect(recommendPractice(events, scope)).toEqual(recommendPractice([...events].reverse(), scope));
  for (const key of ["childId", "goalId", "targetId"] as const) {
    expect(recommendPractice(events, { ...scope, [key]: "other" }).reasonCode).toBe(
      "observe_first"
    );
  }
});
