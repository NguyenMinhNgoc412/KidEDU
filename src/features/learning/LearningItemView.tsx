import { Home, RotateCcw, X } from "lucide-react-native";
import type { ReactNode } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { LearningItem } from "@/data/types";
import { LearningMediaPlayer } from "@/features/learning/LearningMediaPlayer";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { colors, radii } from "@/theme";

export function LearningItemView({
  item,
  onReplay,
  onExit,
  onContinue
}: {
  item: LearningItem;
  onReplay?: () => void;
  onExit?: () => void;
  onContinue?: () => void;
}) {
  const [replayCount, setReplayCount] = useState(0);
  const [sampleRequestCount, setSampleRequestCount] = useState(0);
  const resolved = resolveLearningItemMedia(item);

  return (
    <View style={styles.container}>
      <View style={styles.wordBlock}>
        <View style={styles.wordPill}>
          <Text style={styles.word}>{item.title.toLocaleUpperCase("vi-VN")}</Text>
        </View>
        <Text style={styles.category}>{item.categoryName}</Text>
      </View>

      <LearningMediaPlayer
        autoPlayKey={`${item.id}:${sampleRequestCount}`}
        illustration={resolved.byRole.illustration}
        mouthVideo={resolved.byRole.mouth_video}
        pronunciationAudio={resolved.byRole.pronunciation_audio}
      />

      <View style={styles.controls}>
        <ControlButton icon={<X color={colors.danger} size={20} />} label="Thoát" onPress={onExit} tone="danger" />
        <ControlButton
          icon={<RotateCcw color={colors.blue} size={20} />}
          label={replayCount > 0 ? "Phát lại" : "Phát lại"}
          onPress={() => {
            onReplay?.();
            setReplayCount((count) => count + 1);
            setSampleRequestCount((count) => count + 1);
          }}
          tone="info"
        />
        <ControlButton icon={<Home color={colors.primary} size={20} />} label="Tiếp tục" onPress={onContinue} tone="good" />
      </View>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  tone
}: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  tone: "danger" | "info" | "good";
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.controlButton, controlToneStyles[tone], pressed ? styles.pressed : null]}
    >
      <View style={styles.controlIcon}>{icon}</View>
      <Text style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14
  },
  wordBlock: {
    alignItems: "center",
    gap: 8,
    paddingTop: 4
  },
  wordPill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    paddingHorizontal: 28,
    paddingVertical: 14
  },
  word: {
    color: colors.primary,
    fontSize: 40,
    fontWeight: "900",
    lineHeight: 48,
    textAlign: "center"
  },
  category: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  },
  controls: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginTop: 6,
    padding: 12
  },
  controlButton: {
    alignItems: "center",
    borderRadius: radii.lg,
    flex: 1,
    gap: 6,
    justifyContent: "center",
    minHeight: 70,
    padding: 8
  },
  controlIcon: {
    alignItems: "center",
    borderRadius: radii.full,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  controlLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  },
  pressed: {
    opacity: 0.82
  }
});

const controlToneStyles = StyleSheet.create({
  danger: {
    backgroundColor: "#FFF1F0"
  },
  info: {
    backgroundColor: "#ECF6FF"
  },
  good: {
    backgroundColor: "#F1F8E8"
  }
});
