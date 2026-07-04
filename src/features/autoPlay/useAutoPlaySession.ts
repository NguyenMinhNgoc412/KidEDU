import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { useKidEduRepository } from "@/data/KidEduDataProvider";
import { queryKeys } from "@/data/queries";
import type { DeckDetail, LearningItem, LearningSettings, PracticeSessionStatus } from "@/data/types";

import { getAutoPlayItems } from "./autoPlayItems";
import { shouldWaitForSamplePlaybackEnd } from "./autoPlayTimeline";
import {
  advanceAutoPlayState,
  createInitialAutoPlayState,
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
  pause(): void;
  resume(): void;
  replay(): void;
  exit(): void;
  restart(): void;
  completeCurrentSample(): void;
}

export function useAutoPlaySession(deck: DeckDetail, settings: LearningSettings): UseAutoPlaySessionResult {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();
  const { loopCount, loopMode, playbackSpeed, reinforcementEnabled, sfxEnabled, speedPreset } = settings;
  const playableItems = useMemo(() => getAutoPlayItems(deck.items), [deck.items]);
  const [state, setState] = useState(() => createInitialAutoPlayState(playableItems.length));
  const shouldWaitForCurrentSamplePlaybackEnd = shouldWaitForSamplePlaybackEnd(playableItems[state.itemIndex]);
  const sessionIdRef = useRef<string | null>(null);
  const viewedKeyRef = useRef<string | null>(null);
  const completedKeyRef = useRef<string | null>(null);
  const finishedRef = useRef(false);

  const finishSession = useCallback(
    (status: PracticeSessionStatus) => {
      const sessionId = sessionIdRef.current;

      if (!sessionId || finishedRef.current) {
        return;
      }

      finishedRef.current = true;
      void repository.finishPracticeSession({ sessionId, status }).then(async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.progress });
      });
    },
    [queryClient, repository]
  );

  useEffect(() => {
    setState(createInitialAutoPlayState(playableItems.length));
    sessionIdRef.current = null;
    viewedKeyRef.current = null;
    completedKeyRef.current = null;
    finishedRef.current = false;
  }, [deck.id, playableItems.length]);

  useEffect(() => {
    let isMounted = true;

    async function startSession() {
      if (sessionIdRef.current || playableItems.length === 0) {
        return;
      }

      const sessionId = await repository.startPracticeSession({ mode: "auto_play_deck", deckId: deck.id });
      if (isMounted) {
        sessionIdRef.current = sessionId;
      }
    }

    void startSession();

    return () => {
      isMounted = false;
    };
  }, [deck.id, playableItems.length, repository]);

  useEffect(() => {
    const duration =
      state.phase === "sample" && shouldWaitForCurrentSamplePlaybackEnd
        ? null
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
    const sessionId = sessionIdRef.current;

    if (!currentItem || !sessionId || state.phase !== "attention") {
      return;
    }

    const key = `${sessionId}:${currentItem.id}:${state.loopIndex}:${state.replayNonce}:viewed`;
    if (viewedKeyRef.current === key) {
      return;
    }

    viewedKeyRef.current = key;
    void repository.recordPracticeEvent({ sessionId, learningItemId: currentItem.id, eventType: "viewed" });
  }, [playableItems, repository, state.itemIndex, state.loopIndex, state.phase, state.replayNonce]);

  useEffect(() => {
    const currentItem = playableItems[state.itemIndex];
    const sessionId = sessionIdRef.current;

    if (!currentItem || !sessionId || (state.phase !== "transition" && state.phase !== "reinforce")) {
      return;
    }

    const key = `${sessionId}:${currentItem.id}:${state.loopIndex}:${state.replayNonce}:completed`;
    if (completedKeyRef.current === key) {
      return;
    }

    completedKeyRef.current = key;
    void repository.recordPracticeEvent({ sessionId, learningItemId: currentItem.id, eventType: "completed_item" });
  }, [playableItems, repository, state.itemIndex, state.loopIndex, state.phase, state.replayNonce]);

  useEffect(() => {
    if (state.phase === "completed" || state.phase === "stopped") {
      const status: PracticeSessionStatus = state.phase === "completed" ? "completed" : "cancelled";
      finishSession(status);
    }
  }, [finishSession, state.phase]);

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
      void repository.recordPracticeEvent({ sessionId, learningItemId: currentItem.id, eventType: "replayed" });
    }

    setState((current) => replayCurrentAutoPlayItem(current));
  }, [playableItems, repository, state.itemIndex]);

  const exit = useCallback(() => {
    finishSession("cancelled");
    setState((current) => stopAutoPlayState(current));
  }, [finishSession]);

  const restart = useCallback(() => {
    finishSession("cancelled");
    setState(createInitialAutoPlayState(playableItems.length));
    sessionIdRef.current = null;
    viewedKeyRef.current = null;
    completedKeyRef.current = null;
    finishedRef.current = false;
  }, [finishSession, playableItems.length]);

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
  }, [loopCount, loopMode, playbackSpeed, playableItems.length, reinforcementEnabled, sfxEnabled, speedPreset]);

  return {
    state,
    playableItems,
    currentItem: playableItems[state.itemIndex] ?? null,
    pause,
    resume,
    replay,
    exit,
    restart,
    completeCurrentSample
  };
}
