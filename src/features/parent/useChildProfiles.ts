import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import type { components } from "@/api/generated";
import { createLocalApiClient } from "@/api/localClient";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSelectedChildStore } from "./selectedChild";
import { useParentGateStore } from "./parentGate";

export type ChildProfile = components["schemas"]["Child"];
export function useChildProfiles() {
  const { session, accessTokenValid } = useAuth();
  const cache = useQueryClient();
  const selection = useSelectedChildStore();
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const api =
    session && accessTokenValid ? createLocalApiClient(baseUrl, session.accessToken) : null;
  const current = useRef({ accountId: session?.accountId, api });
  current.current = { accountId: session?.accountId, api };
  const query = useQuery({
    queryKey: ["child-profiles", baseUrl, session?.accountId],
    enabled: Boolean(api),
    queryFn: () => api!.listChildren()
  });
  const selected =
    query.data?.find(
      (child) => selection.accountId === session?.accountId && child.id === selection.childId
    ) ?? query.data?.[0];
  const save = useCallback(
    async (child: ChildProfile, name: string, gender: "boy" | "girl") => {
      const { accountId, api: client } = current.current;
      if (!client || !accountId || !useParentGateStore.getState().isUnlocked)
        throw new Error("PARENT_REQUIRED");
      const updated = await client.updateChild(child.id, child.version, {
        displayName: name.trim(),
        ...(!child.gender ? { gender } : {})
      });
      if (current.current.accountId !== accountId || !useParentGateStore.getState().isUnlocked)
        throw new Error("PROFILE_CONTEXT_CHANGED");
      await cache.invalidateQueries({
        predicate: (entry) =>
          ["child-profiles", "parent-dashboard", "daily-game"].includes(String(entry.queryKey[0]))
      });
      return updated;
    },
    [cache]
  );
  return {
    children: api ? (query.data ?? []) : [],
    selected: api ? selected : undefined,
    loading: Boolean(api) && query.isPending,
    error: !api || query.isError,
    save,
    refresh: () => query.refetch(),
    select: (id: string) => {
      if (session && query.data?.some((child) => child.id === id))
        selection.select(session.accountId, id);
    }
  };
}
