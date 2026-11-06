import { View } from "react-native";
import Svg, { Circle, Path, Rect, Ellipse } from "react-native-svg";
import {
  Cat,
  Dog,
  Rabbit,
  Fish,
  Bird,
  Turtle,
  Zap,
  Shield,
  Rocket,
  Star,
  Bot,
  Crown,
  Castle,
  Flower2,
  WandSparkles,
  Heart,
  Sparkles
} from "lucide-react-native";
import { colors, radii } from "@/theme";

const icons = {
  animals: [Cat, Dog, Rabbit, Fish, Bird, Turtle],
  heroes: [Zap, Shield, Shield, Rocket, Star, Bot],
  princesses: [Crown, Castle, Flower2, Crown, WandSparkles, Heart]
};
const palettes = {
  animals: [colors.primarySoft, colors.primary],
  heroes: [colors.infoSoft, colors.blue],
  princesses: [colors.secondarySoft, colors.secondary]
};
export function RewardScene({ puzzle }: { puzzle: string }) {
  return puzzle === "garden" ? (
    <>
      <Rect width="200" height="200" fill="#DDF0F2" />
      <Circle cx="155" cy="35" r="22" fill={colors.yellow} />
      <Path d="M0 125Q65 80 120 122T200 115V200H0Z" fill={colors.sage} />
      <Path d="M25 120L68 75L110 120Z" fill={colors.coral} />
      <Rect x="35" y="120" width="65" height="63" rx="8" fill={colors.secondarySoft} />
      <Rect x="59" y="143" width="20" height="40" rx="5" fill={colors.primary} />
      <Path d="M140 180V120M172 187V143" stroke={colors.primary} strokeWidth="5" />
      <Circle cx="140" cy="119" r="16" fill={colors.secondarySoft} />
      <Circle cx="140" cy="119" r="7" fill={colors.coral} />
      <Circle cx="172" cy="143" r="15" fill={colors.yellow} />
      <Circle cx="172" cy="143" r="6" fill={colors.secondary} />
      <Ellipse cx="30" cy="40" rx="20" ry="10" fill="white" />
      <Ellipse cx="56" cy="44" rx="22" ry="11" fill="white" />
    </>
  ) : (
    <>
      <Rect width="200" height="200" fill="#263E61" />
      <Circle cx="150" cy="42" r="25" fill={colors.yellow} />
      <Circle cx="160" cy="32" r="7" fill={colors.secondarySoft} />
      <Circle cx="30" cy="35" r="4" fill="white" />
      <Circle cx="165" cy="157" r="4" fill="white" />
      <Circle cx="44" cy="170" r="5" fill="white" />
      <Path d="M70 124Q60 73 100 45Q140 73 130 124Z" fill={colors.surface} />
      <Path d="M70 100L45 135L75 128M130 100L155 135L125 128" fill={colors.coral} />
      <Circle cx="100" cy="88" r="16" fill={colors.blue} />
      <Circle cx="100" cy="88" r="9" fill={colors.infoSoft} />
      <Path d="M83 127Q80 155 100 176Q120 155 117 127Z" fill={colors.yellow} />
      <Path d="M92 128L100 153L108 128Z" fill={colors.coral} />
    </>
  );
}
export function PuzzlePreview({
  puzzle,
  owned,
  size = 180
}: {
  puzzle: string;
  owned: string[];
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <RewardScene puzzle={puzzle} />
      {[0, 1, 2, 3].map((index) =>
        !owned.includes(`piece_${puzzle}_${index}`) ? (
          <Rect
            key={index}
            x={(index % 2) * 100}
            y={Math.floor(index / 2) * 100}
            width="100"
            height="100"
            fill={colors.surfaceHigh}
            stroke={colors.primary}
            strokeDasharray="5 4"
          />
        ) : null
      )}
    </Svg>
  );
}
export function RewardArt({ itemId, size = 72 }: { itemId: string; size?: number }) {
  if (itemId.startsWith("piece_")) {
    const [, puzzle, index] = itemId.split("_"),
      i = Number(index);
    return (
      <View style={{ width: size, height: size, borderRadius: radii.md, overflow: "hidden" }}>
        <Svg
          width={size}
          height={size}
          viewBox={`${(i % 2) * 100} ${Math.floor(i / 2) * 100} 100 100`}
        >
          <RewardScene puzzle={puzzle!} />
        </Svg>
      </View>
    );
  }
  const [, theme, index] = itemId.split("_");
  const key = theme as keyof typeof icons,
    Icon = icons[key]?.[Number(index) - 1] ?? Sparkles;
  const [background, foreground] = palettes[key] ?? palettes.animals;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        borderWidth: 3,
        borderColor: colors.surfaceLowest,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Icon size={size * 0.62} color={foreground} strokeWidth={2} />
    </View>
  );
}
