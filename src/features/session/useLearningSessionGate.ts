import { useEffect, useState } from "react";

import { tryBeginLearningSession } from "./learningOperationCoordinator";

export type LearningSessionGateStatus = "preparing" | "active" | "blocked";

export function useLearningSessionGate(): LearningSessionGateStatus {
  const [status, setStatus] = useState<LearningSessionGateStatus>("preparing");

  useEffect(() => {
    const release = tryBeginLearningSession();
    setStatus(release ? "active" : "blocked");
    return release ?? undefined;
  }, []);

  return status;
}
