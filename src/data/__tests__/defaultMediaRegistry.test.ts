import {
  bundledDefaultMedia,
  createBundledDefaultMediaUri,
  isBundledDefaultMediaUri,
  type BundledDefaultMediaDefinition,
  validateBundledDefaultMediaDefinitions
} from "@/data/defaultMediaRegistry";
import { seedLearningItems } from "@/data/seedData";

describe("defaultMediaRegistry", () => {
  it("keeps the production registry structurally valid", () => {
    expect(validateBundledDefaultMediaDefinitions(bundledDefaultMedia)).toEqual([]);
  });

  it("bundles an illustration for every seed item and mouth videos for ba and mẹ", () => {
    const illustrationItemIds = bundledDefaultMedia
      .filter(({ role }) => role === "illustration")
      .map(({ itemId }) => itemId)
      .sort();

    expect(illustrationItemIds).toEqual(seedLearningItems.map(({ id }) => id).sort());
    expect(
      bundledDefaultMedia
        .filter(({ role }) => role === "mouth_video")
        .map(({ itemId, durationMs, videoMetadata }) => ({ itemId, durationMs, videoMetadata }))
    ).toEqual([
      {
        itemId: "item-ba",
        durationMs: 10_006,
        videoMetadata: { codec: "h264", width: 1280, height: 720 }
      },
      {
        itemId: "item-me",
        durationMs: 10_006,
        videoMetadata: { codec: "h264", width: 1280, height: 720 }
      }
    ]);
  });

  it("creates an encoded logical URI for bundled assets", () => {
    const uri = createBundledDefaultMediaUri("item-mẹ/mouth video v1");

    expect(uri).toBe("bundle://default/item-m%E1%BA%B9%2Fmouth%20video%20v1");
    expect(isBundledDefaultMediaUri(uri)).toBe(true);
    expect(isBundledDefaultMediaUri("file:///media/video.mp4")).toBe(false);
  });

  it("accepts one correctly typed asset for an item role", () => {
    expect(validateBundledDefaultMediaDefinitions([makeDefinition()])).toEqual([]);
  });

  it("accepts a lightweight animated illustration", () => {
    expect(
      validateBundledDefaultMediaDefinitions([
        makeDefinition({
          role: "illustration",
          type: "animated_image",
          asset: {
            key: "item-me-illustration-v1",
            module: 1,
            mimeType: "image/webp"
          }
        })
      ])
    ).toEqual([]);
  });

  it("reports duplicate roles, duplicate keys and invalid media types", () => {
    const duplicate = makeDefinition({ type: "audio" });

    const errors = validateBundledDefaultMediaDefinitions([makeDefinition(), duplicate]);

    expect(errors).toContain("Duplicate default media role: item-me:mouth_video");
    expect(errors).toContain(
      "Default media item-me:mouth_video must use type video, received audio"
    );
    expect(errors).toContain("Duplicate default media asset key: item-me-mouth-video-v1");
  });

  it("requires image thumbnails", () => {
    const errors = validateBundledDefaultMediaDefinitions([
      makeDefinition({
        thumbnail: {
          key: "item-me-mouth-video-thumbnail-v1",
          module: 2,
          mimeType: "video/mp4"
        }
      })
    ]);

    expect(errors).toContain(
      "Default media thumbnail item-me-mouth-video-thumbnail-v1 must be an image"
    );
  });

  it("requires versioned local assets and rejects cloud URLs", () => {
    const errors = validateBundledDefaultMediaDefinitions([
      makeDefinition({
        asset: {
          key: "mouth-video",
          module: "https://cdn.example.com/mouth.mp4",
          mimeType: "video/mp4"
        }
      })
    ]);

    expect(errors).toContain("Default media asset key mouth-video must start with item-me-");
    expect(errors).toContain(
      "Default media asset key mouth-video must end with a revision such as -v1"
    );
    expect(errors).toContain("Default media asset mouth-video must be bundled, not a remote URL");
  });

  it("requires complete HD H.264 metadata for bundled mouth videos", () => {
    const errors = validateBundledDefaultMediaDefinitions([
      makeDefinition({
        durationMs: 0,
        sizeBytes: undefined,
        thumbnail: undefined,
        videoMetadata: {
          codec: "h264",
          height: 480,
          width: 640
        }
      })
    ]);

    expect(errors).toContain("Default media item-me:mouth_video requires a bundled thumbnail");
    expect(errors).toContain(
      "Default media item-me:mouth_video durationMs must be between 1 and 15000"
    );
    expect(errors).toContain(
      "Default media item-me:mouth_video sizeBytes must be between 1 and 83886080"
    );
    expect(errors).toContain(
      "Default media item-me:mouth_video resolution must be at least 1280 × 720"
    );
  });
});

function makeDefinition(
  overrides: Partial<BundledDefaultMediaDefinition> = {}
): BundledDefaultMediaDefinition {
  return {
    itemId: "item-me",
    role: "mouth_video",
    type: "video",
    asset: {
      key: "item-me-mouth-video-v1",
      module: 1,
      mimeType: "video/mp4"
    },
    durationMs: 2_400,
    sizeBytes: 1_200_000,
    thumbnail: {
      key: "item-me-mouth-video-thumbnail-v1",
      module: 2,
      mimeType: "image/jpeg"
    },
    videoMetadata: {
      codec: "h264",
      height: 720,
      width: 1280
    },
    ...overrides
  };
}
