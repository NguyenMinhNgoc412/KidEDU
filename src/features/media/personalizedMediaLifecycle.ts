export function cleanupPersonalizedMediaOnUnmount<T>({
  markUnmounted,
  resetAudioMode,
  stagedMedia,
  discardStagedMedia
}: {
  markUnmounted: () => void;
  resetAudioMode: () => Promise<void>;
  stagedMedia: T[];
  discardStagedMedia: (staged: T) => Promise<void>;
}): void {
  markUnmounted();
  void resetAudioMode();

  for (const staged of stagedMedia) {
    void discardStagedMedia(staged);
  }
}
