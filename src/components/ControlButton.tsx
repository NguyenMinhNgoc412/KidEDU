import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/theme";

import { AppText } from "./AppText";

export type ControlButtonTone = "danger" | "info" | "good";

export function ControlButton({
  icon,
  label,
  onPress,
  tone
}: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  tone: ControlButtonTone;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.controlButton,
        toneStyles[tone],
        pressed ? styles.pressed : null
      ]}
    >
      <View style={styles.controlIcon}>{icon}</View>
      <AppText align="center" variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controlButton: {
    alignItems: "center",
    borderColor: colors.borderSubtle,
    borderRadius: radii.xl,
    borderWidth: 1,
    elevation: 1,
    flex: 1,
    gap: spacing[6],
    justifyContent: "center",
    minHeight: 82,
    padding: spacing[8],
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8
  },
  controlIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.full,
    elevation: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }]
  }
});

const toneStyles = StyleSheet.create({
  danger: {
    backgroundColor: colors.dangerSoft
  },
  info: {
    backgroundColor: colors.infoSoft
  },
  good: {
    backgroundColor: colors.successSoft
  }
});
