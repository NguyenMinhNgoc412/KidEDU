import { useCallback, useEffect, useRef } from "react";
export const listenFeedbackMs = 900;
/** Delay presentation, never the durable checkpoint. Cancel resolves pending work. */
export function useFeedbackWindow() {
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; resolve(): void } | null>(null);
  const cancel = useCallback(() => {
    if (pending.current) {
      clearTimeout(pending.current.timer);
      pending.current.resolve();
      pending.current = null;
    }
  }, []);
  const wait = useCallback(() => {
    cancel();
    return new Promise<void>((resolve) => {
      pending.current = {
        timer: setTimeout(() => {
          pending.current = null;
          resolve();
        }, listenFeedbackMs),
        resolve
      };
    });
  }, [cancel]);
  useEffect(() => cancel, [cancel]);
  return { wait, cancel };
}
