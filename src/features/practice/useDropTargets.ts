import { useEffect, useRef, type ComponentRef } from "react";
import type { View } from "react-native";

/** Resolve release coordinates only while this board is mounted and active. */
export function useDropTargets(blocked: boolean, accept: (id: string, target: string) => boolean) {
  const targets = useRef<Record<string, ComponentRef<typeof View> | null>>({});
  const alive = useRef(true);
  const current = useRef({ blocked, accept });
  current.current = { blocked, accept };
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function drop(id: string, x: number, y: number): Promise<boolean> {
    if (!alive.current || current.current.blocked) return false;
    for (const [target, view] of Object.entries(targets.current)) {
      if (!view) continue;
      const bounds = await new Promise<{ x: number; y: number; w: number; h: number }>((resolve) =>
        view.measureInWindow((x, y, w, h) => resolve({ x, y, w, h }))
      );
      if (!alive.current || current.current.blocked) return false;
      if (x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h)
        return current.current.accept(id, target);
    }
    return false;
  }
  function assist(id: string, target: string) {
    return alive.current && !current.current.blocked && current.current.accept(id, target);
  }
  return { targets, drop, assist };
}
