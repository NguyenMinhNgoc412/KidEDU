import { evaluateEntitlement, type EntitlementProjection } from "../entitlement/entitlement.policy";

// C50: PRD-GAME-001/002, PRD-REWARD-001, PRD-SUB-006, TA-ADR-025.
// Call only after authentication/child ownership checks with a server-owned clock.
export const DAILY_GAME_TIME_ZONE = "Asia/Ho_Chi_Minh";
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DAILY_GAME_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});
const DAY_MS = 86_400_000;

export function dailyGameWindow(serverNow: Date) {
  if (!Number.isFinite(serverNow.getTime())) throw new Error("Invalid server time");
  const parts = dayFormatter.formatToParts(serverNow);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)!.value;
  const playDay = `${part("year")}-${part("month")}-${part("day")}`;
  // Approved modern Vietnam policy is UTC+07:00 without seasonal clock changes.
  const startsAt = new Date(`${playDay}T00:00:00.000+07:00`);
  return { playDay, startsAt, resetAt: new Date(startsAt.getTime() + DAY_MS) };
}

export const BASIC_COLLECTION_IDS = [
  "deck-family",
  "deck-needs",
  "deck-objects",
  "deck-animals",
  "deck-actions"
] as const;

export function dailyGameAccess(projection: EntitlementProjection | null, serverNow: Date) {
  if (!Number.isFinite(serverNow.getTime())) throw new Error("Invalid server time");
  const access = evaluateEntitlement(projection, serverNow);
  const full = access.learningAllowed;
  const paid = full && projection?.state !== "trial_active";
  return {
    tier: full ? ("full" as const) : ("basic" as const),
    // Trial can use its full grant but never gains custom authoring.
    customAuthoringAllowed: paid,
    // AI remains closed until D03 provider/quota/operations gates are implemented.
    aiGenerationEnabled: false as const,
    basicCollectionIds: BASIC_COLLECTION_IDS,
    rounds: { shadow: full ? 5 : 2, listen: full ? 12 : 5, memoryPairs: 5 }
  };
}

export type ClaimBoundaryResult = "existing_receipt" | "expired" | "not_completed" | "claimable";
export function rewardClaimBoundary(input: {
  serverNow: Date;
  startsAt: Date;
  resetAt: Date;
  completed: boolean;
  hasConfirmedReceipt: boolean;
}): ClaimBoundaryResult {
  const { serverNow, startsAt, resetAt } = input;
  if (
    ![serverNow, startsAt, resetAt].every((value) => Number.isFinite(value.getTime())) ||
    resetAt <= startsAt
  )
    throw new Error("Invalid reservation window");
  // Service must first load the receipt by authorized child/session/command identity.
  // Retrying a committed claim after midnight returns it; it never re-awards.
  if (input.hasConfirmedReceipt) return "existing_receipt";
  if (serverNow < startsAt || serverNow >= resetAt) return "expired";
  return input.completed ? "claimable" : "not_completed";
}

export type RewardPoolItem = {
  id: string;
  kind: "sticker" | "puzzle_piece";
  groups: readonly ("boy" | "girl")[];
};
export function remainingRewardPool(
  publishedItems: readonly RewardPoolItem[],
  group: "boy" | "girl" | null,
  ownedIds: ReadonlySet<string>
) {
  const seen = new Set<string>();
  const available = publishedItems.filter((item) => {
    if (seen.has(item.id)) throw new Error("Duplicate reward catalog item");
    seen.add(item.id);
    return group !== null && item.groups.includes(group) && !ownedIds.has(item.id);
  });
  const stickers = available.filter((item) => item.kind === "sticker");
  const pieces = available.filter((item) => item.kind === "puzzle_piece");
  return {
    profileRequired: group === null,
    sticker: { items: stickers, remaining: stickers.length, disabled: stickers.length === 0 },
    puzzle_piece: { items: pieces, remaining: pieces.length, disabled: pieces.length === 0 }
  };
}

/** Persist the result once in a transaction; never call again for the same reservation. */
export function reserveFourBoxes(
  pool: readonly RewardPoolItem[],
  randomIndex: (exclusiveMax: number) => number
) {
  if (pool.length === 0) return [];
  if (
    new Set(pool.map((item) => item.id)).size !== pool.length ||
    pool.some((item) => item.kind !== pool[0]!.kind)
  )
    throw new Error("Invalid reward pool");
  const remaining = [...pool];
  const boxes: string[] = [];
  while (boxes.length < 4) {
    // Refill only after every available new item has a box; no duplicate grants.
    if (remaining.length === 0) remaining.push(...pool);
    const index = randomIndex(remaining.length);
    if (!Number.isInteger(index) || index < 0 || index >= remaining.length)
      throw new Error("Invalid random index");
    boxes.push(remaining.splice(index, 1)[0]!.id);
  }
  return boxes;
}
