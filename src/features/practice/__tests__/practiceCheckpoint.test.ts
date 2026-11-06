import { prepareSampleLesson } from "@/features/lessonRuntime/lessonCatalog";
import { createLessonSession, transition } from "@/features/lessonRuntime/sessionEngine";
import {
  practiceCheckpoint,
  restorePracticeCheckpoint,
  scopePracticeLesson
} from "../practiceCheckpoint";
const child = "11111111-1111-4111-8111-111111111111";
test("practice has a distinct generation; server references restore paused without media/account payloads", () => {
  const learning = prepareSampleLesson(true, "fixture_lesson_put_ball");
  const prepared = scopePracticeLesson(learning);
  expect(prepared.generation).not.toBe(learning.generation);
  const session = transition(createLessonSession("practice_a", child, prepared), { type: "start" });
  const document = practiceCheckpoint(session);
  expect(document).not.toHaveProperty("prepared");
  expect(document).not.toHaveProperty("childId");
  const restored = restorePracticeCheckpoint(session.id, child, prepared, document);
  expect(restored.phase).toBe("paused");
  expect(restored.resumePhase).toBe("presenting");
  expect(() =>
    restorePracticeCheckpoint(session.id, child, prepared, { ...document, lessonId: "other" })
  ).toThrow("INVALID_CHECKPOINT");
  expect(() =>
    restorePracticeCheckpoint(session.id, child, prepared, { ...document, index: 80 })
  ).toThrow("INVALID_CHECKPOINT");
});
