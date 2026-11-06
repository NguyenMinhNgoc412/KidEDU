import { z } from "zod";

export const rewardKindSchema = z.enum(["sticker", "puzzle_piece"]);
export type RewardKind = z.infer<typeof rewardKindSchema>;
export const rewardItemSchema = z
  .string()
  .regex(/^(sticker_(animals|heroes|princesses)_[1-6]|piece_(garden|space)_[0-3])$/);
const id = z.string().regex(/^[a-z][a-z0-9_:-]{2,159}$/);
export const rewardReceiptSchema = z
  .strictObject({ kind: rewardKindSchema, itemId: rewardItemSchema })
  .refine((value) =>
    value.kind === "sticker"
      ? value.itemId.startsWith("sticker_")
      : value.itemId.startsWith("piece_")
  );
export type RewardReceipt = z.infer<typeof rewardReceiptSchema>;
export const rewardReceiptsSchema = z
  .record(id, rewardReceiptSchema)
  .refine((value) => Object.keys(value).length <= 120);
export const pendingRewardSchema = z
  .strictObject({
    key: id,
    activityId: id,
    slot: z.enum(["round_1", "round_2", "round_3", "lesson", "play"]),
    stickerCandidate: rewardItemSchema.refine((id) => id.startsWith("sticker_")),
    pieceCandidate: rewardItemSchema.refine((id) => id.startsWith("piece_")).nullable(),
    selectedKind: rewardKindSchema.nullable()
  })
  .refine((value) => value.key === `${value.activityId}:${value.slot}`);
export type PendingReward = z.infer<typeof pendingRewardSchema>;
export function validPendingReceipt(
  pending: PendingReward,
  receipts: Record<string, RewardReceipt>
) {
  const receipt = receipts[pending.key];
  return (
    !receipt ||
    (receipt.kind === pending.selectedKind &&
      receipt.itemId ===
        (receipt.kind === "sticker" ? pending.stickerCandidate : pending.pieceCandidate))
  );
}
