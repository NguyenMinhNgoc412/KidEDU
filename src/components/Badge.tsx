import { StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/theme";

import { AppText } from "./AppText";

export function Badge({
  label,
  tone = "neutral"
}: {
  label: string;
  tone?: "neutral" | "good" | "warn" | "info";
}) {
  return (
    <View style={[styles.badge, toneStyles[tone]]}>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[5]
  }
});

const toneStyles = StyleSheet.create({
  neutral: {
    backgroundColor: colors.surfaceContainer
  },
  good: {
    backgroundColor: colors.primarySoft
  },
  warn: {
    backgroundColor: colors.yellow
  },
  info: {
    backgroundColor: colors.secondarySoft
  }
});
