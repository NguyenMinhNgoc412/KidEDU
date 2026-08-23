import { Home, RotateCcw, X } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { ControlButton } from "@/components/ControlButton";
import type { LearningItem, PlaybackSpeed } from "@/data/types";
import {
  LearningMediaPlayer,
  type LearningSampleCompletion
} from "@/features/learning/LearningMediaPlayer";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { useLearningSessionGate } from "@/features/session/useLearningSessionGate";
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
  const sessionGate = useLearningSessionGate();

  if (sessionGate !== "active") {
    return (
      <Card>
        <AppText align="center" color="muted">
          {sessionGate === "blocked"
            ? "Đang xử lý dữ liệu. Hãy thử mở bài học lại sau khi hoàn tất."
            : "Đang chuẩn bị bài học"}
        </AppText>
      </Card>
    );
  }

  return (
    <ActiveLearningItemView
      item={item}
      onContinue={onContinue}
      onExit={onExit}
      onReplay={onReplay}
      onSampleCompleted={onSampleCompleted}
      playbackSpeed={playbackSpeed}
    />
  );
}

function ActiveLearningItemView({
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
          <AppText align="center" color="onPrimary" variant="deckTitle">
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
    minWidth: 132,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[10]
  },
  controls: {
    backgroundColor: colors.surfaceLowest,
    borderColor: colors.borderSubtle,
    borderRadius: radii.xl,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: spacing[10],
    justifyContent: "space-between",
    marginTop: spacing[6],
    padding: spacing[12],
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12
  }
});
