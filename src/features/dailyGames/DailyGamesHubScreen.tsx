import { useCallback, useRef } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { ChildTabBar } from "@/components/ChildTabBar";
import { useDailyGameHub } from "./useDailyGameHub";
import { localFixtureEnabled } from "@/features/lessonRuntime/fixtureBoundary";
import { useParentGateStore } from "@/features/parent/parentGate";

export function DailyGamesHubScreen() {
  const hub = useDailyGameHub();
  const router = useRouter();
  const refresh = useRef(hub.refresh);
  refresh.current = hub.refresh;
  useFocusEffect(
    useCallback(() => {
      refresh.current();
    }, [])
  );
  const completed = hub.status?.state === "completed";
  return (
    <Screen bottomBar={<ChildTabBar active="games" />}>
      <AppText variant="screenTitle">Trò chơi</AppText>
      <AppText color="muted">Ba trò nhỏ, cùng con khám phá.</AppText>
      <Card>
        {completed ? (
          <>
            <AppText variant="cardTitle">Mình đã chơi xong hôm nay</AppText>
            <AppText>Lượt mới mở lúc 00:00 theo giờ Việt Nam.</AppText>
            <KidButton label="Vào chơi" disabled />
            <KidButton
              label="Xem quà hôm nay"
              variant="plain"
              onPress={() => router.push("/daily-reward")}
            />
          </>
        ) : hub.status?.canStart && localFixtureEnabled() ? (
          <>
            <AppText variant="cardTitle">Cùng chơi ba trò hôm nay</AppText>
            <KidButton
              label={hub.status.state === "resumable" ? "Tiếp tục" : "Vào chơi"}
              onPress={() => router.push("/daily-game")}
            />
          </>
        ) : localFixtureEnabled() ? (
          <>
            <AppText variant="cardTitle">Chơi thử ba trò</AppText>
            <AppText>Cùng phụ huynh thử tìm bóng, chọn hình và tìm đôi.</AppText>
            <KidButton
              label="Vào chơi thử"
              onPress={() => {
                useParentGateStore.getState().lock();
                router.push("/parent-gate?destination=game-preview");
              }}
            />
          </>
        ) : hub.loading ? (
          <AppText>Đang chuẩn bị góc chơi…</AppText>
        ) : hub.error ? (
          <>
            <AppText>Chưa kiểm tra được lượt chơi. Mình thử lại nhé.</AppText>
            <KidButton label="Thử lại" onPress={hub.refresh} />
          </>
        ) : !hub.childId ? (
          <>
            <AppText>Nhờ phụ huynh chọn hồ sơ cho con trước khi chơi.</AppText>
            <KidButton label="Nhờ phụ huynh chuẩn bị" onPress={() => router.push("/parent-gate")} />
          </>
        ) : (
          <>
            <AppText variant="cardTitle">Góc chơi đang được chuẩn bị</AppText>
            <AppText>Mình có thể tập nói hoặc xem bộ sưu tập trong lúc chờ.</AppText>
            <KidButton
              label={hub.status?.state === "resumable" ? "Tiếp tục" : "Vào chơi"}
              disabled
            />
          </>
        )}
      </Card>
      <KidButton label="Cùng tập nói" variant="secondary" onPress={() => router.replace("/")} />
    </Screen>
  );
}
