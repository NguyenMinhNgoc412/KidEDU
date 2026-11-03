import type { ActivityV1 } from "@/content/contracts/activity";
import type { LessonV1 } from "@/content/contracts/lesson";
import { validatePublishedLessonGraph } from "@/content/contracts/validateLessonGraph";

export interface PreparedLesson {
  source: "development_fixture";
  generation: string;
  lesson: LessonV1;
  activities: ActivityV1[];
}

/** No production content can pass this development-only preparation boundary. */
export function prepareDevelopmentLesson(
  graph: Parameters<typeof validatePublishedLessonGraph>[0],
  development: boolean
): PreparedLesson {
  if (!development) throw new Error("FIXTURE_NOT_ALLOWED");
  const result = validatePublishedLessonGraph(graph);
  if (!result.ok) throw new Error("INVALID_LESSON_GRAPH");
  for (const activity of result.activities) {
    if (
      !["command", "functional_communication", "parent_transfer"].includes(activity.type) ||
      activity.assets.required.length > 0
    )
      throw new Error("ACTIVITY_NOT_PREPARED");
  }
  const prepared: PreparedLesson = {
    source: "development_fixture",
    generation: `fixture:${result.lesson.id}:${result.lesson.version}`,
    lesson: result.lesson,
    activities: result.activities
  };
  return freeze(prepared);
}

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export function freezePreparedLesson(value: PreparedLesson) {
  return freeze(value);
}
