import { RotateCcw } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/Badge";
import { KidButton } from "@/components/KidButton";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import type { LearningItem } from "@/data/types";
import { getContentStatusLabel, resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { colors } from "@/theme";

export function LearningItemView({ item, onReplay }: { item: LearningItem; onReplay?: () => void }) {
  const [replayCount, setReplayCount] = useState(0);
  const resolved = resolveLearningItemMedia(item);
  const label = getContentStatusLabel(item);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.word}>{item.title}</Text>
        <Text style={styles.category}>{item.categoryName}</Text>
        <Badge label={label} tone={label === "Cần bổ sung" ? "warn" : label === "Đã cá nhân hóa" ? "info" : "good"} />
      </View>

      <MediaPlaceholder large media={resolved.byRole.illustration ?? resolved.byRole.mouth_video} role={resolved.byRole.illustration ? "illustration" : "mouth_video"} />

      <View style={styles.mediaGrid}>
        <MediaPlaceholder media={resolved.byRole.mouth_video} role="mouth_video" />
        <MediaPlaceholder media={resolved.byRole.pronunciation_audio} role="pronunciation_audio" />
      </View>

      <KidButton
        icon={<RotateCcw color="#FFFFFF" size={22} />}
        label={replayCount > 0 ? `Phát lại ${replayCount}` : "Phát lại"}
        onPress={() => {
          onReplay?.();
          setReplayCount((count) => count + 1);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  word: {
    color: colors.text,
    fontSize: 48,
    fontWeight: "900",
    textAlign: "center"
  },
  category: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center"
  },
  mediaGrid: {
    flexDirection: "row",
    gap: 12
  }
});
