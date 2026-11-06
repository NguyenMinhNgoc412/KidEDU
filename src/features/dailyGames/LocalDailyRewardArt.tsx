import Svg, { G, Rect } from "react-native-svg";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { RewardArt, RewardScene } from "@/features/practice/RewardArt";
import { rewardName, puzzleNames } from "@/features/practice/rewardCatalog";
import { colors } from "@/theme";

/** Explicit local-fixture registry; unknown catalog versions never guess an image. */
export function localRewardName(catalogId: string, version: number, itemId: string) {
  return catalogId === "local_daily_rewards" &&
    version === 1 &&
    /^local_(sticker_(animals|heroes|princesses)_[1-6]|piece_(garden|space)_[0-5])$/.test(itemId)
    ? rewardName(itemId.replace(/^local_/, ""))
    : null;
}
export function LocalDailyRewardArt({ itemId, size = 72 }: { itemId: string; size?: number }) {
  if (/^local_sticker_(animals|heroes|princesses)_[1-6]$/.test(itemId))
    return <RewardArt itemId={itemId.replace(/^local_/, "")} size={size} />;
  const match = /^local_piece_(garden|space)_([0-5])$/.exec(itemId);
  if (!match) return null;
  const index = Number(match[2]);
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`${((index % 3) * 200) / 3} ${Math.floor(index / 3) * 100} ${200 / 3} 100`}
    >
      <RewardScene puzzle={match[1]!} />
    </Svg>
  );
}
export function LocalDailyPuzzle({
  puzzle,
  owned
}: {
  puzzle: "garden" | "space";
  owned: readonly string[];
}) {
  const count = Array.from({ length: 6 }, (_, index) =>
    owned.includes(`local_piece_${puzzle}_${index}`)
  ).filter(Boolean).length;
  return (
    <View
      accessible
      accessibilityLabel={`${puzzleNames[puzzle]}: ${count} trên 6 mảnh`}
      style={{ gap: 12 }}
    >
      <AppText variant="cardTitle">{puzzleNames[puzzle]}</AppText>
      <View style={{ width: "100%", aspectRatio: 1, maxWidth: 420, alignSelf: "center" }}>
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          <RewardScene puzzle={puzzle} />
          <G>
            {Array.from({ length: 6 }, (_, index) =>
              !owned.includes(`local_piece_${puzzle}_${index}`) ? (
                <Rect
                  key={index}
                  x={((index % 3) * 200) / 3}
                  y={Math.floor(index / 3) * 100}
                  width={200 / 3}
                  height={100}
                  fill={colors.surfaceHigh}
                  stroke={colors.primarySoft}
                  strokeDasharray="5 4"
                />
              ) : null
            )}
          </G>
        </Svg>
      </View>
      <AppText color="muted">{count === 6 ? "Tranh đã đủ rồi!" : `Đã có ${count}/6 mảnh`}</AppText>
    </View>
  );
}
