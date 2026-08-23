import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/theme";

import { AppText } from "./AppText";

export type KidButtonVariant = "primary" | "secondary" | "plain" | "danger";
export type KidButtonSize = "sm" | "md" | "lg";

export function KidButton({
  label,
  onPress,
  icon,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  accessibilityLabel
}: {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  variant?: KidButtonVariant;
  size?: KidButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth ? styles.fullWidth : null,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null
      ]}
    >
      <View style={styles.inner}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <AppText
          color={variant === "plain" ? "primary" : "onPrimary"}
          style={styles.label}
          numberOfLines={2}
          variant="button"
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radii.full,
    elevation: 3,
    justifyContent: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { height: spacing[6], width: spacing.none },
    shadowOpacity: 0.15,
    shadowRadius: spacing[12]
  },
  inner: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[8],
    justifyContent: "center"
  },
  icon: {
    alignItems: "center",
    height: spacing[24],
    justifyContent: "center",
    width: spacing[24]
  },
  fullWidth: {
    alignSelf: "stretch"
  },
  label: {
    flexShrink: 1,
    textAlign: "center"
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }, { translateY: 1 }]
  },
  disabled: {
    opacity: 0.45
  }
});

const sizeStyles = StyleSheet.create({
  sm: {
    minHeight: 44,
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[8]
  },
  md: {
    minHeight: spacing[56],
    paddingHorizontal: spacing[18],
    paddingVertical: spacing[12]
  },
  lg: {
    minHeight: 64,
    paddingHorizontal: spacing[22],
    paddingVertical: spacing[14]
  }
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.coral
  },
  plain: {
    backgroundColor: colors.surfaceLowest,
    borderColor: colors.borderSoft,
    borderWidth: 1
  },
  danger: {
    backgroundColor: colors.danger
  }
});
