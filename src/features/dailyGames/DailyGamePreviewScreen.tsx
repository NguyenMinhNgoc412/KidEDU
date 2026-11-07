import { useCallback, useRef, useState } from "react";
import { AccessibilityInfo, AppState } from "react-native";
import { useFeedbackWindow } from "./useFeedbackWindow";
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
  const busy = useRef(false);
  const { wait: waitFeedback, cancel: cancelFeedback } = useFeedbackWindow();
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setActive(true);
      setCheckpoint(current.current);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state !== "active") {
          setActive(false);
          cancelFeedback();
        } else {
          setCheckpoint(current.current);
          setActive(true);
        }
      });
      return () => {
        focused.current = false;
        setActive(false);
        cancelFeedback();
        subscription.remove();
      };
    }, [cancelFeedback])
  );
  if (!localFixtureEnabled()) return <Redirect href="/games" />;
  if (!unlocked) return <Redirect href="/parent-gate?destination=game-preview" />;
  function apply(action: DailyGameAction) {
    if (busy.current || !focused.current || !active || !useParentGateStore.getState().isUnlocked)
      return;
    const result = advanceDailyGame(plan, current.current, action);
    current.current = result.checkpoint;
    if (action.type === "choose_listen") {
      busy.current = true;
      void waitFeedback()
        .then(() => {
          if (
            focused.current &&
            AppState.currentState !== "background" &&
            AppState.currentState !== "inactive"
          )
            setCheckpoint(current.current);
        })
        .finally(() => {
          busy.current = false;
        });
    } else setCheckpoint(result.checkpoint);
    const message =
      action.type === "choose_listen"
        ? ""
        : result.feedback === "correct"
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
