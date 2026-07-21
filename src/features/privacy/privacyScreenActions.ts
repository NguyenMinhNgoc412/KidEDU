import type { PrivacyDataSummary } from "@/data/types";

export interface PrivacyActionAvailability {
  hasLearningHistory: boolean;
  hasPersonalizedMedia: boolean;
  canClose: boolean;
  canClearLearningHistory: boolean;
  canDeletePersonalizedMedia: boolean;
  canResetApp: boolean;
}

export function getPrivacyActionAvailability(
  summary: PrivacyDataSummary | null,
  isBusy: boolean
): PrivacyActionAvailability {
  const hasLearningHistory = Boolean(
    summary &&
    (summary.practiceSessionCount > 0 ||
      summary.practiceEventCount > 0 ||
      summary.learningProgressCount > 0)
  );
  const hasPersonalizedMedia = Boolean(summary?.personalizedMediaCount);

  return {
    hasLearningHistory,
    hasPersonalizedMedia,
    canClose: !isBusy,
    canClearLearningHistory: !isBusy && hasLearningHistory,
    canDeletePersonalizedMedia: !isBusy && hasPersonalizedMedia,
    canResetApp: !isBusy
  };
}

export async function resetPrivacyDataAndExit({
  resetAllLocalData,
  lockParentZone,
  replaceRoute
}: {
  resetAllLocalData(): Promise<boolean>;
  lockParentZone(): void;
  replaceRoute(path: "/"): void;
}): Promise<boolean> {
  const succeeded = await resetAllLocalData();
  if (!succeeded) {
    return false;
  }

  lockParentZone();
  replaceRoute("/");
  return true;
}
