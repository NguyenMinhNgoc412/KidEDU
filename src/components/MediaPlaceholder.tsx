import { Image } from "expo-image";
import { Mic2, Play, Volume2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { LearningItemMedia, MediaRole } from "@/data/types";
import { getWebMediaObjectUrl, isWebMediaUri } from "@/features/media/webMediaStore";
import { colors } from "@/theme";

export function MediaPlaceholder({
  role,
  media,
  large = false
}: {
  role: MediaRole;
  media?: LearningItemMedia;
  large?: boolean;
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
        style={[styles.frame, large ? styles.large : null]}
      />
    );
  }

  const iconColor = role === "mouth_video" ? colors.coral : role === "pronunciation_audio" ? colors.blue : colors.primary;
  const label = roleLabel[role];

  return (
    <View style={[styles.frame, large ? styles.large : null]}>
      {role === "mouth_video" ? <Play color={iconColor} size={large ? 42 : 28} /> : null}
      {role === "pronunciation_audio" ? <Volume2 color={iconColor} size={large ? 42 : 28} /> : null}
      {role === "illustration" ? <Mic2 color={iconColor} size={large ? 42 : 28} /> : null}
      <Text style={styles.text}>{label}</Text>
      {media ? <Text style={styles.source}>{media.asset.source === "custom" ? "Cá nhân hóa" : "Mặc định"}</Text> : null}
    </View>
  );
}

function useDisplayMediaUri(uri: string | null): string | null {
  const [displayUri, setDisplayUri] = useState<string | null>(uri);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    async function resolveUri() {
      if (!uri || !isWebMediaUri(uri)) {
        setDisplayUri(uri);
        return;
      }

      const resolvedUri = await getWebMediaObjectUrl(uri);
      objectUrl = resolvedUri;

      if (!isMounted) {
        if (resolvedUri) {
          URL.revokeObjectURL(resolvedUri);
        }
        return;
      }

      setDisplayUri(resolvedUri);
    }

    void resolveUri();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [uri]);

  return displayUri;
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
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 8,
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
