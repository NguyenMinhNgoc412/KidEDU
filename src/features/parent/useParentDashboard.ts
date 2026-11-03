import { useQuery } from "@tanstack/react-query";

import { createLocalApiClient } from "@/api/localClient";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSelectedChildStore } from "./selectedChild";

export function useParentDashboard() {
  const { session, accessTokenValid } = useAuth();
  const selection = useSelectedChildStore();
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const accountKey = session?.accountId ?? "signed-out";
  const selectedChildId = selection.accountId === accountKey ? selection.childId : null;
  const client =
    session && accessTokenValid ? createLocalApiClient(apiUrl, session.accessToken) : null;

  const overview = useQuery({
    queryKey: ["parent-dashboard", accountKey, "overview"],
    enabled: Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error("AUTH_REQUIRED");
      const [children, subscription] = await Promise.all([
        client.listChildren(),
        client.getSubscription()
      ]);
      return { children, subscription };
    }
  });

  const children = overview.data?.children ?? [];
  const selected = children.find((child) => child.id === selectedChildId) ?? children[0] ?? null;
  const childDetail = useQuery({
    queryKey: ["parent-dashboard", accountKey, "child", selected?.id],
    enabled: Boolean(client && selected),
    queryFn: async () => {
      if (!client || !selected) throw new Error("CHILD_REQUIRED");
      const [plan, observations] = await Promise.all([
        client.getPlan(selected.id),
        client.listObservations(selected.id)
      ]);
      return { plan, observations: observations.observations };
    }
  });

  return {
    children,
    selected,
    selectChild: (childId: string) => {
      if (session && children.some((child) => child.id === childId))
        selection.select(accountKey, childId);
    },
    subscription: overview.data?.subscription ?? null,
    plan: childDetail.data?.plan ?? null,
    observations: childDetail.data?.observations ?? [],
    loading: overview.isPending || (Boolean(selected) && childDetail.isPending),
    error: overview.isError || childDetail.isError,
    refresh: () => {
      void overview.refetch();
      if (selected) void childDetail.refetch();
    }
  };
}
