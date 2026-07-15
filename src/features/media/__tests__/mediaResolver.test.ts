import type { LearningItem, LearningItemMedia, MediaRole, MediaSource } from "@/data/types";

import { getContentStatusLabel, resolveLearningItemMedia } from "../mediaResolver";

describe("mediaResolver", () => {
  it("prefers custom media over default media for the same role", () => {
    const item = makeItem([
      makeMedia("illustration", "default", 10),
      makeMedia("illustration", "custom", 100),
      makeMedia("mouth_video", "default", 10),
      makeMedia("pronunciation_audio", "default", 10)
    ]);

    const resolved = resolveLearningItemMedia(item);

    expect(resolved.byRole.illustration?.asset.source).toBe("custom");
    expect(resolved.hasCustomMedia).toBe(true);
    expect(getContentStatusLabel(item)).toBe("Đã cá nhân hóa");
  });

  it("marks item as needing content when a core role is missing", () => {
    const item = makeItem([makeMedia("illustration", "default", 10), makeMedia("pronunciation_audio", "default", 10)]);

    const resolved = resolveLearningItemMedia(item);

    expect(resolved.needsContentLabel).toBe(true);
    expect(resolved.missingRoles).toContain("mouth_video");
    expect(getContentStatusLabel(item)).toBe("Cần bổ sung");
  });

  it("allows text-only active items into Auto Play with missing-content labels", () => {
    const item = makeItem([]);

    const resolved = resolveLearningItemMedia(item);

    expect(resolved.isPlayableInAutoPlay).toBe(true);
    expect(resolved.needsContentLabel).toBe(true);
  });
});

function makeItem(media: LearningItemMedia[]): LearningItem {
  return {
    id: "item-test",
    title: "mẹ",
    categoryId: "cat-family",
    categoryName: "Gia đình",
    status: "active",
    learningStatus: "new",
    note: null,
    media
  };
}

function makeMedia(role: MediaRole, source: MediaSource, priority: number): LearningItemMedia {
  return {
    id: `${role}-${source}`,
    learningItemId: "item-test",
    mediaAssetId: `asset-${role}-${source}`,
    role,
    priority,
    isActive: true,
    asset: {
      id: `asset-${role}-${source}`,
      type: role === "mouth_video" ? "video" : role === "pronunciation_audio" ? "audio" : "image",
      source,
      uri: `test://${role}/${source}`,
      thumbnailAssetId: null,
      thumbnailUri: null,
      durationMs: null,
      sizeBytes: null,
      mimeType: null,
      status: "active"
    }
  };
}
