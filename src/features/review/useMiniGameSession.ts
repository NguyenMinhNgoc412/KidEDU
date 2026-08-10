import { useCallback, useEffect, useRef, useState } from "react";

import { useKidEduRepository } from "@/data/KidEduDataProvider";
import type { PracticeMode, PracticeSessionStatus } from "@/data/types";

interface SessionRun {
  finalStatus: PracticeSessionStatus | null;
  isMounted: boolean;
  sessionId: string | null;
}

export function useMiniGameSession(
  mode: Extract<PracticeMode, "puzzle_game" | "memory_game">,
  deckId: string
) {
  const repository = useKidEduRepository();
  const runRef = useRef<SessionRun | null>(null);
  const [runNumber, setRunNumber] = useState(0);

  useEffect(() => {
    const run: SessionRun = { finalStatus: null, isMounted: true, sessionId: null };
    runRef.current = run;

    void repository
      .startPracticeSession({ deckId, mode })
      .then((sessionId) => {
        run.sessionId = sessionId;
        if (!run.isMounted || run.finalStatus) {
          return repository.finishPracticeSession({
            sessionId,
            status: run.finalStatus ?? "cancelled"
          });
        }
      })
      .catch(() => undefined);

    return () => {
      run.isMounted = false;
      run.finalStatus ??= "cancelled";
      if (run.sessionId) {
        void repository
          .finishPracticeSession({ sessionId: run.sessionId, status: run.finalStatus })
          .catch(() => undefined);
      }
      if (runRef.current === run) {
        runRef.current = null;
      }
    };
  }, [deckId, mode, repository, runNumber]);

  const complete = useCallback(() => {
    const run = runRef.current;
    if (!run || run.finalStatus) {
      return;
    }

    run.finalStatus = "completed";
    if (run.sessionId) {
      void repository
        .finishPracticeSession({ sessionId: run.sessionId, status: "completed" })
        .catch(() => {
          run.finalStatus = null;
        });
    }
  }, [repository]);

  const restart = useCallback(() => {
    setRunNumber((current) => current + 1);
  }, []);

  return { complete, restart };
}
