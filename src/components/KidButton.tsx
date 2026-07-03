import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme";

export type KidButtonVariant = "primary" | "secondary" | "plain" | "danger";

export function KidButton({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  accessibilityLabel
}: {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  variant?: KidButtonVariant;
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
        variantStyles[variant],
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null
      ]}
    >
      <View style={styles.inner}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={[styles.label, variant === "plain" ? styles.plainLabel : null]} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 8,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  inner: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  icon: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24
  },
  label: {
    color: "#FFFFFF",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center"
  },
  plainLabel: {
    color: colors.primary
  },
  pressed: {
    opacity: 0.82
  },
  disabled: {
    opacity: 0.45
  }
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.blue
  },
  plain: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1
  },
  danger: {
    backgroundColor: colors.danger
  }
});
