import { Image } from "expo-image";
import { Mic2, Play, Volume2 } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import type { LearningItemMedia, MediaRole } from "@/data/types";
import { useDisplayMediaUri } from "@/features/media/useDisplayMediaUri";
import { colors, radii } from "@/theme";

export function MediaPlaceholder({
  role,
  media,
  large = false,
  compact = false
}: {
  role: MediaRole;
  media?: LearningItemMedia;
  large?: boolean;
  compact?: boolean;
}) {
  const displayUri = useDisplayMediaUri(media?.asset.uri ?? null);
  const canRenderImage =
    role === "illustration" &&
    displayUri &&
    !displayUri.startsWith("seed://") &&
    !displayUri.startsWith("data:");

  if (canRenderImage) {
    return (
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        source={{ uri: displayUri }}
        style={[styles.frame, large ? styles.large : null, compact ? styles.compact : null]}
      />
    );
  }

  const iconColor = role === "mouth_video" ? colors.coral : role === "pronunciation_audio" ? colors.blue : colors.primary;
  const label = roleLabel[role];

  return (
    <View style={[styles.frame, large ? styles.large : null, compact ? styles.compact : null]}>
      {role === "mouth_video" ? <Play color={iconColor} size={large ? 42 : 28} /> : null}
      {role === "pronunciation_audio" ? <Volume2 color={iconColor} size={large ? 42 : 28} /> : null}
      {role === "illustration" ? <Mic2 color={iconColor} size={large ? 42 : 28} /> : null}
      {compact ? null : <Text style={styles.text}>{label}</Text>}
      {media && !compact ? <Text style={styles.source}>{media.asset.source === "custom" ? "Cá nhân hóa" : "Mặc định"}</Text> : null}
    </View>
  );
}

const roleLabel: Record<MediaRole, string> = {
  illustration: "Hình minh họa",
  mouth_video: "Khẩu hình",
  pronunciation_audio: "Âm phát âm",
  sfx: "Âm thanh"
};

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    aspectRatio: 1.3,
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 6,
    justifyContent: "center",
    minHeight: 112,
    overflow: "hidden",
    padding: 12
  },
  large: {
    aspectRatio: 1.15,
    minHeight: 230
  },
  compact: {
    aspectRatio: 1,
    borderRadius: 18,
    minHeight: 0,
    padding: 8
  },
  text: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  },
  source: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  }
});
