import { act, render } from "@testing-library/react-native";
import { AppState } from "react-native";

import { ParentGateLifecycle } from "../ParentGateLifecycle";
import { useParentGateStore } from "../parentGate";

jest.mock("react-native-web/dist/exports/AppState", () => ({
  __esModule: true,
  default: { currentState: "active", addEventListener: jest.fn(() => ({ remove: jest.fn() })) }
}));

test("background locks parent access and foreground does not unlock it", async () => {
  let change: ((state: string) => void) | undefined;
  const remove = jest.fn();
  const listener = jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event, callback) => {
      change = callback as (state: string) => void;
      return { remove };
    });
  const view = await render(<ParentGateLifecycle />);
  await act(() => useParentGateStore.getState().unlock());
  await act(() => change?.("background"));
  expect(useParentGateStore.getState().isUnlocked).toBe(false);
  await act(() => change?.("active"));
  expect(useParentGateStore.getState().isUnlocked).toBe(false);
  await view.unmount();
  expect(remove).toHaveBeenCalled();
  listener.mockRestore();
});
