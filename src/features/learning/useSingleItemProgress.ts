import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

import { useKidEduRepository } from "@/data/KidEduDataProvider";
import { queryKeys } from "@/data/queries";

export function useSingleItemProgress(learningItemId: string | null) {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();
  const sessionIdRef = useRef<string | null>(null);
  const viewedRef = useRef(false);
  const finishedRef = useRef(false);

  const invalidateProgress = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.progress });
  }, [queryClient]);

  useEffect(() => {
    if (!learningItemId) {
      return;
    }

    const itemId = learningItemId;
    let isMounted = true;
    let startedSessionId: string | null = null;
    sessionIdRef.current = null;
    viewedRef.current = false;
    finishedRef.current = false;

    async function startSession() {
      const sessionId = await repository.startPracticeSession({ mode: "single_item", deckId: null });
      startedSessionId = sessionId;

      if (!isMounted) {
        await repository.finishPracticeSession({ sessionId, status: "interrupted" });
        return;
      }

      sessionIdRef.current = sessionId;
      if (!viewedRef.current) {
        viewedRef.current = true;
        await repository.recordPracticeEvent({ sessionId, learningItemId: itemId, eventType: "viewed" });
        await invalidateProgress();
      }
    }

    void startSession();

    return () => {
      isMounted = false;
      const sessionId = sessionIdRef.current ?? startedSessionId;

      if (!sessionId || finishedRef.current) {
        return;
      }

      finishedRef.current = true;
      void repository
        .recordPracticeEvent({ sessionId, learningItemId: itemId, eventType: "completed_item" })
        .then(() => repository.finishPracticeSession({ sessionId, status: "completed" }))
        .then(invalidateProgress);
    };
  }, [invalidateProgress, learningItemId, repository]);

  const recordReplay = useCallback(() => {
    if (!learningItemId || !sessionIdRef.current) {
      return;
    }

    void repository
      .recordPracticeEvent({ sessionId: sessionIdRef.current, learningItemId, eventType: "replayed" })
      .then(invalidateProgress);
  }, [invalidateProgress, learningItemId, repository]);

  return {
    recordReplay
  };
}
