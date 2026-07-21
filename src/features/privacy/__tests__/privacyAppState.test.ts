jest.mock("react-native", () => ({
  AppState: {
    currentState: "active",
    addEventListener: jest.fn()
  }
}));

jest.mock("react-native-web/dist/exports/AppState", () => ({
  __esModule: true,
  default: {
    currentState: "active",
    addEventListener: jest.fn()
  }
}));

import type { AppStateStatus } from "react-native";

import { subscribeToAppResume } from "../privacyAppState";

describe("privacy app-state refresh", () => {
  it("refreshes only when the app returns active from background or inactive", () => {
    let listener: ((state: AppStateStatus) => void) | null = null;
    const remove = jest.fn();
    const onResume = jest.fn();
    const unsubscribe = subscribeToAppResume(onResume, {
      currentState: "active",
      addEventListener: (_type, nextListener) => {
        listener = nextListener;
        return { remove };
      }
    });

    const emit = (state: AppStateStatus) => {
      const currentListener = listener as ((nextState: AppStateStatus) => void) | null;
      currentListener?.(state);
    };
    emit("background");
    expect(onResume).not.toHaveBeenCalled();

    emit("active");
    expect(onResume).toHaveBeenCalledTimes(1);

    emit("active");
    expect(onResume).toHaveBeenCalledTimes(1);

    emit("inactive");
    emit("active");
    expect(onResume).toHaveBeenCalledTimes(2);

    unsubscribe();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
