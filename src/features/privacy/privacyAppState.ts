import { AppState, type AppStateStatus } from "react-native";

interface PrivacyAppStateAdapter {
  currentState: AppStateStatus | null;
  addEventListener(type: "change", listener: (state: AppStateStatus) => void): { remove(): void };
}

/** Refreshes privacy state after returning from the operating-system settings app. */
export function subscribeToAppResume(
  onResume: () => void,
  adapter: PrivacyAppStateAdapter = AppState
): () => void {
  let previousState = adapter.currentState;
  const subscription = adapter.addEventListener("change", (nextState) => {
    const wasAway = previousState === "inactive" || previousState === "background";
    previousState = nextState;

    if (wasAway && nextState === "active") {
      onResume();
    }
  });

  return () => subscription.remove();
}
