import { fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { DailyGamesHubScreen } from "../DailyGamesHubScreen";
import { useParentGateStore } from "@/features/parent/parentGate";

const mockPush = jest.fn();
let mockLocal = true;
const mockHub = {
  localTestAccess: false,
  restartingTest: false,
  restartTestError: false,
  restartTest: jest.fn().mockResolvedValue(true),
  loading: false,
  error: false,
  childId: "child-a",
  status: { state: "available", contentReady: false, canStart: false },
  refresh: jest.fn()
};
jest.mock("../useDailyGameHub", () => ({ useDailyGameHub: () => mockHub }));
jest.mock("@/features/lessonRuntime/fixtureBoundary", () => ({
  localFixtureEnabled: () => mockLocal
}));
jest.mock("@/components/ChildTabBar", () => ({ ChildTabBar: () => null }));
jest.mock("@/components/Screen", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Screen: ({ children }: { children: ReactNode }) => React.createElement(View, null, children)
  };
});
jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return {
    useRouter: () => ({ push: mockPush, replace: jest.fn() }),
    useFocusEffect: (effect: () => void) => React.useEffect(effect, [effect])
  };
});
beforeEach(() => {
  mockHub.localTestAccess = false;
  mockLocal = true;
  mockHub.error = false;
  mockHub.status = { state: "available", contentReady: false, canStart: false };
  mockPush.mockReset();
  useParentGateStore.getState().lock();
});

it("only lets the local full fixture open a new completed run", async () => {
  mockHub.status.state = "completed";
  const screen = await render(<DailyGamesHubScreen />);
  expect(screen.getByRole("button", { name: "Vào chơi" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Chơi phiên thử mới" })).toBeNull();
  mockHub.localTestAccess = true;
  await screen.rerender(<DailyGamesHubScreen />);
  expect(screen.queryByRole("button", { name: "Vào chơi" })).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Chơi phiên thử mới" }));
  expect(mockHub.restartTest).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/daily-game");
});
afterEach(() => useParentGateStore.getState().lock());

it("offers one enabled local play entry and locks the gate before opening it", async () => {
  useParentGateStore.getState().unlock();
  const screen = await render(<DailyGamesHubScreen />);
  expect(screen.queryByRole("button", { name: "Vào chơi" })).toBeNull();
  const entry = screen.getByRole("button", { name: "Vào chơi thử" });
  expect(entry).toBeEnabled();
  await fireEvent.press(entry);
  expect(useParentGateStore.getState().isUnlocked).toBe(false);
  expect(mockPush).toHaveBeenCalledWith("/parent-gate?destination=game-preview");
});
it("keeps local preview usable when daily status is unavailable", async () => {
  mockHub.error = true;
  const screen = await render(<DailyGamesHubScreen />);
  expect(screen.getByRole("button", { name: "Vào chơi thử" })).toBeEnabled();
});
it("does not enable the production play button or expose the local fixture outside its boundary", async () => {
  mockLocal = false;
  const screen = await render(<DailyGamesHubScreen />);
  expect(screen.queryByRole("button", { name: "Vào chơi thử" })).toBeNull();
  expect(screen.getByRole("button", { name: "Vào chơi" })).toBeDisabled();
});
it("opens the durable daily route when the local server has prepared content", async () => {
  mockHub.status.canStart = true;
  const screen = await render(<DailyGamesHubScreen />);
  await fireEvent.press(screen.getByRole("button", { name: "Vào chơi" }));
  expect(mockPush).toHaveBeenCalledWith("/daily-game");
  expect(screen.queryByRole("button", { name: "Vào chơi thử" })).toBeNull();
});
it("keeps the completed day accessible for receipt recovery", async () => {
  mockHub.status.state = "completed";
  const screen = await render(<DailyGamesHubScreen />);
  expect(screen.getByRole("button", { name: "Vào chơi" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Xem quà hôm nay" }));
  expect(mockPush).toHaveBeenCalledWith("/daily-reward");
});
