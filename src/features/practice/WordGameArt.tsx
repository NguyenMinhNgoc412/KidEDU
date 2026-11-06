import { View } from "react-native";
import { Image } from "expo-image";
import { Leaf, Gift, Star, Check, ArrowRight, RotateCcw } from "lucide-react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { PlayPiece } from "@/content/contracts/playPresentation";
import { illustrationAnimations, type IllustrationAnimation } from "@/data/illustrationAnimations";
import { useIllustrationPlayback } from "@/features/learning/useIllustrationPlayback";
import { colors, gameSizes, radii } from "@/theme";
import { useArtworkReadiness } from "./useArtworkReadiness";
import { wordGameArtwork } from "./wordGameArtwork";

export { Leaf, Gift, Star, Check, ArrowRight, RotateCcw };
const noop = () => {};
function Sprite({
  animation,
  size,
  paused,
  onArtworkError
}: {
  animation: IllustrationAnimation & { columns?: number; rows?: number };
  size: number;
  paused: boolean;
  onArtworkError?(): void;
}) {
  const { ready, failed, onLoad, onError } = useArtworkReadiness(paused, onArtworkError);
  const { frame } = useIllustrationPlayback({ animation, ready, paused, onComplete: noop });
  const columns = animation.columns ?? 4;
  const rows = animation.rows ?? 2;
  if (failed)
    return (
      <View testID={`artwork-fallback-${animation.itemId}`} accessibilityLabel="Hình minh họa tĩnh">
        <WordSilhouette picture={animation.itemId} size={size} />
      </View>
    );
  return (
    <View
      pointerEvents="none"
      style={{ width: size, height: size, overflow: "hidden", borderRadius: radii.md }}
    >
      {!ready ? <WordSilhouette picture={animation.itemId} size={size} /> : null}
      <Image
        source={animation.source}
        contentFit="fill"
        cachePolicy="memory-disk"
        accessible={false}
        onLoad={onLoad}
        onError={onError}
        style={{
          position: "absolute",
          width: size * columns,
          height: size * rows,
          left: -(frame % columns) * size,
          top: -Math.floor(frame / columns) * size
        }}
      />
    </View>
  );
}
export function WordSprite({
  piece,
  size = gameSizes.sprite,
  paused = false,
  onArtworkError
}: {
  piece: PlayPiece;
  size?: number;
  paused?: boolean;
  onArtworkError?(): void;
}) {
  const animation = wordGameArtwork[piece.picture] ?? illustrationAnimations[piece.picture];
  return animation ? (
    <Sprite
      key={piece.id}
      animation={animation}
      size={size}
      paused={paused}
      onArtworkError={onArtworkError}
    />
  ) : (
    <Star size={size * 0.7} color={colors.primary} />
  );
}
/** Matching holes are code-native silhouettes, never a tinted rectangular photograph. */
export function WordSilhouette({
  picture,
  size = gameSizes.sticker
}: {
  picture: string;
  size?: number;
}) {
  const fill = colors.surfaceHigh,
    stroke = colors.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {picture === "item-bong" ? (
        <Circle
          cx="50"
          cy="50"
          r="35"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      ) : picture === "item-gau" ? (
        <Path
          d="M27 15C12 8 8 29 22 33C17 44 23 51 28 55C8 46 5 72 23 75C15 96 40 98 45 85H55C60 98 85 96 77 75C95 72 92 46 72 55C77 51 83 44 78 33C92 29 88 8 73 15C62 7 38 7 27 15Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      ) : picture === "item-xe" ? (
        <>
          <Path
            d="M12 44H28L39 25H65L77 44H88V73H12Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <Circle cx="30" cy="76" r="11" fill={stroke} />
          <Circle cx="73" cy="76" r="11" fill={stroke} />
        </>
      ) : picture === "item-sua" ? (
        <>
          <Path
            d="M25 17Q50 8 75 17L70 84Q50 94 30 84Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        </>
      ) : (
        <>
          <Path
            d="M15 60C10 30 30 15 50 15C75 15 90 36 85 63C80 88 20 90 15 60Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <Path d="M29 35L67 66M64 31L33 68" stroke={stroke} strokeWidth="2" fill="none" />
        </>
      )}
    </Svg>
  );
}
