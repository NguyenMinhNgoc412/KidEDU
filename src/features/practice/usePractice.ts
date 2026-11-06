import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLocalApiClient, ApiRequestError } from "@/api/localClient";
import { useAuth } from "@/features/auth/AuthProvider";
import { useParentDashboard } from "@/features/parent/useParentDashboard";
import { useParentGateStore } from "@/features/parent/parentGate";
import { useLessonRuntimeRepository } from "@/features/lessonRuntime/LessonRuntimeProvider";
import { composePractice, type PracticeDocument } from "./practicePlan";
import type { LessonEvent } from "@/features/lessonRuntime/sessionEngine";
import { recommendPractice } from "@/features/lessonRuntime/lessonRecommendation";
import { activityTypeSchema } from "@/content/contracts/target";
import { flushOutbox } from "@/features/lessonRuntime/flushOutbox";
import { practiceCheckpoint } from "./practiceCheckpoint";

export function usePractice() {
  const dashboard = useParentDashboard();
  const { session, accessTokenValid } = useAuth();
  const { repository } = useLessonRuntimeRepository();
  const client = useQueryClient();
  const childId = dashboard.selected?.id;
  const key = ["practice", session?.accountId, childId];
  const api =
    session && accessTokenValid
      ? createLocalApiClient(
          process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
          session.accessToken
        )
      : null;
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(api && childId),
    queryFn: async () => {
      const [catalog, plan, checkpoints] = await Promise.all([
        api!.getPracticeCatalog(childId!),
        api!.getPracticePlan(childId!),
        api!.getPracticeCheckpoints(childId!)
      ]);
      return {
        catalog,
        plan,
        checkpoints: checkpoints.checkpoints,
        stickers: checkpoints.stickers ?? []
      };
    }
  });
  const local = useQuery({
    queryKey: [...key, "local"],
    enabled: Boolean(repository && childId),
    queryFn: async () => ({
      history: await repository!.history(childId!),
      sessions: await repository!.practiceSessions(childId!),
      stickers: await repository!.stickerCollection(childId!)
    })
  });
  const mutation = useMutation({
    mutationFn: async (document: PracticeDocument) => {
      if (!api || !childId || !query.data || !useParentGateStore.getState().isUnlocked)
        throw new Error("PARENT_REQUIRED");
      return api.savePracticePlan(childId, query.data.plan.revision, document);
    },
    onSuccess: (plan) => {
      client.setQueryData(key, (previous: typeof query.data) =>
        previous ? { ...previous, plan } : previous
      );
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.status === 409)
        void client.invalidateQueries({ queryKey: key });
    }
  });
  const sync = useMutation({
    mutationFn: async () => {
      if (!api || !childId || !repository) throw new Error("AUTH_REQUIRED");
      let remaining = 0;
      for (let batch = 0; batch < 3; batch++) {
        const outcome = await flushOutbox(repository, childId, api);
        remaining = outcome.remaining;
        if (outcome.rejected) throw new Error("OBSERVATION_REJECTED");
        if (!remaining) break;
      }
      if (remaining) throw new Error("SYNC_REMAINS");
      const history = await repository.history(childId);
      if (history.some((row) => row.syncState === "rejected"))
        throw new Error("OBSERVATION_REJECTED");
      for (const saved of await repository.practiceSessions(childId)) {
        if (saved.phase === "paused" || saved.phase === "finished")
          await api.savePracticeCheckpoint(childId, saved.id, practiceCheckpoint(saved));
      }
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: key });
      void client.invalidateQueries({
        queryKey: ["lesson-runtime-history", session?.accountId, childId]
      });
      dashboard.refresh();
    }
  });
  const superseded = new Set(
    dashboard.observations.filter((row) => row.supersededById).map((row) => row.eventId)
  );
  const eventMap = new Map<string, LessonEvent>();
  for (const row of dashboard.observations) {
    if (row.supersededById || !childId) continue;
    const activityType = activityTypeSchema.safeParse(row.activityType);
    if (!activityType.success) continue;
    eventMap.set(row.eventId, {
      schemaVersion: 1,
      eventType: "observation.recorded",
      eventId: row.eventId,
      childId,
      occurredAt: row.occurredAt,
      payload: {
        goalId: row.goalId,
        targetId: row.targetId,
        activityType: activityType.data,
        contentVersion: row.contentVersion,
        result: row.result,
        promptLevel: row.promptLevel,
        context: row.context,
        sessionId: row.sessionId
      }
    });
  }
  for (const { event } of local.data?.history ?? [])
    if (!superseded.has(event.eventId) && !eventMap.has(event.eventId))
      eventMap.set(event.eventId, event);
  const recommendations = Object.fromEntries(
    (query.data?.catalog.lessons ?? []).map((lesson) => [
      lesson.id,
      recommendPractice([...eventMap.values()], {
        childId: childId!,
        goalId: `fixture_goal_${lesson.goalId}`,
        targetId:
          lesson.id === "fixture_lesson_request" ? "fixture_target_water" : `${lesson.id}_target`
      })
    ])
  );
  return {
    stickers: [...new Set([...(query.data?.stickers ?? []), ...(local.data?.stickers ?? [])])],
    recommendations,
    sync: sync.mutateAsync,
    syncing: sync.isPending,
    syncMessage: sync.isError
      ? "Chưa cập nhật được hết. Buổi và ghi nhận vẫn được giữ trên thiết bị."
      : sync.isSuccess
        ? "Đã cập nhật buổi và ghi nhận với server."
        : null,
    dashboard,
    data: query.data,
    composition: query.data ? composePractice(query.data.catalog, query.data.plan.document) : null,
    local: local.data,
    loading: (Boolean(childId) && query.isPending) || dashboard.loading,
    error: query.isError || dashboard.error,
    saving: mutation.isPending,
    saveError: mutation.error,
    save: mutation.mutateAsync,
    refresh: () => {
      if (api && childId) void query.refetch();
      if (repository && childId) void local.refetch();
      dashboard.refresh();
    }
  };
}
