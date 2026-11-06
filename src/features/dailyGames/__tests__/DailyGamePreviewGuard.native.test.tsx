import { render } from "@testing-library/react-native";
import { DailyGamePreviewScreen } from "../DailyGamePreviewScreen";
import { useParentGateStore } from "@/features/parent/parentGate";

let mockFixtureEnabled = false;
jest.mock("@/features/lessonRuntime/fixtureBoundary", () => ({
  localFixtureEnabled: () => mockFixtureEnabled
}));
jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    useRouter: () => ({ replace: jest.fn() }),
    useFocusEffect: (effect: () => void) => React.useEffect(effect, [effect]),
    Redirect: ({ href }: { href: string }) =>
      React.createElement(View, { testID: "redirect", accessibilityLabel: href })
  };
});

afterEach(() => useParentGateStore.getState().lock());

it("rejects the preview outside the local-fixture boundary even with an unlocked parent gate", async () => {
  mockFixtureEnabled = false;
  useParentGateStore.getState().unlock();
  const screen = await render(<DailyGamePreviewScreen />);
  expect(screen.getByTestId("redirect").props.accessibilityLabel).toBe("/games");
  expect(screen.queryByText("Bản thử ba trò chơi")).toBeNull();
});

it("requires the parent gate before rendering a local preview", async () => {
  mockFixtureEnabled = true;
  useParentGateStore.getState().lock();
  const screen = await render(<DailyGamePreviewScreen />);
  expect(screen.getByTestId("redirect").props.accessibilityLabel).toBe(
    "/parent-gate?destination=game-preview"
  );
  expect(screen.queryByText("Bản thử ba trò chơi")).toBeNull();
});
