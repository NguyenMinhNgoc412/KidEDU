import { act, renderHook } from "@testing-library/react-native";

import {
  mediaStallTimeoutMs,
  mediaStartTimeoutMs,
  usePlaybackProgressFailSafe
} from "../learningSampleFailSafe";

interface FailSafeProps {
  attemptKey: number | null;
  paused: boolean;
  playing: boolean;
  progressSeconds: number;
}

describe("learning sample progress fail-safe", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("times out a playback attempt that never starts", async () => {
    const onTimeout = jest.fn();
    await renderHook(
      (props: FailSafeProps) =>
        usePlaybackProgressFailSafe({
          ...props,
          onTimeout
        }),
      {
        initialProps: {
          attemptKey: 1,
          paused: false,
          playing: false,
          progressSeconds: 0
        }
      }
    );

    await advanceTimers(mediaStartTimeoutMs - 1);
    expect(onTimeout).not.toHaveBeenCalled();

    await advanceTimers(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("allows playback to run for any duration while progress keeps advancing", async () => {
    const onPlaybackStarted = jest.fn();
    const onTimeout = jest.fn();
    const { rerender } = await renderHook(
      (props: FailSafeProps) =>
        usePlaybackProgressFailSafe({
          ...props,
          onPlaybackStarted,
          onTimeout
        }),
      {
        initialProps: {
          attemptKey: 1,
          paused: false,
          playing: false,
          progressSeconds: 0
        }
      }
    );

    await rerender({
      attemptKey: 1,
      paused: false,
      playing: true,
      progressSeconds: 0
    });
    expect(onPlaybackStarted).toHaveBeenCalledTimes(1);

    for (let progressSeconds = 1; progressSeconds <= 4; progressSeconds += 1) {
      await advanceTimers(mediaStallTimeoutMs - 1_000);
      await rerender({
        attemptKey: 1,
        paused: false,
        playing: true,
        progressSeconds
      });
      expect(onTimeout).not.toHaveBeenCalled();
    }

    await advanceTimers(mediaStallTimeoutMs - 1);
    expect(onTimeout).not.toHaveBeenCalled();

    await advanceTimers(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("cancels stale timers when paused or when the attempt changes", async () => {
    const onTimeout = jest.fn();
    const { rerender } = await renderHook(
      (props: FailSafeProps) =>
        usePlaybackProgressFailSafe({
          ...props,
          onTimeout
        }),
      {
        initialProps: {
          attemptKey: 1,
          paused: false,
          playing: false,
          progressSeconds: 0
        }
      }
    );

    await advanceTimers(mediaStartTimeoutMs - 1_000);
    await rerender({
      attemptKey: 1,
      paused: true,
      playing: false,
      progressSeconds: 0
    });
    await advanceTimers(mediaStartTimeoutMs);
    expect(onTimeout).not.toHaveBeenCalled();

    await rerender({
      attemptKey: 2,
      paused: false,
      playing: false,
      progressSeconds: 0
    });
    await advanceTimers(mediaStartTimeoutMs - 1);
    expect(onTimeout).not.toHaveBeenCalled();

    await advanceTimers(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});

async function advanceTimers(durationMs: number): Promise<void> {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(durationMs);
  });
}
