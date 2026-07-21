import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { useKidEduRepository } from "@/data/KidEduDataProvider";
import { queryKeys } from "@/data/queries";
import type {
  DeckDetail,
  LearningItem,
  LearningSettings,
  PracticeSessionStatus
} from "@/data/types";

import { getAutoPlayItems } from "./autoPlayItems";
import { getSamplePlaybackTimeoutMs, shouldWaitForSamplePlaybackEnd } from "./autoPlayTimeline";
import {
  advanceAutoPlayState,
  createInitialAutoPlayState,
  getNextAutoPlayItemIndex,
  getPhaseDurationMs,
  pauseAutoPlayState,
  replayCurrentAutoPlayItem,
  resumeAutoPlayState,
  stopAutoPlayState,
  type AutoPlayState
} from "./autoPlayEngine";

export interface UseAutoPlaySessionResult {
  state: AutoPlayState;
  playableItems: LearningItem[];
  currentItem: LearningItem | null;
  nextItem: LearningItem | null;
  pause(): void;
  resume(): void;
  replay(): void;
  exit(): void;
  restart(): void;
  completeCurrentSample(): void;
}

interface AutoPlaySessionRun {
  sessionId: string | null;
  isActive: boolean;
  finalStatus: PracticeSessionStatus | null;
}

