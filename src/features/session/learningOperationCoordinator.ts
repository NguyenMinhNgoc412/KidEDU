let activeLearningSessionCount = 0;
let isExclusiveDataOperationActive = false;

export type ActivityRelease = () => void;

export function tryBeginLearningSession(): ActivityRelease | null {
  if (isExclusiveDataOperationActive) {
    return null;
  }

  activeLearningSessionCount += 1;
  return createRelease(() => {
    activeLearningSessionCount = Math.max(0, activeLearningSessionCount - 1);
  });
}

export function tryBeginExclusiveDataOperation(): ActivityRelease | null {
  if (isExclusiveDataOperationActive || activeLearningSessionCount > 0) {
    return null;
  }

  isExclusiveDataOperationActive = true;
  return createRelease(() => {
    isExclusiveDataOperationActive = false;
  });
}

export function isLearningSessionActive(): boolean {
  return activeLearningSessionCount > 0;
}

function createRelease(release: () => void): ActivityRelease {
  let hasReleased = false;

  return () => {
    if (hasReleased) {
      return;
    }
    hasReleased = true;
    release();
  };
}
