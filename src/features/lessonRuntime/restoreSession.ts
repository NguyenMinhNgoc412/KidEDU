import { z } from "zod";
import { activitySchemaV1 } from "@/content/contracts/activity";
import { lessonSchemaV1 } from "@/content/contracts/lesson";
import type { LessonSession } from "./sessionEngine";
import { freezePreparedLesson, isGuidedActivityPrepared } from "./prepareLesson";
import { localActivityAssetSchema } from "@/features/practice/activityMedia";
import { practiceCourseStateSchema } from "@/features/practice/practiceCourseState";
import { sessionActivityIndex } from "./sessionEngine";
import {
  pendingRewardSchema,
  rewardReceiptsSchema,
  validPendingReceipt
} from "@/content/contracts/gameReward";
import {
  validWordGameProgress,
  wordGameProgressMapSchema
} from "@/content/contracts/wordGameProgress";

const activePhase = z.enum(["overview", "presenting", "waiting", "observation", "finished"]);
const schema = z.strictObject({
  id: z.string().min(1).max(64),
  childId: z.uuid(),
  revision: z.number().int().nonnegative(),
  prepared: z.strictObject({
    source: z.literal("development_fixture"),
    generation: z.string().max(160),
    lesson: lessonSchemaV1,
    activities: z.array(activitySchemaV1).min(2).max(64),
    media: z.record(z.string().max(100), localActivityAssetSchema).optional(),
    courseLessonIds: z.array(z.string()).min(1).max(30).optional()
  }),
  index: z.number().int().nonnegative(),
  phase: z.enum([...activePhase.options, "paused"]),
  resumePhase: activePhase.nullable(),
  waitRemainingMs: z.number().nonnegative().max(30000),
  promptLevel: z.number().int().nonnegative(),
  repeats: z.number().int().nonnegative(),
  deferred: z.boolean(),
  gameRounds: z.record(z.string().max(160), z.number().int().min(1).max(3)).optional(),
  gameProgress: wordGameProgressMapSchema.optional(),
  rewardReceipts: rewardReceiptsSchema.optional(),
  pendingReward: pendingRewardSchema.optional(),
  gameStickers: z
    .record(
      z.string().max(160),
      z.enum(["item-bong", "item-gau", "item-xe", "item-banh", "item-sua"])
    )
    .optional(),
  course: practiceCourseStateSchema.optional()
});

export function restoreSession(document: string, childId: string): LessonSession {
  if (document.length > 1000000) throw new Error("INVALID_CHECKPOINT");
  const value = schema.parse(JSON.parse(document));
  if (
    value.childId !== childId ||
    value.phase === "finished" ||
    ![
      `fixture:${value.prepared.lesson.id}:${value.prepared.lesson.version}`,
      `practice:fixture:${value.prepared.lesson.id}:${value.prepared.lesson.version}`,
      `practice-course:fixture:${value.prepared.lesson.id}:${value.prepared.lesson.version}`
    ].includes(value.prepared.generation) ||
    value.prepared.activities.length !== value.prepared.lesson.activitySequence.length ||
    (value.phase === "paused" && (!value.resumePhase || value.resumePhase === "finished"))
  )
    throw new Error("INVALID_CHECKPOINT");
  for (const [index, activity] of value.prepared.activities.entries()) {
    const ref = value.prepared.lesson.activitySequence[index]!;
    if (
      ref.id !== activity.id ||
      ref.version !== activity.version ||
      ref.type !== activity.type ||
      !isGuidedActivityPrepared(activity, value.prepared.media)
    )
      throw new Error("INVALID_CHECKPOINT");
  }
  if (
    Object.keys(value.gameRounds ?? {}).some(
      (id) =>
        !value.prepared.activities.some(
          (activity) => activity.id === id && activity.presentation?.wordGames
        )
    )
  )
    throw new Error("INVALID_CHECKPOINT");
  if (value.course) {
    const course = value.course;
    const phase = value.phase === "paused" ? value.resumePhase : value.phase;
    if (
      JSON.stringify(course.lessonIds) !== JSON.stringify(value.prepared.courseLessonIds) ||
      course.lessonIds[0] !== value.prepared.lesson.id ||
      value.prepared.activities.length !== course.lessonIds.length + 1 ||
      course.attempts.some(
        (attempt, index) =>
          attempt.index !== index ||
          attempt.promptLevel >= value.prepared.activities[index]!.promptLadder.length ||
          attempt.repeats > value.prepared.activities[index]!.repetitionLimit
      ) ||
      (phase === "observation"
        ? course.attempts.length !== course.lessonIds.length ||
          course.reviewIndex >= course.lessonIds.length ||
          value.index !== course.lessonIds.length - 1 ||
          value.promptLevel < course.attempts[course.reviewIndex]!.promptLevel ||
          value.deferred !== course.attempts[course.reviewIndex]!.deferred
        : course.attempts.length !== value.index ||
          course.reviewIndex !== 0 ||
          value.index >= course.lessonIds.length)
    )
      throw new Error("INVALID_CHECKPOINT");
  } else if (value.prepared.courseLessonIds) throw new Error("INVALID_CHECKPOINT");
  const activity = value.prepared.activities[sessionActivityIndex(value)];
  if (
    !activity ||
    value.promptLevel >= activity.promptLadder.length ||
    value.repeats > activity.repetitionLimit
  )
    throw new Error("INVALID_CHECKPOINT");
  const prepared = freezePreparedLesson(value.prepared);
  if (
    Object.keys(value.rewardReceipts ?? {}).some(
      (key) =>
        !value.prepared.activities.some(
          (activity) =>
            activity.presentation &&
            (activity.presentation.wordGames
              ? ["round_1", "round_2", "round_3", "lesson"].some(
                  (slot) => key === `${activity.id}:${slot}`
                )
              : key === `${activity.id}:play`)
        )
    )
  )
    throw new Error("INVALID_CHECKPOINT");
  if (value.pendingReward) {
    const pending = value.pendingReward;
    const effective = value.phase === "paused" ? value.resumePhase : value.phase;
    const round = value.gameRounds?.[activity.id] ?? 0;
    if (
      !["presenting", "waiting"].includes(effective ?? "") ||
      pending.activityId !== activity.id ||
      !activity.presentation ||
      !validPendingReceipt(pending, value.rewardReceipts ?? {}) ||
      (activity.presentation.wordGames
        ? pending.slot === "play" ||
          (pending.slot === "lesson" ? round !== 3 : pending.slot !== `round_${round + 1}`)
        : pending.slot !== "play")
    )
      throw new Error("INVALID_CHECKPOINT");
  }
  if (
    Object.entries(value.gameProgress ?? {}).some(([id, progress]) => {
      const game = value.prepared.activities.find((activity) => activity.id === id)?.presentation;
      return !game?.wordGames || !validWordGameProgress(game, progress);
    })
  )
    throw new Error("INVALID_CHECKPOINT");
  if (
    Object.entries(value.gameStickers ?? {}).some(
      ([id]) =>
        value.gameRounds?.[id] !== 3 ||
        !value.prepared.activities.some(
          (activity) => activity.id === id && activity.presentation?.wordGames
        )
    )
  )
    throw new Error("INVALID_CHECKPOINT");
  return value.phase === "paused"
    ? { ...value, prepared }
    : { ...value, prepared, phase: "paused", resumePhase: value.phase };
}
