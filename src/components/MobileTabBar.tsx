import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/theme";

import { AppText } from "./AppText";

export interface MobileTabItem {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
}

export function MobileTabBar({ items }: { items: MobileTabItem[] }) {
  return (
    <View style={styles.container}>
      {items.map((item) => (
        <Pressable
          key={item.label}
          accessibilityLabel={item.label}
          accessibilityRole="tab"
          accessibilityState={{ selected: Boolean(item.active) }}
          onPress={item.onPress}
          style={({ pressed }) => [
            styles.item,
            item.active ? styles.itemActive : null,
            pressed ? styles.pressed : null
          ]}
        >
          <View style={styles.icon}>{item.icon}</View>
          <AppText
            align="center"
            color={item.active ? "secondary" : "muted"}
            variant="caption"
          >
            {item.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surfaceLowest,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 5,
    flexDirection: "row",
    gap: spacing[4],
    justifyContent: "space-around",
    minHeight: 74,
    padding: spacing[6],
    shadowColor: colors.primaryDark,
    shadowOffset: { height: -3, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 14
  },
  icon: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24
  },
  item: {
    alignItems: "center",
    borderRadius: radii.md,
    flex: 1,
    gap: spacing[4],
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: spacing[6]
  },
  itemActive: {
    backgroundColor: colors.secondarySoft
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }]
  }
});
