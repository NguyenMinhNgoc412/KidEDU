import type { LearningItem } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";

export function shouldWaitForSamplePlaybackEnd(item: LearningItem | undefined): boolean {
  if (!item) {
    return false;
  }

  const resolved = resolveLearningItemMedia(item);

  return (
    isPlayableTimelineMediaUri(resolved.byRole.mouth_video?.asset.uri ?? null) ||
    isPlayableTimelineMediaUri(resolved.byRole.pronunciation_audio?.asset.uri ?? null)
  );
}

function isPlayableTimelineMediaUri(uri: string | null): boolean {
  return Boolean(uri && !uri.startsWith("seed://") && !uri.startsWith("data:"));
}
