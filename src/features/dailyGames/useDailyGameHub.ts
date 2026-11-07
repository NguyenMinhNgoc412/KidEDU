import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { isLocalFullAccess } from "@/features/auth/localFullAccess";
import { createLocalApiClient } from "@/api/localClient";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSelectedChildStore } from "@/features/parent/selectedChild";

export function useDailyGameHub() {
  const { session, accessTokenValid } = useAuth();
  const selection = useSelectedChildStore();
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const api =
    session && accessTokenValid ? createLocalApiClient(baseUrl, session.accessToken) : null;
  const children = useQuery({
    queryKey: ["daily-game", baseUrl, session?.accountId, "children"],
    enabled: Boolean(api),
    queryFn: () => api!.listChildren()
  });
  const selectedId = selection.accountId === session?.accountId ? selection.childId : null;
  const childId = api
    ? (children.data?.find((child) => child.id === selectedId) ?? children.data?.[0])?.id
    : undefined;
  const status = useQuery({
    queryKey: ["daily-game", baseUrl, session?.accountId, childId, "status"],
    enabled: Boolean(api && childId),
    queryFn: () => api!.getDailyGameStatus(childId!)
  });
  const inventory = useQuery({
    queryKey: ["daily-game", baseUrl, session?.accountId, childId, "inventory"],
    enabled: Boolean(api && childId),
    queryFn: () => api!.getDailyRewardInventory(childId!)
  });
  const localTestAccess = Boolean(api && isLocalFullAccess(session?.accountId));
  const context = `${session?.accountId}:${childId}`;
  const current = useRef(context);
  current.current = context;
  useEffect(() => {
    current.current = context;
    return () => {
      current.current = "";
    };
  }, [context]);
  const restart = useMutation({
    mutationFn: async () => {
      if (!api || !childId || !localTestAccess || !status.data?.sessionId)
        throw new Error("LOCAL_TEST_NOT_AVAILABLE");
      await api.restartLocalDailyTest(childId, status.data.sessionId);
      if (current.current !== context) return false;
      await status.refetch();
      return current.current === context;
    }
  });
  return {
    localTestAccess,
    restartTest: () => restart.mutateAsync().catch(() => false),
    restartingTest: restart.isPending,
    restartTestError: restart.isError,
    childId: api ? childId : undefined,
    status: api ? status.data : undefined,
    inventory: api ? inventory.data : undefined,
    loading: Boolean(api) && (children.isPending || (Boolean(childId) && status.isPending)),
    error: !api || children.isError || status.isError,
    inventoryLoading:
      Boolean(api) && (children.isPending || (Boolean(childId) && inventory.isPending)),
    inventoryError: !api || children.isError || inventory.isError,
    refresh: () => {
      if (api) void children.refetch();
      if (api && childId) {
        void status.refetch();
        void inventory.refetch();
      }
    }
  };
}
