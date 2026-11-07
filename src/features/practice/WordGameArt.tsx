import { View } from "react-native";
import { useId } from "react";
import { Image } from "expo-image";
import { Leaf, Gift, Star, Check, ArrowRight, RotateCcw } from "lucide-react-native";
import Svg, { ClipPath, Defs, G, Image as SvgImage, Path } from "react-native-svg";
import type { PlayPiece } from "@/content/contracts/playPresentation";
import { illustrationAnimations, type IllustrationAnimation } from "@/data/illustrationAnimations";
import { useIllustrationPlayback } from "@/features/learning/useIllustrationPlayback";
import { colors, gameSizes, radii } from "@/theme";
import { useArtworkReadiness } from "./useArtworkReadiness";
import { wordGameArtwork } from "./wordGameArtwork";
import { wordSilhouetteContours } from "./wordSilhouetteContours";

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
      <View
        testID={`artwork-fallback-${animation.itemId}`}
        accessibilityLabel="Chưa tải được hình minh họa"
      >
        {wordSilhouetteContours[animation.itemId] ? (
          <WordSilhouette picture={animation.itemId} size={size} />
        ) : (
          <Star size={size * 0.7} color={colors.primary} />
        )}
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
        accessible={false}
        contentFit="fill"
        cachePolicy="memory-disk"

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
/** A real outline for every supported picture; never substitute another object's shape. */
export function WordSilhouette({
  picture,
  size = gameSizes.sticker
}: {
  picture: string;
  size?: number;
}) {
  const contour = wordSilhouetteContours[picture];
  return contour ? (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={contour} fill={colors.primary} />
    </Svg>
  ) : null;
}

/** Picture and shadow share one static crop and one contour, including scene-based art. */
export function WordMatchingArt({
  piece,
  size,
  shadow = false,
  paused = false,
  onArtworkError
}: {
  piece: PlayPiece;
  size: number;
  shadow?: boolean;
  paused?: boolean;
  onArtworkError?(): void;
}) {
  const id = `word-outline-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const contour = wordSilhouetteContours[piece.picture];
  const animation = wordGameArtwork[piece.picture] ?? illustrationAnimations[piece.picture];
  const { failed, onLoad } = useArtworkReadiness(
    paused || shadow || !contour || !animation,
    onArtworkError
  );
  if (!contour || !animation)
    return (
      <View style={{ opacity: shadow ? 0.4 : 1 }}>
        <WordSprite piece={piece} size={size} paused onArtworkError={onArtworkError} />
      </View>
    );
  if (shadow || failed) return <WordSilhouette picture={piece.picture} size={size} />;
  const columns = wordGameArtwork[piece.picture]?.columns ?? 4;
  const rows = wordGameArtwork[piece.picture]?.rows ?? 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id={id}>
          <Path d={contour} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>
        <SvgImage
          href={animation.source}
          width={100 * columns}
          height={100 * rows}
          preserveAspectRatio="none"
          onLoad={onLoad}
        />
      </G>
    </Svg>
  );
}
