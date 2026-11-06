import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radii, spacing } from "@/theme";

import { AppText } from "./AppText";

export interface MobileTabItem {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
}

export function MobileTabBar({ items }: { items: MobileTabItem[] }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, spacing[8]);

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset }]}>
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
            <AppText align="center" color={item.active ? "secondary" : "muted"} variant="caption">
              {item.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surfaceLowest,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    elevation: 8,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[8],
    shadowColor: colors.primaryDark,
    shadowOffset: { height: -2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    width: "100%"
  },
  container: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing[8],
    justifyContent: "space-around",
    maxWidth: 720,
    width: "100%"
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
    minHeight: 56,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4]
  },
  itemActive: {
    backgroundColor: colors.secondarySoft
  },
  pressed: {
    opacity: 0.78
  }
});
