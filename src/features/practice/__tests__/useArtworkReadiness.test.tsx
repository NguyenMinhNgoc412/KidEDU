import { act, renderHook } from "@testing-library/react-native";
import { artworkLoadTimeoutMs, useArtworkReadiness } from "../useArtworkReadiness";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test("timeout presents a static fallback once; late image load cannot silently restart playback", async () => {
  const report = jest.fn();
  const hook = await renderHook(() => useArtworkReadiness(false, report));
  await act(async () => {
    jest.advanceTimersByTime(artworkLoadTimeoutMs);
  });
  expect(hook.result.current.failed).toBe(true);
  expect(report).toHaveBeenCalledTimes(1);
  await act(async () => hook.result.current.onLoad());
  expect(hook.result.current.failed).toBe(true);
  expect(hook.result.current.ready).toBe(false);
  await hook.unmount();
});
test("pause and unmount cancel timeout; explicit fresh attempt can load successfully", async () => {
  const report = jest.fn();
  const paused = await renderHook(() => useArtworkReadiness(true, report));
  await act(async () => {
    jest.advanceTimersByTime(artworkLoadTimeoutMs * 2);
  });
  expect(paused.result.current.failed).toBe(false);
  await paused.unmount();
  const loaded = await renderHook(() => useArtworkReadiness(false, report));
  await act(async () => loaded.result.current.onLoad());
  await act(async () => {
    jest.advanceTimersByTime(artworkLoadTimeoutMs);
  });
  expect(loaded.result.current.ready).toBe(true);
  expect(report).not.toHaveBeenCalled();
  await loaded.unmount();
  const failed = await renderHook(() => useArtworkReadiness(false, report));
  await act(async () => failed.result.current.onError());
  expect(failed.result.current.failed).toBe(true);
  expect(report).toHaveBeenCalledTimes(1);
  await failed.unmount();
});
