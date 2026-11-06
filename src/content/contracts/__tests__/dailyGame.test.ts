import {
  dailyGamePlanSchemaV1,
  dailyGameCheckpointSchemaV1,
  validateDailyGameCheckpoint,
  type DailyGamePlanV1
} from "../dailyGame";

function plan(tier: "basic" | "full"): DailyGamePlanV1 {
  return {
    schemaVersion: 1,
    kind: "daily_game",
    contentVersion: "content_test",
    tier,
    shadowScreens: Array.from({ length: tier === "full" ? 5 : 2 }, (_, i) => ({
      id: `shadow_${i}`,
      targetIds: ["target_a", "target_b", "target_c"]
    })),
    listenRounds: Array.from({ length: tier === "full" ? 12 : 5 }, (_, i) => ({
      id: `listen_${i}`,
      targetId: `target_${i}`,
      optionTargetIds: [`target_${i}`, "distractor_a", "distractor_b"]
    })),
    memoryTargetIds: ["target_0", "target_1", "target_2", "target_3", "target_4"]
  };
}
const checkpoint = {
  schemaVersion: 1,
  kind: "daily_game",
  contentVersion: "content_test",
  shadowScreenIndex: 0,
  placedTargetIds: ["target_a"],
  listenRoundIndex: 0,
  memoryMatchedTargetIds: [],
  memoryOpenCardIds: []
};
describe("C50 immutable daily game content and checkpoints", () => {
  it.each(["basic", "full"] as const)("accepts exact %s lengths", (tier) => {
    expect(dailyGamePlanSchemaV1.parse(plan(tier)).tier).toBe(tier);
  });
  it("rejects incorrect lengths, duplicate words and unauthored answers", () => {
    expect(dailyGamePlanSchemaV1.safeParse({ ...plan("basic"), tier: "full" }).success).toBe(false);
    const wrong = plan("full");
    wrong.listenRounds[0]!.targetId = "not_an_option";
    expect(dailyGamePlanSchemaV1.safeParse(wrong).success).toBe(false);
    wrong.listenRounds[0] = { ...wrong.listenRounds[1]!, id: "listen_unique" };
    expect(dailyGamePlanSchemaV1.safeParse(wrong).success).toBe(false);
  });
  it("rejects unknown versions, language observations and media URLs", () => {
    for (const extra of [
      { schemaVersion: 2 },
      { observation: "independent" },
      { mediaUrl: "https://example.test" }
    ])
      expect(dailyGameCheckpointSchemaV1.safeParse({ ...checkpoint, ...extra }).success).toBe(
        false
      );
  });
  it("restores local progress only against the same prepared content and sequence", () => {
    expect(validateDailyGameCheckpoint(plan("basic"), checkpoint).placedTargetIds).toEqual([
      "target_a"
    ]);
    for (const change of [
      { contentVersion: "other_version" },
      { listenRoundIndex: 1 },
      { placedTargetIds: ["unknown_target"] },
      { memoryOpenCardIds: ["target_0:a"] },
      { shadowScreenIndex: 3 }
    ])
      expect(() =>
        validateDailyGameCheckpoint(plan("basic"), { ...checkpoint, ...change })
      ).toThrow();
  });
  it("allows memory only after both prior games and rejects stale/open matched cards", () => {
    const memory = {
      ...checkpoint,
      shadowScreenIndex: 2,
      placedTargetIds: [],
      listenRoundIndex: 5,
      memoryMatchedTargetIds: ["target_0"],
      memoryOpenCardIds: ["target_1:a"]
    };
    expect(validateDailyGameCheckpoint(plan("basic"), memory).memoryOpenCardIds).toEqual([
      "target_1:a"
    ]);
    for (const memoryOpenCardIds of [
      ["target_0:a"],
      ["target_missing:a"],
      ["target_1:a", "target_1:a"]
    ])
      expect(() =>
        validateDailyGameCheckpoint(plan("basic"), { ...memory, memoryOpenCardIds })
      ).toThrow();
  });
});
