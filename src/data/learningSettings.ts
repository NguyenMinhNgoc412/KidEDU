import type { LearningSettings, LoopMode, PlaybackSpeed, SpeedPreset } from "./types";

export const playbackSpeedsByPreset: Record<SpeedPreset, PlaybackSpeed> = {
  slow: 0.85,
  normal: 1,
  fast: 1.15
};

export const loopCountsByMode: Record<LoopMode, number | null> = {
  once: 1,
  three_times: 3,
  continuous: null
};

export const defaultLearningSettings: LearningSettings = {
  speedPreset: "normal",
  playbackSpeed: playbackSpeedsByPreset.normal,
  loopMode: "once",
  loopCount: loopCountsByMode.once,
  reinforcementEnabled: true,
  sfxEnabled: false
};

export function normalizeSpeedPreset(value: string | null | undefined): SpeedPreset {
  if (value === "slow" || value === "fast") {
    return value;
  }

  return "normal";
}

export function normalizeLoopMode(value: string | null | undefined): LoopMode {
  if (value === "three_times" || value === "continuous") {
    return value;
  }

  return "once";
}

export function normalizePlaybackSpeed(value: string | number | null | undefined, fallbackPreset: SpeedPreset): PlaybackSpeed {
  const numericValue = typeof value === "number" ? value : Number(value);
  const supportedSpeed = Object.values(playbackSpeedsByPreset).find((speed) => speed === numericValue);

  return supportedSpeed ?? playbackSpeedsByPreset[fallbackPreset];
}

export function normalizeLoopCount(value: string | number | null | undefined, fallbackLoopMode: LoopMode): number | null {
  if (value === null || value === "null") {
    return null;
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  if (numericValue === 1 || numericValue === 3) {
    return numericValue;
  }

  return loopCountsByMode[fallbackLoopMode];
}

export function getSpeedPresetForPlaybackSpeed(playbackSpeed: PlaybackSpeed): SpeedPreset {
  if (playbackSpeed === playbackSpeedsByPreset.slow) {
    return "slow";
  }

  if (playbackSpeed === playbackSpeedsByPreset.fast) {
    return "fast";
  }

  return "normal";
}

export function getLoopModeForCount(loopCount: number | null): LoopMode {
  if (loopCount === null) {
    return "continuous";
  }

  if (loopCount === 3) {
    return "three_times";
  }

  return "once";
}

export function completeLearningSettings(settings: LearningSettings): LearningSettings {
  const speedPreset = normalizeSpeedPreset(settings.speedPreset);
  const playbackSpeed = normalizePlaybackSpeed(settings.playbackSpeed, speedPreset);
  const loopMode = normalizeLoopMode(settings.loopMode);
  const loopCount = normalizeLoopCount(settings.loopCount, loopMode);

  return {
    ...settings,
    speedPreset: getSpeedPresetForPlaybackSpeed(playbackSpeed),
    playbackSpeed,
    loopMode: getLoopModeForCount(loopCount),
    loopCount
  };
}
