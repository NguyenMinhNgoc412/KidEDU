import { act, render } from "@testing-library/react-native";
import { AppState, BackHandler, type AppStateStatus } from "react-native";
import { useRewardReturn } from "../useRewardReturn";
import { useGameNavigationLock } from "../useGameNavigationLock";
const mockRouter = { replace: jest.fn() };
const previousAppState = AppState.currentState;
jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return {
    useRouter: () => mockRouter,
    useFocusEffect: (effect: () => void) => React.useEffect(effect, [effect])
  };
});
function Harness({ receipt }: { receipt?: string }) {
  useRewardReturn(receipt);
  return null;
}
beforeEach(() => {
  AppState.currentState = "active";
  jest.useFakeTimers();
  mockRouter.replace.mockReset();
});
afterEach(() => {
  AppState.currentState = previousAppState;
  jest.useRealTimers();
  jest.restoreAllMocks();
});
it("returns to games only after revealing a confirmed receipt, without a confirmation button", async () => {
  const screen = await render(<Harness />);
  await act(async () => jest.advanceTimersByTime(10000));
  expect(mockRouter.replace).not.toHaveBeenCalled();
  await screen.rerender(<Harness receipt="confirmed" />);
  await act(async () => jest.advanceTimersByTime(2399));
  expect(mockRouter.replace).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1));
  expect(mockRouter.replace).toHaveBeenCalledWith("/games");
});
it("cancels automatic return in the background and gives the reveal time again on foreground", async () => {
  let listener!: (value: AppStateStatus) => void;
  jest.spyOn(AppState, "addEventListener").mockImplementation((_event, callback) => {
    listener = callback;
    return { remove: jest.fn() };
  });
  const screen = await render(<Harness receipt="confirmed" />);
  await act(async () => {
    jest.advanceTimersByTime(1000);
    listener("background");
    jest.advanceTimersByTime(10000);
  });
  expect(mockRouter.replace).not.toHaveBeenCalled();
  await act(async () => {
    listener("active");
    jest.advanceTimersByTime(2400);
  });
  expect(mockRouter.replace).toHaveBeenCalledTimes(1);
  await screen.unmount();
});
it("consumes Android back/edge-back while focused and removes the listener on exit", async () => {
  let back!: Parameters<typeof BackHandler.addEventListener>[1];
  const remove = jest.fn();
  jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, callback) => {
    back = callback;
    return { remove };
  });
  function Locked() {
    useGameNavigationLock();
    return null;
  }
  const screen = await render(<Locked />);
  expect(back({} as Parameters<typeof back>[0])).toBe(true);
  await screen.unmount();
  expect(remove).toHaveBeenCalled();
});
