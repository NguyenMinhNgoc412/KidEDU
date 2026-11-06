import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import type { components } from "@/api/generated";
import { ApiRequestError, createLocalApiClient } from "@/api/localClient";
import { useDailyGameRepository } from "./DailyGameRuntimeProvider";
import { DailyRewardCoordinator } from "./rewardCoordinator";
type RewardState = components["schemas"]["DailyRewardState"];
export function useDailyReward({
  childId,
  sessionId,
  accountId,
  accessToken
}: {
  childId?: string;
  sessionId?: string;
  accountId?: string;
  accessToken?: string;
}) {
  const { repository, error: storageError } = useDailyGameRepository();
  const api = useRef<ReturnType<typeof createLocalApiClient> | null>(null);
  api.current = accessToken
    ? createLocalApiClient(
        process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
        accessToken
      )
    : null;
  const controller = useMemo(
    () =>
      repository && repository.accountId === accountId && childId && sessionId
        ? new DailyRewardCoordinator(repository, childId, sessionId, () => {
            if (!api.current) throw new Error("AUTH_REQUIRED");
            return api.current;
          })
        : null,
    [repository, accountId, childId, sessionId]
  );
  const [state, setState] = useState<RewardState | null>(null);
  const [pendingBox, setPendingBox] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const focused = useRef(false);
  const epoch = useRef(0);
  const run = useCallback(async (operation: () => Promise<void>) => {
    const generation = epoch.current;
    setBusy(true);
    setError(false);
    try {
      await operation();
    } catch (failure) {
      if (focused.current && generation === epoch.current) {
        if (failure instanceof ApiRequestError && failure.status === 410)
          setState((old) => (old ? { ...old, state: "expired" } : old));
        else setError(true);
      }
    } finally {
      if (focused.current && generation === epoch.current) setBusy(false);
    }
  }, []);
  const recover = useCallback(() => {
    if (!controller) return;
    const generation = epoch.current;
    void run(async () => {
      const recovered = await controller.recover();
      if (focused.current && generation === epoch.current) {
        setState(recovered.state);
        setPendingBox(recovered.pendingBox);
      }
    });
  }, [controller, run]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      epoch.current++;
      recover();
      const subscription = AppState.addEventListener("change", (next) => {
        epoch.current++;
        focused.current = next === "active";
        if (focused.current) recover();
      });
      return () => {
        subscription.remove();
        focused.current = false;
        epoch.current++;
      };
    }, [recover])
  );
  useEffect(() => () => controller?.close(), [controller]);
  const claim = (box: number) => {
    if (!controller || busy) return;
    const generation = epoch.current;
    // Disable every box immediately; retries recover the choice persisted before I/O.
    setPendingBox(box);
    void run(async () => {
      const receipt = await controller.claim(box);
      if (focused.current && generation === epoch.current)
        setState((old) => (old ? { ...old, state: "claimed", receipt } : old));
    });
  };
  const choose = (kind: "sticker" | "puzzle_piece") => {
    if (!controller || busy) return;
    const generation = epoch.current;
    void run(async () => {
      const next = await controller.chooseKind(kind);
      if (focused.current && generation === epoch.current) setState(next);
    });
  };
  return {
    state,
    pendingBox,
    busy,
    error,
    storageError,
    available: Boolean(controller),
    recover,
    claim,
    choose
  };
}
