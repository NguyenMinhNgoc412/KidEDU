import { View } from "react-native";
import { GameControl } from "@/components/GameControl";
import { colors, gameSizes } from "@/theme";
import { WordSprite, Star, Gift } from "./WordGameArt";
import { StickerAlbum } from "./StickerAlbum";
import { giftChoices, type StickerPicture } from "./wordGames";
import { wordGameStyles as styles } from "./wordGameStyles";
export function WordGameRewards({
  paused,
  saving,
  seed,
  sticker,
  collection,
  onClaimGift,
  onArtworkError
}: {
  paused: boolean;
  saving: boolean;
  seed: string;
  sticker?: string;
  collection: string[];
  onClaimGift(id: string): void;
  onArtworkError?(): void;
}) {
  const gifts = giftChoices(seed);
  const disabled = paused || saving;
  return (
    <View style={styles.board} testID="word-gifts">
      {sticker ? (
        <View style={styles.prize} accessibilityLabel="Sticker mới của con">
          <WordSprite
            piece={{
              id: sticker,
              label: "Sticker mới",
              picture: sticker as StickerPicture
            }}
            size={gameSizes.reward}
            onArtworkError={onArtworkError}
            paused={paused}
          />
          <Star size={38} color={colors.secondary} />
        </View>
      ) : (
        <View style={styles.gifts}>
          {gifts.map((id, index) => (
            <GameControl
              key={id}
              accessibilityRole="button"
              accessibilityLabel={`Chọn hộp quà ${index + 1}`}
              disabled={disabled}
              testID={`gift-box-${index}`}
              style={[
                styles.gift,
                {
                  backgroundColor: [colors.primarySoft, colors.secondarySoft, colors.surfaceHigh][
                    index
                  ]
                }
              ]}
              onPress={() => onClaimGift(id)}
            >
              <Gift size={64} color={index === 1 ? colors.secondary : colors.primary} />
            </GameControl>
          ))}
        </View>
      )}
      <StickerAlbum collected={[...collection, ...(sticker ? [sticker] : [])]} paused={paused} />
    </View>
  );
}
