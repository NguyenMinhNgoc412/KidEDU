import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
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
      releaseScroll.current?.();
      releaseScroll.current = null;
      position.stopAnimation();
      motion.remove();
    };
  }, [position]);
  useEffect(() => {
    if (disabled) {
      unlockScroll();
      position.stopAnimation();
      position.setValue({ x: 0, y: 0 });
      setDragging(false);
    }
  }, [disabled, position, unlockScroll]);
  const handlers = useMemo(() => {
    function returnHome() {
      unlockScroll();
      if (!alive.current) return;
      setDragging(false);
      if (current.current.reduced) position.setValue({ x: 0, y: 0 });
      else
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          speed: 24,
          bounciness: 0,
          useNativeDriver: true
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
        setDragging(true);
      },
      onPanResponderMove: (_event, gesture) => {
        if (!current.current.disabled) position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_event, gesture) => {
        if (current.current.disabled || Math.abs(gesture.dx) + Math.abs(gesture.dy) < 8)
          return returnHome();
        void current.current.onDrop(id, gesture.moveX, gesture.moveY).then((accepted) => {
          if (!alive.current) return;
          if (accepted) {
            unlockScroll();
            position.setValue({ x: 0, y: 0 });
            setDragging(false);
          } else returnHome();
        }, returnHome);
      },
      onPanResponderTerminate: returnHome
    }).panHandlers;
  }, [id, position, acquireScrollLock, unlockScroll]);
  return (
    <Animated.View
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
