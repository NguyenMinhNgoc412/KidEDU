import { View, StyleSheet } from "react-native";
import { Gift, Puzzle, Sticker, ArrowLeft } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { GameControl } from "@/components/GameControl";
import { colors, radii, spacing } from "@/theme";
import type { PendingReward, RewardKind, RewardReceipt } from "@/content/contracts/gameReward";
import { RewardArt, PuzzlePreview } from "./RewardArt";
import { rewardName } from "./rewardCatalog";
import { useGameAutoAdvance } from "./useGameAutoAdvance";
import { useLessonChime } from "./useLessonChime";

export function GameRewardPanel({
  pending,
  receipt,
  inventory,
  paused,
  saving,
  onChoose,
  onOpen,
  onAdvance
}: {
  pending: PendingReward;
  receipt?: RewardReceipt;
  inventory: string[];
  paused: boolean;
  saving: boolean;
  onChoose(kind: RewardKind): void;
  onOpen(): void;
  onAdvance(): void;
}) {
  const blocked = paused || saving;
  useGameAutoAdvance(!!receipt, blocked, onAdvance, 2200, pending.key);
  useLessonChime(!!receipt && (pending.slot === "lesson" || pending.slot === "play"), paused);
  return (
    <View style={styles.board} testID="game-reward-panel">
      {receipt ? (
        <View
          style={styles.board}
          accessible
          accessibilityLabel={`Con nhận được ${rewardName(receipt.itemId)}`}
          accessibilityLiveRegion="polite"
        >
          <RewardArt itemId={receipt.itemId} size={112} />
          <AppText variant="cardTitle" align="center">
            {rewardName(receipt.itemId)}
          </AppText>
          {receipt.kind === "puzzle_piece" ? (
            <PuzzlePreview
              puzzle={receipt.itemId.split("_")[1]!}
              owned={[...inventory, receipt.itemId]}
            />
          ) : null}
        </View>
      ) : (
        <>
          <AppText variant="sectionTitle" align="center">
            {pending.selectedKind ? "Mở quà nào!" : "Con chọn quà nhé"}
          </AppText>
          {!pending.selectedKind ? (
            <View style={styles.choices}>
              <GameControl
                accessibilityLabel="Chọn mảnh ghép"
                disabled={blocked || !pending.pieceCandidate}
                onPress={() => onChoose("puzzle_piece")}
                style={styles.tile}
              >
                <Puzzle size={64} color={colors.primary} />
                <AppText align="center">Mảnh ghép</AppText>
              </GameControl>
              <GameControl
                accessibilityLabel="Chọn sticker"
                disabled={blocked}
                onPress={() => onChoose("sticker")}
                style={styles.tile}
              >
                <Sticker size={64} color={colors.secondary} />
                <AppText align="center">Sticker</AppText>
              </GameControl>
            </View>
          ) : (
            <>
              <GameControl
                accessibilityLabel="Mở hộp quà"
                disabled={blocked}
                onPress={onOpen}
                style={styles.box}
              >
                <Gift size={112} color={colors.secondary} />
                <AppText align="center">
                  {pending.selectedKind === "sticker" ? "Sticker" : "M?nh gh?p"}
                </AppText>
              </GameControl>
              <GameControl
                accessibilityLabel="Đổi loại quà"
                disabled={blocked}
                onPress={() =>
                  onChoose(
                    pending.selectedKind === "sticker" && pending.pieceCandidate
                      ? "puzzle_piece"
                      : "sticker"
                  )
                }
                style={styles.change}
              >
                <ArrowLeft size={24} color={colors.primary} />
                <AppText>Đổi loại quà</AppText>
              </GameControl>
            </>
          )}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  board: { alignItems: "center", gap: spacing.lg, paddingVertical: spacing.lg },
  choices: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing.md },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceHigh,
    minWidth: 120,
    minHeight: 140
  },
  box: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.secondarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  change: { flexDirection: "row", alignItems: "center", gap: spacing.sm }
});
