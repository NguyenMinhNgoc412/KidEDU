import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Hand, ArrowRight, Copy, Pointer } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { colors, gameSizes, radii, spacing } from "@/theme";
import { WordSprite, WordSilhouette } from "./WordGameArt";
import type { PlayPiece } from "@/content/contracts/playPresentation";

const instructions = {
  memory: "Chạm hai thẻ, tìm hình giống nhau",
  find: "Kéo hình vào hình mẫu giống nhau",
  match: "Kéo hình vào ô giống hình"
};
export function WordGameGuide({
  step,
  piece,
  onDismiss
}: {
  step: keyof typeof instructions;
  piece: PlayPiece;
  onDismiss(): void;
}) {
  return (
    <Modal transparent visible animationType="none" onRequestClose={onDismiss}>
      <Pressable
        testID="word-game-guide"
        accessibilityRole="button"
        accessibilityLabel={`${instructions[step]}. Chạm để bắt đầu`}
        accessibilityViewIsModal
        onPress={onDismiss}
        style={styles.backdrop}
      >
        <View pointerEvents="none" style={styles.card}>
          <View style={styles.demo}>
            <View style={styles.tile}>
              {step === "memory" ? (
                <Copy size={48} color={colors.primary} />
              ) : (
                <WordSprite piece={piece} size={gameSizes.sprite} paused />
              )}
            </View>
            {step !== "memory" ? (
              <ArrowRight size={32} color={colors.primary} />
            ) : (
              <Pointer size={32} color={colors.primary} />
            )}
            <View style={styles.tile}>
              {step === "match" ? (
                <WordSilhouette picture={piece.picture} size={gameSizes.sprite} />
              ) : (
                <WordSprite piece={piece} size={gameSizes.sprite} paused />
              )}
            </View>
          </View>
          <AppText variant="cardTitle" align="center">
            {instructions[step]}
          </AppText>
          <Hand size={32} color={colors.primary} />
          <AppText color="muted" align="center">
            Chạm để bắt đầu
          </AppText>
        </View>
      </Pressable>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.mediaOverlayStrong,
    justifyContent: "center",
    padding: spacing[24],
    alignItems: "center"
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing[24],
    gap: spacing[16],
    alignItems: "center"
  },
  demo: { flexDirection: "row", alignItems: "center", gap: spacing[8] },
  tile: {
    width: gameSizes.source,
    height: gameSizes.source,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center"
  }
});
