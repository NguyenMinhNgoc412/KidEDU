import { cleanupPersonalizedMediaOnUnmount } from "../personalizedMediaLifecycle";

describe("personalized media lifecycle", () => {
  it("cleans screen resources without touching a released native recorder", () => {
    const releasedRecorder = {
      getStatus: jest.fn(() => {
        throw new Error("Recorder native object was already released.");
      }),
      stop: jest.fn()
    };
    const markUnmounted = jest.fn();
    const resetAudioMode = jest.fn(async () => undefined);
    const discardStagedMedia = jest.fn(async () => undefined);

    expect(() =>
      cleanupPersonalizedMediaOnUnmount({
        discardStagedMedia,
        markUnmounted,
        resetAudioMode,
        stagedMedia: ["staged-video", "staged-audio"]
      })
    ).not.toThrow();

    expect(markUnmounted).toHaveBeenCalledTimes(1);
    expect(resetAudioMode).toHaveBeenCalledTimes(1);
    expect(discardStagedMedia).toHaveBeenCalledTimes(2);
    expect(releasedRecorder.getStatus).not.toHaveBeenCalled();
    expect(releasedRecorder.stop).not.toHaveBeenCalled();
  });
});
