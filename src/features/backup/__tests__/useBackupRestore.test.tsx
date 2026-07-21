import { act, renderHook, waitFor } from "@testing-library/react-native";

import type { KidEduRepository } from "@/data/types";

import {
  BackupServiceError,
  type CreatedLocalBackup,
  type LocalBackupPreview,
  type PreparedLocalRestore
} from "../backupService";
import { useBackupRestore } from "../useBackupRestore";

const mockUseKidEduRepository = jest.fn<KidEduRepository, []>();
const mockResetQueries = jest.fn();
const mockQueryClient = { resetQueries: mockResetQueries };
const mockCreateLocalBackup = jest.fn();
const mockShareLocalBackup = jest.fn();
const mockPickAndPrepareLocalRestore = jest.fn();
const mockRestorePreparedLocalBackup = jest.fn();
const mockDiscardCreatedLocalBackup = jest.fn();
const mockDiscardPreparedLocalRestore = jest.fn();

jest.mock("@/data/KidEduDataProvider", () => ({
  useKidEduRepository: () => mockUseKidEduRepository()
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient
}));

jest.mock("../backupService", () => {
  class MockBackupServiceError extends Error {
    readonly code: string;
    readonly originalError?: unknown;

    constructor(errorCode: string, message: string, originalError?: unknown) {
      super(message);
      this.name = "BackupServiceError";
      this.code = errorCode;
      this.originalError = originalError;
    }
  }

  return {
    BackupServiceError: MockBackupServiceError,
    createLocalBackup: (...args: unknown[]) => mockCreateLocalBackup(...args),
    shareLocalBackup: (...args: unknown[]) => mockShareLocalBackup(...args),
    pickAndPrepareLocalRestore: (...args: unknown[]) => mockPickAndPrepareLocalRestore(...args),
    restorePreparedLocalBackup: (...args: unknown[]) => mockRestorePreparedLocalBackup(...args),
    discardCreatedLocalBackup: (...args: unknown[]) => mockDiscardCreatedLocalBackup(...args),
    discardPreparedLocalRestore: (...args: unknown[]) => mockDiscardPreparedLocalRestore(...args)
  };
});

