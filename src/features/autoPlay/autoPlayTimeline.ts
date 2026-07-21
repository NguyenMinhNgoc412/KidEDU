import type { LearningItem, PlaybackSpeed } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";

const samplePlaybackGraceMs = 2_000;
const unknownSamplePlaybackTimeoutMs = 20_000;
const minimumSamplePlaybackTimeoutMs = 3_000;
const maximumSamplePlaybackTimeoutMs = 22_000;

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

/**
 * Playback completion remains the primary clock for a real sample. This upper
 * bound is only a recovery path for missing/corrupt media or a native player
 * that never reports completion.
 */
export function getSamplePlaybackTimeoutMs(
  item: LearningItem | undefined,
  playbackSpeed: PlaybackSpeed
): number | null {
  if (!item) {
    return null;
  }

  const resolved = resolveLearningItemMedia(item);
  const sampleMedia = [resolved.byRole.mouth_video, resolved.byRole.pronunciation_audio].filter(
    (media) => isPlayableTimelineMediaUri(media?.asset.uri ?? null)
  );

  if (sampleMedia.length === 0) {
    return null;
  }

  const hasUnknownDuration = sampleMedia.some(
    (media) => !media?.asset.durationMs || media.asset.durationMs <= 0
  );

  if (hasUnknownDuration) {
    return unknownSamplePlaybackTimeoutMs;
  }

  const totalDurationMs = sampleMedia.reduce(
    (duration, media) => duration + (media?.asset.durationMs ?? 0),
    0
  );
  const speedAdjustedDurationMs = totalDurationMs / playbackSpeed + samplePlaybackGraceMs;

  return Math.min(
    maximumSamplePlaybackTimeoutMs,
    Math.max(minimumSamplePlaybackTimeoutMs, Math.ceil(speedAdjustedDurationMs))
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
