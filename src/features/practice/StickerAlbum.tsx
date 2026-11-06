import { View, useWindowDimensions } from "react-native";
import { AppText } from "@/components/AppText";
import { RewardArt, PuzzlePreview } from "./RewardArt";
import {
  rewardThemes,
  rewardThemeNames,
  rewardStickers,
  rewardName,
  puzzleNames
} from "./rewardCatalog";
import { colors, gameSizes } from "@/theme";
import { WordSprite, Star } from "./WordGameArt";
import { stickerPictures, stickerNames } from "./wordGames";
import { wordGameStyles as styles } from "./wordGameStyles";
export function StickerAlbum({
  collected,
  paused = true,
  ownedOnly = false,
  kind = "all"
}: {
  collected: string[];
  paused?: boolean;
  ownedOnly?: boolean;
  kind?: "all" | "sticker" | "puzzle_piece";
}) {
  const { width } = useWindowDimensions();
  if (
    ownedOnly &&
    !collected.some((id) =>
      kind === "puzzle_piece"
        ? id.startsWith("piece_")
        : kind === "sticker"
          ? !id.startsWith("piece_")
          : true
    )
  )
    return null;
  return (
    <View
      style={styles.album}
      accessibilityLabel={`Bộ sưu tập: ${new Set(collected).size} món quà`}
    >
      {kind !== "puzzle_piece"
        ? rewardThemes
            .filter(
              (theme) => !ownedOnly || collected.some((id) => id.startsWith(`sticker_${theme}_`))
            )
            .map((theme) => (
              <View key={theme} style={{ width: "100%", gap: 12 }}>
                <AppText variant="cardTitle">{rewardThemeNames[theme]}</AppText>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {rewardStickers
                    .filter((id) => id.startsWith(`sticker_${theme}_`))
                    .filter((id) => !ownedOnly || collected.includes(id))
                    .map((id) => (
                      <View
                        key={id}
                        style={[
                          styles.sticker,
                          ownedOnly && { width: 104, height: 104 },
                          !collected.includes(id) && styles.empty
                        ]}
                        accessible
                        accessibilityLabel={
                          collected.includes(id)
                            ? `Sticker ${rewardName(id)}`
                            : `Chưa sưu tập sticker ${rewardName(id)}`
                        }
                      >
                        {collected.includes(id) ? (
                          <RewardArt itemId={id} size={ownedOnly ? 80 : gameSizes.stickerImage} />
                        ) : (
                          <Star size={28} color={colors.primarySoft} />
                        )}
                      </View>
                    ))}
                </View>
              </View>
            ))
        : null}
      {kind !== "sticker"
        ? Object.entries(puzzleNames)
            .filter(
              ([id]) => !ownedOnly || collected.some((item) => item.startsWith(`piece_${id}_`))
            )
            .map(([id, name]) => (
              <View
                key={id}
                style={{ gap: 12 }}
                accessible
                accessibilityLabel={`${name}: ${new Set(collected.filter((item) => item.startsWith(`piece_${id}_`))).size} trên 4 mảnh`}
              >
                <AppText variant="cardTitle">{name}</AppText>
                <PuzzlePreview
                  puzzle={id}
                  owned={collected}
                  size={ownedOnly ? Math.min(width - 104, 360) : 180}
                />
              </View>
            ))
        : null}
      {kind !== "puzzle_piece"
        ? stickerPictures
            .filter((picture) => collected.includes(picture))
            .map((picture) => (
              <View
                key={picture}
                style={[styles.sticker, !collected.includes(picture) && styles.empty]}
                accessible
                accessibilityLabel={
                  collected.includes(picture)
                    ? `Sticker ${stickerNames[picture]}`
                    : `Chưa sưu tập sticker ${stickerNames[picture]}`
                }
              >
                {collected.includes(picture) ? (
                  <WordSprite
                    piece={{ id: picture, label: "Sticker", picture }}
                    size={gameSizes.stickerImage}
                    paused={paused}
                  />
                ) : (
                  <Star size={28} color={colors.primarySoft} />
                )}
              </View>
            ))
        : null}
    </View>
  );
}
