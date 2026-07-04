import {
  completeLearningSettings,
  defaultLearningSettings,
  getLoopModeForCount,
  getSpeedPresetForPlaybackSpeed,
  normalizeLoopCount,
  normalizePlaybackSpeed
} from "@/data/learningSettings";

describe("learning settings mapping", () => {
  it("maps playback speed back to the matching speed preset", () => {
    expect(getSpeedPresetForPlaybackSpeed(0.85)).toBe("slow");
    expect(getSpeedPresetForPlaybackSpeed(1)).toBe("normal");
    expect(getSpeedPresetForPlaybackSpeed(1.15)).toBe("fast");
  });

  it("maps loop count back to the matching loop mode", () => {
    expect(getLoopModeForCount(1)).toBe("once");
    expect(getLoopModeForCount(3)).toBe("three_times");
    expect(getLoopModeForCount(null)).toBe("continuous");
  });

  it("uses defaults only when canonical values are missing or invalid", () => {
    expect(normalizePlaybackSpeed(undefined, "fast")).toBe(1.15);
    expect(normalizePlaybackSpeed("0.85", "normal")).toBe(0.85);
    expect(normalizePlaybackSpeed("2", "normal")).toBe(1);
    expect(normalizeLoopCount(undefined, "three_times")).toBe(3);
    expect(normalizeLoopCount("null", "once")).toBeNull();
    expect(normalizeLoopCount("7", "once")).toBe(1);
  });

  it("keeps canonical playback speed and loop count in sync with legacy fields", () => {
    expect(
      completeLearningSettings({
        ...defaultLearningSettings,
        speedPreset: "normal",
        playbackSpeed: 1.15,
        loopMode: "once",
        loopCount: 3
      })
    ).toMatchObject({
      speedPreset: "fast",
      playbackSpeed: 1.15,
      loopMode: "three_times",
      loopCount: 3
    });
  });
});
