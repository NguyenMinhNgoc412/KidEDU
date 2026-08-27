import { type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges,
  bottomBar
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
  bottomBar?: ReactNode;
}) {
  const defaultEdges: readonly Edge[] = bottomBar
    ? ["top", "left", "right"]
    : ["top", "left", "right", "bottom"];
  const safeEdges = edges ?? defaultEdges;

  const content = (
    <View
      style={[
        styles.content,
        padded ? styles.padded : null,
        bottomBar && padded ? styles.paddedWithBottomBar : null
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={safeEdges} style={styles.safeArea}>
      <View style={styles.container}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
        {bottomBar}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  container: {
    flex: 1,
    width: "100%"
  },
  scrollContent: {
    flexGrow: 1
  },
  content: {
    alignSelf: "center",
    flex: 1,
    gap: spacing[12],
    maxWidth: 460,
    width: "100%"
  },
  padded: {
    paddingBottom: spacing[24],
    paddingHorizontal: spacing[18],
    paddingTop: spacing[12]
  },
  paddedWithBottomBar: {
    paddingBottom: spacing[8]
  }
});
