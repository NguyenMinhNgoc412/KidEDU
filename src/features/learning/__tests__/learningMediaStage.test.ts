import {
  getLearningVisualPlaceholderLabel,
  missingVisualMediaLabel,
  resolveLearningMediaStageRole
} from "../learningMediaStage";

describe("resolveLearningMediaStageRole", () => {
  it("shows the illustration stage while pronunciation audio is selected", () => {
    expect(
      resolveLearningMediaStageRole({
        activeRole: "pronunciation_audio",
        hasRenderableIllustration: true,
        hasPlayableVideo: true
      })
    ).toBe("illustration");
  });

  it("keeps the mouth video stage while mouth video is selected", () => {
    expect(
      resolveLearningMediaStageRole({
        activeRole: "mouth_video",
        hasRenderableIllustration: true,
        hasPlayableVideo: true
      })
    ).toBe("mouth_video");
  });

  it("falls back to mouth video only when no renderable illustration is available", () => {
    expect(
      resolveLearningMediaStageRole({
        activeRole: "illustration",
        hasRenderableIllustration: false,
        hasPlayableVideo: true
      })
    ).toBe("mouth_video");
  });

  it("shows the missing visual placeholder only when both image and video are unavailable", () => {
    expect(
      getLearningVisualPlaceholderLabel({
        hasRenderableIllustration: false,
        hasPlayableVideo: false
      })
    ).toBe(missingVisualMediaLabel);

    expect(
      getLearningVisualPlaceholderLabel({
        hasRenderableIllustration: true,
        hasPlayableVideo: false
      })
    ).toBeUndefined();

    expect(
      getLearningVisualPlaceholderLabel({
        hasRenderableIllustration: false,
        hasPlayableVideo: true
      })
    ).toBeUndefined();
  });
});