export function useAutoPlaySession(
  deck: DeckDetail,
  settings: LearningSettings
): UseAutoPlaySessionResult {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();
  const { loopCount, loopMode, playbackSpeed, reinforcementEnabled, sfxEnabled, speedPreset } =
    settings;
  const playableItems = useMemo(() => getAutoPlayItems(deck.items), [deck.items]);
  const [state, setState] = useState(() => createInitialAutoPlayState(playableItems.length));
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionRun, setSessionRun] = useState(0);
  const currentItem = playableItems[state.itemIndex];
  const shouldWaitForCurrentSamplePlaybackEnd = shouldWaitForSamplePlaybackEnd(currentItem);
  const samplePlaybackTimeoutMs = getSamplePlaybackTimeoutMs(currentItem, playbackSpeed);
  const nextItemIndex = getNextAutoPlayItemIndex(state, settings, playableItems.length);
  const sessionIdRef = useRef<string | null>(null);
  const activeSessionRunRef = useRef<AutoPlaySessionRun | null>(null);
  const viewedKeyRef = useRef<string | null>(null);
  const completedKeyRef = useRef<string | null>(null);
  const finalizedSessionIdsRef = useRef(new Set<string>());

  const finishSessionById = useCallback(
    (sessionId: string, status: PracticeSessionStatus) => {
      if (finalizedSessionIdsRef.current.has(sessionId)) {
        return;
      }

      finalizedSessionIdsRef.current.add(sessionId);
      void repository
        .finishPracticeSession({ sessionId, status })
        .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.progress }))
        .catch(() => {
          finalizedSessionIdsRef.current.delete(sessionId);
        });
    },
    [queryClient, repository]
  );

  const finishCurrentSession = useCallback(
    (status: PracticeSessionStatus) => {
      const run = activeSessionRunRef.current;
      if (!run) {
        return;
      }

      run.finalStatus ??= status;
      if (run.sessionId) {
        finishSessionById(run.sessionId, run.finalStatus);
      }
    },
    [finishSessionById]
  );

  useEffect(() => {
    setState(createInitialAutoPlayState(playableItems.length));
    sessionIdRef.current = null;
    setActiveSessionId(null);
    viewedKeyRef.current = null;
    completedKeyRef.current = null;
  }, [deck.id, playableItems.length]);

  useEffect(() => {
    const run: AutoPlaySessionRun = {
      sessionId: null,
      isActive: true,
      finalStatus: null
    };
    activeSessionRunRef.current = run;

    async function startSession() {
      if (playableItems.length === 0) {
        return;
      }

      const sessionId = await repository.startPracticeSession({
        mode: "auto_play_deck",
        deckId: deck.id
      });
      run.sessionId = sessionId;

      if (!run.isActive || run.finalStatus) {
        finishSessionById(sessionId, run.finalStatus ?? "interrupted");
        return;
      }

      sessionIdRef.current = sessionId;
      setActiveSessionId(sessionId);
    }

    void startSession().catch(() => undefined);

    return () => {
      run.isActive = false;
      run.finalStatus ??= "interrupted";
      if (activeSessionRunRef.current === run) {
        activeSessionRunRef.current = null;
      }
      if (run.sessionId) {
        finishSessionById(run.sessionId, run.finalStatus);
      }
    };
  }, [deck.id, finishSessionById, playableItems.length, repository, sessionRun]);

  useEffect(() => {
    const duration =
      state.phase === "sample" && shouldWaitForCurrentSamplePlaybackEnd
        ? samplePlaybackTimeoutMs
        : getPhaseDurationMs(state.phase, speedPreset);

    if (duration === null) {
      return;
    }

    const scheduledState = {
      itemIndex: state.itemIndex,
      loopIndex: state.loopIndex,
      phase: state.phase,
      replayNonce: state.replayNonce
    };

    const timeout = setTimeout(() => {
      setState((current) => {
        if (
          current.phase !== scheduledState.phase ||
          current.itemIndex !== scheduledState.itemIndex ||
          current.loopIndex !== scheduledState.loopIndex ||
          current.replayNonce !== scheduledState.replayNonce
        ) {
          return current;
        }

        return advanceAutoPlayState(
          current,
          { loopCount, loopMode, playbackSpeed, reinforcementEnabled, sfxEnabled, speedPreset },
          playableItems.length
        );
      });
    }, duration);

    return () => clearTimeout(timeout);
  }, [
    loopMode,
    loopCount,
    playbackSpeed,
    playableItems.length,
    reinforcementEnabled,
    samplePlaybackTimeoutMs,
    shouldWaitForCurrentSamplePlaybackEnd,
    sfxEnabled,
    speedPreset,
    state.phase,
    state.itemIndex,
    state.loopIndex,
    state.replayNonce
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        setState((current) => pauseAutoPlayState(current));
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const currentItem = playableItems[state.itemIndex];
    const sessionId = activeSessionId;

    if (!currentItem || !sessionId || state.phase !== "attention") {
      return;
    }

    const key = `${sessionId}:${currentItem.id}:${state.loopIndex}:${state.replayNonce}:viewed`;
    if (viewedKeyRef.current === key) {
      return;
    }

    viewedKeyRef.current = key;
    void repository
      .recordPracticeEvent({
        sessionId,
        learningItemId: currentItem.id,
        eventType: "viewed"
      })
      .catch(() => undefined);
  }, [
    activeSessionId,
    playableItems,
    repository,
    state.itemIndex,
    state.loopIndex,
    state.phase,
    state.replayNonce
  ]);

  useEffect(() => {
    const currentItem = playableItems[state.itemIndex];
    const sessionId = activeSessionId;

    if (
      !currentItem ||
      !sessionId ||
      (state.phase !== "transition" && state.phase !== "reinforce")
    ) {
      return;
    }

    const key = `${sessionId}:${currentItem.id}:${state.loopIndex}:${state.replayNonce}:completed`;
    if (completedKeyRef.current === key) {
      return;
    }

    completedKeyRef.current = key;
    void repository
      .recordPracticeEvent({
        sessionId,
        learningItemId: currentItem.id,
        eventType: "completed_item"
      })
      .catch(() => undefined);
  }, [
    activeSessionId,
    playableItems,
    repository,
    state.itemIndex,
    state.loopIndex,
    state.phase,
    state.replayNonce
  ]);

  useEffect(() => {
    if (state.phase === "completed" || state.phase === "stopped") {
      const status: PracticeSessionStatus = state.phase === "completed" ? "completed" : "cancelled";
      finishCurrentSession(status);
    }
  }, [finishCurrentSession, state.phase]);

  const pause = useCallback(() => {
    setState((current) => pauseAutoPlayState(current));
  }, []);

  const resume = useCallback(() => {
    setState((current) => resumeAutoPlayState(current));
  }, []);

  const replay = useCallback(() => {
    const currentItem = playableItems[state.itemIndex];
    const sessionId = sessionIdRef.current;

    if (currentItem && sessionId) {
      void repository
        .recordPracticeEvent({
          sessionId,
          learningItemId: currentItem.id,
          eventType: "replayed"
        })
        .catch(() => undefined);
    }

    setState((current) => replayCurrentAutoPlayItem(current));
  }, [playableItems, repository, state.itemIndex]);

  const exit = useCallback(() => {
    finishCurrentSession("cancelled");
    setState((current) => stopAutoPlayState(current));
  }, [finishCurrentSession]);

  const restart = useCallback(() => {
    finishCurrentSession("cancelled");
    setState(createInitialAutoPlayState(playableItems.length));
    sessionIdRef.current = null;
    setActiveSessionId(null);
    viewedKeyRef.current = null;
    completedKeyRef.current = null;
    setSessionRun((run) => run + 1);
  }, [finishCurrentSession, playableItems.length]);

  const completeCurrentSample = useCallback(() => {
    setState((current) => {
      if (current.phase !== "sample") {
        return current;
      }

      return advanceAutoPlayState(
        current,
        { loopCount, loopMode, playbackSpeed, reinforcementEnabled, sfxEnabled, speedPreset },
        playableItems.length
      );
    });
  }, [
    loopCount,
    loopMode,
    playbackSpeed,
    playableItems.length,
    reinforcementEnabled,
    sfxEnabled,
    speedPreset
  ]);

  return {
    state,
    playableItems,
    currentItem: currentItem ?? null,
    nextItem: nextItemIndex === null ? null : (playableItems[nextItemIndex] ?? null),
    pause,
    resume,
    replay,
    exit,
    restart,
    completeCurrentSample
  };
}
