import {
  bundledDefaultMedia,
  createBundledDefaultMediaUri,
  isBundledDefaultMediaUri,
  type BundledDefaultMediaDefinition,
  validateBundledDefaultMediaDefinitions
} from "@/data/defaultMediaRegistry";

describe("defaultMediaRegistry", () => {
  it("keeps the production registry structurally valid", () => {
    expect(validateBundledDefaultMediaDefinitions(bundledDefaultMedia)).toEqual([]);
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
    ...overrides
  };
}
