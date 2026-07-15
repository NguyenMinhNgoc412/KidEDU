import type { ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle
} from "react-native";

import { colors, radii, spacing } from "@/theme";

type CardVariant = "surface" | "subtle" | "form" | "input";
type CardPadding = "sm" | "md" | "lg" | "none";

export function Card({
  children,
  variant = "surface",
  padding = "md",
  style,
  ...props
}: ViewProps & {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
}) {
  return (
    <View {...props} style={[styles.card, variantStyles[variant], paddingStyles[padding], style]}>
      {children}
    </View>
  );
}

export function PressableCard({
  children,
  variant = "surface",
  padding = "md",
  style,
  pressedStyle,
  ...props
}: PressableProps & {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  pressedStyle?: ViewStyle;
}) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.card,
        variantStyles[variant],
        paddingStyles[padding],
        typeof style === "function" ? style({ pressed }) : style,
        pressed ? pressedStyle ?? styles.pressed : null
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[12]
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }]
  }
});

const variantStyles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderColor: colors.border
  },
  subtle: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderSubtle
  },
  form: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl
  },
  input: {
    backgroundColor: colors.surfaceInput,
    borderColor: colors.border
  }
});

const paddingStyles = StyleSheet.create({
  none: {
    padding: spacing.none
  },
  sm: {
    padding: spacing[10]
  },
  md: {
    padding: spacing[14]
  },
  lg: {
    padding: spacing[18]
  }
});
