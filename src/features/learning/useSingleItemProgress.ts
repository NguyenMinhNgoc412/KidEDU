import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

import { useKidEduRepository } from "@/data/KidEduDataProvider";
import { queryKeys } from "@/data/queries";
import type { LearningSampleCompletion } from "@/features/learning/LearningMediaPlayer";

interface SingleItemSessionRun {
  itemId: string;
  sessionId: string | null;
  isMounted: boolean;
  sampleCompleted: boolean;
  viewedPromise: Promise<void> | null;
  completedEventPromise: Promise<void> | null;
  finalizePromise: Promise<void> | null;
}

export function useSingleItemProgress(learningItemId: string | null) {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();
  const activeRunRef = useRef<SingleItemSessionRun | null>(null);

  const invalidateProgress = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.progress });
  }, [queryClient]);

  const recordCompletedItem = useCallback(
    (run: SingleItemSessionRun): Promise<void> => {
      if (!run.sessionId) {
        return Promise.resolve();
      }

      if (!run.completedEventPromise) {
        run.completedEventPromise = (async () => {
          await run.viewedPromise;
          await repository.recordPracticeEvent({
            sessionId: run.sessionId!,
            learningItemId: run.itemId,
            eventType: "completed_item"
          });
          await invalidateProgress();
        })().catch(() => undefined);
      }

      return run.completedEventPromise;
    },
    [invalidateProgress, repository]
  );

  const finalizeRun = useCallback(
    (run: SingleItemSessionRun): Promise<void> => {
      if (!run.sessionId) {
        return Promise.resolve();
      }

      if (!run.finalizePromise) {
        run.finalizePromise = (async () => {
          if (run.sampleCompleted) {
            await recordCompletedItem(run);
          } else {
            await run.viewedPromise;
          }

          await repository.finishPracticeSession({
            sessionId: run.sessionId!,
            status: run.sampleCompleted ? "completed" : "interrupted"
          });
          await invalidateProgress();
        })();
      }

      return run.finalizePromise;
    },
    [invalidateProgress, recordCompletedItem, repository]
  );

  useEffect(() => {
    if (!learningItemId) {
      activeRunRef.current = null;
      return;
    }

    const run: SingleItemSessionRun = {
      itemId: learningItemId,
      sessionId: null,
      isMounted: true,
      sampleCompleted: false,
      viewedPromise: null,
      completedEventPromise: null,
      finalizePromise: null
    };
    activeRunRef.current = run;

    async function startSession() {
      const sessionId = await repository.startPracticeSession({
        mode: "single_item",
        deckId: null
      });
      run.sessionId = sessionId;

      if (run.isMounted || run.sampleCompleted) {
        run.viewedPromise = repository
          .recordPracticeEvent({ sessionId, learningItemId: run.itemId, eventType: "viewed" })
          .then(invalidateProgress)
          .catch(() => undefined);
      }

      if (run.sampleCompleted) {
        void recordCompletedItem(run).catch(() => undefined);
      }

      if (!run.isMounted) {
        void finalizeRun(run).catch(() => undefined);
      }
    }

    void startSession().catch(() => undefined);

    return () => {
      run.isMounted = false;
      if (activeRunRef.current === run) {
        activeRunRef.current = null;
      }
      void finalizeRun(run).catch(() => undefined);
    };
  }, [finalizeRun, invalidateProgress, learningItemId, recordCompletedItem, repository]);

  const recordSampleCompleted = useCallback(
    (completion: LearningSampleCompletion = "played") => {
      if (completion !== "played") {
        return;
      }

      const run = activeRunRef.current;
      if (!run || !run.isMounted || run.sampleCompleted) {
        return;
      }

      run.sampleCompleted = true;
      if (run.sessionId) {
        void recordCompletedItem(run).catch(() => undefined);
      }
    },
    [recordCompletedItem]
  );

  const recordReplay = useCallback(() => {
    const run = activeRunRef.current;
    if (!run?.sessionId || !run.isMounted) {
      return;
    }

    void repository
      .recordPracticeEvent({
        sessionId: run.sessionId,
        learningItemId: run.itemId,
        eventType: "replayed"
      })
      .then(invalidateProgress)
      .catch(() => undefined);
  }, [invalidateProgress, repository]);

  return {
    recordReplay,
    recordSampleCompleted
  };
}
