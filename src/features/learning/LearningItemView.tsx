import { Home, RotateCcw, X } from "lucide-react-native";
import type { ReactNode } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import type { LearningItem, PlaybackSpeed } from "@/data/types";
import {
  LearningMediaPlayer,
  type LearningSampleCompletion
} from "@/features/learning/LearningMediaPlayer";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { colors, radii, spacing } from "@/theme";

export function LearningItemView({
  item,
  onReplay,
  onSampleCompleted,
  onExit,
  onContinue,
  playbackSpeed
}: {
  item: LearningItem;
  onReplay?: () => void;
  onSampleCompleted?: (completion: LearningSampleCompletion) => void;
  onExit?: () => void;
  onContinue?: () => void;
  playbackSpeed?: PlaybackSpeed;
}) {
  const [replayCount, setReplayCount] = useState(0);
  const [sampleRequestCount, setSampleRequestCount] = useState(0);
  const resolved = resolveLearningItemMedia(item);

  return (
    <View style={styles.container}>
      <View style={styles.wordBlock}>
        <Card padding="none" style={styles.wordPill} variant="subtle">
          <AppText align="center" color="primary" variant="learningTitle">
            {item.title.toLocaleUpperCase("vi-VN")}
          </AppText>
        </Card>
        <AppText align="center" color="muted" variant="labelStrong">
          {item.categoryName}
        </AppText>
      </View>

      <LearningMediaPlayer
        key={`${item.id}:${sampleRequestCount}`}
        autoPlayKey={`${item.id}:${sampleRequestCount}`}
        illustration={resolved.byRole.illustration}
        mouthVideo={resolved.byRole.mouth_video}
        onAutoPlaySampleEnd={onSampleCompleted}
        playbackSpeed={playbackSpeed}
        pronunciationAudio={resolved.byRole.pronunciation_audio}
      />

      <View style={styles.controls}>
        <ControlButton
          icon={<X color={colors.danger} size={24} />}
          label="Thoát"
          onPress={onExit}
          tone="danger"
        />
        <ControlButton
          icon={<RotateCcw color={colors.blue} size={24} />}
          label={replayCount > 0 ? "Phát lại" : "Phát lại"}
          onPress={() => {
            onReplay?.();
            setReplayCount((count) => count + 1);
            setSampleRequestCount((count) => count + 1);
          }}
          tone="info"
        />
        <ControlButton
          icon={<Home color={colors.primary} size={24} />}
          label="Tiếp tục"
          onPress={onContinue}
          tone="good"
        />
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
      style={({ pressed }) => [
        styles.controlButton,
        controlToneStyles[tone],
        pressed ? styles.pressed : null
      ]}
    >
      <View style={styles.controlIcon}>{icon}</View>
      <AppText align="center" variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[14]
  },
  wordBlock: {
    alignItems: "center",
    gap: spacing[8],
    paddingTop: spacing[4]
  },
  wordPill: {
    paddingHorizontal: spacing[28],
    paddingVertical: spacing[14]
  },
  controls: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.xl,
    flexDirection: "row",
    gap: spacing[10],
    justifyContent: "space-between",
    marginTop: spacing[6],
    padding: spacing[12]
  },
  controlButton: {
    alignItems: "center",
    borderRadius: radii.xl,
    flex: 1,
    gap: spacing[6],
    justifyContent: "center",
    minHeight: 82,
    padding: spacing[8]
  },
  controlIcon: {
    alignItems: "center",
    borderRadius: radii.full,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  pressed: {
    opacity: 0.82
  }
});

const controlToneStyles = StyleSheet.create({
  danger: {
    backgroundColor: colors.dangerSoft
  },
  info: {
    backgroundColor: colors.infoSoft
  },
  good: {
    backgroundColor: colors.successSoft
  }
});
