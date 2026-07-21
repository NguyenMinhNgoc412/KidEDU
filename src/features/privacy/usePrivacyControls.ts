import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useKidEduRepository } from "@/data/KidEduDataProvider";
import type { PrivacyDataSummary } from "@/data/types";
import { cleanupMediaFiles } from "@/features/media/mediaImportService";

import { subscribeToAppResume } from "./privacyAppState";
import {
  getPrivacyPermissionSnapshot,
  openAppPrivacySettings,
  type PrivacyPermissionSnapshot
} from "./privacyPermissions";

export type PrivacyControlAction =
  "opening_settings" | "clearing_history" | "deleting_media" | "resetting_app";

export interface PrivacyControlsController {
  summary: PrivacyDataSummary | null;
  permissions: PrivacyPermissionSnapshot | null;
  isLoading: boolean;
  isBusy: boolean;
  activeAction: PrivacyControlAction | null;
  errorMessage: string | null;
  successMessage: string | null;
  refresh(): Promise<boolean>;
  openPrivacySettings(): Promise<boolean>;
  clearLearningHistory(): Promise<boolean>;
  deletePersonalizedMedia(): Promise<boolean>;
  resetAllLocalData(): Promise<boolean>;
}

export function usePrivacyControls(): PrivacyControlsController {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const refreshIdRef = useRef(0);
  const [summary, setSummary] = useState<PrivacyDataSummary | null>(null);
  const [permissions, setPermissions] = useState<PrivacyPermissionSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<PrivacyControlAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      refreshIdRef.current += 1;
    };
  }, []);

  const loadOverview = useCallback(
    async (clearMessages: boolean): Promise<boolean> => {
      const refreshId = ++refreshIdRef.current;
      if (mountedRef.current) {
        setIsLoading(true);
        if (clearMessages) {
          setErrorMessage(null);
        }
      }

      const [summaryResult, permissionResult] = await Promise.allSettled([
        repository.getPrivacyDataSummary(),
        getPrivacyPermissionSnapshot()
      ]);
      if (!mountedRef.current || refreshId !== refreshIdRef.current) {
        return false;
      }

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      }
      if (permissionResult.status === "fulfilled") {
        setPermissions(permissionResult.value);
      }

      const succeeded =
        summaryResult.status === "fulfilled" && permissionResult.status === "fulfilled";
      if (!succeeded) {
        setErrorMessage(
          summaryResult.status === "rejected"
            ? "Chưa tải được tổng quan dữ liệu. Hãy thử mở lại màn hình."
            : "Chưa đọc được trạng thái quyền trên thiết bị này."
        );
      }
      setIsLoading(false);
      return succeeded;
    },
    [repository]
  );

  const refresh = useCallback(() => loadOverview(true), [loadOverview]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return subscribeToAppResume(() => {
        void refresh();
      });
    }, [refresh])
  );

  const beginOperation = useCallback((action: PrivacyControlAction): boolean => {
    if (!mountedRef.current || busyRef.current) {
      return false;
    }

    busyRef.current = true;
    setIsBusy(true);
    setActiveAction(action);
    setErrorMessage(null);
    setSuccessMessage(null);
    return true;
  }, []);

  const finishOperation = useCallback(() => {
    busyRef.current = false;
    if (mountedRef.current) {
      setIsBusy(false);
      setActiveAction(null);
    }
  }, []);

  const refreshQueryCache = useCallback(async () => {
    try {
      await queryClient.resetQueries();
    } catch {
      await queryClient.invalidateQueries().catch(() => undefined);
    }
  }, [queryClient]);

  const runDestructiveAction = useCallback(
    async ({
      action,
      mutate,
      error,
      success,
      reloadAfter = true
    }: {
      action: PrivacyControlAction;
      mutate(): Promise<string[] | void>;
      error: string;
      success: string;
      reloadAfter?: boolean;
    }): Promise<boolean> => {
      if (!beginOperation(action)) {
        return false;
      }

      try {
        const uris = await mutate();
        if (uris) {
          await cleanupMediaFiles(uris);
        }
        await refreshQueryCache();
        if (reloadAfter) {
          await loadOverview(false);
        }
        if (mountedRef.current) {
          setSuccessMessage(success);
        }
        return true;
      } catch {
        if (mountedRef.current) {
          setErrorMessage(error);
        }
        return false;
      } finally {
        finishOperation();
      }
    },
    [beginOperation, finishOperation, loadOverview, refreshQueryCache]
  );

  const openPrivacySettings = useCallback(async (): Promise<boolean> => {
    if (!beginOperation("opening_settings")) {
      return false;
    }

    try {
      const opened = await openAppPrivacySettings();
      if (!opened && mountedRef.current) {
        setErrorMessage("Không mở được Cài đặt của ứng dụng trên thiết bị này.");
      }
      return opened;
    } catch {
      if (mountedRef.current) {
        setErrorMessage("Không mở được Cài đặt của ứng dụng trên thiết bị này.");
      }
      return false;
    } finally {
      finishOperation();
    }
  }, [beginOperation, finishOperation]);

  const clearLearningHistory = useCallback(
    () =>
      runDestructiveAction({
        action: "clearing_history",
        mutate: () => repository.clearLearningHistory(),
        error: "Chưa xóa được lịch sử học. Dữ liệu hiện tại không bị thay đổi.",
        success: "Đã xóa lịch sử học. Thẻ, bộ học và media vẫn được giữ lại."
      }),
    [repository, runDestructiveAction]
  );

  const deletePersonalizedMedia = useCallback(
    () =>
      runDestructiveAction({
        action: "deleting_media",
        mutate: () => repository.deleteAllPersonalizedMedia(),
        error: "Chưa xóa được media cá nhân hóa. Dữ liệu hiện tại không bị thay đổi.",
        success: "Đã xóa media cá nhân hóa. KidEDU sẽ dùng nội dung mặc định nếu có."
      }),
    [repository, runDestructiveAction]
  );

  const resetAllLocalData = useCallback(
    () =>
      runDestructiveAction({
        action: "resetting_app",
        mutate: () => repository.resetAllLocalData(),
        error: "Chưa đặt lại được KidEDU. Dữ liệu hiện tại không bị thay đổi.",
        success: "Đã đặt lại KidEDU về dữ liệu mặc định.",
        reloadAfter: false
      }),
    [repository, runDestructiveAction]
  );

  return {
    summary,
    permissions,
    isLoading,
    isBusy,
    activeAction,
    errorMessage,
    successMessage,
    refresh,
    openPrivacySettings,
    clearLearningHistory,
    deletePersonalizedMedia,
    resetAllLocalData
  };
}
