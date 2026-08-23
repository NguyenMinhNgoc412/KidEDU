import { Image, type ImageContentFit } from "expo-image";
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, radii, spacing } from "@/theme";

type MediaContainerSize = "compact" | "default" | "large";

export function MediaContainer({
  children,
  uri,
  size = "default",
  contentFit = "cover",
  style,
  ...props
}: ViewProps & {
  children?: ReactNode;
  uri?: string;
  size?: MediaContainerSize;
  contentFit?: ImageContentFit;
}) {
  const frameStyle = [styles.frame, sizeStyles[size], style];

  if (uri) {
    return (
      <Image
        cachePolicy="memory-disk"
        contentFit={contentFit}
        source={{ uri }}
        style={frameStyle}
      />
    );
  }

  return (
    <View {...props} style={frameStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    aspectRatio: 1.3,
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    gap: spacing[6],
    justifyContent: "center",
    minHeight: 112,
    overflow: "hidden",
    padding: spacing[12],
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 14
  }
});

const sizeStyles = StyleSheet.create({
  default: {},
  large: {
    aspectRatio: 1.15,
    minHeight: 230
  },
  compact: {
    aspectRatio: 1,
    borderRadius: radii.md,
    minHeight: 0,
    padding: spacing[8]
  }
});
