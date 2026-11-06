import { preparePracticeSample } from "./preparePracticeSample";
import { freezePreparedLesson, type PreparedLesson } from "@/features/lessonRuntime/prepareLesson";
import type { LessonRuntimeRepository } from "@/features/lessonRuntime/runtimeRepository";

/** Lessons are learned in order; transfer remains guidance, never an invented observation. */
export function combinePracticeLessons(lessons: PreparedLesson[]): PreparedLesson {
  if (!lessons.length || lessons.length > 30) throw new Error("INVALID_PRACTICE_COURSE");
  const lessonIds = lessons.map((item) => item.lesson.id);
  if (new Set(lessonIds).size !== lessonIds.length) throw new Error("INVALID_PRACTICE_COURSE");
  const first = lessons[0]!;
  const transfer = first.activities.find((activity) => activity.type === "parent_transfer")!;
  const activities = [
    ...lessons.map((item) =>
      item.activities.find((activity) => activity.type !== "parent_transfer")!
    ),
    transfer
  ];
  return freezePreparedLesson({
    ...first,
    generation: `practice-course:${first.generation}`,
    courseLessonIds: lessonIds,
    activities,
    lesson: {
      ...first.lesson,
      activitySequence: activities.map(({ id, version, type }) => ({ id, version, type })),
      transferActivityRef: { id: transfer.id, version: transfer.version, type: transfer.type }
    },
    // Namespace each binding so the same authored sample asset can have different family replacements.
    media: Object.assign({}, ...lessons.map((item) => item.media ?? {}))
  });
}
export async function preparePracticeCourse(
  accountId: string,
  childId: string,
  lessonIds: string[],
  repository?: LessonRuntimeRepository | null
) {
  const lessons = await Promise.all(
    lessonIds.map((id) => preparePracticeSample(accountId, childId, id, repository))
  );
  // Resolve repeated asset IDs per lesson before freezing the combined snapshot.
  const scoped = lessons.map((item, index) => {
    const prefix = `course_${index}_`;
    const replacements = Object.fromEntries(
      Object.keys(item.media ?? {}).map((id) => [id, `${prefix}${id}`])
    );
    const rename = (value: unknown): unknown =>
      typeof value === "string"
        ? (replacements[value] ?? value)
        : Array.isArray(value)
          ? value.map(rename)
          : value && typeof value === "object"
            ? Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, rename(entry)]))
            : value;
    return {
      ...item,
      activities: item.activities.map((activity) =>
        rename(activity)
      ) as PreparedLesson["activities"],
      media: Object.fromEntries(
        Object.entries(item.media ?? {}).map(([id, asset]) => [replacements[id]!, asset])
      )
    };
  });
  return combinePracticeLessons(scoped);
}
