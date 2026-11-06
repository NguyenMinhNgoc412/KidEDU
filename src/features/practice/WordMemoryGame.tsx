import { useEffect, useMemo } from "react";
import { AccessibilityInfo, View } from "react-native";
import { GameControl } from "@/components/GameControl";
import { colors, gameSizes } from "@/theme";
import { WordSprite, Leaf } from "./WordGameArt";
import { memoryDeck } from "./wordGames";
import type { WordGameViewProps } from "./wordGameViewTypes";
import { wordGameStyles as styles } from "./wordGameStyles";
export function WordMemoryGame({
  game,
  paused,
  saving,
  seed,
  progress,
  onInput,
  onArtworkError
}: WordGameViewProps) {
  const deck = useMemo(() => memoryDeck(game.pieces, seed), [game.pieces, seed]);
  const memory = { open: progress.memoryOpen, matched: progress.memoryMatched };
  const mismatch = memory.open.length === 2;
  useEffect(() => {
    if (!mismatch || paused || saving) return;
    const timer = setTimeout(() => onInput({ type: "close_mismatch" }), 350);
    return () => clearTimeout(timer);
  }, [mismatch, paused, saving, onInput]);
  useEffect(() => {
    if (mismatch && !paused)
      AccessibilityInfo.announceForAccessibility("Hai hình khác nhau. Mình thử lại nhé!");
  }, [mismatch, paused]);
  return (
    <View style={styles.grid}>
      {deck.map((card, index) => {
        const matched = memory.matched.includes(card.wordId);
        const visible = memory.open.includes(card.id) || matched;
        return (
          <GameControl
            key={card.id}
            testID={`memory-card-${index}`}
            accessibilityRole="button"
            accessibilityLabel={
              matched
                ? `Đã ghép ${card.piece.label}`
                : visible
                  ? card.piece.label
                  : `Thẻ úp ${index + 1}`
            }
            accessibilityState={{
              disabled: paused || saving || matched || mismatch,
              selected: matched
            }}
            disabled={paused || saving || matched || mismatch}
            completed={matched}
            style={[styles.tile, matched && styles.matched]}
            onPress={() => onInput({ type: "flip", id: card.id })}
          >
            {visible ? (
              <WordSprite
                piece={card.piece}
                size={gameSizes.sprite}
                paused={paused}
                onArtworkError={onArtworkError}
              />
            ) : (
              <Leaf size={38} color={colors.primary} />
            )}
          </GameControl>
        );
      })}
    </View>
  );
}
