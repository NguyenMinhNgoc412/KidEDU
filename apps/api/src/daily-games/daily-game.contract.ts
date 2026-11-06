import { z } from "zod";

// C50 P1: pack content, not an activation grant or proof of a completed session.
const id = z.string().regex(/^[a-z][a-z0-9_:-]{2,159}$/);
const uniqueIds = (count: number) =>
  z
    .array(id)
    .length(count)
    .refine((v) => new Set(v).size === v.length);
const shadowScreen = z.strictObject({ id, targetIds: uniqueIds(3) });
const listenRound = z
  .strictObject({ id, targetId: id, optionTargetIds: uniqueIds(3) })
  .refine(
    (round) => round.optionTargetIds.includes(round.targetId),
    "Answer must be an authored option"
  );

export const dailyGamePlanSchemaV1 = z
  .strictObject({
    schemaVersion: z.literal(1),
    kind: z.literal("daily_game"),
    contentVersion: id,
    tier: z.enum(["basic", "full"]),
    shadowScreens: z.array(shadowScreen).min(2).max(5),
    listenRounds: z.array(listenRound).min(5).max(12),
    memoryTargetIds: uniqueIds(5)
  })
  .superRefine((plan, context) => {
    const issue = (path: string[], message: string) =>
      context.addIssue({ code: "custom", path, message });
    if (plan.shadowScreens.length !== (plan.tier === "full" ? 5 : 2))
      issue(["shadowScreens"], "Incorrect number of shadow screens for tier");
    if (plan.listenRounds.length !== (plan.tier === "full" ? 12 : 5))
      issue(["listenRounds"], "Incorrect number of listening rounds for tier");
    const roundIds = [
      ...plan.shadowScreens.map((v) => v.id),
      ...plan.listenRounds.map((v) => v.id)
    ];
    if (new Set(roundIds).size !== roundIds.length)
      issue(["listenRounds"], "Round IDs must be unique across the session");
    if (new Set(plan.listenRounds.map((v) => v.targetId)).size !== plan.listenRounds.length)
      issue(["listenRounds"], "Listening requires distinct authored target words");
  });
export type DailyGamePlanV1 = z.infer<typeof dailyGamePlanSchemaV1>;

// Checkpoints contain completed IDs, never parent observations or media URLs.
export const dailyGameCheckpointSchemaV1 = z
  .strictObject({
    schemaVersion: z.literal(1),
    kind: z.literal("daily_game"),
    contentVersion: id,
    shadowScreenIndex: z.number().int().min(0).max(5),
    placedTargetIds: z.array(id).max(3),
    listenRoundIndex: z.number().int().min(0).max(12),
    memoryMatchedTargetIds: z.array(id).max(5),
    memoryOpenCardIds: z.array(z.string().regex(/^[a-z][a-z0-9_:-]{2,159}:[ab]$/)).max(2)
  })
  .superRefine((value, context) => {
    for (const field of [
      "placedTargetIds",
      "memoryMatchedTargetIds",
      "memoryOpenCardIds"
    ] as const) {
      if (new Set(value[field]).size !== value[field].length)
        context.addIssue({ code: "custom", path: [field], message: "Duplicate checkpoint IDs" });
    }
  });
export type DailyGameCheckpointV1 = z.infer<typeof dailyGameCheckpointSchemaV1>;

/** Validate references after resolving the immutable prepared pack, before restore/commit. */
export function validateDailyGameCheckpoint(planInput: unknown, checkpointInput: unknown) {
  const plan = dailyGamePlanSchemaV1.parse(planInput);
  const checkpoint = dailyGameCheckpointSchemaV1.parse(checkpointInput);
  const shadowDone = checkpoint.shadowScreenIndex === plan.shadowScreens.length;
  const listenDone = checkpoint.listenRoundIndex === plan.listenRounds.length;
  if (
    checkpoint.contentVersion !== plan.contentVersion ||
    checkpoint.shadowScreenIndex > plan.shadowScreens.length ||
    checkpoint.listenRoundIndex > plan.listenRounds.length ||
    (!shadowDone && checkpoint.listenRoundIndex !== 0) ||
    ((!shadowDone || !listenDone) &&
      (checkpoint.memoryMatchedTargetIds.length > 0 || checkpoint.memoryOpenCardIds.length > 0))
  )
    throw new Error("Checkpoint does not match the prepared daily game sequence");
  const shadowTargets = plan.shadowScreens[checkpoint.shadowScreenIndex]?.targetIds ?? [];
  if (
    checkpoint.placedTargetIds.some((target) => !shadowTargets.includes(target)) ||
    checkpoint.memoryMatchedTargetIds.some((target) => !plan.memoryTargetIds.includes(target))
  )
    throw new Error("Unknown completed target in checkpoint");
  for (const card of checkpoint.memoryOpenCardIds) {
    const target = card.slice(0, -2);
    if (
      !plan.memoryTargetIds.includes(target) ||
      checkpoint.memoryMatchedTargetIds.includes(target)
    )
      throw new Error("Unknown or already matched open card");
  }
  return checkpoint;
}

export const dailyGamePlanJsonSchemaV1 = {
  ...z.toJSONSchema(dailyGamePlanSchemaV1, { target: "draft-2020-12" }),
  $id: "urn:kidedu:content:daily-game-plan:v1"
};
