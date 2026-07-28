import {
  configureMouthVideoPlayer,
  hasMouthVideoReachedEnd,
  learningAudioPlayerOptions,
  learningVideoProgressUpdateIntervalSeconds,
  MouthVideoPlaybackAttempts,
  replayMouthVideoFromStart,
  type MouthVideoPlaybackPlayer
} from "../mouthVideoPlayback";

describe("mouthVideoPlayback", () => {
  it("allows only one terminal outcome for each native playback attempt", () => {
    const attempts = new MouthVideoPlaybackAttempts();
    const firstAttempt = attempts.begin();

    expect(attempts.tryStart()).toBe(firstAttempt);
    expect(attempts.tryStart()).toBeNull();
    expect(attempts.markStarted()).toBe(firstAttempt);
    expect(attempts.claimEnd()).toBe(firstAttempt);
    expect(attempts.claimError()).toBeNull();
    expect(attempts.claimEnd()).toBeNull();
  });

  it("cancels stale native outcomes before a fresh playback attempt", () => {
    const attempts = new MouthVideoPlaybackAttempts();
    const cancelledAttempt = attempts.begin();
    attempts.cancel();

    expect(attempts.isActive(cancelledAttempt)).toBe(false);
    expect(attempts.claimEnd()).toBeNull();
    expect(attempts.claimError()).toBeNull();

    const freshAttempt = attempts.begin();
    expect(freshAttempt).toBeGreaterThan(cancelledAttempt);
    expect(attempts.tryStart()).toBe(freshAttempt);
    expect(attempts.markStarted()).toBe(freshAttempt);
    expect(attempts.claimEnd()).toBe(freshAttempt);
  });

  it("does not accept a native end event before playback actually starts", () => {
    const attempts = new MouthVideoPlaybackAttempts();
    const attempt = attempts.begin();

    expect(attempts.tryStart()).toBe(attempt);
    expect(attempts.claimEnd()).toBeNull();
    expect(attempts.claimError()).toBe(attempt);
  });

  it("rejects a late end event while a fresh video is still playing", () => {
    const player = makePlayer();
    player.currentTime = 0.4;
    player.duration = 8;
    player.playing = true;

    expect(hasMouthVideoReachedEnd(player)).toBe(false);

    player.playing = false;
    expect(hasMouthVideoReachedEnd(player)).toBe(false);

    player.currentTime = 8;
    player.playing = true;
    expect(hasMouthVideoReachedEnd(player)).toBe(true);
  });

  it("keeps the iOS audio session active so audio pauses cannot interrupt video", () => {
    expect(learningAudioPlayerOptions).toEqual({
      keepAudioSessionActive: true,
      updateInterval: 500
    });
  });

  it("configures bundled videos for audible foreground playback", () => {
    const player = makePlayer();

    configureMouthVideoPlayer(player);

    expect(player.loop).toBe(false);
    expect(player.staysActiveInBackground).toBe(false);
    expect(player.audioMixingMode).toBe("doNotMix");
    expect(player.muted).toBe(false);
    expect(player.timeUpdateEventInterval).toBe(learningVideoProgressUpdateIntervalSeconds);
    expect(player.volume).toBe(1);
  });

  it("seeks to the beginning and plays without pausing first", () => {
    const player = makePlayer();
    player.currentTime = 4;

    replayMouthVideoFromStart(player);

    expect(player.currentTime).toBe(0);
    expect(player.play).toHaveBeenCalledTimes(1);
    expect(player.replay).not.toHaveBeenCalled();
  });

  it("falls back to replay when direct play is temporarily unavailable", () => {
    const player = makePlayer();
    (player.play as jest.Mock).mockImplementation(() => {
      throw new Error("not ready");
    });

    replayMouthVideoFromStart(player);

    expect(player.replay).toHaveBeenCalledTimes(1);
  });
});

function makePlayer(): MouthVideoPlaybackPlayer {
  return {
    audioMixingMode: "auto",
    currentTime: 0,
    duration: 8,
    loop: true,
    muted: true,
    play: jest.fn(),
    playing: false,
    replay: jest.fn(),
    staysActiveInBackground: true,
    timeUpdateEventInterval: 0,
    volume: 0
  };
}
