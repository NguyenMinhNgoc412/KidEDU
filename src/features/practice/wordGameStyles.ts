import { StyleSheet } from "react-native";
import { colors, gameSizes, radii, spacing } from "@/theme";
export const wordGameStyles = StyleSheet.create({
  board: { width: "100%", gap: spacing[16] },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[16]
  },
  dot: {
    height: gameSizes.step,
    width: gameSizes.step,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt
  },
  current: { backgroundColor: colors.primarySoft },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[8], justifyContent: "center" },
  tile: {
    width: gameSizes.tile,
    height: gameSizes.tileHeight,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: "hidden"
  },
  matched: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  retry: { borderColor: colors.secondary },
  target: {
    alignSelf: "center",
    padding: spacing[8],
    backgroundColor: colors.primarySoft,
    borderRadius: radii.xl
  },
  check: {
    position: "absolute",
    right: 1,
    bottom: 1,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft
  },
  next: {
    width: gameSizes.primaryControl,
    height: gameSizes.primaryControl,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  gifts: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing[16],
    paddingVertical: spacing[24]
  },
  gift: {
    width: gameSizes.tile,
    height: gameSizes.giftHeight,
    borderRadius: radii.lg,
    justifyContent: "center",
    alignItems: "center"
  },
  prize: {
    alignItems: "center",
    gap: spacing[16],
    padding: spacing[16],
    borderRadius: radii.xl,
    backgroundColor: colors.secondarySoft
  },
  album: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing[8],
    padding: spacing[16],
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt
  },
  sticker: {
    width: gameSizes.sticker,
    height: gameSizes.sticker,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  empty: { backgroundColor: colors.surfaceAlt, borderStyle: "dashed" }
});
