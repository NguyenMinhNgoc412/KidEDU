import type { LearningItem } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";

export function shouldWaitForSamplePlaybackEnd(item: LearningItem | null | undefined): boolean {
  if (!item) {
    return false;
  }

  const resolved = resolveLearningItemMedia(item);

  return (
    isPlayableTimelineMediaUri(resolved.byRole.mouth_video?.asset.uri ?? null) ||
    isPlayableTimelineMediaUri(resolved.byRole.pronunciation_audio?.asset.uri ?? null)
  );
}

export function getAutoPlayPreloadVisualUri(item: LearningItem | null | undefined): string | null {
  if (!item) {
    return null;
  }

  const resolved = resolveLearningItemMedia(item);
  const uri =
    resolved.byRole.illustration?.asset.thumbnailUri ??
    resolved.byRole.illustration?.asset.uri ??
    resolved.byRole.mouth_video?.asset.thumbnailUri ??
    null;

  return isPlayableTimelineMediaUri(uri) ? uri : null;
}

export function getAutoPlayPreloadMediaUris(item: LearningItem | null | undefined): string[] {
  if (!item) {
    return [];
  }

  const resolved = resolveLearningItemMedia(item);
  const media = [
    resolved.byRole.illustration,
    resolved.byRole.mouth_video,
    resolved.byRole.pronunciation_audio
  ];

  return [
    ...new Set(
      media
        .flatMap((entry) => [entry?.asset.uri, entry?.asset.thumbnailUri])
        .filter((uri): uri is string => isPlayableTimelineMediaUri(uri ?? null))
    )
  ];
}

function isPlayableTimelineMediaUri(uri: string | null): boolean {
  return Boolean(uri && !uri.startsWith("seed://") && !uri.startsWith("data:"));
}
