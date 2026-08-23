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
    elevation: 2,
    gap: spacing[12],
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.975 }, { translateY: 1 }]
  }
});

const variantStyles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle
  },
  subtle: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderSubtle
  },
  form: {
    backgroundColor: colors.surfaceLowest,
    borderColor: colors.borderSoft,
    borderRadius: radii.xl
  },
  input: {
    backgroundColor: colors.surfaceInput,
    borderColor: colors.borderSoft
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
