import type { MediaRole } from "@/data/types";

export type ActiveLearningMediaRole = Extract<MediaRole, "illustration" | "mouth_video" | "pronunciation_audio">;
export type LearningMediaStageRole = Extract<MediaRole, "illustration" | "mouth_video">;

export const missingVisualMediaLabel = "Từ này chưa có ảnh hoặc video";

export function resolveLearningMediaStageRole({
  activeRole,
  hasRenderableIllustration,
  hasPlayableVideo
}: {
  activeRole: ActiveLearningMediaRole;
  hasRenderableIllustration: boolean;
  hasPlayableVideo: boolean;
}): LearningMediaStageRole {
  if (activeRole === "mouth_video" && hasPlayableVideo) {
    return "mouth_video";
  }

  if (activeRole === "pronunciation_audio") {
    return "illustration";
  }

  if (hasRenderableIllustration) {
    return "illustration";
  }

  if (hasPlayableVideo) {
    return "mouth_video";
  }

  return "illustration";
}

export function getLearningVisualPlaceholderLabel({
  hasRenderableIllustration,
  hasPlayableVideo
}: {
  hasRenderableIllustration: boolean;
  hasPlayableVideo: boolean;
}): string | undefined {
  return !hasRenderableIllustration && !hasPlayableVideo ? missingVisualMediaLabel : undefined;
}
