import {
  validateDailyGameCheckpoint,
  type DailyGamePlanV1
} from "../../../content/contracts/dailyGame";
import { advanceDailyGame, dailyGamePhase, initialDailyGameCheckpoint } from "../sessionEngine";

const plan = (tier: "basic" | "full"): DailyGamePlanV1 => ({
  schemaVersion: 1,
  kind: "daily_game",
  contentVersion: "synthetic_v1",
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
});

it.each(["basic", "full"] as const)(
  "completes %s with restorable checkpoints after every action",
  (tier) => {
    const p = plan(tier);
    let state = initialDailyGameCheckpoint(p);
    const act = (action: Parameters<typeof advanceDailyGame>[2]) => {
      const result = advanceDailyGame(p, state, action);
      state = validateDailyGameCheckpoint(p, JSON.parse(JSON.stringify(result.checkpoint)));
      return result.feedback;
    };
    for (const screen of p.shadowScreens) {
      expect(dailyGamePhase(p, state)).toBe("shadow");
      expect(
        act({
          type: "place_shadow",
          roundId: screen.id,
          targetId: "target_a",
          slotTargetId: "target_b"
        })
      ).toBe("try_again");
      for (const targetId of screen.targetIds)
        expect(
          act({ type: "place_shadow", roundId: screen.id, targetId, slotTargetId: targetId })
        ).toBe("correct");
    }
    for (const round of p.listenRounds) {
      expect(dailyGamePhase(p, state)).toBe("listen");
      const index = state.listenRoundIndex;
      expect(act({ type: "choose_listen", roundId: round.id, targetId: "distractor_a" })).toBe(
        "try_again"
      );
      expect(state.listenRoundIndex).toBe(index);
      expect(act({ type: "choose_listen", roundId: round.id, targetId: round.targetId })).toBe(
        "correct"
      );
    }
    expect(dailyGamePhase(p, state)).toBe("memory");
    act({ type: "open_memory", cardId: "target_0:a" });
    expect(act({ type: "open_memory", cardId: "target_1:b" })).toBe("try_again");
    expect(act({ type: "open_memory", cardId: "target_2:a" })).toBe("none");
    expect(state.memoryOpenCardIds).toEqual(["target_0:a", "target_1:b"]);
    act({ type: "close_unmatched", cardIds: ["target_0:a", "target_1:b"] });
    for (const target of p.memoryTargetIds) {
      act({ type: "open_memory", cardId: `${target}:a` });
      expect(act({ type: "open_memory", cardId: `${target}:a` })).toBe("none");
      expect(act({ type: "open_memory", cardId: `${target}:b` })).toBe("correct");
    }
    expect(dailyGamePhase(p, state)).toBe("completed");
    const completed = state;
    act({ type: "open_memory", cardId: "target_0:a" });
    expect(state).toEqual(completed);
    expect(Object.keys(state)).not.toContain("observations");
  }
);

it("ignores wrong-phase/unknown inputs and rejects cross-version restoration", () => {
  const p = plan("basic");
  const start = initialDailyGameCheckpoint(p);
  expect(
    advanceDailyGame(p, start, { type: "choose_listen", roundId: "listen_0", targetId: "target_0" })
      .checkpoint
  ).toEqual(start);
  expect(
    advanceDailyGame(p, start, {
      type: "place_shadow",
      roundId: "shadow_0",
      targetId: "unknown",
      slotTargetId: "target_a"
    }).checkpoint
  ).toEqual(start);
  expect(() =>
    advanceDailyGame(
      p,
      { ...start, contentVersion: "wrong_version" },
      { type: "close_unmatched", cardIds: ["target_0:a", "target_1:b"] }
    )
  ).toThrow();
});

it("ignores a replay from the preceding screen and a delayed close for another pair", () => {
  const p = plan("basic");
  const start = initialDailyGameCheckpoint(p);
  const secondScreen = { ...start, shadowScreenIndex: 1 };
  expect(
    advanceDailyGame(p, secondScreen, {
      type: "place_shadow",
      roundId: "shadow_0",
      targetId: "target_c",
      slotTargetId: "target_c"
    }).checkpoint
  ).toEqual(secondScreen);
  const memory = {
    ...start,
    shadowScreenIndex: 2,
    listenRoundIndex: 5,
    memoryOpenCardIds: ["target_2:a", "target_3:b"]
  };
  expect(
    advanceDailyGame(p, memory, {
      type: "close_unmatched",
      cardIds: ["target_0:a", "target_1:b"]
    }).checkpoint
  ).toEqual(memory);
});
