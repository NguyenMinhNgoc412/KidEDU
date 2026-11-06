import {
  dailyGameWindow,
  dailyGameAccess,
  rewardClaimBoundary,
  remainingRewardPool,
  reserveFourBoxes,
  type RewardPoolItem
} from "../src/daily-games/daily-game.policy";

describe("C50 approved server policy", () => {
  it.each([
    ["2026-11-05T16:59:59.999Z", "2026-11-05", "2026-11-05T17:00:00.000Z"],
    ["2026-11-05T17:00:00.000Z", "2026-11-06", "2026-11-06T17:00:00.000Z"],
    ["2026-12-31T17:00:00.000Z", "2027-01-01", "2027-01-01T17:00:00.000Z"],
    ["2028-02-28T17:00:00.000Z", "2028-02-29", "2028-02-29T17:00:00.000Z"]
  ])("uses Vietnam midnight for %s", (now, day, reset) => {
    const result = dailyGameWindow(new Date(now));
    expect(result.playDay).toBe(day);
    expect(result.resetAt.toISOString()).toBe(reset);
    expect(result.resetAt.getTime() - result.startsAt.getTime()).toBe(86400000);
  });
  it("never accepts invalid server time", () => {
    expect(() => dailyGameWindow(new Date(NaN))).toThrow();
    expect(() => dailyGameAccess(null, new Date(NaN))).toThrow();
  });
  const now = new Date("2026-11-05T10:00:00Z");
  const grant = {
    state: "active" as const,
    effectiveUntil: new Date("2026-11-05T11:00:00Z"),
    capabilities: ["learning.plan.full"]
  };
  it("keeps basic learning after expiry and does not extend paid to midnight", () => {
    expect(dailyGameAccess(grant, now)).toMatchObject({
      tier: "full",
      customAuthoringAllowed: true,
      rounds: { shadow: 5, listen: 12, memoryPairs: 5 }
    });
    for (const projection of [
      null,
      { ...grant, state: "expired" as const },
      { ...grant, effectiveUntil: now }
    ]) {
      expect(dailyGameAccess(projection, now)).toMatchObject({
        tier: "basic",
        customAuthoringAllowed: false,
        rounds: { shadow: 2, listen: 5, memoryPairs: 5 }
      });
    }
  });
  it("denies trial authoring even with an injected capability", () => {
    expect(
      dailyGameAccess(
        {
          ...grant,
          state: "trial_active",
          capabilities: [...grant.capabilities, "custom.authoring"]
        },
        now
      )
    ).toMatchObject({ tier: "full", customAuthoringAllowed: false, aiGenerationEnabled: false });
  });
  it("cancels unclaimed rewards exactly at reset, preserving committed receipts", () => {
    const window = dailyGameWindow(now);
    const base = { ...window, completed: true, hasConfirmedReceipt: false };
    expect(
      rewardClaimBoundary({ ...base, serverNow: new Date(window.resetAt.getTime() - 1) })
    ).toBe("claimable");
    expect(rewardClaimBoundary({ ...base, serverNow: window.resetAt })).toBe("expired");
    expect(
      rewardClaimBoundary({ ...base, serverNow: window.resetAt, hasConfirmedReceipt: true })
    ).toBe("existing_receipt");
    expect(rewardClaimBoundary({ ...base, serverNow: now, completed: false })).toBe(
      "not_completed"
    );
  });
  const items: RewardPoolItem[] = [
    { id: "sticker_house", kind: "sticker", groups: ["boy", "girl"] },
    { id: "sticker_hero", kind: "sticker", groups: ["boy"] },
    { id: "piece_kitchen", kind: "puzzle_piece", groups: ["girl"] }
  ];
  it("counts only new items in the entered group, with no inference for a missing group", () => {
    const pool = remainingRewardPool(items, "girl", new Set(["sticker_house"]));
    expect(pool.sticker).toMatchObject({ remaining: 0, disabled: true });
    expect(pool.puzzle_piece).toMatchObject({ remaining: 1, disabled: false });
    expect(remainingRewardPool(items, null, new Set())).toMatchObject({
      profileRequired: true,
      sticker: { remaining: 0 },
      puzzle_piece: { remaining: 0 }
    });
    expect(() => remainingRewardPool([...items, items[0]!], "boy", new Set())).toThrow();
  });
  it.each([1, 2, 3, 4, 8])(
    "reserves four boxes from %i new items without prioritizing a picture",
    (size) => {
      const pool: RewardPoolItem[] = Array.from({ length: size }, (_, i) => ({
        id: `piece_${i}`,
        kind: "puzzle_piece",
        groups: ["boy"]
      }));
      const boxes = reserveFourBoxes(pool, () => 0);
      expect(boxes).toHaveLength(4);
      expect(new Set(boxes).size).toBe(Math.min(size, 4));
      expect(pool).toHaveLength(size);
    }
  );
  it("never fabricates a fallback when exhausted and rejects invalid randomness", () => {
    expect(
      reserveFourBoxes([], () => {
        throw new Error("must not draw");
      })
    ).toEqual([]);
    expect(() => reserveFourBoxes([items[0]!], () => NaN)).toThrow();
    expect(() => reserveFourBoxes([items[0]!], () => 1)).toThrow();
    expect(() => reserveFourBoxes(items, () => 0)).toThrow();
  });
});
