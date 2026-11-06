import { useQuery } from "@tanstack/react-query";
import { createLocalApiClient } from "@/api/localClient";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLessonRuntimeRepository } from "@/features/lessonRuntime/LessonRuntimeProvider";

/** Owned rewards are readable independently of catalog access and subscription. */
export function useLegacyCollection(childId: string | undefined) {
  const { session, accessTokenValid } = useAuth();
  const { repository } = useLessonRuntimeRepository();
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const api =
    session && accessTokenValid ? createLocalApiClient(baseUrl, session.accessToken) : null;
  const key = ["owned-legacy-rewards", baseUrl, session?.accountId, childId];
  const remote = useQuery({
    queryKey: [...key, "server"],
    enabled: Boolean(api && childId),
    queryFn: async () => (await api!.getPracticeCheckpoints(childId!)).stickers ?? []
  });
  const local = useQuery({
    queryKey: [...key, "local"],
    enabled: Boolean(session && repository && childId),
    queryFn: () => repository!.stickerCollection(childId!)
  });
  return {
    stickers:
      session && childId
        ? [
            ...new Set([
              ...(api ? (remote.data ?? []) : []),
              ...(repository ? (local.data ?? []) : [])
            ])
          ]
        : [],
    error: remote.isError || local.isError,
    refresh: () => {
      if (api && childId) void remote.refetch();
      if (session && repository && childId) void local.refetch();
    }
  };
}
