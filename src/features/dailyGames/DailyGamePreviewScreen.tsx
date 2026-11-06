import { useCallback, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { localFixtureEnabled } from "@/features/lessonRuntime/fixtureBoundary";
import { useParentGateStore } from "@/features/parent/parentGate";
import { DailyGameStage } from "./DailyGameStage";
import { GameScreenHeader } from "./GameScreenHeader";
import { useGameNavigationLock } from "./useGameNavigationLock";
import { localPreviewPlan as plan, previewTargets } from "./localPreviewPlan";
import {
  advanceDailyGame,
  initialDailyGameCheckpoint,
  type DailyGameAction
} from "./sessionEngine";

export function DailyGamePreviewScreen() {
  const router = useRouter();
  useGameNavigationLock();
  const [height, setHeight] = useState<number>();
  const unlocked = useParentGateStore((state) => state.isUnlocked);
  const [checkpoint, setCheckpoint] = useState(() => initialDailyGameCheckpoint(plan));
  const current = useRef(checkpoint);
  const [feedback, setFeedback] = useState("");
  const [active, setActive] = useState(false);
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setActive(true);
      return () => {
        focused.current = false;
        setActive(false);
      };
    }, [])
  );
  if (!localFixtureEnabled()) return <Redirect href="/games" />;
  if (!unlocked) return <Redirect href="/parent-gate?destination=game-preview" />;
  function apply(action: DailyGameAction) {
    if (!focused.current || !useParentGateStore.getState().isUnlocked) return;
    const result = advanceDailyGame(plan, current.current, action);
    current.current = result.checkpoint;
    setCheckpoint(result.checkpoint);
    const message =
      result.feedback === "correct"
        ? "Đúng rồi!"
        : result.feedback === "try_again"
          ? "Mình thử lại nhé."
          : "";
    setFeedback(message);
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }
  return (
    <Screen
      scroll={false}
      maxWidth={900}
      contentStyle={{ gap: 8, paddingTop: 4, paddingBottom: 8 }}
    >
      <GameScreenHeader
        title="Bản thử ba trò chơi"
        onBack={() => {
          useParentGateStore.getState().lock();
          router.replace("/games");
        }}
      />
      <Card
        padding="sm"
        style={{ flex: 1, justifyContent: "center" }}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height - 24)}
      >
        <DailyGameStage
          plan={plan}
          checkpoint={checkpoint}
          targets={previewTargets}
          paused={!active}
          availableHeight={height}
          onAction={apply}
        />
      </Card>
      <AppText accessibilityLiveRegion="polite">{feedback}</AppText>
    </Screen>
  );
}
