import type { ComponentProps } from "react";
import { StyleSheet, Text } from "react-native";

import { colors, fontFamilies, fontSizes, lineHeights, typography } from "@/theme";

type TextColor = "default" | "muted" | "primary" | "secondary" | "danger" | "onPrimary";

export type AppTextVariant =
  | "screenTitle"
  | "sectionTitle"
  | "learningTitle"
  | "deckTitle"
  | "cardTitle"
  | "body"
  | "bodyStrong"
  | "label"
  | "labelStrong"
  | "fieldLabel"
  | "caption"
  | "meta"
  | "button";

export function AppText({
  variant = "body",
  color = "default",
  align,
  style,
  ...props
}: ComponentProps<typeof Text> & {
  variant?: AppTextVariant;
  color?: TextColor;
  align?: "left" | "center" | "right";
}) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        variantStyles[variant],
        colorStyles[color],
        align ? { textAlign: align } : null,
        style
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
    fontFamily: fontFamilies.regular
  }
});

const variantStyles = StyleSheet.create({
  screenTitle: typography.screenTitle,
  sectionTitle: typography.sectionTitle,
  learningTitle: typography.learningTitle,
  deckTitle: typography.deckTitle,
  cardTitle: typography.cardTitle,
  body: typography.body,
  bodyStrong: typography.bodyStrong,
  label: typography.label,
  labelStrong: typography.labelStrong,
  fieldLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes[15],
    lineHeight: lineHeights[20]
  },
  caption: typography.caption,
  meta: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes[13],
    lineHeight: lineHeights[18]
  },
  button: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes[16],
    lineHeight: lineHeights[20]
  }
});

const colorStyles = StyleSheet.create({
  default: {
    color: colors.text
  },
  muted: {
    color: colors.muted
  },
  primary: {
    color: colors.primary
  },
  secondary: {
    color: colors.secondary
  },
  danger: {
    color: colors.danger
  },
  onPrimary: {
    color: colors.onPrimary
  }
});
