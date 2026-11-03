import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { createLocalApiClient } from "@/api/localClient";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLearningAccess } from "@/features/entitlement/LearningAccessProvider";
import { useParentGateStore } from "@/features/parent/parentGate";
import { findSampleLesson, prepareSampleLesson, sampleLessons } from "./lessonCatalog";
import { flushOutbox } from "./flushOutbox";
import { localFixtureEnabled } from "./fixtureBoundary";
import { useLessonRuntimeRepository } from "./LessonRuntimeProvider";
import {
  createLessonSession,
  recordObservation,
  transition,
  type Action,
  type LessonSession,
  type ObservationResult
} from "./sessionEngine";

export function useLessonSession(childId: string | undefined) {
  const queryClient = useQueryClient();
  const { repository, error: databaseError } = useLessonRuntimeRepository();
  const { session: auth, accessTokenValid } = useAuth();
  const access = useLearningAccess();
  const [session, setSession] = useState<LessonSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const current = useRef<LessonSession | null>(null);
  const pending = useRef(false);
  const pauseRequested = useRef(false);
  const alive = useRef(true);
  const key = `${auth?.accountId}:${childId}`;
  const loadedKey = useRef("");
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (
      !repository ||
      !auth ||
      !accessTokenValid ||
      !childId ||
      !localFixtureEnabled() ||
      loadedKey.current === key
    )
      return;
    let active = true;
    const initialize = async () => {
      // One ownership check at preparation; no network request in activity actions.
      const children = await createLocalApiClient(apiUrl, auth.accessToken).listChildren();
      if (!active) return;
      if (!children.some((child) => child.id === childId)) throw new Error("CHILD_NOT_OWNED");
      const selectedId = (await repository.selectedLesson(childId)) ?? sampleLessons[0].id;
      if (!findSampleLesson(selectedId)) throw new Error("UNKNOWN_LESSON");
      const prepared = prepareSampleLesson(__DEV__, selectedId);
      let saved = await repository.load(childId, prepared.generation);
      if (!active) return;
      if (!saved) {
        const id = `lesson_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
        saved = createLessonSession(id, childId, prepared);
        await repository.start(saved);
      }
      if (active) {
        if (AppState.currentState && AppState.currentState !== "active") {
          const paused = transition(saved, { type: "pause" });
          if (paused !== saved) await repository.checkpoint(saved.revision, paused);
          saved = paused;
        }
        loadedKey.current = key;
        current.current = saved;
        setSession(saved);
      }
    };
    void initialize().catch(() => {
      if (active) setError("Chưa chuẩn bị được bài. Về học rồi thử lại.");
    });
    return () => {
      active = false;
    };
  }, [repository, key, auth, accessTokenValid, childId, apiUrl]);

  async function apply(action: Action) {
    const previous = current.current;
    if (!previous || previous.childId !== childId || !repository || pending.current) return;
    if (action.type !== "pause" && AppState.currentState && AppState.currentState !== "active")
      return;
    if (action.type === "pause") pauseRequested.current = false;
    if ((action.type === "start" || action.type === "resume") && access.status !== "allowed") {
      setError("Nhờ phụ huynh kiểm tra kết nối và quyền học trước khi tiếp tục.");
      return;
    }
    const next = transition(previous, action);
    if (next === previous) return;
    pending.current = true;
    setBusy(true);
    try {
      await repository.checkpoint(previous.revision, next);
      current.current = next;
      if (alive.current) {
        setSession(next);
        setError(null);
      }
    } catch {
      if (alive.current) setError("Chưa lưu được bài. Tạm dừng và thử lại.");
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
      if (pauseRequested.current) void applyRef.current({ type: "pause" });
    }
  }
  const applyRef = useRef(apply);
  applyRef.current = apply;
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        pauseRequested.current = true;
        void applyRef.current({ type: "pause" });
      }
    });
    return () => {
      listener.remove();
      pauseRequested.current = true;
      void applyRef.current({ type: "pause" });
    };
  }, []);
  useEffect(() => {
    if (busy || error || session?.phase !== "waiting" || session.waitRemainingMs <= 0) return;
    const startedAt = performance.now();
    const timer = setTimeout(() => {
      if (!AppState.currentState || AppState.currentState === "active")
        void applyRef.current({ type: "elapsed", ms: performance.now() - startedAt });
    }, session.waitRemainingMs);
    return () => clearTimeout(timer);
  }, [session, busy, error]);

  async function observe(result: ObservationResult) {
    const previous = current.current;
    if (!previous || previous.childId !== childId || !repository || pending.current) return;
    if (AppState.currentState && AppState.currentState !== "active") return;
    pending.current = true;
    setBusy(true);
    try {
      const { next, event } = recordObservation(
        previous,
        result,
        new Date().toISOString(),
        useParentGateStore.getState().isUnlocked
      );
      // Activity boundary: no new activity opens with invalid access.
      const guarded =
        next.phase !== "finished" && access.status !== "allowed"
          ? { ...transition(next, { type: "pause" }), revision: next.revision }
          : next;
      await repository.commitObservation(previous, guarded, event);
      void queryClient.invalidateQueries({
        queryKey: ["lesson-runtime-history", auth?.accountId, childId]
      });
      current.current = guarded;
      if (alive.current) {
        setSession(guarded);
        setError(null);
      }
    } catch {
      if (alive.current) setError("Chưa lưu được quan sát. Giữ bài này và thử lại.");
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
      if (pauseRequested.current) void applyRef.current({ type: "pause" });
    }
  }
  async function sync() {
    if (
      !localFixtureEnabled() ||
      !repository ||
      !auth ||
      !accessTokenValid ||
      !childId ||
      session?.phase !== "finished" ||
      pending.current
    )
      return;
    pending.current = true;
    setBusy(true);
    try {
      const outcome = await flushOutbox(
        repository,
        childId,
        createLocalApiClient(apiUrl, auth.accessToken)
      );
      if (alive.current)
        setSyncMessage(
          outcome.rejected
            ? "Một số quan sát cần kiểm tra; dữ liệu vẫn được giữ trên thiết bị."
            : outcome.remaining
              ? "Còn quan sát chờ gửi. Thử lại sau."
              : "Quan sát đã được đồng bộ."
        );
    } catch {
      if (alive.current)
        setSyncMessage("Quan sát đã lưu trên thiết bị. Có thể gửi lại khi có kết nối.");
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return {
    session: session?.childId === childId ? session : null,
    busy,
    error: databaseError ? "Không mở được dữ liệu bài học." : error,
    apply,
    observe,
    sync,
    syncMessage
  };
}
