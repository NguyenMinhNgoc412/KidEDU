import { Pause, Play, RotateCcw, X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { StateMessage } from "@/components/StateMessage";
import type { DeckDetail, LearningSettings } from "@/data/types";
import { getAutoPlaySignal } from "@/features/autoPlay/autoPlayEngine";
import { useAutoPlaySession } from "@/features/autoPlay/useAutoPlaySession";
import { LearningMediaPlayer } from "@/features/learning/LearningMediaPlayer";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { colors, radii, spacing } from "@/theme";

export function AutoPlaySessionView({
  deck,
  settings,
  onExitToHome
}: {
  deck: DeckDetail;
  settings: LearningSettings;
  onExitToHome: () => void;
}) {
  const session = useAutoPlaySession(deck, settings);
  const currentItem = session.currentItem;

  if (session.state.phase === "completed") {
    const isEmpty = session.state.completedReason === "no_valid_items";

    return (
      <View style={styles.completed}>
        <StateMessage
          title={isEmpty ? "Chưa có thẻ trong bộ" : "Con đã học xong bộ này"}
          message={
            isEmpty
              ? "Phụ huynh hãy thêm ít nhất một thẻ trước khi bắt đầu."
              : `${session.playableItems.length} thẻ đã được phát.`
          }
        />
        <KidButton
          icon={<RotateCcw color={colors.onPrimary} size={22} />}
          label="Học lại"
          onPress={session.restart}
        />
        <KidButton
          icon={<X color={colors.primary} size={22} />}
          label="Về danh sách"
          onPress={onExitToHome}
          variant="plain"
        />
      </View>
    );
  }

  if (!currentItem) {
    return <StateMessage title="Không có thẻ để phát" />;
  }

  const resolved = resolveLearningItemMedia(currentItem);
  const progressLabel = `${session.state.itemIndex + 1}/${session.playableItems.length}`;
  const loopLabel =
    settings.loopCount === null
      ? `Vòng ${session.state.loopIndex + 1}`
      : `Vòng ${session.state.loopIndex + 1}/${settings.loopCount}`;
  const isPaused = session.state.phase === "paused";
  const sampleAutoPlayKey =
    session.state.phase === "sample"
      ? `${currentItem.id}:${session.state.itemIndex}:${session.state.loopIndex}:${session.state.replayNonce}:sample`
      : null;
  const mediaPlaybackKey = `${currentItem.id}:${session.state.itemIndex}:${session.state.loopIndex}:${session.state.replayNonce}`;

  function exit() {
    session.exit();
    onExitToHome();
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <AppText align="center" style={styles.deckTitle} variant="bodyStrong">
          {deck.title}
        </AppText>
        <AppText color="muted" variant="caption">
          {progressLabel} · {loopLabel}
        </AppText>
      </View>

      <Pressable
        accessibilityLabel={isPaused ? "Tiếp tục" : "Tạm dừng"}
        accessibilityRole="button"
        onPress={isPaused ? session.resume : session.pause}
        style={({ pressed }) => [styles.pausePill, pressed ? styles.pressed : null]}
      >
        {isPaused ? (
          <Play color={colors.onPrimary} size={20} />
        ) : (
          <Pause color={colors.onPrimary} size={20} />
        )}
        <AppText color="onPrimary" variant="labelStrong">
          {isPaused ? "Tiếp tục" : "Tạm dừng"}
        </AppText>
      </Pressable>

      <View style={styles.wordBlock}>
        <Card padding="none" style={styles.wordPill} variant="subtle">
          <AppText align="center" color="primary" variant="learningTitle">
            {currentItem.title.toLocaleUpperCase("vi-VN")}
          </AppText>
        </Card>
        <AppText align="center" color="muted" variant="labelStrong">
          {currentItem.categoryName}
        </AppText>
      </View>

      <LearningMediaPlayer
        key={mediaPlaybackKey}
        autoPlayKey={sampleAutoPlayKey}
        illustration={resolved.byRole.illustration}
        mouthVideo={resolved.byRole.mouth_video}
        onAutoPlaySampleEnd={session.completeCurrentSample}
        paused={session.state.phase !== "sample"}
        playbackSpeed={settings.playbackSpeed}
        pronunciationAudio={resolved.byRole.pronunciation_audio}
      />

      <AppText align="center" color="secondary" variant="fieldLabel">
        {getAutoPlaySignal(session.state.phase)}
      </AppText>

      <View style={styles.controls}>
        <ControlButton
          icon={<X color={colors.danger} size={24} />}
          label="Thoát"
          onPress={exit}
          tone="danger"
        />
        <ControlButton
          icon={<RotateCcw color={colors.blue} size={24} />}
          label="Phát lại"
          onPress={session.replay}
          tone="info"
        />
        <ControlButton
          icon={
            isPaused ? (
              <Play color={colors.primary} size={24} />
            ) : (
              <Pause color={colors.primary} size={24} />
            )
          }
          label={isPaused ? "Tiếp tục" : "Tạm dừng"}
          onPress={isPaused ? session.resume : session.pause}
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
    gap: spacing[12]
  },
  completed: {
    gap: spacing[14]
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[12],
    justifyContent: "space-between"
  },
  deckTitle: {
    flex: 1
  },
  pausePill: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.coral,
    borderRadius: radii.full,
    flexDirection: "row",
    gap: spacing[8],
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing[26],
    shadowColor: colors.sage,
    shadowOffset: { height: spacing[8], width: spacing.none },
    shadowOpacity: 0.12,
    shadowRadius: spacing[14]
  },
  wordBlock: {
    alignItems: "center",
    gap: spacing[7]
  },
  wordPill: {
    paddingHorizontal: spacing[28],
    paddingVertical: spacing[12]
  },
  controls: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.xl,
    flexDirection: "row",
    gap: spacing[10],
    justifyContent: "space-between",
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
