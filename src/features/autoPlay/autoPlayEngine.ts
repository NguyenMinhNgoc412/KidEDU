import type { LearningSettings, LoopMode, SpeedPreset } from "@/data/types";

export type AutoPlayPhase =
  | "attention"
  | "sample"
  | "speak"
  | "reinforce"
  | "transition"
  | "paused"
  | "completed"
  | "stopped";

export type AutoPlayCompletedReason = "finished" | "no_valid_items" | "exited";

export interface AutoPlayState {
  phase: AutoPlayPhase;
  itemIndex: number;
  loopIndex: number;
  replayNonce: number;
  previousPhase: Exclude<AutoPlayPhase, "paused"> | null;
  completedReason: AutoPlayCompletedReason | null;
}

export interface AutoPlayTiming {
  attentionMs: number;
  sampleMs: number;
  speakMs: number;
  reinforceMs: number;
  transitionMs: number;
}

export const speedPresetTimings: Record<SpeedPreset, AutoPlayTiming> = {
  slow: {
    attentionMs: 900,
    sampleMs: 2800,
    speakMs: 5000,
    reinforceMs: 1000,
    transitionMs: 1000
  },
  normal: {
    attentionMs: 700,
    sampleMs: 2200,
    speakMs: 5000,
    reinforceMs: 1000,
    transitionMs: 1000
  },
  fast: {
    attentionMs: 500,
    sampleMs: 1600,
    speakMs: 5000,
    reinforceMs: 1000,
    transitionMs: 1000
  }
};

export function createInitialAutoPlayState(itemCount: number): AutoPlayState {
  if (itemCount <= 0) {
    return {
      phase: "completed",
      itemIndex: 0,
      loopIndex: 0,
      replayNonce: 0,
      previousPhase: null,
      completedReason: "no_valid_items"
    };
  }

  return {
    phase: "attention",
    itemIndex: 0,
    loopIndex: 0,
    replayNonce: 0,
    previousPhase: null,
    completedReason: null
  };
}

export function getLoopLimit(loopMode: LoopMode): number | null {
  if (loopMode === "continuous") {
    return null;
  }

  return loopMode === "three_times" ? 3 : 1;
}

export function getLoopLimitForSettings(settings: LearningSettings): number | null {
  if (settings.loopCount === null) {
    return null;
  }

  if (typeof settings.loopCount === "number") {
    return settings.loopCount;
  }

  return getLoopLimit(settings.loopMode);
}

export function getNextAutoPlayItemIndex(
  state: AutoPlayState,
  settings: LearningSettings,
  itemCount: number
): number | null {
  if (itemCount <= 0 || state.phase === "completed" || state.phase === "stopped") {
    return null;
  }

  const nextItemIndex = state.itemIndex + 1;
  if (nextItemIndex < itemCount) {
    return nextItemIndex;
  }

  const loopLimit = getLoopLimitForSettings(settings);
  return loopLimit === null || state.loopIndex + 1 < loopLimit ? 0 : null;
}

export function getPhaseDurationMs(phase: AutoPlayPhase, preset: SpeedPreset): number | null {
  const timing = speedPresetTimings[preset];

  switch (phase) {
    case "attention":
      return timing.attentionMs;
    case "sample":
      return timing.sampleMs;
    case "speak":
      return timing.speakMs;
    case "reinforce":
      return timing.reinforceMs;
    case "transition":
      return timing.transitionMs;
    default:
      return null;
  }
}

export function advanceAutoPlayState(
  state: AutoPlayState,
  settings: LearningSettings,
  itemCount: number
): AutoPlayState {
  if (state.phase === "paused" || state.phase === "completed" || state.phase === "stopped") {
    return state;
  }

  if (itemCount <= 0) {
    return { ...state, phase: "completed", completedReason: "no_valid_items" };
  }

  if (state.phase === "attention") {
    return { ...state, phase: "sample" };
  }

  if (state.phase === "sample") {
    return { ...state, phase: "speak" };
  }

  if (state.phase === "speak") {
    return { ...state, phase: settings.reinforcementEnabled ? "reinforce" : "transition" };
  }

  if (state.phase === "reinforce") {
    return advanceToNextAutoPlayItem(state, settings, itemCount);
  }

  return advanceToNextAutoPlayItem(state, settings, itemCount);
}

function advanceToNextAutoPlayItem(
  state: AutoPlayState,
  settings: LearningSettings,
  itemCount: number
): AutoPlayState {
  const nextItemIndex = state.itemIndex + 1;
  if (nextItemIndex < itemCount) {
    return { ...state, itemIndex: nextItemIndex, phase: "attention" };
  }

  const loopLimit = getLoopLimitForSettings(settings);
  const nextLoopIndex = state.loopIndex + 1;

  if (loopLimit === null || nextLoopIndex < loopLimit) {
    return { ...state, itemIndex: 0, loopIndex: nextLoopIndex, phase: "attention" };
  }

  return { ...state, phase: "completed", completedReason: "finished" };
}

export function pauseAutoPlayState(state: AutoPlayState): AutoPlayState {
  if (state.phase === "completed" || state.phase === "stopped" || state.phase === "paused") {
    return state;
  }

  return { ...state, phase: "paused", previousPhase: state.phase };
}

export function resumeAutoPlayState(state: AutoPlayState): AutoPlayState {
  if (state.phase !== "paused") {
    return state;
  }

  return { ...state, phase: state.previousPhase ?? "attention", previousPhase: null };
}

export function replayCurrentAutoPlayItem(state: AutoPlayState): AutoPlayState {
  if (state.phase === "completed" || state.phase === "stopped") {
    return state;
  }

  return { ...state, phase: "attention", previousPhase: null, replayNonce: state.replayNonce + 1 };
}

export function stopAutoPlayState(state: AutoPlayState): AutoPlayState {
  return { ...state, phase: "stopped", previousPhase: null, completedReason: "exited" };
}

export function getAutoPlaySignal(phase: AutoPlayPhase): string {
  switch (phase) {
    case "attention":
      return "Nhìn hình";
    case "sample":
      return "Nghe mẫu";
    case "speak":
      return "Con nói theo";
    case "reinforce":
      return "Tốt lắm";
    case "transition":
      return "Chuyển thẻ";
    case "paused":
      return "Tạm dừng";
    case "completed":
      return "Hoàn thành";
    case "stopped":
      return "Đã thoát";
  }
}
