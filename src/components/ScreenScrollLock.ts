import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const noopRelease = () => {};
export const ScreenScrollLockContext = createContext<() => () => void>(() => noopRelease);
export const useScreenScrollLock = () => useContext(ScreenScrollLockContext);

/** Each gesture owns a lock; stale/duplicate releases cannot unlock another gesture. */
export function useScreenScrollLockController(onChange: (locked: boolean) => void) {
  const [locked, setLocked] = useState(false);
  const owners = useRef(new Set<symbol>());
  const alive = useRef(true);
  const notify = useRef(onChange);
  notify.current = onChange;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      owners.current.clear();
    };
  }, []);
  const acquire = useCallback(() => {
    if (!alive.current) return noopRelease;
    const owner = Symbol("drag");
    owners.current.add(owner);
    if (owners.current.size === 1) {
      notify.current(true);
      setLocked(true);
    }
    return () => {
      if (!owners.current.delete(owner) || !alive.current || owners.current.size > 0) return;
      notify.current(false);
      setLocked(false);
    };
  }, []);
  return { locked, acquire };
}
