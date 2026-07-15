import { type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";

export function Screen({
  children,
  scroll = true,
  padded = true
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
}) {
  const content = <View style={[styles.content, padded ? styles.padded : null]}>{children}</View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
  content: {
    alignSelf: "center",
    flex: 1,
    gap: spacing[16],
    maxWidth: 560,
    width: "100%"
  },
  padded: {
    padding: spacing[24]
  }
});
