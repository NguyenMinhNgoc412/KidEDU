import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Volume2, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { StateMessage } from "@/components/StateMessage";
import { bundledCelebrationSoundModule } from "@/data/defaultMediaRegistry";
import { useDeckDetailQuery, useLearningItemsQuery } from "@/data/queries";
import type { LearningItem } from "@/data/types";
import { useDisplayMediaUri } from "@/features/media/useDisplayMediaUri";
import {
  createMiniTestQuestions,
  type MiniTestQuestion
} from "@/features/review/miniTestQuestions";
import { useMiniTestSession } from "@/features/review/useMiniTestSession";
import { colors, radii, spacing } from "@/theme";

export default function MiniTestScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const deckQuery = useDeckDetailQuery(deckId);
  const allItemsQuery = useLearningItemsQuery({ childOnly: true });
  const [runKey, setRunKey] = useState(0);
  const questions = useMemo(
    () =>
      createMiniTestQuestions(deckQuery.data?.items ?? [], allItemsQuery.data ?? [], {
        random: Math.random
      }),
    [allItemsQuery.data, deckQuery.data?.items, runKey]
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [celebration, setCelebration] = useState<"answer" | "final" | null>(null);
  const [finished, setFinished] = useState(false);
  const celebrationStarted = useRef(false);
  const { complete, restart } = useMiniTestSession(deckId);
  const handleAudioStart = useCallback(() => setAudioReady(false), []);
  const handleAudioReady = useCallback(() => setAudioReady(true), []);
  const question = questions[questionIndex];
  const celebrationPlayer = useAudioPlayer(bundledCelebrationSoundModule, {
    updateInterval: 250
  });
  const celebrationStatus = useAudioPlayerStatus(celebrationPlayer);

  const resetRun = useCallback(() => {
    celebrationPlayer.pause();
    setCelebration(null);
    setFinished(false);
    setQuestionIndex(0);
    setAudioReady(false);
    setRunKey((current) => current + 1);
    restart();
  }, [celebrationPlayer, restart]);

  useEffect(() => {
    if (!question || finished || celebration) {
      return;
    }

    setAudioReady(false);
  }, [finished, question, questionIndex]);

  useEffect(() => {
    if (!celebration || !celebrationStatus.didJustFinish || !celebrationStarted.current) {
      if (celebrationStatus.playing) {
        celebrationStarted.current = true;
      }
      return;
    }

    celebrationStarted.current = false;
    setCelebration(null);
    if (celebration === "final") {
      complete();
      setFinished(true);
      return;
    }

    if (questionIndex + 1 >= questions.length) {
      celebrationStarted.current = false;
      setCelebration("final");
      void celebrationPlayer.seekTo(0).catch(() => undefined);
      celebrationPlayer.play();
      return;
    }

    setQuestionIndex((current) => current + 1);
  }, [celebration, celebrationPlayer, celebrationStatus.didJustFinish, celebrationStatus.playing, complete, questionIndex, questions.length]);

  useEffect(() => {
    if (!question || finished || celebration || audioReady) {
      return;
    }

    // The player source is replaced by QuestionAudio below; this effect only gives
    // the first render a chance to resolve the local asset before accepting taps.
  }, [audioReady, celebration, finished, question]);

  if (deckQuery.isLoading || allItemsQuery.isLoading) {
    return <Screen><StateMessage title="Đang chuẩn bị mini test" /></Screen>;
  }

  if (!deckQuery.data) {
    return <Screen><StateMessage title="Không tìm thấy bộ học" /></Screen>;
  }

  if (questions.length === 0) {
    return (
      <Screen>
        <StateMessage
          title="Chưa đủ nội dung để ôn"
          message="Bộ học cần ít nhất hai thẻ có cả hình minh họa và âm phát âm local."
        />
        <KidButton label="Học tiếp" onPress={() => router.replace("/decks")} variant="plain" />
      </Screen>
    );
  }

  if (finished) {
    return (
      <Screen>
        <CompletionMenu
          onGames={() => router.replace(`/games/${deckId}`)}
          onHome={() => router.replace("/decks")}
          onReplay={resetRun}
        />
      </Screen>
    );
  }

  if (!question) {
    return <Screen><StateMessage title="Đang chuẩn bị câu hỏi" /></Screen>;
  }

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Đóng mini test" accessibilityRole="button" onPress={() => setFinished(true)} style={styles.closeButton}>
            <X color={colors.secondary} size={24} />
          </Pressable>
          <AppText color="muted" variant="labelStrong">Ôn tập {questionIndex + 1}/{questions.length}</AppText>
          <View style={styles.headerSpacer} />
        </View>
        <AppText align="center" variant="sectionTitle">Nghe và chọn hình</AppText>
        <QuestionAudio key={`${question.target.id}:${runKey}`} onStart={handleAudioStart} question={question} replayKey={replayKey} onReady={handleAudioReady} />
        <ChoiceGrid audioReady={audioReady} choices={question.choices} targetId={question.target.id} onCorrect={() => {
          setCelebration("answer");
          celebrationStarted.current = false;
          void celebrationPlayer.seekTo(0).catch(() => undefined);
          celebrationPlayer.play();
        }} />
        <KidButton
          disabled={!audioReady}
          icon={<Volume2 color={colors.onPrimary} size={22} />}
          label="Phát lại"
          onPress={() => setReplayKey((current) => current + 1)}
          size="lg"
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

function QuestionAudio({ question, replayKey, onStart, onReady }: { question: MiniTestQuestion; replayKey: number; onStart: () => void; onReady: () => void }) {
  const uri = useDisplayMediaUri(question.targetAudio.asset.uri);
  const source = useMemo(() => (uri ? { uri } : null), [uri]);
  const player = useAudioPlayer(source, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const started = useRef(false);

  useEffect(() => {
    started.current = false;
    if (!uri) {
      return;
    }
    onStart();
    void player.seekTo(0).then(() => {
      started.current = true;
      player.play();
    }).catch(() => onReady());
  }, [onReady, onStart, player, replayKey, uri]);

  useEffect(() => {
    if (status.didJustFinish && started.current) {
      started.current = false;
      onReady();
    }
  }, [onReady, status.didJustFinish]);

  return null;
}

function ChoiceGrid({ choices, targetId, audioReady, onCorrect }: { choices: readonly LearningItem[]; targetId: string; audioReady: boolean; onCorrect: () => void }) {
  return (
    <View style={[styles.choiceGrid, choices.length > 2 ? styles.choiceGridMany : null]}>
      {choices.map((item) => <ChoiceCard key={item.id} audioReady={audioReady} isTarget={item.id === targetId} item={item} onCorrect={onCorrect} />)}
    </View>
  );
}

function ChoiceCard({ item, isTarget, audioReady, onCorrect }: { item: LearningItem; isTarget: boolean; audioReady: boolean; onCorrect: () => void }) {
  const uri = useDisplayMediaUri(item.media.find((media) => media.role === "illustration" && media.isActive)?.asset.uri ?? null);
  const shake = useRef(new Animated.Value(0)).current;
  const [selected, setSelected] = useState(false);

  function select() {
    if (!audioReady || selected) return;
    if (isTarget) {
      setSelected(true);
      onCorrect();
      return;
    }
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true })
    ]).start();
  }

  return (
    <Animated.View style={[styles.choice, selected ? styles.choiceCorrect : null, { transform: [{ translateX: shake }, { scale: selected ? 1.04 : 1 }] }]}>
      <Pressable accessibilityLabel="Hình lựa chọn" accessibilityRole="button" disabled={!audioReady} onPress={select} style={styles.choicePressable}>
        {uri ? <Image contentFit="contain" source={{ uri }} style={styles.choiceImage} /> : <AppText color="muted" variant="label">Đang chuẩn bị hình</AppText>}
      </Pressable>
    </Animated.View>
  );
}

