import { View } from "react-native";
import { colors } from "@/theme";
import { Check, Leaf, Star } from "./WordGameArt";
import { useGameAutoAdvance } from "./useGameAutoAdvance";
import { WordMemoryGame } from "./WordMemoryGame";
import { WordFindGame } from "./WordFindGame";
import { WordMatchGame } from "./WordMatchGame";
import { WordGameRewards } from "./WordGameRewards";
import { wordGameSteps } from "./wordGameSteps";
import type { WordGameViewProps } from "./wordGameViewTypes";
import { wordGameStyles as styles } from "./wordGameStyles";
import { WordGameGuide } from "./WordGameGuide";
export { StickerAlbum } from "./StickerAlbum";

const renderers = { memory: WordMemoryGame, find: WordFindGame, match: WordMatchGame };
/** Dispatch a prepared step to its renderer; all durable progress belongs to the runtime. */
export function TodayWordGames(
  props: WordGameViewProps & {
    completed: number;
    sticker?: string;
    collection?: string[];
    onCompleteRound(round: number): void;
    onClaimGift(sticker: string): void;
    guideDismissed: boolean;
    onDismissGuide(): void;
    onFinish(): void;
    onBeginLessonReward(): void;
  }
) {
  const {
    game,
    completed,
    paused,
    saving,
    sticker,
    seed,
    progress,
    collection = [],
    onCompleteRound,
    onClaimGift,
    onArtworkError
  } = props;
  const step = wordGameSteps[completed];
  const solved = !!step && step.complete(game, progress);
  useGameAutoAdvance(
    solved,
    paused || saving,
    () => onCompleteRound(completed + 1),
    900,
    completed
  );
  useGameAutoAdvance(!step && !!sticker, paused || saving, props.onFinish, 1800);
  useGameAutoAdvance(!step && !sticker, paused || saving, props.onBeginLessonReward, 100);
  if (!step && !sticker) return <View />;
  if (!step)
    return (
      <WordGameRewards
        {...{ paused, saving, seed, sticker, collection, onClaimGift, onArtworkError }}
      />
    );
  const Stage = renderers[step.id];
  const started =
    step.id === "memory"
      ? progress.memoryOpen.length + progress.memoryMatched.length > 0
      : step.id === "find"
        ? progress.found.length > 0
        : progress.placed.length > 0;
  const guiding = !props.guideDismissed && !started && !paused;
  return (
    <View style={styles.board} testID={`word-game-${completed}`}>
      {guiding ? (
        <WordGameGuide step={step.id} piece={game.pieces[0]!} onDismiss={props.onDismissGuide} />
      ) : null}
      <View
        style={styles.progress}
        accessibilityLabel={`Trò ${completed + 1} trên ${wordGameSteps.length}`}
      >
        {wordGameSteps.map((item, index) => (
          <View key={item.id} style={[styles.dot, index <= completed && styles.current]}>
            {index < completed ? (
              <Check size={20} color={colors.primary} />
            ) : (
              <Leaf size={20} color={index === completed ? colors.primary : colors.primarySoft} />
            )}
          </View>
        ))}
      </View>
      <Stage {...props} paused={paused || guiding} />
      {solved ? (
        <View style={styles.progress}>
          <Star size={40} color={colors.secondary} />
        </View>
      ) : null}
    </View>
  );
}
