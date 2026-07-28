import type { LearningItem, LearningItemMedia, MediaRole } from "@/data/types";

export const requiredLearningRoles: MediaRole[] = ["illustration", "mouth_video", "pronunciation_audio"];

export interface ResolvedLearningMedia {
  byRole: Partial<Record<MediaRole, LearningItemMedia>>;
  missingRoles: MediaRole[];
  fallbackRoles: MediaRole[];
  brokenCustomRoles: MediaRole[];
  hasCustomMedia: boolean;
  isPlayableInAutoPlay: boolean;
  needsContentLabel: boolean;
}

export function resolveLearningItemMedia(item: LearningItem): ResolvedLearningMedia {
  const byRole: Partial<Record<MediaRole, LearningItemMedia>> = {};
  const fallbackRoles: MediaRole[] = [];
  const brokenCustomRoles: MediaRole[] = [];
  let hasCustomMedia = false;

  for (const role of requiredLearningRoles) {
    const roleMedia = item.media.filter((media) => media.role === role && media.isActive);
    const brokenCustom = roleMedia.some(
      (media) => media.asset.source === "custom" && media.asset.status !== "active"
    );
    const active = roleMedia.filter((media) => media.asset.status === "active");
    const custom = active.find((media) => media.asset.source === "custom");
    const fallback = active.find((media) => media.asset.source === "default");
    const selected = custom ?? fallback;

    if (brokenCustom) {
      brokenCustomRoles.push(role);
    }

    if (selected) {
      byRole[role] = selected;
      hasCustomMedia ||= selected.asset.source === "custom";
      if (brokenCustom && !custom && fallback) {
        fallbackRoles.push(role);
      }
    }
  }

  const missingRoles = requiredLearningRoles.filter((role) => !byRole[role]);
  const hasPlayableMedia = requiredLearningRoles.some((role) => Boolean(byRole[role]));

  return {
    byRole,
    missingRoles,
    fallbackRoles,
    brokenCustomRoles,
    hasCustomMedia,
    isPlayableInAutoPlay:
      item.status === "active" && Boolean(item.title.trim()) && hasPlayableMedia,
    needsContentLabel: missingRoles.length > 0 || brokenCustomRoles.length > 0
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
