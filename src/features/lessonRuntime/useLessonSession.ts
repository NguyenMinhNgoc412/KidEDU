import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { createLocalApiClient } from "@/api/localClient";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLearningAccess } from "@/features/entitlement/LearningAccessProvider";
import { useParentGateStore } from "@/features/parent/parentGate";
import { findSampleLesson, prepareSampleLesson, sampleLessons } from "./lessonCatalog";
import { preparePracticeSample } from "@/features/practice/preparePracticeSample";
import { verifyLocalActivityMedia } from "@/features/practice/practiceFixtureMedia";
import { preparePracticeCourse } from "@/features/practice/preparePracticeCourse";
import { composePractice } from "@/features/practice/practicePlan";
import { flushOutbox } from "./flushOutbox";
import { localFixtureEnabled } from "./fixtureBoundary";
import { useLessonRuntimeRepository } from "./LessonRuntimeProvider";
import {
  practiceCheckpoint,
  restorePracticeCheckpoint
} from "@/features/practice/practiceCheckpoint";
import {
  createLessonSession,
  recordObservation,
  transition,
  type Action,
  type LessonSession,
  type ObservationResult
} from "./sessionEngine";

export function useLessonSession(childId: string | undefined, practiceLessonId?: string) {
  const queryClient = useQueryClient();
  const { repository, error: databaseError } = useLessonRuntimeRepository();
  const { session: auth, accessTokenValid } = useAuth();
  const access = useLearningAccess();
  const [session, setSession] = useState<LessonSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [collection, setCollection] = useState<{ scope: string; ids: string[] }>({
    scope: "",
    ids: []
  });
  const current = useRef<LessonSession | null>(null);
  const pending = useRef(false);
  const pauseRequested = useRef(false);
  const alive = useRef(true);
  const key = `${auth?.accountId}:${childId}:${practiceLessonId ?? "learning"}`;
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
      if (practiceLessonId === "fixture_play_today_words")
        throw new Error("DAILY_GAME_ROUTE_REQUIRED");
      const storedSelection =
        practiceLessonId ?? (await repository.selectedLesson(childId)) ?? sampleLessons[0].id;
      const selectedId =
        storedSelection === "fixture_play_today_words" ? sampleLessons[0].id : storedSelection;
      if (!findSampleLesson(selectedId)) throw new Error("UNKNOWN_LESSON");
      const api = createLocalApiClient(apiUrl, auth.accessToken);
      const localStickers = await repository.stickerCollection(childId);
      if (active) setCollection({ scope: key, ids: localStickers });
      const localCourse = practiceLessonId
        ? await repository.load(childId, `practice-course:fixture:${selectedId}:1`)
        : null;
      let prepared;
      let ignoredRemoteSessionId: string | null = null;
      if (practiceLessonId) {
        if (localCourse?.course && localCourse.resumePhase === "observation") {
          prepared = localCourse.prepared;
        } else {
          const [catalog, plan, remote] = await Promise.all([
            api.getPracticeCatalog(childId),
            api.getPracticePlan(childId),
            api.getPracticeCheckpoints(childId)
          ]);
          const remoteCourse = remote.checkpoints.find(
            (item) =>
              item.document.course &&
              item.document.lessonId === selectedId &&
              item.document.phase !== "finished"
          );
          if (active)
            setCollection({
              scope: key,
              ids: [...new Set([...localStickers, ...(remote.stickers ?? [])])]
            });
          const canRestore =
            remoteCourse && !(await repository.hasSession(childId, remoteCourse.sessionId));
          if (remoteCourse && !canRestore) ignoredRemoteSessionId = remoteCourse.sessionId;
          const lessonIds =
            localCourse?.course?.lessonIds ??
            (canRestore
              ? remoteCourse.document.course!.lessonIds
              : composePractice(catalog, plan.document).lessons.map((item) => item.id));
          if (lessonIds[0] !== selectedId) throw new Error("COURSE_PLAN_CHANGED");
          const authorization = await api.preparePracticeLesson(childId, selectedId, lessonIds);
          if (!active) return;
          if (
            authorization.source !== "development_fixture" ||
            authorization.lessonId !== selectedId ||
            authorization.lessonVersion !== 1 ||
            JSON.stringify(authorization.lessonIds) !== JSON.stringify(lessonIds)
          )
            throw new Error("LESSON_NOT_AUTHORIZED");
          prepared =
            localCourse?.prepared ??
            (await preparePracticeCourse(auth.accountId, childId, lessonIds, repository));
        }
      } else {
        prepared =
          "activityType" in findSampleLesson(selectedId)!
            ? await preparePracticeSample(auth.accountId, childId, selectedId, repository)
            : prepareSampleLesson(__DEV__, selectedId);
      }
      let saved = localCourse ?? (await repository.load(childId, prepared.generation));
      if (!active) return;
      if (
        saved?.prepared.media &&
        !(saved.course && saved.resumePhase === "observation") &&
        !(await verifyLocalActivityMedia(
          saved.prepared.activities,
          saved.prepared.media,
          auth.accountId,
          childId
        ))
      )
        throw new Error("MEDIA_REPAIR_REQUIRED");
      if (!saved && practiceLessonId) {
        const remote = await api.getPracticeCheckpoints(childId);
        if (!active) return;
        const checkpoint = remote.checkpoints.find(
          (item) =>
            item.sessionId !== ignoredRemoteSessionId &&
            item.document.lessonId === selectedId &&
            Boolean(item.document.course) &&
            item.document.lessonVersion === prepared.lesson.version &&
            item.document.phase !== "finished"
        );
        // A stale remote pause must not resurrect a session already finished locally.
        if (checkpoint && !(await repository.hasSession(childId, checkpoint.sessionId))) {
          saved = restorePracticeCheckpoint(
            checkpoint.sessionId,
            childId,
            prepared,
            checkpoint.document
          );
          await repository.start(saved);
        }
      }
      if (!saved) {
        const id = `${practiceLessonId ? "practice" : "lesson"}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
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
  }, [repository, key, auth, accessTokenValid, childId, apiUrl, practiceLessonId]);

  async function apply(action: Action) {
    const previous = current.current;
    if (!previous || previous.childId !== childId || !repository || pending.current) return;
    if (action.type !== "pause" && AppState.currentState && AppState.currentState !== "active")
      return;
    if (action.type === "pause") pauseRequested.current = false;
    if (
      (action.type === "start" || action.type === "resume") &&
      access.status !== "allowed" &&
      !(previous.course && previous.resumePhase === "observation")
    ) {
      setError("Nhờ phụ huynh kiểm tra kết nối và quyền học trước khi tiếp tục.");
      return;
    }
    let next = transition(previous, action);
    if (next === previous) return;
    if (
      previous.course &&
      next.index !== previous.index &&
      next.phase === "presenting" &&
      access.status !== "allowed"
    )
      next = { ...transition(next, { type: "pause" }), revision: next.revision };
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
        next.phase !== "finished" &&
        !(next.course && next.phase === "observation") &&
        access.status !== "allowed"
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
      if (practiceLessonId && !outcome.remaining && !outcome.rejected && current.current) {
        await createLocalApiClient(apiUrl, auth.accessToken).savePracticeCheckpoint(
          childId,
          current.current.id,
          practiceCheckpoint(current.current)
        );
        void queryClient.invalidateQueries({ queryKey: ["practice", auth.accountId, childId] });
      }
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
  async function leave() {
    if (pending.current) return false;
    await apply({ type: "pause" });
    const snapshot = current.current;
    if (practiceLessonId && snapshot && auth && repository && accessTokenValid) {
      try {
        const api = createLocalApiClient(apiUrl, auth.accessToken);
        const outcome = await flushOutbox(repository, snapshot.childId, api);
        if (!outcome.remaining && !outcome.rejected)
          await api.savePracticeCheckpoint(
            snapshot.childId,
            snapshot.id,
            practiceCheckpoint(snapshot)
          );
      } catch {
        /* Durable local checkpoint/outbox remain the recovery source. */
      }
      void queryClient.invalidateQueries({
        queryKey: ["practice", auth.accountId, snapshot.childId]
      });
    }
    return true;
  }
  return {
    collection: collection.scope === key ? collection.ids : [],
    session: session?.childId === childId ? session : null,
    busy,
    error: databaseError ? "Không mở được dữ liệu bài học." : error,
    apply,
    observe,
    sync,
    leave,
    syncMessage
  };
}
