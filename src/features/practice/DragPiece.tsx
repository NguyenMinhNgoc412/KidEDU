import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode
} from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  type View,
  type ViewStyle
} from "react-native";
import { gameSizes } from "@/theme";
import { useScreenScrollLock } from "@/components/ScreenScrollLock";

// Browser pan arbitration must be set before touchstart, not after React renders a lock.
const webDragStyle: (ViewStyle & { touchAction: "none" }) | undefined =
  Platform.OS === "web" ? { touchAction: "none" } : undefined;

/** Pointer/touch always drags. Assistive activation is a separate accessibility action. */
export function DragPiece({
  id,
  label,
  disabled,
  onDrop,
  onAssist,
  children,
  testID
}: {
  id: string;
  label: string;
  disabled: boolean;
  onDrop(id: string, x: number, y: number): Promise<boolean>;
  onAssist?(): void;
  children: ReactNode;
  testID?: string;
}) {
  const position = useRef(new Animated.ValueXY()).current;
  const source = useRef<ComponentRef<typeof View> | null>(null);
  const gestureRevision = useRef(0);
  const geometryReady = useRef(false);
  const dragDelta = useRef({ x: 0, y: 0 });
  const measurePending = useRef<Promise<{ x: number; y: number } | null>>(Promise.resolve(null));
  const cancelMeasurement = useRef<() => void>(() => {});
  const [dragging, setDragging] = useState(false);
  const [reduced, setReduced] = useState(true);
  const current = useRef({ disabled, onDrop, reduced });
  current.current = { disabled, onDrop, reduced };
  const alive = useRef(true);
  const acquireScrollLock = useScreenScrollLock();
  const releaseScroll = useRef<(() => void) | null>(null);
  const unlockScroll = useCallback(() => {
    releaseScroll.current?.();
    releaseScroll.current = null;
  }, []);
  useEffect(() => {
    alive.current = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (alive.current) setReduced(value);
      },
      () => {}
    );
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      alive.current = false;
      gestureRevision.current++;
      cancelMeasurement.current();
      releaseScroll.current?.();
      releaseScroll.current = null;
      position.stopAnimation();
      motion.remove();
    };
  }, [position]);
  useEffect(() => {
    if (disabled) {
      gestureRevision.current++;
      cancelMeasurement.current();
      unlockScroll();
      position.stopAnimation();
      position.setValue({ x: 0, y: 0 });
      setDragging(false);
    }
  }, [disabled, position, unlockScroll]);
  const handlers = useMemo(() => {
    function returnHome() {
      gestureRevision.current++;
      cancelMeasurement.current();
      unlockScroll();
      if (!alive.current) return;
      setDragging(false);
      if (current.current.reduced) position.setValue({ x: 0, y: 0 });
      else
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          speed: 24,
          bounciness: 0,
          useNativeDriver: Platform.OS !== "web"
        }).start();
    }
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !current.current.disabled,
      onStartShouldSetPanResponderCapture: () => !current.current.disabled,
      onMoveShouldSetPanResponder: () => !current.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        if (current.current.disabled) return;
        releaseScroll.current ??= acquireScrollLock();
        position.stopAnimation();
        position.setValue({ x: 0, y: 0 });
        const revision = ++gestureRevision.current;
        cancelMeasurement.current();
        geometryReady.current = false;
        dragDelta.current = { x: 0, y: 0 };
        measurePending.current = new Promise((resolve) => {
          let settled = false;
          const finish = (origin: { x: number; y: number } | null) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (alive.current && revision === gestureRevision.current) {
              geometryReady.current = true;
              position.setValue(dragDelta.current);
            }
            resolve(origin);
          };
          cancelMeasurement.current = () => finish(null);
          const timer = setTimeout(() => finish(null), 120);
          if (!source.current) return finish(null);
          source.current.measureInWindow((x, y, width, height) => {
            const valid = width > 0 && height > 0 && [x, y, width, height].every(Number.isFinite);
            finish(valid ? { x: x + width / 2, y: y + height / 2 } : null);
          });
        });
        setDragging(true);
      },
      onPanResponderMove: (_event, gesture) => {
        if (!current.current.disabled) {
          dragDelta.current = { x: gesture.dx, y: gesture.dy };
          if (geometryReady.current) position.setValue(dragDelta.current);
        }
      },
      onPanResponderRelease: (event, gesture) => {
        if (current.current.disabled || Math.abs(gesture.dx) + Math.abs(gesture.dy) < 8)
          return returnHome();
        const releaseRevision = gestureRevision.current;
        const delta = { x: gesture.dx, y: gesture.dy };
        const pointer = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
        dragDelta.current = delta;
        void measurePending.current
          .then((origin) => {
            if (
              !alive.current ||
              current.current.disabled ||
              releaseRevision !== gestureRevision.current
            )
              return false;
            const x = origin ? origin.x + delta.x : pointer.x;
            const y = origin ? origin.y + delta.y : pointer.y;
            if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
            return current.current.onDrop(id, x, y);
          })
          .then(
            (accepted) => {
              if (!alive.current || releaseRevision !== gestureRevision.current) return;
              if (accepted) {
                unlockScroll();
                position.setValue({ x: 0, y: 0 });
                setDragging(false);
              } else returnHome();
            },
            () => {
              if (alive.current && releaseRevision === gestureRevision.current) returnHome();
            }
          );
      },
      onPanResponderTerminate: () => {
        gestureRevision.current++;
        returnHome();
      }
    }).panHandlers;
  }, [id, position, acquireScrollLock, unlockScroll]);
  return (
    <Animated.View
      ref={source}
      collapsable={false}
      {...handlers}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Kéo ${label}`}
      accessibilityState={{ disabled }}
      accessibilityHint="Kéo vào ô phù hợp. Trình đọc màn hình có thể kích hoạt để chọn nguồn."
      accessibilityActions={onAssist ? [{ name: "activate", label: "Chọn hình để di chuyển" }] : []}
      onAccessibilityAction={(event) => {
        if (!disabled && event.nativeEvent.actionName === "activate") onAssist?.();
      }}
      testID={testID ?? `drag-${id}`}
      style={[
        styles.source,
        webDragStyle,
        {
          transform: position.getTranslateTransform(),
          zIndex: dragging ? 100 : 0,
          elevation: dragging ? 8 : 0
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  source: {
    minWidth: gameSizes.minimumControl,
    minHeight: gameSizes.minimumControl,
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none"
  }
});
