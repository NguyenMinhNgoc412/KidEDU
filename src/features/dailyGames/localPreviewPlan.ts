import { dailyGamePlanSchemaV1 } from "@/content/contracts/dailyGame";
import type { PlayPiece } from "@/content/contracts/playPresentation";

/** Synthetic developer fixture only. Never a published catalog or access grant. */
export const previewTargets: Record<string, PlayPiece> = Object.fromEntries(
  [
    ["bong", "Bóng"],
    ["gau", "Gấu"],
    ["xe", "Xe"],
    ["banh", "Bánh"],
    ["sua", "Sữa"]
  ].map(([id, label]) => [
    `target_${id}`,
    { id: `target_${id}`, label: label!, picture: `item-${id}` }
  ])
) as Record<string, PlayPiece>;
const ids = Object.keys(previewTargets);
export const localPreviewPlan = dailyGamePlanSchemaV1.parse({
  schemaVersion: 1,
  kind: "daily_game",
  contentVersion: "local_preview_v1",
  tier: "basic",
  shadowScreens: [ids.slice(0, 3), ids.slice(2, 5)].map((targetIds, index) => ({
    id: `shadow_${index}`,
    targetIds
  })),
  listenRounds: ids.map((targetId, index) => ({
    id: `listen_${index}`,
    targetId,
    optionTargetIds: [targetId, ids[(index + 1) % ids.length], ids[(index + 2) % ids.length]]
  })),
  memoryTargetIds: ids
});
