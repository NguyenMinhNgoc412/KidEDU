import { useCallback, useEffect, useRef, useState } from "react";
import { useFeedbackWindow } from "./useFeedbackWindow";
import { AccessibilityInfo, AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { createLocalApiClient } from "@/api/localClient";
import { localFixtureEnabled } from "@/features/lessonRuntime/fixtureBoundary";
import { useDailyGameRepository } from "./DailyGameRuntimeProvider";
import { localDailyPreparation } from "./localPreparationBoundary";
import { prepareWordArtwork } from "@/features/practice/prepareWordArtwork";
import type { DailyGameLocalState, DailyGameSessionCoordinator } from "./sessionCoordinator";
import { dailyGamePhase, type DailyGameAction } from "./sessionEngine";
export function useDailyGameSession({
  childId,
  accountId,
  token
}: {
  childId?: string;
  accountId?: string;
  token?: string;
}) {
  const { runtime, error: storageError } = useDailyGameRepository();
  const context = useRef({ childId, accountId, token });
  context.current = { childId, accountId, token };
  const [handle, setHandle] = useState<{
    runtime: typeof runtime;
    coordinator: DailyGameSessionCoordinator;
  } | null>(null);
  const coordinator = handle?.runtime === runtime ? (handle?.coordinator ?? null) : null;
  useEffect(() => {
    if (
      !runtime ||
      runtime.repository.accountId !== accountId ||
      !childId ||
      !localFixtureEnabled()
    )
      return;
    const assertIdentity = () => {
      const current = context.current;
      if (current.accountId !== accountId || current.childId !== childId || !current.token)
        throw new Error("DAILY_CONTEXT_CHANGED");
    };
    const getApi = () => {
      assertIdentity();
      return createLocalApiClient(
        process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
        context.current.token!
      );
    };
    const created = runtime.createSession(
      childId,
      getApi,
      localDailyPreparation(getApi, assertIdentity, undefined, prepareWordArtwork)
    );
    setHandle({ runtime, coordinator: created });
    return () => {
      void created.close().catch(() => undefined);
    };
  }, [runtime, accountId, childId]);
  const [state, setState] = useState<DailyGameLocalState | null>(null);
  const [mode, setMode] = useState<
    | "loading"
    | "playing"
    | "between"
    | "paused"
    | "sync"
    | "finishing"
    | "sync_error"
    | "done"
    | "error"
  >("loading");
  const [feedback, setFeedback] = useState("");
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");
  const focused = useRef(false);
  const busy = useRef(false);
  const epoch = useRef(0);
  const { wait: waitFeedback, cancel: cancelFeedback } = useFeedbackWindow();
  const fail = (failure: unknown) => {
    const expired = failure instanceof Error && /EXPIRED|DAY_CHANGED/.test(failure.message);
    setError(
      expired
        ? "Lượt chơi trước đã khép lại. Về Trò chơi để mở lượt hiện tại nhé."
        : "Chưa chuẩn bị xong. Tiến độ đã lưu vẫn được giữ để thử lại."
    );
    setMode("error");
  };
  const prepare = useCallback(() => {
    if (!coordinator || !focused.current || busy.current) return;
    const generation = epoch.current;
    busy.current = true;
    setMode("loading");
    setFeedback("");
    void coordinator
      .prepare()
      .then(({ state: next, playable }) => {
        if (!focused.current || generation !== epoch.current) return;
        setState(next);
        setMode(playable ? "playing" : next.session.completedAt ? "done" : "sync");
      })
      .catch((failure: unknown) => {
        if (focused.current && generation === epoch.current) fail(failure);
      })
      .finally(() => {
        busy.current = false;
      });
  }, [coordinator]);
  const pause = useCallback(() => {
    epoch.current++;
    cancelFeedback();
    setCommitting(false);
    setMode("paused");
    if (coordinator) void coordinator.pauseAndSync().catch(() => undefined);
  }, [coordinator, cancelFeedback]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      epoch.current++;
      prepare();
      const subscription = AppState.addEventListener("change", (next) => {
        if (next !== "active") pause();
      });
      return () => {
        focused.current = false;
        epoch.current++;
        cancelFeedback();
        subscription.remove();
        if (coordinator) void coordinator.pauseAndSync().catch(() => undefined);
      };
    }, [coordinator, pause, prepare, cancelFeedback])
  );
  const sync = useCallback(() => {
    if (!coordinator || busy.current) return;
    const generation = epoch.current;
    busy.current = true;
    setMode("finishing");
    void coordinator
      .pauseAndSync()
      .then(({ outcome, state: next }) => {
        if (!focused.current || generation !== epoch.current) return;
        if (next) setState(next);
        if (outcome === "expired" || outcome === "conflict")
          throw new Error(outcome === "expired" ? "DAILY_SESSION_EXPIRED" : "DAILY_SYNC_CONFLICT");
        setMode(outcome === "synced" && next?.session.completedAt ? "done" : "sync_error");
      })
      .catch((failure: unknown) => {
        if (focused.current && generation === epoch.current) fail(failure);
      })
      .finally(() => {
        busy.current = false;
      });
  }, [coordinator]);
  useEffect(() => {
    if (mode !== "sync" || committing) return;
    const timer = setTimeout(sync, 0);
    return () => clearTimeout(timer);
  }, [mode, committing, sync]);
  const apply = (action: DailyGameAction) => {
    if (!coordinator || busy.current || mode !== "playing" || !focused.current) return;
    const generation = epoch.current;
    busy.current = true;
    setCommitting(true);
    void coordinator
      .apply(action)
      .then(async (result) => {
        if (action.type === "choose_listen" && focused.current && generation === epoch.current)
          await waitFeedback();
        if (!focused.current || generation !== epoch.current) return;
        setState(result.state);
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
        if (result.requiresBoundary) {
          const completed =
            dailyGamePhase(result.state.session.plan, result.state.session.checkpoint) ===
            "completed";
          setMode(completed ? "sync" : "between");
        }
      })
      .catch((failure: unknown) => {
        if (focused.current && generation === epoch.current) fail(failure);
      })
      .finally(() => {
        busy.current = false;
        if (focused.current && generation === epoch.current) setCommitting(false);
      });
  };
  const continueGame = () => {
    if (!coordinator || busy.current) return;
    const generation = epoch.current;
    busy.current = true;
    void coordinator
      .continuePrepared()
      .then(() => {
        if (focused.current && generation === epoch.current) {
          setFeedback("");
          setMode("playing");
        }
      })
      .catch((failure: unknown) => {
        if (focused.current && generation === epoch.current) fail(failure);
      })
      .finally(() => {
        busy.current = false;
      });
  };
  return {
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
  };
}
