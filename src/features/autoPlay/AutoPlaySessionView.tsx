import { Pause, Play, RotateCcw, X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { KidButton } from "@/components/KidButton";
import { StateMessage } from "@/components/StateMessage";
import type { DeckDetail, LearningSettings } from "@/data/types";
import { getAutoPlaySignal } from "@/features/autoPlay/autoPlayEngine";
import { useAutoPlaySession } from "@/features/autoPlay/useAutoPlaySession";
import { LearningMediaPlayer } from "@/features/learning/LearningMediaPlayer";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { colors, radii } from "@/theme";

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
          title={isEmpty ? "Chưa có thẻ phù hợp" : "Con đã học xong bộ này"}
          message={isEmpty ? "Bộ học cần ít nhất một thẻ có nội dung để tự chạy." : `${session.playableItems.length} thẻ đã được phát.`}
        />
        <KidButton icon={<RotateCcw color="#FFFFFF" size={22} />} label="Học lại" onPress={session.restart} />
        <KidButton icon={<X color={colors.primary} size={22} />} label="Về danh sách" onPress={onExitToHome} variant="plain" />
      </View>
    );
  }

  if (!currentItem) {
    return <StateMessage title="Không có thẻ để phát" />;
  }

  const resolved = resolveLearningItemMedia(currentItem);
  const progressLabel = `${session.state.itemIndex + 1}/${session.playableItems.length}`;
  const loopLabel =
    settings.loopMode === "continuous" ? `Vòng ${session.state.loopIndex + 1}` : `Vòng ${session.state.loopIndex + 1}/${loopTotals[settings.loopMode]}`;
  const isPaused = session.state.phase === "paused";
  const sampleAutoPlayKey =
    session.state.phase === "sample"
      ? `${currentItem.id}:${session.state.itemIndex}:${session.state.loopIndex}:${session.state.replayNonce}:sample`
      : null;

  function exit() {
    session.exit();
    onExitToHome();
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.deckTitle}>{deck.title}</Text>
        <Text style={styles.progress}>
          {progressLabel} · {loopLabel}
        </Text>
      </View>

      <Pressable
        accessibilityLabel={isPaused ? "Tiếp tục" : "Tạm dừng"}
        accessibilityRole="button"
        onPress={isPaused ? session.resume : session.pause}
        style={({ pressed }) => [styles.pausePill, pressed ? styles.pressed : null]}
      >
        {isPaused ? <Play color="#FFFFFF" size={17} /> : <Pause color="#FFFFFF" size={17} />}
        <Text style={styles.pauseText}>{isPaused ? "Tiếp tục" : "Tạm dừng"}</Text>
      </Pressable>

      <View style={styles.wordBlock}>
        <View style={styles.wordPill}>
          <Text style={styles.word}>{currentItem.title.toLocaleUpperCase("vi-VN")}</Text>
        </View>
        <Text style={styles.category}>{currentItem.categoryName}</Text>
      </View>

      <LearningMediaPlayer
        autoPlayKey={sampleAutoPlayKey}
        illustration={resolved.byRole.illustration}
        mouthVideo={resolved.byRole.mouth_video}
        paused={session.state.phase !== "sample"}
        pronunciationAudio={resolved.byRole.pronunciation_audio}
      />

      <Text style={styles.signal}>{getAutoPlaySignal(session.state.phase)}</Text>

      <View style={styles.controls}>
        <ControlButton icon={<X color={colors.danger} size={20} />} label="Thoát" onPress={exit} tone="danger" />
        <ControlButton icon={<RotateCcw color={colors.blue} size={20} />} label="Phát lại" onPress={session.replay} tone="info" />
        <ControlButton
          icon={isPaused ? <Play color={colors.primary} size={20} /> : <Pause color={colors.primary} size={20} />}
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
      style={({ pressed }) => [styles.controlButton, controlToneStyles[tone], pressed ? styles.pressed : null]}
    >
      <View style={styles.controlIcon}>{icon}</View>
      <Text style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  completed: {
    gap: 14
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  deckTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
    textAlign: "center"
  },
  progress: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  pausePill: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.coral,
    borderRadius: radii.full,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 26,
    shadowColor: colors.sage,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 14
  },
  pauseText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  wordBlock: {
    alignItems: "center",
    gap: 7
  },
  wordPill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    paddingHorizontal: 28,
    paddingVertical: 12
  },
  word: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 44,
    textAlign: "center"
  },
  category: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center"
  },
  signal: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center"
  },
  controls: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
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

const loopTotals: Record<Exclude<LearningSettings["loopMode"], "continuous">, number> = {
  once: 1,
  three_times: 3
};
