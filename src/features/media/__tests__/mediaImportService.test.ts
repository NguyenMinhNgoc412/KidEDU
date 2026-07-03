import type { ImagePickerAsset } from "expo-image-picker";

import { getMediaTypeForRole, validatePickedMediaAsset } from "../mediaImportValidation";

function makeAsset(overrides: Partial<ImagePickerAsset>): ImagePickerAsset {
  return {
    height: 720,
    type: "image",
    uri: "file:///tmp/media.jpg",
    width: 960,
    ...overrides
  };
}

describe("mediaImportService", () => {
  it("maps illustration gifs as animated images", () => {
    expect(getMediaTypeForRole("illustration", makeAsset({ mimeType: "image/gif" }))).toBe("animated_image");
  });

  it("rejects base64 payloads", () => {
    expect(() => validatePickedMediaAsset(makeAsset({ base64: "abc" }), "illustration")).toThrow("base64");
  });

  it("rejects overlong mouth videos", () => {
    const video = makeAsset({
      duration: 16_000,
      mimeType: "video/mp4",
      type: "video",
      uri: "file:///tmp/mouth.mp4"
    });

    expect(() => validatePickedMediaAsset(video, "mouth_video")).toThrow("15 giây");
  });

  it("rejects videos for illustration role", () => {
    const video = makeAsset({
      mimeType: "video/mp4",
      type: "video",
      uri: "file:///tmp/mouth.mp4"
    });

    expect(() => validatePickedMediaAsset(video, "illustration")).toThrow("ảnh minh họa");
  });
});
