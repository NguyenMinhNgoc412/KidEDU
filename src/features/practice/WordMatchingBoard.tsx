import { useMemo, useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import type { PlayPresentation } from "@/content/contracts/playPresentation";
import { colors, gameSizes, radii, spacing } from "@/theme";
import { WordMatchingArt, Check, RotateCcw } from "./WordGameArt";
import { orderRecognitionOptions } from "./activityMedia";
import type { WordGameInput } from "./wordGameSteps";
import { DragPiece } from "./DragPiece";
import { useDropTargets } from "./useDropTargets";

export function WordMatchingBoard({
  game,
  paused,
  seed,
  placed,
  saving,
  onInput,
  onArtworkError,
  pictureTargets = false,
  tileSize = gameSizes.slot,
  verticalColumns = false
}: {
  game: PlayPresentation;
  paused: boolean;
  seed: string;
  placed: string[];
  saving: boolean;
  onInput(input: WordGameInput): void;
  onArtworkError?(): void;
  pictureTargets?: boolean;
  tileSize?: number;
  verticalColumns?: boolean;
}) {
  const [hint, setHint] = useState(false);
  const [assistSource, setAssistSource] = useState<string | null>(null);
  const blocked = paused || saving;
  const pieces = useMemo(() => orderRecognitionOptions(game.pieces, seed), [game.pieces, seed]);
  const holes = useMemo(
    () => orderRecognitionOptions(game.places, `${seed}:holes`),
    [game.places, seed]
  );
  const { targets, drop, assist } = useDropTargets(blocked, (id, target) => {
    if (placed.includes(id)) return false;
    if (game.matches[id] !== target) {
      setHint(true);
      AccessibilityInfo.announceForAccessibility("Thử ô khác nhé.");
      return false;
    }
    onInput(pictureTargets ? { type: "find", id } : { type: "place", id, place: target });
    setAssistSource(null);
    setHint(false);
    AccessibilityInfo.announceForAccessibility(
      `Đã ghép ${game.pieces.find((piece) => piece.id === id)!.label}.`
    );
    return true;
  });
  return (
    <View style={{ gap: spacing[16] }}>
      <View style={verticalColumns ? styles.columns : styles.rows}>
        <View style={[styles.grid, verticalColumns && styles.column]}>
          {holes.map((hole) => {
            const piece = game.pieces.find((piece) => game.matches[piece.id] === hole.id)!;
            const filled = placed.includes(piece.id);
            return (
              <View
                key={hole.id}
                collapsable={false}
                ref={(view) => {
                  targets.current[hole.id] = view;
                }}
                testID={`hole-${piece.id}`}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Ô ${hole.label}`}
                accessibilityState={{ disabled: blocked || filled, selected: filled }}
                accessibilityActions={[
                  { name: "activate", label: "Đặt hình bằng trình đọc màn hình" }
                ]}
                onAccessibilityAction={(event) => {
                  if (event.nativeEvent.actionName === "activate" && assistSource)
                    assist(assistSource, hole.id);
                }}
                style={[
                  styles.hole,
                  { width: tileSize, height: tileSize },
                  filled && styles.filled
                ]}
              >
                {filled || pictureTargets ? (
                  <View
                    testID={filled ? `attached-${piece.id}` : undefined}
                    style={{ opacity: filled ? 1 : 0.4 }}
                  >
                    <WordMatchingArt
                      piece={piece}
                      paused={paused}
                      size={tileSize - 16}
                      onArtworkError={onArtworkError}
                    />
                  </View>
                ) : (
                  <WordMatchingArt piece={piece} shadow size={tileSize - 16} />
                )}
                {filled ? (
                  <View style={styles.check}>
                    <Check size={18} color={colors.primary} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
        <View
          style={[styles.tray, verticalColumns && styles.column, verticalColumns && { padding: 0 }]}
        >
          {pieces.map((piece) =>
            placed.includes(piece.id) ? (
              <View key={piece.id} style={[styles.source, { width: tileSize, height: tileSize }]}>
                <Check size={26} color={colors.primary} />
              </View>
            ) : (
              <DragPiece
                key={piece.id}
                id={piece.id}
                label={piece.label}
                disabled={blocked}
                onDrop={drop}
                onAssist={() => {
                  setAssistSource(piece.id);
                  AccessibilityInfo.announceForAccessibility(
                    `Đã chọn ${piece.label}. Kích hoạt ô muốn ghép.`
                  );
                }}
              >
                <View style={[styles.source, { width: tileSize, height: tileSize }]}>
                  <WordMatchingArt
                    piece={piece}
                    paused={paused}
                    size={tileSize - 16}
                    onArtworkError={onArtworkError}
                  />
                </View>
              </DragPiece>
            )
          )}
        </View>
      </View>
      {hint ? (
        <View accessibilityLabel="Thử ô khác nhé" style={styles.hint}>
          <RotateCcw size={26} color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  rows: { gap: spacing[16] },
  columns: { flexDirection: "row", justifyContent: "center", gap: spacing[16] },
  column: { flexDirection: "column", flexWrap: "nowrap", gap: spacing[8] },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing[8] },
  tray: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing[8],
    padding: spacing[8],
    borderRadius: radii.lg,
    backgroundColor: colors.surface
  },
  hole: {
    width: gameSizes.slot,
    height: gameSizes.slot,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.primarySoft
  },
  filled: { borderStyle: "solid", borderColor: colors.primary },
  source: {
    width: gameSizes.source,
    height: gameSizes.source,
    alignItems: "center",
    justifyContent: "center"
  },
  check: { position: "absolute", right: spacing[4], bottom: spacing[4] },
  hint: { alignItems: "center" }
});
