export const colors = {
  background: "#FFFDF2",
  surfaceLowest: "#FFFFFF",
  surface: "#FFF1D6",
  surfaceAlt: "#F4F8E8",
  surfaceInput: "#FFFFFF",
  surfaceContainer: "#EAF3DB",
  surfaceHigh: "#DDE8CE",
  border: "#D9DFC9",
  borderSubtle: "rgba(79, 118, 84, 0.1)",
  borderSoft: "rgba(79, 118, 84, 0.14)",
  text: "#253126",
  muted: "#66705C",
  primary: "#4F7654",
  primaryDark: "#34583B",
  primarySoft: "#D9EBCB",
  onPrimary: "#FFFFFF",
  secondary: "#98572E",
  secondarySoft: "#FFE0C2",
  coral: "#E47D45",
  yellow: "#FFD98A",
  blue: "#5B83C4",
  sage: "#91B984",
  danger: "#C54949",
  dangerSoft: "#FFF0EE",
  infoSoft: "#EDF4FF",
  successSoft: "#EDF7E6",
  starSoft: "#FFF0B8",
  starGlow: "#FFEAA7",
  celebrationGold: "#FFB800",
  celebrationBg: "#FFF9E6",
  mediaOverlay: "rgba(74, 72, 50, 0.55)",
  mediaOverlayStrong: "rgba(74, 72, 50, 0.72)",
  mediaOverlayLight: "rgba(255,255,255,0.9)",
  loadingBackground: "#F7FBFA",
  loadingText: "#163B3A",
  loadingMuted: "#42615F"
} as const;

export const categoryTileColors = ["#22B8CE", "#F6D957", "#F064A6", "#5CC765", "#F5A24B"] as const;

export const categoryTileForegroundColors = [
  "#253126",
  "#2D321F",
  "#253126",
  "#253126",
  "#3E2B16"
] as const;

export const spacing = {
  2: 2,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
  26: 26,
  28: 28,
  32: 32,
  34: 34,
  36: 36,
  40: 40,
  42: 42,
  44: 44,
  46: 46,
  48: 48,
  56: 56,
  58: 58,
  64: 64,
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  full: 999
} as const;

export const fontSizes = {
  12: 12,
  13: 13,
  14: 14,
  15: 15,
  16: 16,
  17: 17,
  18: 18,
  20: 20,
  21: 21,
  22: 22,
  24: 24,
  26: 26,
  28: 28,
  34: 34,
  36: 36,
  40: 40
} as const;

export const lineHeights = {
  17: 17,
  18: 18,
  20: 20,
  21: 21,
  22: 22,
  24: 24,
  25: 25,
  26: 26,
  27: 27,
  28: 28,
  30: 30,
  32: 32,
  34: 34,
  44: 44,
  48: 48
} as const;

export const fontFamilies = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold"
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extraBold: "700",
  black: "700"
} as const;

export const typography = {
  screenTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes[26],
    lineHeight: lineHeights[32]
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes[24],
    lineHeight: lineHeights[30]
  },
  learningTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes[40],
    lineHeight: lineHeights[48]
  },
  deckTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes[20],
    lineHeight: lineHeights[26]
  },
  cardTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes[18],
    lineHeight: lineHeights[24]
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes[16],
    lineHeight: lineHeights[24]
  },
  bodyStrong: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes[16],
    lineHeight: lineHeights[20]
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes[14],
    lineHeight: lineHeights[20]
  },
  labelStrong: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes[14],
    lineHeight: lineHeights[20]
  },
  caption: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes[12],
    lineHeight: lineHeights[17]
  }
} as const;
