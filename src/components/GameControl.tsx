import { Pressable, StyleSheet, type PressableProps } from "react-native";
import { controlFeedback, gameSizes } from "@/theme";

/** Image-only child control with the same feedback as KidButton. Completed tiles stay legible. */
export function GameControl({
  style,
  disabled,
  completed = false,
  preserveAppearance = false,
  accessibilityState,
  ...props
}: PressableProps & { completed?: boolean; preserveAppearance?: boolean }) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
      style={(state) => [
        styles.touch,
        typeof style === "function" ? style(state) : style,
        disabled && !completed && !preserveAppearance && styles.disabled,
        state.pressed && !disabled && styles.pressed
      ]}
    />
  );
}
const styles = StyleSheet.create({
  touch: { minWidth: gameSizes.minimumControl, minHeight: gameSizes.minimumControl },
  pressed: { opacity: controlFeedback.pressedOpacity },
  disabled: { opacity: controlFeedback.disabledOpacity }
});
