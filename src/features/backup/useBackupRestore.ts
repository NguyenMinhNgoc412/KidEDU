import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { useKidEduRepository } from "@/data/KidEduDataProvider";

import {
  BackupServiceError,
  type BackupStage,
  createLocalBackup,
  type CreatedLocalBackup,
  discardCreatedLocalBackup,
  discardPreparedLocalRestore,
  type LocalBackupPreview,
  pickAndPrepareLocalRestore,
  type PreparedLocalRestore,
  restorePreparedLocalBackup,
  shareLocalBackup
} from "./backupService";

export interface LocalBackupSelection {
  fileName: string;
  preview: LocalBackupPreview;
}

export interface BackupRestoreController {
  isBusy: boolean;
  stage: BackupStage | null;
  errorMessage: string | null;
  createdBackup: LocalBackupSelection | null;
  preparedRestore: LocalBackupSelection | null;
  restoreSucceeded: boolean;
  createBackup(): Promise<boolean>;
  shareCreatedBackup(): Promise<boolean>;
  selectRestoreFile(): Promise<boolean>;
  restorePreparedBackup(): Promise<boolean>;
  clearRestoreSuccess(): void;
}

export function useBackupRestore(): BackupRestoreController {
  const repository = useKidEduRepository();
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const createdRef = useRef<CreatedLocalBackup | null>(null);
  const preparedRef = useRef<PreparedLocalRestore | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [stage, setStage] = useState<BackupStage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBackup, setCreatedBackup] = useState<LocalBackupSelection | null>(null);
  const [preparedRestore, setPreparedRestore] = useState<LocalBackupSelection | null>(null);
  const [restoreSucceeded, setRestoreSucceeded] = useState(false);

  const cleanupResources = useCallback(() => {
    const created = createdRef.current;
    const prepared = preparedRef.current;
    createdRef.current = null;
    preparedRef.current = null;
    discardCreatedLocalBackup(created);
    discardPreparedLocalRestore(prepared);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (!busyRef.current) {
        cleanupResources();
      }
    };
  }, [cleanupResources]);

  const beginOperation = useCallback((): boolean => {
    if (!mountedRef.current || busyRef.current) {
      return false;
    }

    busyRef.current = true;
    setIsBusy(true);
    setStage(null);
    setErrorMessage(null);
    return true;
  }, []);

  const finishOperation = useCallback(() => {
    busyRef.current = false;
    if (mountedRef.current) {
      setIsBusy(false);
      setStage(null);
    } else {
      cleanupResources();
    }
  }, [cleanupResources]);

  const onStage = useCallback((nextStage: BackupStage) => {
    if (mountedRef.current) {
      setStage(nextStage);
    }
  }, []);

  const showError = useCallback((error: unknown, fallbackMessage: string) => {
    if (!mountedRef.current) {
      return;
    }

    setErrorMessage(error instanceof BackupServiceError ? error.message : fallbackMessage);
  }, []);

  const createBackup = useCallback(async (): Promise<boolean> => {
    if (!beginOperation()) {
      return false;
    }

    try {
      const nextBackup = await createLocalBackup(repository, { onStage });
      if (!mountedRef.current) {
        discardCreatedLocalBackup(nextBackup);
        return false;
      }

      const previousBackup = createdRef.current;
      createdRef.current = nextBackup;
      setCreatedBackup(toSelection(nextBackup));
      if (previousBackup?.uri !== nextBackup.uri) {
        discardCreatedLocalBackup(previousBackup);
      }

      try {
        await shareLocalBackup(nextBackup, { onStage });
        return true;
      } catch (error) {
        showError(error, "Bản sao đã tạo nhưng chưa mở được bảng lưu hoặc chia sẻ.");
        return false;
      }
    } catch (error) {
      showError(error, "Chưa tạo được bản sao lưu. Dữ liệu hiện tại không bị thay đổi.");
      return false;
    } finally {
      finishOperation();
    }
  }, [beginOperation, finishOperation, onStage, repository, showError]);

  const shareCreatedBackup = useCallback(async (): Promise<boolean> => {
    const backup = createdRef.current;
    if (!backup || !beginOperation()) {
      return false;
    }

    try {
      await shareLocalBackup(backup, { onStage });
      return true;
    } catch (error) {
      showError(error, "Chưa mở được bảng lưu hoặc chia sẻ. Hãy thử lại.");
      return false;
    } finally {
      finishOperation();
    }
  }, [beginOperation, finishOperation, onStage, showError]);

  const selectRestoreFile = useCallback(async (): Promise<boolean> => {
    if (!beginOperation()) {
      return false;
    }

    try {
      const nextPrepared = await pickAndPrepareLocalRestore({ onStage });
      if (!nextPrepared) {
        return false;
      }
      if (!mountedRef.current) {
        discardPreparedLocalRestore(nextPrepared);
        return false;
      }

      const previousPrepared = preparedRef.current;
      preparedRef.current = nextPrepared;
      setPreparedRestore(toSelection(nextPrepared));
      if (previousPrepared?.sourceUri !== nextPrepared.sourceUri) {
        discardPreparedLocalRestore(previousPrepared);
      }
      return true;
    } catch (error) {
      showError(error, "Chưa đọc được tệp sao lưu. Hãy chọn một tệp KidEDU khác.");
      return false;
    } finally {
      finishOperation();
    }
  }, [beginOperation, finishOperation, onStage, showError]);

  const restorePreparedBackup = useCallback(async (): Promise<boolean> => {
    const prepared = preparedRef.current;
    if (!prepared || !beginOperation()) {
      return false;
    }

    try {
      await restorePreparedLocalBackup(repository, prepared, { onStage });
      await queryClient.resetQueries();

      if (preparedRef.current === prepared) {
        preparedRef.current = null;
        discardPreparedLocalRestore(prepared);
      }
      if (mountedRef.current) {
        setPreparedRestore(null);
        setRestoreSucceeded(true);
      }
      return true;
    } catch (error) {
      showError(error, "Khôi phục chưa thành công. Dữ liệu hiện tại không bị thay đổi.");
      return false;
    } finally {
      finishOperation();
    }
  }, [beginOperation, finishOperation, onStage, queryClient, repository, showError]);

  const clearRestoreSuccess = useCallback(() => {
    if (mountedRef.current) {
      setRestoreSucceeded(false);
    }
  }, []);

  return {
    isBusy,
    stage,
    errorMessage,
    createdBackup,
    preparedRestore,
    restoreSucceeded,
    createBackup,
    shareCreatedBackup,
    selectRestoreFile,
    restorePreparedBackup,
    clearRestoreSuccess
  };
}

function toSelection(
  value: Pick<CreatedLocalBackup, "fileName" | "preview">
): LocalBackupSelection {
  return { fileName: value.fileName, preview: value.preview };
}
