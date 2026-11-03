import { Mic2, Play, Volume2 } from "lucide-react-native";
import { StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import type { LearningItemMedia, MediaRole } from "@/data/types";
import { getBundledDefaultMediaFile } from "@/data/defaultMediaRegistry";
import { useDisplayMediaUri } from "@/features/media/useDisplayMediaUri";
import { colors } from "@/theme";

import { AppText } from "./AppText";
import { MediaContainer } from "./MediaContainer";

export function MediaPlaceholder({
  role,
  media,
  fallbackLabel,
  large = false,
  compact = false,
  style
}: {
  role: MediaRole;
  media?: LearningItemMedia;
  fallbackLabel?: string;
  large?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const sourceUri = media?.asset.thumbnailUri ?? media?.asset.uri ?? null;
  const bundledFile =
    media?.asset.source === "default" ? getBundledDefaultMediaFile(sourceUri) : null;
  const displayUri = useDisplayMediaUri(bundledFile ? null : sourceUri);
  const canRenderImage =
    (role === "illustration" || Boolean(media?.asset.thumbnailUri)) &&
    (bundledFile ||
      (displayUri && !displayUri.startsWith("seed://") && !displayUri.startsWith("data:")));

  if (canRenderImage) {
    return (
      <MediaContainer
        size={getContainerSize({ large, compact })}
        style={style}
        uri={displayUri ?? undefined}
        source={bundledFile?.module}
      />
    );
  }

  const iconColor =
    role === "mouth_video"
      ? colors.coral
      : role === "pronunciation_audio"
        ? colors.blue
        : colors.primary;
  const label = fallbackLabel ?? roleLabel[role];

  return (
    <MediaContainer size={getContainerSize({ large, compact })} style={style}>
      {role === "mouth_video" ? <Play color={iconColor} size={large ? 42 : 28} /> : null}
      {role === "pronunciation_audio" ? <Volume2 color={iconColor} size={large ? 42 : 28} /> : null}
      {role === "illustration" ? <Mic2 color={iconColor} size={large ? 42 : 28} /> : null}
      {compact ? null : (
        <AppText align="center" style={styles.text} variant="labelStrong">
          {label}
        </AppText>
      )}
      {media && !compact ? (
        <AppText align="center" color="muted" variant="caption">
          {media.asset.source === "custom" ? "Cá nhân hóa" : "Mặc định"}
        </AppText>
      ) : null}
    </MediaContainer>
  );
}

function getContainerSize({
  large,
  compact
}: {
  large: boolean;
  compact: boolean;
}): "large" | "compact" | "default" {
  if (large) {
    return "large";
  }

  if (compact) {
    return "compact";
  }

  return "default";
}

const roleLabel: Record<MediaRole, string> = {
  illustration: "Hình minh họa",
  mouth_video: "Khẩu hình",
  pronunciation_audio: "Âm phát âm",
  sfx: "Âm thanh"
};

const styles = StyleSheet.create({
  text: {
    color: colors.text
  }
});
