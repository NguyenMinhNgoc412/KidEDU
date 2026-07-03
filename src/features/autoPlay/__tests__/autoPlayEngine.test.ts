import type { LearningSettings } from "@/data/types";

import {
  advanceAutoPlayState,
  createInitialAutoPlayState,
  getPhaseDurationMs,
  getLoopLimit,
  pauseAutoPlayState,
  replayCurrentAutoPlayItem,
  resumeAutoPlayState
} from "../autoPlayEngine";

const baseSettings: LearningSettings = {
  speedPreset: "normal",
  loopMode: "once",
  reinforcementEnabled: true,
  sfxEnabled: false
};

describe("autoPlayEngine", () => {
  it("creates completed state when there are no playable items", () => {
    const state = createInitialAutoPlayState(0);

    expect(state.phase).toBe("completed");
    expect(state.completedReason).toBe("no_valid_items");
  });

  it("walks through card phases and moves to the next item", () => {
    let state = createInitialAutoPlayState(2);

    state = advanceAutoPlayState(state, baseSettings, 2);
    expect(state.phase).toBe("sample");

    state = advanceAutoPlayState(state, baseSettings, 2);
    expect(state.phase).toBe("speak");

    state = advanceAutoPlayState(state, baseSettings, 2);
    expect(state.phase).toBe("reinforce");

    state = advanceAutoPlayState(state, baseSettings, 2);
    expect(state.phase).toBe("transition");

    state = advanceAutoPlayState(state, baseSettings, 2);
    expect(state.itemIndex).toBe(1);
    expect(state.phase).toBe("attention");
  });

  it("honors three loop mode before completing", () => {
    const settings: LearningSettings = { ...baseSettings, loopMode: "three_times", reinforcementEnabled: false };
    let state = createInitialAutoPlayState(1);

    for (let i = 0; i < 12; i += 1) {
      state = advanceAutoPlayState(state, settings, 1);
    }

    expect(state.phase).toBe("completed");
    expect(state.loopIndex).toBe(2);
    expect(state.completedReason).toBe("finished");
  });

  it("pauses, resumes, and replays without changing the item index", () => {
    let state = createInitialAutoPlayState(3);
    state = advanceAutoPlayState(state, baseSettings, 3);

    const paused = pauseAutoPlayState(state);
    expect(paused.phase).toBe("paused");
    expect(paused.previousPhase).toBe("sample");

    const resumed = resumeAutoPlayState(paused);
    expect(resumed.phase).toBe("sample");
    expect(resumed.itemIndex).toBe(0);

    const replayed = replayCurrentAutoPlayItem(resumed);
    expect(replayed.phase).toBe("attention");
    expect(replayed.itemIndex).toBe(0);
    expect(replayed.replayNonce).toBe(1);
  });

  it("uses null loop limit for continuous play", () => {
    expect(getLoopLimit("continuous")).toBeNull();
  });

  it("uses shorter phase durations for faster speed presets", () => {
    const slowSpeakMs = getPhaseDurationMs("speak", "slow");
    const normalSpeakMs = getPhaseDurationMs("speak", "normal");
    const fastSpeakMs = getPhaseDurationMs("speak", "fast");

    expect(slowSpeakMs).toBeGreaterThan(normalSpeakMs ?? 0);
    expect(normalSpeakMs).toBeGreaterThan(fastSpeakMs ?? 0);
  });
});
