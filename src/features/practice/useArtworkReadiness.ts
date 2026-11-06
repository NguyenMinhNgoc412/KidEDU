import { useEffect, useRef, useState } from "react";

export const artworkLoadTimeoutMs = 8000;
/** A failed or late decode stays on a static fallback until an explicit remount/retry. */
export function useArtworkReadiness(paused: boolean, onFailure?: () => void) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const callback = useRef(onFailure);
  callback.current = onFailure;
  const alive = useRef(true),
    reported = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (paused || status !== "loading") return;
    const timer = setTimeout(() => setStatus("error"), artworkLoadTimeoutMs);
    return () => clearTimeout(timer);
  }, [paused, status]);
  useEffect(() => {
    if (status === "error" && !reported.current) {
      reported.current = true;
      callback.current?.();
    }
  }, [status]);
  return {
    ready: status === "ready",
    failed: status === "error",
    onLoad: () => {
      if (alive.current) setStatus((previous) => (previous === "error" ? previous : "ready"));
    },
    onError: () => {
      if (alive.current) setStatus("error");
    }
  };
}
