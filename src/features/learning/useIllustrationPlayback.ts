import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, AppState } from "react-native";

import type { IllustrationAnimation } from "@/data/illustrationAnimations";

export function useIllustrationPlayback({
  animation,
  ready,
  paused,
  onComplete
}: {
  animation: IllustrationAnimation;
  ready: boolean;
  paused: boolean;
  onComplete(): void;
}) {
  const [frame, setFrame] = useState(animation.staticFrame);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [foreground, setForeground] = useState(
    AppState.currentState !== "background" && AppState.currentState !== "inactive"
  );
  const [attempt, setAttempt] = useState(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const finished = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (active) setReduced(value);
      },
      () => {
        if (active) setReduced(true);
      }
    );
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    const state = AppState.addEventListener("change", (next) => setForeground(next === "active"));
    return () => {
      active = false;
      motion.remove();
      state.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready || reduced === null || finished.current) return;
    const finish = () => {
      finished.current = true;
      setFrame(animation.staticFrame);
      setPlaying(false);
      completeRef.current();
    };
    if (reduced || paused || !foreground) {
      if (reduced || started.current) finish();
      return;
    }
    started.current = true;
    setFrame(0);
    setPlaying(true);
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      if (current >= animation.frameCount) {
        clearInterval(timer);
        finish();
      } else setFrame(current);
    }, animation.frameDurationMs);
    return () => clearInterval(timer);
  }, [animation, ready, reduced, paused, foreground, attempt]);

  return {
    frame,
    playing,
    replay: () => {
      finished.current = false;
      started.current = false;
      setAttempt((value) => value + 1);
    },
    stop: () => {
      finished.current = true;
      setPlaying(false);
      setFrame(animation.staticFrame);
      setAttempt((value) => value + 1);
      completeRef.current();
    }
  };
}
