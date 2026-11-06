import { useRef, type ComponentRef, type ReactNode } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";
import { ScreenScrollLockContext, useScreenScrollLockController } from "./ScreenScrollLock";

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges,
  bottomBar,
  maxWidth = 720,
  contentStyle
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
  bottomBar?: ReactNode;
  maxWidth?: number;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const scrollView = useRef<ComponentRef<typeof ScrollView>>(null);
  const { locked, acquire } = useScreenScrollLockController((value) => {
    // Apply immediately on native; the prop below also keeps React/web in sync.
    if (Platform.OS !== "web") scrollView.current?.setNativeProps({ scrollEnabled: !value });
  });
  const defaultEdges: readonly Edge[] = bottomBar
    ? ["top", "left", "right"]
    : ["top", "left", "right", "bottom"];
  const safeEdges = edges ?? defaultEdges;

  const content = (
    <View
      style={[
        styles.content,
        { maxWidth },
        padded ? styles.padded : null,
        bottomBar && padded ? styles.paddedWithBottomBar : null,
        contentStyle
      ]}
    >
      {children}
    </View>
  );

  return (
    <ScreenScrollLockContext.Provider value={acquire}>
      <SafeAreaView edges={safeEdges} style={styles.safeArea}>
        <View style={styles.container}>
          {scroll ? (
            <ScrollView
              ref={scrollView}
              testID="screen-scroll"
              scrollEnabled={!locked}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {content}
            </ScrollView>
          ) : (
            <View testID="screen-scroll" nativeID="game-fixed-screen" style={styles.fixedContent}>
              {content}
            </View>
          )}
          {bottomBar}
        </View>
      </SafeAreaView>
    </ScreenScrollLockContext.Provider>
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
    width: "100%"
  },
  fixedContent: { flex: 1, overflow: "hidden" },
  padded: {
    paddingBottom: spacing[24],
    paddingHorizontal: spacing[18],
    paddingTop: spacing[12]
  },
  paddedWithBottomBar: {
    paddingBottom: spacing[8]
  }
});