describe("useBackupRestore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKidEduRepository.mockReturnValue(repository);
    mockResetQueries.mockResolvedValue(undefined);
    mockShareLocalBackup.mockResolvedValue(undefined);
    mockDiscardCreatedLocalBackup.mockReturnValue(undefined);
    mockDiscardPreparedLocalRestore.mockReturnValue(undefined);
  });

  it("treats picker cancellation as a silent no-op", async () => {
    mockPickAndPrepareLocalRestore.mockResolvedValue(null);
    const { result } = await renderHook(() => useBackupRestore());

    await act(async () => {
      expect(await result.current.selectRestoreFile()).toBe(false);
    });

    expect(result.current.errorMessage).toBeNull();
    expect(result.current.preparedRestore).toBeNull();
    expect(mockRestorePreparedLocalBackup).not.toHaveBeenCalled();
  });

  it("shows the BackupServiceError message for an invalid file", async () => {
    mockPickAndPrepareLocalRestore.mockRejectedValue(
      new BackupServiceError("invalid_file", "Tệp sao lưu bị hỏng hoặc chưa tải xong.")
    );
    const { result } = await renderHook(() => useBackupRestore());

    await act(async () => {
      await result.current.selectRestoreFile();
    });

    expect(result.current.errorMessage).toBe("Tệp sao lưu bị hỏng hoặc chưa tải xong.");
    expect(result.current.preparedRestore).toBeNull();
  });

  it("keeps only preview data in state and does not restore after selection", async () => {
    mockPickAndPrepareLocalRestore.mockResolvedValue(preparedRestore);
    const { result } = await renderHook(() => useBackupRestore());

    await act(async () => {
      expect(await result.current.selectRestoreFile()).toBe(true);
    });

    expect(result.current.preparedRestore).toEqual({
      fileName: preparedRestore.fileName,
      preview
    });
    expect(result.current.preparedRestore).not.toHaveProperty("sourceUri");
    expect(result.current.preparedRestore).not.toHaveProperty("manifest");
    expect(mockRestorePreparedLocalBackup).not.toHaveBeenCalled();
  });

  it("blocks a second action while backup creation is pending", async () => {
    const deferred = createDeferred<CreatedLocalBackup>();
    mockCreateLocalBackup.mockReturnValue(deferred.promise);
    const { result } = await renderHook(() => useBackupRestore());
    let firstOperation!: Promise<boolean>;

    await act(async () => {
      firstOperation = result.current.createBackup();
      void firstOperation;
      await Promise.resolve();
    });

    await act(async () => {
      expect(await result.current.createBackup()).toBe(false);
    });
    expect(mockCreateLocalBackup).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve(createdBackup);
      expect(await firstOperation).toBe(true);
    });

    expect(mockShareLocalBackup).toHaveBeenCalledTimes(1);
  });

  it("retains a created backup when sharing fails so sharing can be retried", async () => {
    mockCreateLocalBackup.mockResolvedValue(createdBackup);
    mockShareLocalBackup.mockRejectedValueOnce(
      new BackupServiceError(
        "share_failed",
        "Bản sao đã tạo nhưng chưa mở được bảng lưu hoặc chia sẻ."
      )
    );
    const { result } = await renderHook(() => useBackupRestore());

    await act(async () => {
      expect(await result.current.createBackup()).toBe(false);
    });

    expect(result.current.createdBackup).toEqual({
      fileName: createdBackup.fileName,
      preview
    });
    expect(result.current.errorMessage).toBe(
      "Bản sao đã tạo nhưng chưa mở được bảng lưu hoặc chia sẻ."
    );

    mockShareLocalBackup.mockResolvedValueOnce(undefined);
    await act(async () => {
      expect(await result.current.shareCreatedBackup()).toBe(true);
    });

    expect(mockShareLocalBackup).toHaveBeenCalledTimes(2);
    expect(mockShareLocalBackup.mock.calls[1]?.[0]).toBe(createdBackup);
    expect(result.current.createdBackup).not.toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it("resets all queries and exposes success after restore", async () => {
    mockPickAndPrepareLocalRestore.mockResolvedValue(preparedRestore);
    mockRestorePreparedLocalBackup.mockResolvedValue(undefined);
    const { result } = await renderHook(() => useBackupRestore());

    await act(async () => {
      await result.current.selectRestoreFile();
    });
    await act(async () => {
      expect(await result.current.restorePreparedBackup()).toBe(true);
    });

    expect(mockRestorePreparedLocalBackup).toHaveBeenCalledWith(
      repository,
      preparedRestore,
      expect.objectContaining({ onStage: expect.any(Function) })
    );
    expect(mockResetQueries).toHaveBeenCalledTimes(1);
    expect(mockDiscardPreparedLocalRestore).toHaveBeenCalledWith(preparedRestore);
    expect(result.current.preparedRestore).toBeNull();
    expect(result.current.restoreSucceeded).toBe(true);
  });

  it("retains the prepared preview and rollback message when restore fails", async () => {
    mockPickAndPrepareLocalRestore.mockResolvedValue(preparedRestore);
    mockRestorePreparedLocalBackup.mockRejectedValue(
      new BackupServiceError(
        "restore_failed",
        "Khôi phục chưa thành công. Dữ liệu hiện tại không bị thay đổi."
      )
    );
    const { result } = await renderHook(() => useBackupRestore());

    await act(async () => {
      await result.current.selectRestoreFile();
    });
    await act(async () => {
      expect(await result.current.restorePreparedBackup()).toBe(false);
    });

    expect(result.current.preparedRestore).toEqual({
      fileName: preparedRestore.fileName,
      preview
    });
    expect(result.current.errorMessage).toBe(
      "Khôi phục chưa thành công. Dữ liệu hiện tại không bị thay đổi."
    );
    expect(mockResetQueries).not.toHaveBeenCalled();
    expect(mockDiscardPreparedLocalRestore).not.toHaveBeenCalledWith(preparedRestore);
  });

  it("discards replaced and retained resources at the appropriate lifecycle points", async () => {
    const secondPrepared = {
      ...preparedRestore,
      fileName: "KidEDU-second.kidedu",
      sourceUri: "file:///cache/KidEDU-second.kidedu"
    } as PreparedLocalRestore;
    mockPickAndPrepareLocalRestore
      .mockResolvedValueOnce(preparedRestore)
      .mockResolvedValueOnce(secondPrepared);
    mockCreateLocalBackup.mockResolvedValue(createdBackup);
    const { result, unmount } = await renderHook(() => useBackupRestore());

    await act(async () => {
      await result.current.selectRestoreFile();
      await result.current.selectRestoreFile();
      await result.current.createBackup();
    });

    expect(mockDiscardPreparedLocalRestore).toHaveBeenCalledWith(preparedRestore);
    await unmount();

    await waitFor(() => {
      expect(mockDiscardPreparedLocalRestore).toHaveBeenCalledWith(secondPrepared);
      expect(mockDiscardCreatedLocalBackup).toHaveBeenCalledWith(createdBackup);
    });
  });
});

const repository = {} as KidEduRepository;

const preview: LocalBackupPreview = {
  appVersion: "1.0.0",
  createdAt: "2026-07-20T10:00:00.000Z",
  learningItemCount: 12,
  deckCount: 3,
  mediaAssetCount: 8,
  mediaFileCount: 5,
  totalMediaBytes: 2048,
  practiceSessionCount: 4,
  integrityChecked: true
};

const createdBackup: CreatedLocalBackup = {
  fileName: "KidEDU-20260720.kidedu",
  uri: "file:///cache/KidEDU-20260720.kidedu",
  preview
};

const preparedRestore = {
  fileName: "KidEDU-restore.kidedu",
  sourceUri: "file:///cache/KidEDU-restore.kidedu",
  archive: {},
  manifest: {},
  preview
} as PreparedLocalRestore;

function createDeferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}
