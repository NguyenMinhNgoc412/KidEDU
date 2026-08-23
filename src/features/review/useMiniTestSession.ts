import { useCallback, useEffect, useRef, useState } from "react";

import { useKidEduRepository } from "@/data/KidEduDataProvider";

export function useMiniTestSession(deckId: string) {
  const repository = useKidEduRepository();
  const sessionRef = useRef<{ id: string | null; mounted: boolean; status: "completed" | "cancelled" | null }>({
    id: null,
    mounted: true,
    status: null
  });
  const [runNumber, setRunNumber] = useState(0);

  useEffect(() => {
    const run = { id: null as string | null, mounted: true, status: null as "completed" | "cancelled" | null };
    sessionRef.current = run;
    void repository.startPracticeSession({ deckId, mode: "mini_test" }).then((id) => {
      run.id = id;
      if (!run.mounted) {
        void repository.finishPracticeSession({ sessionId: id, status: run.status ?? "cancelled" });
      }
    }).catch(() => undefined);

    return () => {
      run.mounted = false;
      run.status ??= "cancelled";
      if (run.id) {
        void repository.finishPracticeSession({ sessionId: run.id, status: run.status });
      }
    };
  }, [deckId, repository, runNumber]);

  const complete = useCallback(() => {
    const run = sessionRef.current;
    if (run.status) return;
    run.status = "completed";
    if (run.id) {
      void repository.finishPracticeSession({ sessionId: run.id, status: "completed" });
    }
  }, [repository]);

  const restart = useCallback(() => setRunNumber((current) => current + 1), []);

  return { complete, restart };
}
