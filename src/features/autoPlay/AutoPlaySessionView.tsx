import { Image } from "expo-image";
import { Pause, Play, RotateCcw, X } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { CelebrationView } from "@/components/CelebrationView";
import { ChildProgressIndicator } from "@/components/ChildProgressIndicator";
import { ControlButton } from "@/components/ControlButton";
import { KidButton } from "@/components/KidButton";
import { StateMessage } from "@/components/StateMessage";
import { isBundledDefaultMediaUri } from "@/data/defaultMediaRegistry";
import type { DeckDetail, LearningSettings } from "@/data/types";
import { getAutoPlaySignal } from "@/features/autoPlay/autoPlayEngine";
import {
  getAutoPlayPreloadMediaUris,
  getAutoPlayPreloadVisualUri
} from "@/features/autoPlay/autoPlayTimeline";
import { useAutoPlaySession } from "@/features/autoPlay/useAutoPlaySession";
import { LearningMediaPlayer } from "@/features/learning/LearningMediaPlayer";
import {
  preloadBundledDefaultMediaUris,
  resolveBundledDefaultMediaUri
} from "@/features/media/bundledMediaAssetResolver";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { useLearningSessionGate } from "@/features/session/useLearningSessionGate";
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
  const sessionGate = useLearningSessionGate();

  if (sessionGate !== "active") {
    return (
      <StateMessage
        title={sessionGate === "blocked" ? "Chưa thể bắt đầu bộ học" : "Đang chuẩn bị bộ học"}
        message={
          sessionGate === "blocked"
            ? "KidEDU đang xử lý dữ liệu. Hãy thử mở lại bộ học sau khi hoàn tất."
            : undefined
        }
      />
    );
  }

  return <ActiveAutoPlaySessionView deck={deck} settings={settings} onExitToHome={onExitToHome} />;
}

function ActiveAutoPlaySessionView({
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

  useEffect(() => {
    const nextItem = session.nextItem;
    if (!nextItem) {
      return;
    }

    let isCurrentPreload = true;

    async function preloadNextItem() {
      const mediaUris = getAutoPlayPreloadMediaUris(nextItem);
      await preloadBundledDefaultMediaUris(mediaUris);

      const visualUri = getAutoPlayPreloadVisualUri(nextItem);
      const resolvedVisualUri =
        visualUri && isBundledDefaultMediaUri(visualUri)
          ? await resolveBundledDefaultMediaUri(visualUri)
          : visualUri;

      if (isCurrentPreload && resolvedVisualUri) {
        await Image.prefetch(resolvedVisualUri, "memory-disk");
      }
    }

    void preloadNextItem().catch(() => undefined);

    return () => {
      isCurrentPreload = false;
    };
  }, [session.nextItem]);

  if (session.state.phase === "completed") {
    const isEmpty = session.state.completedReason === "no_valid_items";

    if (isEmpty) {
      return (
        <View style={styles.completed}>
          <StateMessage
            title="Chưa có thẻ trong bộ"
            message="Phụ huynh hãy thêm ít nhất một thẻ trước khi bắt đầu."
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

    return (
      <View style={styles.completed}>
        <CelebrationView
          exitLabel="Về danh sách"
          onExit={onExitToHome}
          onRestart={session.restart}
          restartLabel="Học lại"
          title="Bé giỏi quá! 🌟"
          totalItems={session.playableItems.length}
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
        <AppText align="center" color="muted" variant="caption">
          {progressLabel} · {loopLabel}
        </AppText>
      </View>

      <ChildProgressIndicator
        currentIndex={session.state.itemIndex}
        loopIndex={session.state.loopIndex}
        total={session.playableItems.length}
        totalLoops={settings.loopCount}
      />

      <Pressable
        accessibilityLabel={isPaused ? "Tiếp tục bộ học" : "Tạm dừng bộ học"}
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
          {isPaused ? "Tiếp tục bộ học" : "Tạm dừng bộ học"}
        </AppText>
      </Pressable>

      <View style={styles.wordBlock}>
        <Card padding="none" style={styles.wordPill} variant="subtle">
          <AppText align="center" color="onPrimary" variant="deckTitle">
            {currentItem.title.toLocaleUpperCase("vi-VN")}
          </AppText>
        </Card>
        <AppText align="center" color="muted" variant="labelStrong">
          {currentItem.categoryName}
        </AppText>
      </View>

      <LearningMediaPlayer
        autoPlayKey={sampleAutoPlayKey}
        illustration={resolved.byRole.illustration}
        manageAppStateExternally
        mouthVideo={resolved.byRole.mouth_video}
        onAutoPlaySampleEnd={session.completeCurrentSample}
        onRequestResume={isPaused ? session.resume : undefined}
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

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    gap: spacing[8],
    width: "100%"
  },
  completed: {
    alignSelf: "stretch",
    gap: spacing[12],
    width: "100%"
  },
  topBar: {
    alignItems: "center",
    alignSelf: "stretch",
    gap: spacing[2],
    justifyContent: "center",
    width: "100%"
  },
  deckTitle: {
    width: "100%"
  },
  pausePill: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.coral,
    borderRadius: radii.full,
    flexDirection: "row",
    gap: spacing[8],
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing[20],
    elevation: 3,
    shadowColor: colors.primaryDark,
    shadowOffset: { height: spacing[8], width: spacing.none },
    shadowOpacity: 0.12,
    shadowRadius: spacing[14]
  },
  wordBlock: {
    alignItems: "center",
    alignSelf: "stretch",
    gap: spacing[4],
    width: "100%"
  },
  wordPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
    minWidth: 120,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[6]
  },
  controls: {
    alignSelf: "stretch",
    backgroundColor: colors.surfaceLowest,
    borderColor: colors.borderSubtle,
    borderRadius: radii.xl,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: spacing[8],
    justifyContent: "space-between",
    padding: spacing[10],
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: "100%"
  },
  pressed: {
    opacity: 0.82
  }
});
