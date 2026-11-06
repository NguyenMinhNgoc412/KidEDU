import { act, renderHook } from "@testing-library/react-native";
import { useGameAutoAdvance } from "../useGameAutoAdvance";
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test("a solved game advances once after feedback; rerenders do not duplicate it", async () => {
  const advance = jest.fn();
  const hook = await renderHook(() => useGameAutoAdvance(true, false, advance));
  await act(async () => {
    jest.advanceTimersByTime(899);
  });
  expect(advance).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(advance).toHaveBeenCalledTimes(1);
  await hook.rerender(undefined);
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(advance).toHaveBeenCalledTimes(1);
  await hook.unmount();
});
test("pause cancels handoff, resume restarts feedback, unmount cancels it", async () => {
  const advance = jest.fn();
  let paused = false;
  const hook = await renderHook(() => useGameAutoAdvance(true, paused, advance));
  await act(async () => {
    jest.advanceTimersByTime(400);
  });
  paused = true;
  await hook.rerender(undefined);
  await act(async () => {
    jest.advanceTimersByTime(2000);
  });
  expect(advance).not.toHaveBeenCalled();
  paused = false;
  await hook.rerender(undefined);
  await act(async () => {
    jest.advanceTimersByTime(900);
  });
  expect(advance).toHaveBeenCalledTimes(1);
  await hook.unmount();
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(advance).toHaveBeenCalledTimes(1);
});
