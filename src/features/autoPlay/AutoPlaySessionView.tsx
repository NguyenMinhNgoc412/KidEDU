import { Pause, Play, RotateCcw, X } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { KidButton } from "@/components/KidButton";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { StateMessage } from "@/components/StateMessage";
import type { DeckDetail, LearningSettings } from "@/data/types";
import { getAutoPlaySignal } from "@/features/autoPlay/autoPlayEngine";
import { useAutoPlaySession } from "@/features/autoPlay/useAutoPlaySession";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { colors } from "@/theme";

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
  const loopLabel = settings.loopMode === "continuous" ? `Vòng ${session.state.loopIndex + 1}` : `Vòng ${session.state.loopIndex + 1}`;
  const isPaused = session.state.phase === "paused";

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

      <View style={styles.signalWrap}>
        <Text style={styles.signal}>{getAutoPlaySignal(session.state.phase)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.word}>{currentItem.title}</Text>
        <Text style={styles.category}>{currentItem.categoryName}</Text>
        <MediaPlaceholder large media={resolved.byRole.illustration ?? resolved.byRole.mouth_video} role={resolved.byRole.illustration ? "illustration" : "mouth_video"} />
        <View style={styles.mediaGrid}>
          <MediaPlaceholder media={resolved.byRole.mouth_video} role="mouth_video" />
          <MediaPlaceholder media={resolved.byRole.pronunciation_audio} role="pronunciation_audio" />
        </View>
      </View>

      <View style={styles.controls}>
        {isPaused ? (
          <KidButton icon={<Play color="#FFFFFF" size={22} />} label="Tiếp tục" onPress={session.resume} />
        ) : (
          <KidButton icon={<Pause color="#FFFFFF" size={22} />} label="Tạm dừng" onPress={session.pause} />
        )}
        <KidButton icon={<RotateCcw color="#FFFFFF" size={22} />} label="Phát lại" onPress={session.replay} variant="secondary" />
        <KidButton icon={<X color="#FFFFFF" size={22} />} label="Thoát" onPress={exit} variant="danger" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14
  },
  completed: {
    gap: 14
  },
  topBar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 12
  },
  deckTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: "900"
  },
  progress: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  signalWrap: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 8,
    padding: 12
  },
  signal: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14
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
  },
  controls: {
    gap: 10
  }
});
