import { useCallback, useEffect, useRef } from "react";

export const mediaResolveTimeoutMs = 10_000;
export const mediaStartTimeoutMs = 4_000;
export const mediaStallTimeoutMs = 6_000;

const progressEpsilonSeconds = 0.01;

export function usePlaybackProgressFailSafe({
  attemptKey,
  paused,
  playing,
  progressSeconds,
  onPlaybackStarted,
  onTimeout
}: {
  attemptKey: number | string | null;
  paused: boolean;
  playing: boolean;
  progressSeconds: number;
  onPlaybackStarted?: (attemptKey: number | string) => void;
  onTimeout: () => void;
}): void {
  const activeAttemptRef = useRef<number | string | null>(null);
  const hasStartedRef = useRef(false);
  const hasTimedOutRef = useRef(false);
  const lastProgressRef = useRef(0);
  const renderedAttemptKeyRef = useRef<number | string | null>(attemptKey);
  const pausedRef = useRef(paused);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerGenerationRef = useRef(0);
  const onPlaybackStartedRef = useRef(onPlaybackStarted);
  const onTimeoutRef = useRef(onTimeout);

  renderedAttemptKeyRef.current = attemptKey;
  pausedRef.current = paused;
  onPlaybackStartedRef.current = onPlaybackStarted;
  onTimeoutRef.current = onTimeout;

  const clearTimer = useCallback(() => {
    timerGenerationRef.current += 1;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const armTimer = useCallback(
    (timeoutMs: number) => {
      clearTimer();
      const timerGeneration = timerGenerationRef.current;
      const guardedAttempt = activeAttemptRef.current;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (
          timerGeneration !== timerGenerationRef.current ||
          renderedAttemptKeyRef.current !== guardedAttempt ||
          pausedRef.current ||
          hasTimedOutRef.current
        ) {
          return;
        }

        hasTimedOutRef.current = true;
        onTimeoutRef.current();
      }, timeoutMs);
    },
    [clearTimer]
  );

  useEffect(() => {
    if (attemptKey === null || paused) {
      clearTimer();
      activeAttemptRef.current = null;
      hasStartedRef.current = false;
      hasTimedOutRef.current = false;
      lastProgressRef.current = 0;
      return;
    }

    const progress = normalizeProgress(progressSeconds);
    if (activeAttemptRef.current !== attemptKey) {
      activeAttemptRef.current = attemptKey;
      hasStartedRef.current = false;
      hasTimedOutRef.current = false;
      lastProgressRef.current = progress;
      armTimer(mediaStartTimeoutMs);
      return;
    }

    if (hasTimedOutRef.current) {
      return;
    }

    const previousProgress = lastProgressRef.current;
    if (progress + progressEpsilonSeconds < previousProgress) {
      lastProgressRef.current = progress;
      armTimer(hasStartedRef.current ? mediaStallTimeoutMs : mediaStartTimeoutMs);
      return;
    }

    const madeProgress = progress > previousProgress + progressEpsilonSeconds;
    if (!playing && !madeProgress) {
      return;
    }

    lastProgressRef.current = progress;
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      onPlaybackStartedRef.current?.(attemptKey);
    }
    armTimer(mediaStallTimeoutMs);
  }, [armTimer, attemptKey, clearTimer, paused, playing, progressSeconds]);

  useEffect(() => clearTimer, [clearTimer]);
}

function normalizeProgress(progressSeconds: number): number {
  return Number.isFinite(progressSeconds) && progressSeconds > 0 ? progressSeconds : 0;
}
