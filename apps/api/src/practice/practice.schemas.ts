import { z } from "zod";

const id = z.string().regex(/^[a-z][a-z0-9_:-]{2,159}$/);
const uniqueIds = z
  .array(id)
  .max(30)
  .refine((ids) => new Set(ids).size === ids.length);
export const practiceDocumentSchema = z.strictObject({
  schemaVersion: z.literal(1),
  curriculumVersion: id,
  goalIds: uniqueIds,
  selectedLessonId: id.nullable(),
  deferredLessonIds: uniqueIds,
  lessonIds: uniqueIds.optional()
});
export const practiceSaveSchema = z.strictObject({
  expectedRevision: z.number().int().min(0).max(2147483646),
  document: practiceDocumentSchema
});
const phase = z.enum(["overview", "presenting", "waiting", "observation", "paused", "finished"]);
const rewardKind = z.enum(["sticker", "puzzle_piece"]);
const rewardItem = z
  .string()
  .regex(/^(sticker_(animals|heroes|princesses)_[1-6]|piece_(garden|space)_[0-3])$/);
const rewardReceipt = z
  .strictObject({ kind: rewardKind, itemId: rewardItem })
  .refine((value) =>
    value.kind === "sticker"
      ? value.itemId.startsWith("sticker_")
      : value.itemId.startsWith("piece_")
  );
const pendingReward = z
  .strictObject({
    key: id,
    activityId: id,
    slot: z.enum(["round_1", "round_2", "round_3", "lesson", "play"]),
    stickerCandidate: rewardItem.refine((id) => id.startsWith("sticker_")),
    pieceCandidate: rewardItem.refine((id) => id.startsWith("piece_")).nullable(),
    selectedKind: rewardKind.nullable()
  })
  .refine((value) => value.key === `${value.activityId}:${value.slot}`);
const progressIds = (max: number, length = 80) =>
  z
    .array(
      z
        .string()
        .regex(/^[a-z][a-z0-9_]+$/)
        .max(length)
    )
    .max(max)
    .refine((values) => new Set(values).size === values.length);
const gameProgress = z.strictObject({
  schemaVersion: z.literal(1),
  memoryOpen: progressIds(2, 82),
  memoryMatched: progressIds(5),
  found: progressIds(5),
  placed: progressIds(5)
});
export const practicePrepareSchema = z.strictObject({
  lessonIds: uniqueIds.refine((ids) => ids.length > 0).optional()
});
const courseSchema = z.strictObject({
  lessonIds: uniqueIds.refine((ids) => ids.length > 0),
  attempts: z
    .array(
      z.strictObject({
        index: z.number().int().min(0).max(29),
        promptLevel: z.number().int().min(0).max(4),
        repeats: z.number().int().min(0).max(10),
        deferred: z.boolean(),
        occurredAt: z.iso.datetime()
      })
    )
    .max(30),
  reviewIndex: z.number().int().min(0).max(30)
});
export const checkpointSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    lessonId: id,
    lessonVersion: z.number().int().positive(),
    revision: z.number().int().min(0).max(2147483647),
    index: z.number().int().min(0).max(64),
    phase,
    resumePhase: z.enum(["overview", "presenting", "waiting", "observation"]).nullable(),
    promptLevel: z.number().int().min(0).max(4),
    repeats: z.number().int().min(0).max(10),
    waitRemainingMs: z.number().min(0).max(30000),
    deferred: z.boolean(),
    rewardReceipts: z
      .record(id, rewardReceipt)
      .refine((value) => Object.keys(value).length <= 120)
      .optional(),
    pendingReward: pendingReward.optional(),
    gameRounds: z
      .record(id, z.number().int().min(1).max(3))
      .refine((value) => Object.keys(value).length <= 30)
      .optional(),
    gameProgress: z
      .record(id, gameProgress)
      .refine((value) => Object.keys(value).length <= 30)
      .optional(),
    course: courseSchema.optional(),
    gameStickers: z
      .record(id, z.enum(["item-bong", "item-gau", "item-xe", "item-banh", "item-sua"]))
      .refine((value) => Object.keys(value).length <= 30)
      .optional()
  })
  .superRefine((value, context) => {
    if (value.pendingReward) {
      const pending = value.pendingReward,
        receipt = value.rewardReceipts?.[pending.key];
      const effective = value.phase === "paused" ? value.resumePhase : value.phase;
      if (
        !["presenting", "waiting"].includes(effective ?? "") ||
        (receipt &&
          (receipt.kind !== pending.selectedKind ||
            receipt.itemId !==
              (receipt.kind === "sticker" ? pending.stickerCandidate : pending.pieceCandidate)))
      )
        context.addIssue({ code: "custom", message: "Invalid pending reward" });
    }
    if (Object.keys(value.gameStickers ?? {}).some((id) => value.gameRounds?.[id] !== 3))
      context.addIssue({ code: "custom", message: "Gift requires three completed games" });
    if ((value.phase === "paused") !== (value.resumePhase !== null))
      context.addIssue({ code: "custom", message: "Invalid paused state" });
    if (value.course) {
      const course = value.course;
      const phase = value.phase === "paused" ? value.resumePhase : value.phase;
      const count = course.lessonIds.length;
      if (
        course.lessonIds[0] !== value.lessonId ||
        course.attempts.some((attempt, index) => attempt.index !== index) ||
        (phase === "finished"
          ? value.index !== count ||
            course.attempts.length !== count ||
            course.reviewIndex !== count
          : phase === "observation"
            ? value.index !== count - 1 ||
              course.attempts.length !== count ||
              course.reviewIndex >= count ||
              value.promptLevel < course.attempts[course.reviewIndex]!.promptLevel ||
              value.deferred !== course.attempts[course.reviewIndex]!.deferred
            : value.index >= count ||
              course.attempts.length !== value.index ||
              course.reviewIndex !== 0)
      )
        context.addIssue({ code: "custom", message: "Invalid course checkpoint" });
    }
  });
export const sessionIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{3,64}$/);
