import { z } from "zod";
import { activitySchemaV1 } from "@/content/contracts/activity";
import { lessonSchemaV1 } from "@/content/contracts/lesson";
import type { LessonSession } from "./sessionEngine";
import { freezePreparedLesson } from "./prepareLesson";

const activePhase = z.enum(["overview", "presenting", "waiting", "observation", "finished"]);
const schema = z.strictObject({
  id: z.string().min(1).max(64),
  childId: z.uuid(),
  revision: z.number().int().nonnegative(),
  prepared: z.strictObject({
    source: z.literal("development_fixture"),
    generation: z.string().max(160),
    lesson: lessonSchemaV1,
    activities: z.array(activitySchemaV1).min(2).max(64)
  }),
  index: z.number().int().nonnegative(),
  phase: z.enum([...activePhase.options, "paused"]),
  resumePhase: activePhase.nullable(),
  waitRemainingMs: z.number().nonnegative().max(30000),
  promptLevel: z.number().int().nonnegative(),
  repeats: z.number().int().nonnegative(),
  deferred: z.boolean()
});

export function restoreSession(document: string, childId: string): LessonSession {
  if (document.length > 1000000) throw new Error("INVALID_CHECKPOINT");
  const value = schema.parse(JSON.parse(document));
  if (
    value.childId !== childId ||
    value.phase === "finished" ||
    value.prepared.generation !==
      `fixture:${value.prepared.lesson.id}:${value.prepared.lesson.version}` ||
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
      activity.assets.required.length ||
      !["command", "functional_communication", "parent_transfer"].includes(activity.type)
    )
      throw new Error("INVALID_CHECKPOINT");
  }
  const activity = value.prepared.activities[value.index];
  if (
    !activity ||
    value.promptLevel >= activity.promptLadder.length ||
    value.repeats > activity.repetitionLimit
  )
    throw new Error("INVALID_CHECKPOINT");
  const prepared = freezePreparedLesson(value.prepared);
  return value.phase === "paused"
    ? { ...value, prepared }
    : { ...value, prepared, phase: "paused", resumePhase: value.phase };
}
