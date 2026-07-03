import type { LearningItem, LearningItemMedia, MediaRole } from "@/data/types";

export const requiredLearningRoles: MediaRole[] = ["illustration", "mouth_video", "pronunciation_audio"];

export interface ResolvedLearningMedia {
  byRole: Partial<Record<MediaRole, LearningItemMedia>>;
  missingRoles: MediaRole[];
  fallbackRoles: MediaRole[];
  hasCustomMedia: boolean;
  isPlayableInAutoPlay: boolean;
  needsContentLabel: boolean;
}

export function resolveLearningItemMedia(item: LearningItem): ResolvedLearningMedia {
  const byRole: Partial<Record<MediaRole, LearningItemMedia>> = {};
  const fallbackRoles: MediaRole[] = [];
  let hasCustomMedia = false;

  for (const role of requiredLearningRoles) {
    const active = item.media.filter((media) => media.role === role && media.isActive && media.asset.status === "active");
    const custom = active.find((media) => media.asset.source === "custom");
    const fallback = active.find((media) => media.asset.source === "default");
    const selected = custom ?? fallback;

    if (selected) {
      byRole[role] = selected;
      hasCustomMedia ||= selected.asset.source === "custom";
      if (!custom && fallback) {
        fallbackRoles.push(role);
      }
    }
  }

  const missingRoles = requiredLearningRoles.filter((role) => !byRole[role]);
  const hasTextOnly = missingRoles.length === requiredLearningRoles.length;
  const hasAudio = Boolean(byRole.pronunciation_audio);
  const hasVisual = Boolean(byRole.illustration || byRole.mouth_video);

  return {
    byRole,
    missingRoles,
    fallbackRoles,
    hasCustomMedia,
    isPlayableInAutoPlay: !hasTextOnly && (hasAudio || hasVisual),
    needsContentLabel: missingRoles.length > 0
  };
}

export function getContentStatusLabel(item: LearningItem): "Đã cá nhân hóa" | "Cần bổ sung" | "Sẵn sàng học" {
  const resolved = resolveLearningItemMedia(item);

  if (resolved.hasCustomMedia) {
    return "Đã cá nhân hóa";
  }

  if (resolved.needsContentLabel) {
    return "Cần bổ sung";
  }

  return "Sẵn sàng học";
}
