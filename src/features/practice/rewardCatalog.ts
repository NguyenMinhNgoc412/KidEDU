import type { PendingReward, RewardReceipt } from "@/content/contracts/gameReward";
export const rewardThemes = ["animals", "heroes", "princesses"] as const;
export const rewardThemeNames = {
  animals: "Động vật",
  heroes: "Siêu nhân",
  princesses: "Công chúa"
};
export const rewardStickerNames = {
  animals: ["Mèo", "Chó", "Thỏ", "Cá", "Chim", "Rùa"],
  heroes: ["Tia chớp", "Khiên dũng cảm", "Siêu nhân xanh", "Tên lửa", "Ngôi sao", "Người bạn thép"],
  princesses: ["Vương miện", "Lâu đài", "Hoa xinh", "Công chúa", "Đũa phép", "Trái tim"]
};
export const puzzleNames = { garden: "Khu vườn của bé", space: "Chuyến đi vũ trụ" };
export const rewardStickers = rewardThemes.flatMap((theme) =>
  Array.from({ length: 6 }, (_, index) => `sticker_${theme}_${index + 1}`)
);
export const puzzlePieces = Object.keys(puzzleNames).flatMap((puzzle) =>
  Array.from({ length: 4 }, (_, index) => `piece_${puzzle}_${index}`)
);
export function rewardName(id: string) {
  if (id.startsWith("sticker_")) {
    const [, theme, index] = id.split("_");
    return (
      rewardStickerNames[theme as keyof typeof rewardStickerNames]?.[Number(index) - 1] ?? "Sticker"
    );
  }
  const [, puzzle, index] = id.split("_");
  return `Mảnh ${Number(index) + 1} · ${puzzleNames[puzzle as keyof typeof puzzleNames] ?? "Tranh của bé"}`;
}
function pick<T>(items: readonly T[], seed: string): T {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return items[hash % items.length]!;
}
export function prepareReward(
  activityId: string,
  slot: PendingReward["slot"],
  seed: string,
  inventory: string[],
  receipts: Record<string, RewardReceipt>
): PendingReward {
  const owned = new Set([
    ...inventory,
    ...Object.values(receipts).map((receipt) => receipt.itemId)
  ]);
  const missingStickers = rewardStickers.filter((id) => !owned.has(id));
  const incomplete = Object.keys(puzzleNames).filter((puzzle) =>
    Array.from({ length: 4 }, (_, i) => `piece_${puzzle}_${i}`).some((id) => !owned.has(id))
  );
  const active = incomplete.filter((puzzle) =>
    Array.from({ length: 4 }, (_, i) => `piece_${puzzle}_${i}`).some((id) => owned.has(id))
  );
  const key = `${activityId}:${slot}`;
  const puzzle = active.length
    ? active[0]
    : incomplete.length
      ? pick(incomplete, `${seed}:${key}:picture`)
      : null;
  const missing = puzzle
    ? puzzlePieces.filter((id) => id.startsWith(`piece_${puzzle}_`) && !owned.has(id))
    : [];
  const saved = receipts[key];
  return {
    key,
    activityId,
    slot,
    selectedKind: saved?.kind ?? null,
    stickerCandidate:
      saved?.kind === "sticker"
        ? saved.itemId
        : pick(missingStickers.length ? missingStickers : rewardStickers, `${seed}:${key}:sticker`),
    pieceCandidate:
      saved?.kind === "puzzle_piece"
        ? saved.itemId
        : missing.length
          ? pick(missing, `${seed}:${key}:piece`)
          : null
  };
}
