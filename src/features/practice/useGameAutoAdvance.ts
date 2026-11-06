import { useEffect, useRef } from "react";

/** Leave a short, finite feedback window. Pause/unmount cancels the handoff. */
export function useGameAutoAdvance(
  ready: boolean,
  paused: boolean,
  advance: () => void,
  delayMs = 900,
  identity: string | number = ""
) {
  const callback = useRef(advance);
  callback.current = advance;
  useEffect(() => {
    if (!ready || paused) return;
    const timer = setTimeout(() => callback.current(), delayMs);
    return () => clearTimeout(timer);
  }, [ready, paused, delayMs, identity]);
}
