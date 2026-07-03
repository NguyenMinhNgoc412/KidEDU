import { StyleSheet, Text, View } from "react-native";

import { colors, radii } from "@/theme";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warn" | "info" }) {
  return (
    <View style={[styles.badge, toneStyles[tone]]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  text: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
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
