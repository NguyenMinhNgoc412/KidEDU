import { prepareSampleLesson, findSampleLesson } from "@/features/lessonRuntime/lessonCatalog";
import { buildMediaSampleGraph } from "@/features/lessonRuntime/mediaSampleLessons";
import { validatePublishedLessonGraph } from "@/content/contracts/validateLessonGraph";
import { prepareFixtureMedia, verifyLocalActivityMedia } from "./practiceFixtureMedia";
import type { LessonRuntimeRepository } from "@/features/lessonRuntime/runtimeRepository";
import { preparePlayIllustrations } from "./preparePlayIllustrations";

export async function preparePracticeSample(
  accountId: string,
  childId: string,
  lessonId: string,
  repository?: LessonRuntimeRepository | null
) {
  const sample = findSampleLesson(lessonId);
  if (!sample) throw new Error("UNKNOWN_LESSON");
  if ("presentation" in sample) await preparePlayIllustrations(sample.presentation);
  if (!("activityType" in sample)) return prepareSampleLesson(__DEV__, lessonId);
  const graph = validatePublishedLessonGraph(buildMediaSampleGraph(sample));
  if (!graph.ok) throw new Error("INVALID_LESSON_GRAPH");
  const media = await prepareFixtureMedia(graph.activities, accountId, childId);
  for (const activity of graph.activities) {
    if (!repository || activity.type === "parent_transfer") continue;
    const bindings = await repository.practiceMedia(
      childId,
      lessonId,
      activity.targetIds[0]!,
      activity.type
    );
    for (const ref of activity.assets.required) {
      const custom = bindings[ref.assetId];
      if (!custom || custom.role !== ref.role) continue;
      const candidate = { ...media, [ref.assetId]: custom };
      if (await verifyLocalActivityMedia([activity], candidate, accountId, childId))
        media[ref.assetId] = custom;
    }
  }
  if (!(await verifyLocalActivityMedia(graph.activities, media, accountId, childId)))
    throw new Error("ACTIVITY_NOT_PREPARED");
  return prepareSampleLesson(__DEV__, lessonId, { media, accountId, childId });
}
