import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Platform, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { GameControl } from "@/components/GameControl";
import { useLearningSettingsQuery } from "@/data/queries";
import type { PlayPiece } from "@/content/contracts/playPresentation";
import { WordSprite, Check, Star, RotateCcw } from "@/features/practice/WordGameArt";
import { colors, radii } from "@/theme";

import { listenFeedbackMs } from "./useFeedbackWindow";

/** Cosmetic feedback only. The authored action is committed immediately by the caller. */
export function ListenChoices({
  options,
  targetId,
  width,
  size,
  disabled,
  onChoose
}: {
  options: PlayPiece[];
  targetId: string;
  width: number;
  size: number;
  disabled: boolean;
  onChoose(targetId: string): void;
}) {
  const settings = useLearningSettingsQuery();
  const [choice, setChoice] = useState<{ id: string; correct: boolean } | null>(null);
  const locked = useRef(false);
  const [reduced, setReduced] = useState(true);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (settings.data?.reinforcementEnabled === false) {
      scale.stopAnimation();
      opacity.stopAnimation();
      scale.setValue(1);
      opacity.setValue(1);
    }
  }, [settings.data?.reinforcementEnabled, scale, opacity]);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    scale.stopAnimation();
    opacity.stopAnimation();
    scale.setValue(1);
    opacity.setValue(1);
  };
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (alive) setReduced(value);
      },
      () => {}
    );
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => {
      setReduced(value);
      if (value) {
        scale.stopAnimation();
        opacity.stopAnimation();
        scale.setValue(1);
        opacity.setValue(1);
      }
    });
    const state = AppState.addEventListener("change", (value) => {
      if (value !== "active") {
        clear();
        setChoice(null);
        locked.current = false;
      }
    });
    return () => {
      alive = false;
      clear();
      motion.remove();
      state.remove();
    };
  }, [scale, opacity]);
  function choose(id: string) {
    if (
      disabled ||
      locked.current ||
      AppState.currentState === "background" ||
      AppState.currentState === "inactive"
    )
      return;
    locked.current = true;
    const correct = id === targetId;
    setChoice({ id, correct });
    AccessibilityInfo.announceForAccessibility(correct ? "Đúng rồi!" : "Mình thử lại nhé.");
    if (!reduced && settings.data?.reinforcementEnabled) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: correct ? 1.04 : 1,
            duration: 180,
            useNativeDriver: Platform.OS !== "web"
          }),
          Animated.timing(opacity, {
            toValue: correct ? 1 : 0.72,
            duration: 180,
            useNativeDriver: Platform.OS !== "web"
          })
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 260,
            useNativeDriver: Platform.OS !== "web"
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 260,
            useNativeDriver: Platform.OS !== "web"
          })
        ])
      ]).start();
    }
    onChoose(id);
    if (!correct)
      timer.current = setTimeout(() => {
        setChoice(null);
        locked.current = false;
        timer.current = null;
      }, listenFeedbackMs);
  }
  return (
    <View style={styles.grid}>
      {options.map((piece) => {
        const selected = choice?.id === piece.id;
        return (
          <Animated.View
            key={piece.id}
            style={selected ? { transform: [{ scale }], opacity } : undefined}
          >
            <GameControl
              preserveAppearance
              accessibilityLabel={`Chọn ${piece.label}`}
              disabled={disabled || Boolean(choice)}
              accessibilityState={{ selected }}
              onPress={() => choose(piece.id)}
              style={[
                styles.tile,
                { width, height: size },
                selected && (choice.correct ? styles.correct : styles.retry)
              ]}
            >
              <WordSprite piece={piece} size={size - 20} paused />
              {selected ? (
                <View pointerEvents="none" style={styles.feedback}>
                  {choice.correct ? (
                    <>
                      {settings.data?.reinforcementEnabled ? (
                        <Star size={24} color={colors.secondary} />
                      ) : null}
                      <Check size={24} color={colors.primary} />
                    </>
                  ) : (
                    <RotateCcw size={24} color={colors.secondary} />
                  )}
                  <AppText variant="labelStrong">
                    {choice.correct ? "Đúng rồi!" : "Mình thử lại nhé"}
                  </AppText>
                </View>
              ) : null}
            </GameControl>
          </Animated.View>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  tile: {
    minHeight: 56,
    minWidth: 56,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border
  },
  correct: { borderColor: colors.primary },
  retry: { borderColor: colors.secondary },
  feedback: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 4,
    borderRadius: radii.md,
    backgroundColor: colors.background
  }
});
