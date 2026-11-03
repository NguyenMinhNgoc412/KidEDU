import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { parentGateHoldDurationMs } from "./parentGate";

/** Press-in/out also supports keyboard hold, unlike RN Web's onLongPress. */
export function useParentHold(onComplete: () => void) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  const end = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);
  const begin = useCallback(() => {
    if (timer.current !== null) return;
    if (AppState.currentState && AppState.currentState !== "active") return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      if (!AppState.currentState || AppState.currentState === "active") completeRef.current();
    }, parentGateHoldDurationMs);
  }, []);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") end();
    });
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      listener.remove();
    };
  }, [end]);
  return { holding, begin, end };
}
