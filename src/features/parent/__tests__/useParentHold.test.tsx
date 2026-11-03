import { act, renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";

import { useParentHold } from "../useParentHold";

jest.mock("react-native-web/dist/exports/AppState", () => ({
  __esModule: true,
  default: { currentState: "active", addEventListener: jest.fn(() => ({ remove: jest.fn() })) }
}));
beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(AppState.addEventListener).mockImplementation(() => ({ remove: jest.fn() }));
});
afterEach(() => jest.useRealTimers());

test("short press or interrupted hold cannot open the parent zone", async () => {
  let change: ((state: string) => void) | undefined;
  const listener = jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event, callback) => {
      change = callback as (state: string) => void;
      return { remove: jest.fn() };
    });
  const complete = jest.fn();
  const view = await renderHook(() => useParentHold(complete));
  await act(() => view.result.current.begin());
  await act(() => {
    jest.advanceTimersByTime(1400);
    view.result.current.end();
  });
  await act(() => jest.advanceTimersByTime(2000));
  expect(complete).not.toHaveBeenCalled();
  await act(() => view.result.current.begin());
  await act(() => change?.("background"));
  await act(() => jest.advanceTimersByTime(2000));
  expect(complete).not.toHaveBeenCalled();
  await view.unmount();
  listener.mockRestore();
});

test("continuous press opens once and unmount cancels another pending hold", async () => {
  const complete = jest.fn();
  const view = await renderHook(() => useParentHold(complete));
  await act(() => view.result.current.begin());
  await act(() => jest.advanceTimersByTime(1500));
  expect(complete).toHaveBeenCalledTimes(1);
  await act(() => view.result.current.begin());
  await view.unmount();
  await act(() => jest.advanceTimersByTime(2000));
  expect(complete).toHaveBeenCalledTimes(1);
});