function CompletionMenu({ onReplay, onGames, onHome }: { onReplay: () => void; onGames: () => void; onHome: () => void }) {
  return (
    <View style={styles.completion}>
      <AppText align="center" variant="screenTitle">Giỏi lắm!</AppText>
      <AppText align="center" color="muted" variant="body">Mình cùng chọn hoạt động tiếp theo nhé.</AppText>
      <Card style={styles.completionCard} variant="surface">
        <KidButton label="Làm lại" onPress={onReplay} size="lg" />
        <KidButton label="Trò chơi" onPress={onGames} size="lg" variant="secondary" />
        <KidButton label="Học tiếp" onPress={onHome} size="lg" variant="plain" />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing[16], justifyContent: "center" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  closeButton: { alignItems: "center", borderRadius: radii.full, height: 44, justifyContent: "center", width: 44 },
  headerSpacer: { width: 44 },
  choiceGrid: { flexDirection: "row", gap: spacing[16], justifyContent: "center", width: "100%" },
  choiceGridMany: { flexWrap: "wrap" },
  choice: { backgroundColor: colors.surface, borderRadius: radii.lg, minHeight: 144, overflow: "hidden", width: "46%" },
  choicePressable: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 144, padding: spacing[8] },
  choiceImage: { height: "100%", width: "100%" },
  choiceCorrect: { backgroundColor: colors.successSoft, shadowColor: colors.sage, shadowOpacity: 0.3, shadowRadius: spacing[16] },
  completion: { flex: 1, gap: spacing[16], justifyContent: "center" },
  completionCard: { gap: spacing[12], padding: spacing[16] }
});
