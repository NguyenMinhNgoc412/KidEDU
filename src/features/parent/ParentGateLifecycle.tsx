import { useEffect } from "react";
import { AppState } from "react-native";

import { useParentGateStore } from "./parentGate";

/** Background always ends parent access; auth remains independent. */
export function ParentGateLifecycle() {
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") useParentGateStore.getState().lock();
    });
    return () => listener.remove();
  }, []);
  return null;
}
