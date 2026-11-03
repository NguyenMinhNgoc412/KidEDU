import { act, renderHook } from "@testing-library/react-native";

const mockMotion = jest.fn(async () => false);
let mockMotionListener: ((enabled: boolean) => void) | undefined;
let mockStateListener: ((state: string) => void) | undefined;
jest.mock("react-native-web/dist/exports/AccessibilityInfo", () => ({
  __esModule: true,
  default: {
    isReduceMotionEnabled: () => mockMotion(),
    addEventListener: (_: string, listener: (enabled: boolean) => void) => {
      mockMotionListener = listener;
      return { remove: jest.fn() };
    }
  }
}));
jest.mock("react-native-web/dist/exports/AppState", () => ({
  __esModule: true,
  default: {
    currentState: "active",
    addEventListener: (_: string, listener: (state: string) => void) => {
      mockStateListener = listener;
      return { remove: jest.fn() };
    }
  }
}));

import { useIllustrationPlayback } from "../useIllustrationPlayback";

const animation = {
  itemId: "item-mo",
  label: "Mở",
  source: 1,
  frameCount: 8,
  frameDurationMs: 375,
  staticFrame: 7
};
beforeEach(() => {
  jest.useFakeTimers();
  mockMotion.mockResolvedValue(false);
});
afterEach(() => jest.useRealTimers());

test("shows all eight poses once, then holds the semantic final pose; replay is explicit", async () => {
  const onComplete = jest.fn();
  const view = await renderHook(() =>
    useIllustrationPlayback({ animation, ready: true, paused: false, onComplete })
  );
  expect(view.result.current.playing).toBe(true);
  for (let frame = 1; frame < 8; frame += 1) {
    await act(async () => jest.advanceTimersByTime(375));
    expect(view.result.current.frame).toBe(frame);
  }
  await act(async () => jest.advanceTimersByTime(375));
  expect(view.result.current.playing).toBe(false);
  expect(view.result.current.frame).toBe(7);
  expect(onComplete).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(10000));
  expect(onComplete).toHaveBeenCalledTimes(1);
  await act(async () => view.result.current.replay());
  expect(view.result.current.frame).toBe(0);
  expect(view.result.current.playing).toBe(true);
  await view.unmount();
});

test("Reduce Motion uses a static pose and releases the audio prelude immediately", async () => {
  mockMotion.mockResolvedValue(true);
  const onComplete = jest.fn();
  const view = await renderHook(() =>
    useIllustrationPlayback({ animation, ready: true, paused: false, onComplete })
  );
  expect(view.result.current.playing).toBe(false);
  expect(view.result.current.frame).toBe(7);
  expect(onComplete).toHaveBeenCalledTimes(1);
  await view.unmount();
});

test("background, pause and a live Reduce Motion change stop animation without auto replay", async () => {
  const onComplete = jest.fn();
  const view = await renderHook(
    ({ paused }: { paused: boolean }) =>
      useIllustrationPlayback({ animation, ready: true, paused, onComplete }),
    { initialProps: { paused: false } }
  );
  await act(async () => jest.advanceTimersByTime(375));
  await act(async () => mockStateListener?.("background"));
  expect(view.result.current.playing).toBe(false);
  await act(async () => mockStateListener?.("active"));
  expect(view.result.current.playing).toBe(false);
  await act(async () => view.result.current.replay());
  await act(async () => mockMotionListener?.(true));
  expect(view.result.current.playing).toBe(false);
  await act(async () => mockMotionListener?.(false));
  await act(async () => view.result.current.replay());
  await view.rerender({ paused: true });
  expect(view.result.current.playing).toBe(false);
  await view.unmount();
});
