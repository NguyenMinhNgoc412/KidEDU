import type { LearningItem, LearningItemMedia, LearningSettings, MediaRole } from "@/data/types";

import {
  advanceAutoPlayState,
  createInitialAutoPlayState,
  getPhaseDurationMs,
  getLoopLimit,
  getNextAutoPlayItemIndex,
  pauseAutoPlayState,
  replayCurrentAutoPlayItem,
  resumeAutoPlayState
} from "../autoPlayEngine";
import { getAutoPlayItems } from "../autoPlayItems";
import {
  getAutoPlayPreloadMediaUris,
  getAutoPlayPreloadVisualUri,
  shouldWaitForSamplePlaybackEnd
} from "../autoPlayTimeline";

const baseSettings: LearningSettings = {
  speedPreset: "normal",
  playbackSpeed: 1,
  loopMode: "once",
  loopCount: 1,
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
    expect(state.itemIndex).toBe(1);
    expect(state.phase).toBe("attention");
  });

  it("uses a one-second transition when reinforcement is disabled", () => {
    const settings: LearningSettings = { ...baseSettings, reinforcementEnabled: false };
    let state = createInitialAutoPlayState(2);

    state = advanceAutoPlayState(state, settings, 2);
    expect(state.phase).toBe("sample");

    state = advanceAutoPlayState(state, settings, 2);
    expect(state.phase).toBe("speak");

    state = advanceAutoPlayState(state, settings, 2);
    expect(state.phase).toBe("transition");

    state = advanceAutoPlayState(state, settings, 2);
    expect(state.itemIndex).toBe(1);
    expect(state.phase).toBe("attention");
  });

  it("honors three loop mode before completing", () => {
    const settings: LearningSettings = {
      ...baseSettings,
      loopMode: "three_times",
      loopCount: 3,
      reinforcementEnabled: false
    };
    let state = createInitialAutoPlayState(1);

    for (let i = 0; i < 12; i += 1) {
      state = advanceAutoPlayState(state, settings, 1);
    }

    expect(state.phase).toBe("completed");
    expect(state.loopIndex).toBe(2);
    expect(state.completedReason).toBe("finished");
  });

  it("plays every item in every configured loop before completing", () => {
    const settings: LearningSettings = {
      ...baseSettings,
      loopMode: "three_times",
      loopCount: 3,
      reinforcementEnabled: false
    };
    let state = createInitialAutoPlayState(2);
    const visits = [`${state.loopIndex}:${state.itemIndex}`];

    for (let i = 0; state.phase !== "completed" && i < 100; i += 1) {
      state = advanceAutoPlayState(state, settings, 2);
      if (state.phase === "attention") {
        visits.push(`${state.loopIndex}:${state.itemIndex}`);
      }
    }

    expect(visits).toEqual(["0:0", "0:1", "1:0", "1:1", "2:0", "2:1"]);
    expect(state.phase).toBe("completed");
    expect(state.loopIndex).toBe(2);
  });

  it("uses canonical loop count even when legacy loop mode still has the default value", () => {
    const settings: LearningSettings = {
      ...baseSettings,
      loopMode: "once",
      loopCount: 3,
      reinforcementEnabled: false
    };
    let state = createInitialAutoPlayState(1);

    for (let i = 0; i < 12; i += 1) {
      state = advanceAutoPlayState(state, settings, 1);
    }

    expect(state.phase).toBe("completed");
    expect(state.loopIndex).toBe(2);
  });

  it("keeps text-only and hidden items out of the Auto Play item list", () => {
    const textOnlyItem = makeLearningItem({ id: "item-text-only", status: "active" });
    const hiddenItem = makeLearningItem({ id: "item-hidden", status: "hidden" });

    expect(getAutoPlayItems([hiddenItem, textOnlyItem])).toEqual([]);
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

  it("bounds legacy continuous play to one loop", () => {
    expect(getLoopLimit("continuous")).toBe(1);
  });

  it("finishes a legacy null loop count after one loop", () => {
    const settings: LearningSettings = {
      ...baseSettings,
      loopMode: "once",
      loopCount: null,
      reinforcementEnabled: false
    };
    let state = createInitialAutoPlayState(1);

    for (let i = 0; i < 8; i += 1) {
      state = advanceAutoPlayState(state, settings, 1);
    }

    expect(state.phase).toBe("completed");
    expect(state.loopIndex).toBe(0);
  });

  it("keeps child speaking and card handoff timings fixed across speed presets", () => {
    expect(getPhaseDurationMs("speak", "slow")).toBe(5000);
    expect(getPhaseDurationMs("speak", "normal")).toBe(5000);
    expect(getPhaseDurationMs("speak", "fast")).toBe(5000);
    expect(getPhaseDurationMs("reinforce", "slow")).toBe(1000);
    expect(getPhaseDurationMs("transition", "normal")).toBe(1000);
  });

  it("uses shorter timer-driven sample durations for faster speed presets", () => {
    const slowSampleMs = getPhaseDurationMs("sample", "slow");
    const normalSampleMs = getPhaseDurationMs("sample", "normal");
    const fastSampleMs = getPhaseDurationMs("sample", "fast");

    expect(slowSampleMs).toBeGreaterThan(normalSampleMs ?? 0);
    expect(normalSampleMs).toBeGreaterThan(fastSampleMs ?? 0);
  });

  it("marks real video samples as playback-driven instead of timer-driven", () => {
    const item = makeLearningItem({
      media: [
        makeMedia("mouth_video", { durationMs: null, uri: "file:///media/videos/custom/mouth.mp4" })
      ]
    });

    expect(shouldWaitForSamplePlaybackEnd(item)).toBe(true);
  });

  it("marks real audio-only samples as playback-driven instead of timer-driven", () => {
    const item = makeLearningItem({
      media: [makeMedia("pronunciation_audio", { uri: "file:///media/audio/custom/voice.m4a" })]
    });

    expect(shouldWaitForSamplePlaybackEnd(item)).toBe(true);
  });

  it("keeps text-only or bundled placeholder samples timer-driven", () => {
    const textOnlyItem = makeLearningItem({});
    const bundledPlaceholderItem = makeLearningItem({
      media: [makeMedia("mouth_video", { uri: "seed://item-test/mouth_video" })]
    });

    expect(shouldWaitForSamplePlaybackEnd(textOnlyItem)).toBe(false);
    expect(shouldWaitForSamplePlaybackEnd(bundledPlaceholderItem)).toBe(false);
  });

  it("treats registered bundle URIs as playback-driven media", () => {
    const bundledItem = makeLearningItem({
      media: [
        makeMedia("mouth_video", {
          durationMs: 2_000,
          uri: "bundle://default/item-test-mouth-video-v1"
        })
      ]
    });

    expect(shouldWaitForSamplePlaybackEnd(bundledItem)).toBe(true);
  });

  it("preloads only a lightweight visual URI for the next item", () => {
    const item = makeLearningItem({
      media: [
        makeMedia("illustration", {
          thumbnailUri: "file:///thumb.jpg",
          uri: "file:///full.jpg"
        }),
        makeMedia("mouth_video", { uri: "file:///mouth.mp4" }),
        makeMedia("pronunciation_audio", { uri: "file:///voice.m4a" })
      ]
    });

    expect(getAutoPlayPreloadVisualUri(item)).toBe("file:///thumb.jpg");
    expect(getAutoPlayPreloadMediaUris(item)).toEqual([
      "file:///full.jpg",
      "file:///thumb.jpg",
      "file:///mouth.mp4",
      "file:///voice.m4a"
    ]);
  });

  it("selects at most one next item and respects the final loop", () => {
    const first = createInitialAutoPlayState(2);
    expect(getNextAutoPlayItemIndex(first, baseSettings, 2)).toBe(1);

    const last = { ...first, itemIndex: 1 };
    expect(getNextAutoPlayItemIndex(last, baseSettings, 2)).toBeNull();
    expect(
      getNextAutoPlayItemIndex(
        last,
        { ...baseSettings, loopMode: "continuous", loopCount: null },
        2
      )
    ).toBeNull();
  });
});

function makeLearningItem(overrides: Partial<LearningItem>): LearningItem {
  return {
    id: "item-test",
    title: "me",
    categoryId: "cat-family",
    categoryName: "Gia dinh",
    status: "active",
    learningStatus: "new",
    note: null,
    media: [],
    ...overrides
  };
}

function makeMedia(
  role: MediaRole,
  overrides: Partial<LearningItemMedia["asset"]> = {}
): LearningItemMedia {
  const type =
    role === "mouth_video" ? "video" : role === "pronunciation_audio" ? "audio" : "image";

  return {
    id: `media-${role}`,
    learningItemId: "item-test",
    mediaAssetId: `asset-${role}`,
    role,
    priority: 100,
    isActive: true,
    asset: {
      id: `asset-${role}`,
      type,
      source: "custom",
      uri: `file:///media/${role}`,
      thumbnailAssetId: null,
      thumbnailUri: null,
      durationMs: null,
      sizeBytes: null,
      mimeType: null,
      status: "active",
      ...overrides
    }
  };
}
