import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/features/auth/AuthProvider";
import { localFixtureEnabled } from "@/features/lessonRuntime/fixtureBoundary";
import { DailyGameStage } from "./DailyGameStage";
import { useDailyGameHub } from "./useDailyGameHub";
import { localDailyTargets } from "./localPreparationBoundary";
import { useDailyGameSession } from "./useDailyGameSession";
import { GameScreenHeader } from "./GameScreenHeader";
import { useGameNavigationLock } from "./useGameNavigationLock";

export function DailyGameSessionScreen() {
  const hub = useDailyGameHub();
  const { session, accessTokenValid } = useAuth();
  return (
    <Session
      key={`${session?.accountId}:${hub.childId}`}
      childId={hub.childId}
      accountId={session?.accountId}
      token={accessTokenValid ? session?.accessToken : undefined}
    />
  );
}

function Session({
  childId,
  accountId,
  token
}: {
  childId?: string;
  accountId?: string;
  token?: string;
}) {
  const router = useRouter();
  useGameNavigationLock();
  const [height, setHeight] = useState<number>();
  const {
    state,
    mode,
    feedback,
    committing,
    error,
    storageError,
    prepare,
    pause,
    sync,
    apply,
    continueGame
  } = useDailyGameSession({ childId, accountId, token });
  useEffect(() => {
    if (mode === "done") router.replace("/daily-reward");
  }, [mode, router]);
  const leave = () => {
    pause();
    router.replace("/games");
  };
  return (
    <Screen scroll={false} maxWidth={900} contentStyle={styles.screen}>
      <GameScreenHeader title="Trò chơi" onBack={leave} />
      <Card
        padding="sm"
        style={styles.board}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height - 24)}
      >
        {storageError || mode === "error" ? (
          <>
            <AppText>
              {storageError ? "Chưa mở được tiến độ trên máy. Vui lòng thử lại." : error}
            </AppText>
            <KidButton label="Thử lại" onPress={prepare} />
          </>
        ) : mode === "done" || mode === "sync" || mode === "finishing" ? (
          <>
            <AppText variant="cardTitle">Mình đã hoàn thành cả ba trò!</AppText>
            <AppText accessibilityLiveRegion="polite">Đang mở góc quà…</AppText>
          </>
        ) : mode === "sync_error" ? (
          <>
            <AppText variant="cardTitle">Mình đã chơi xong!</AppText>
            <AppText>Tiến độ đã lưu trên máy. Kiểm tra kết nối để nhận quà nhé.</AppText>
            <KidButton label="Thử kết nối lại" onPress={sync} />
          </>
        ) : mode === "paused" ? (
          <>
            <AppText variant="cardTitle">Mình nghỉ một chút</AppText>
            <KidButton label="Tiếp tục" onPress={prepare} />
          </>
        ) : mode === "between" ? (
          <>
            <AppText variant="cardTitle">Cùng khám phá trò tiếp theo nhé</AppText>
            <KidButton label="Trò tiếp theo" onPress={continueGame} />
          </>
        ) : mode === "playing" && state ? (
          <DailyGameStage
            plan={state.session.plan}
            checkpoint={state.session.checkpoint}
            targets={localDailyTargets}
            availableHeight={height}
            paused={committing}
            onAction={apply}
          />
        ) : (
          <AppText>
            {localFixtureEnabled()
              ? "Đang chuẩn bị trò chơi…"
              : "Nội dung trò chơi đang được chuẩn bị."}
          </AppText>
        )}
      </Card>
      <View style={styles.feedback}>
        <AppText accessibilityLiveRegion="polite">{feedback}</AppText>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { gap: 8, paddingTop: 4, paddingBottom: 8 },
  board: { flex: 1, justifyContent: "center" },
  feedback: { minHeight: 28 }
});
