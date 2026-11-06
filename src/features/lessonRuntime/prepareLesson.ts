import type { ActivityV1 } from "@/content/contracts/activity";
import type { LessonV1 } from "@/content/contracts/lesson";
import { validatePublishedLessonGraph } from "@/content/contracts/validateLessonGraph";
import { activityAssetsReady, type LocalActivityAssets } from "@/features/practice/activityMedia";

export interface PreparedLesson {
  source: "development_fixture";
  generation: string;
  lesson: LessonV1;
  activities: ActivityV1[];
  media?: LocalActivityAssets;
  courseLessonIds?: string[];
}

/** Guided runtime advances prompts from less to more assistance within one attempt. */
export function isGuidedActivityPrepared(activity: ActivityV1, media?: LocalActivityAssets) {
  const ranks = { independent: 0, natural_cue: 0, visual_cue: 1, partial_model: 2, full_model: 3 };
  return (
    (activity.assets.required.length === 0 ||
      Boolean(media && activity.assets.required.every((asset) => Boolean(media[asset.assetId])))) &&
    activity.promptLadder.every(
      (prompt, index, ladder) =>
        index === 0 || ranks[prompt.level] >= ranks[ladder[index - 1]!.level]
    )
  );
}

/** No production content can pass this development-only preparation boundary. */
export function prepareDevelopmentLesson(
  graph: Parameters<typeof validatePublishedLessonGraph>[0],
  development: boolean,
  resources?: { media: LocalActivityAssets; accountId: string; childId: string }
): PreparedLesson {
  if (!development) throw new Error("FIXTURE_NOT_ALLOWED");
  const result = validatePublishedLessonGraph(graph);
  if (!result.ok) throw new Error("INVALID_LESSON_GRAPH");
  for (const activity of result.activities) {
    if (
      !isGuidedActivityPrepared(activity, resources?.media) ||
      (resources &&
        !activityAssetsReady(activity, resources.media, resources.accountId, resources.childId))
    )
      throw new Error("ACTIVITY_NOT_PREPARED");
  }
  const prepared: PreparedLesson = {
    source: "development_fixture",
    generation: `fixture:${result.lesson.id}:${result.lesson.version}`,
    lesson: result.lesson,
    activities: result.activities,
    ...(resources ? { media: resources.media } : {})
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
