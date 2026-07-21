import { act, renderHook, waitFor } from "@testing-library/react-native";

import type { KidEduRepository, PrivacyDataSummary } from "@/data/types";

import type { PrivacyPermissionSnapshot } from "../privacyPermissions";
import { usePrivacyControls } from "../usePrivacyControls";

const mockUseKidEduRepository = jest.fn<KidEduRepository, []>();
const mockResetQueries = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockQueryClient = {
  resetQueries: mockResetQueries,
  invalidateQueries: mockInvalidateQueries
};
const mockGetPrivacyPermissionSnapshot = jest.fn();
const mockOpenAppPrivacySettings = jest.fn();
const mockCleanupMediaFiles = jest.fn();
const mockUnsubscribeFromAppResume = jest.fn();
let mockFocusCallback: (() => void) | null = null;
let mockResumeCallback: (() => void) | null = null;

jest.mock("@/data/KidEduDataProvider", () => ({
  useKidEduRepository: () => mockUseKidEduRepository()
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient
}));

jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) => {
    mockFocusCallback = callback;
  }
}));

jest.mock("../privacyPermissions", () => ({
  getPrivacyPermissionSnapshot: (...args: unknown[]) => mockGetPrivacyPermissionSnapshot(...args),
  openAppPrivacySettings: (...args: unknown[]) => mockOpenAppPrivacySettings(...args)
}));

jest.mock("../privacyAppState", () => ({
  subscribeToAppResume: (callback: () => void) => {
    mockResumeCallback = callback;
    return mockUnsubscribeFromAppResume;
  }
}));

jest.mock("@/features/media/mediaImportService", () => ({
  cleanupMediaFiles: (...args: unknown[]) => mockCleanupMediaFiles(...args)
}));

describe("usePrivacyControls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusCallback = null;
    mockResumeCallback = null;
    mockUseKidEduRepository.mockReturnValue(repository);
    repository.getPrivacyDataSummary.mockResolvedValue(summary);
    repository.clearLearningHistory.mockResolvedValue(undefined);
    repository.deleteAllPersonalizedMedia.mockResolvedValue([]);
    repository.resetAllLocalData.mockResolvedValue([]);
    mockGetPrivacyPermissionSnapshot.mockResolvedValue(permissions);
    mockOpenAppPrivacySettings.mockResolvedValue(true);
    mockCleanupMediaFiles.mockResolvedValue(undefined);
    mockResetQueries.mockResolvedValue(undefined);
    mockInvalidateQueries.mockResolvedValue(undefined);
  });

  it("reloads the summary and permission snapshot whenever the screen receives focus", async () => {
    const { result } = await renderHook(() => usePrivacyControls());

    await focusAndWait(result);
    expect(result.current.summary).toEqual(summary);
    expect(result.current.permissions).toEqual(permissions);

    await focusAndWait(result);
    expect(repository.getPrivacyDataSummary).toHaveBeenCalledTimes(2);
    expect(mockGetPrivacyPermissionSnapshot).toHaveBeenCalledTimes(2);
  });

  it("reloads permission state when the app resumes from system settings", async () => {
    const { result } = await renderHook(() => usePrivacyControls());
    await focusAndWait(result);

    await act(async () => {
      mockResumeCallback?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(repository.getPrivacyDataSummary).toHaveBeenCalledTimes(2));
    expect(mockGetPrivacyPermissionSnapshot).toHaveBeenCalledTimes(2);
  });

  it("preserves permission data and shows a Vietnamese error when the summary fails", async () => {
    repository.getPrivacyDataSummary.mockRejectedValueOnce(new Error("database unavailable"));
    const { result } = await renderHook(() => usePrivacyControls());

    await focusAndWait(result);

    expect(result.current.summary).toBeNull();
    expect(result.current.permissions).toEqual(permissions);
    expect(result.current.errorMessage).toBe(
      "Chưa tải được tổng quan dữ liệu. Hãy thử mở lại màn hình."
    );
  });

  it("reports a settings error without requesting any permission", async () => {
    mockOpenAppPrivacySettings.mockResolvedValueOnce(false);
    const { result } = await renderHook(() => usePrivacyControls());

    await act(async () => {
      expect(await result.current.openPrivacySettings()).toBe(false);
    });

    expect(mockOpenAppPrivacySettings).toHaveBeenCalledTimes(1);
    expect(result.current.errorMessage).toBe(
      "Không mở được Cài đặt của ứng dụng trên thiết bị này."
    );
    expect(mockGetPrivacyPermissionSnapshot).not.toHaveBeenCalled();
  });

  it("blocks a second destructive action while the first mutation is pending", async () => {
    const deferred = createDeferred<void>();
    repository.clearLearningHistory.mockReturnValueOnce(deferred.promise);
    const { result } = await renderHook(() => usePrivacyControls());
    let firstOperation!: Promise<boolean>;

    await act(async () => {
      firstOperation = result.current.clearLearningHistory();
      void firstOperation;
      await Promise.resolve();
    });

    await act(async () => {
      expect(await result.current.deletePersonalizedMedia()).toBe(false);
    });
    expect(repository.clearLearningHistory).toHaveBeenCalledTimes(1);
    expect(repository.deleteAllPersonalizedMedia).not.toHaveBeenCalled();

    await act(async () => {
      deferred.resolve(undefined);
      expect(await firstOperation).toBe(true);
    });
  });

  it("clears history, refreshes cached data, and reloads the overview", async () => {
    const { result } = await renderHook(() => usePrivacyControls());
    await focusAndWait(result);

    await act(async () => {
      expect(await result.current.clearLearningHistory()).toBe(true);
    });

    expect(repository.clearLearningHistory).toHaveBeenCalledTimes(1);
    expect(mockCleanupMediaFiles).not.toHaveBeenCalled();
    expect(mockResetQueries).toHaveBeenCalledTimes(1);
    expect(repository.getPrivacyDataSummary).toHaveBeenCalledTimes(2);
    expect(result.current.successMessage).toContain("Đã xóa lịch sử học");
  });

  it("cleans returned files after deleting personalized media", async () => {
    const removedUris = ["file:///media/voice.m4a", "file:///media/mouth.mp4"];
    repository.deleteAllPersonalizedMedia.mockResolvedValueOnce(removedUris);
    const { result } = await renderHook(() => usePrivacyControls());
    await focusAndWait(result);

    await act(async () => {
      expect(await result.current.deletePersonalizedMedia()).toBe(true);
    });

    expect(mockCleanupMediaFiles).toHaveBeenCalledWith(removedUris);
    expect(mockResetQueries).toHaveBeenCalledTimes(1);
    expect(repository.getPrivacyDataSummary).toHaveBeenCalledTimes(2);
    expect(result.current.successMessage).toContain("Đã xóa media cá nhân hóa");
  });

  it("does not clean files or refresh queries when deleting media fails", async () => {
    repository.deleteAllPersonalizedMedia.mockRejectedValueOnce(new Error("write failed"));
    const { result } = await renderHook(() => usePrivacyControls());

    await act(async () => {
      expect(await result.current.deletePersonalizedMedia()).toBe(false);
    });

    expect(mockCleanupMediaFiles).not.toHaveBeenCalled();
    expect(mockResetQueries).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe(
      "Chưa xóa được media cá nhân hóa. Dữ liệu hiện tại không bị thay đổi."
    );
  });

  it("cleans returned files and resets queries after a full reset without reloading stale data", async () => {
    const removedUris = ["file:///media/custom.jpg"];
    repository.resetAllLocalData.mockResolvedValueOnce(removedUris);
    const { result } = await renderHook(() => usePrivacyControls());
    await focusAndWait(result);

    await act(async () => {
      expect(await result.current.resetAllLocalData()).toBe(true);
    });

    expect(mockCleanupMediaFiles).toHaveBeenCalledWith(removedUris);
    expect(mockResetQueries).toHaveBeenCalledTimes(1);
    expect(repository.getPrivacyDataSummary).toHaveBeenCalledTimes(1);
    expect(result.current.successMessage).toBe("Đã đặt lại KidEDU về dữ liệu mặc định.");
  });

  it("keeps files and cache untouched when a full reset fails", async () => {
    repository.resetAllLocalData.mockRejectedValueOnce(new Error("transaction failed"));
    const { result } = await renderHook(() => usePrivacyControls());

    await act(async () => {
      expect(await result.current.resetAllLocalData()).toBe(false);
    });

    expect(mockCleanupMediaFiles).not.toHaveBeenCalled();
    expect(mockResetQueries).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe(
      "Chưa đặt lại được KidEDU. Dữ liệu hiện tại không bị thay đổi."
    );
  });

  it("invalidates queries if resetting active queries fails", async () => {
    mockResetQueries.mockRejectedValueOnce(new Error("active query failed"));
    const { result } = await renderHook(() => usePrivacyControls());

    await act(async () => {
      expect(await result.current.clearLearningHistory()).toBe(true);
    });

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
  });
});

const summary: PrivacyDataSummary = {
  learningItemCount: 12,
  deckCount: 3,
  practiceSessionCount: 4,
  practiceEventCount: 18,
  learningProgressCount: 5,
  personalizedMediaCount: 6,
  personalizedMediaBytes: 4096
};

const permissions: PrivacyPermissionSnapshot = {
  camera: "granted",
  microphone: "denied",
  mediaLibrary: "limited"
};

const repository = {
  getPrivacyDataSummary: jest.fn(),
  clearLearningHistory: jest.fn(),
  deleteAllPersonalizedMedia: jest.fn(),
  resetAllLocalData: jest.fn()
} as unknown as jest.Mocked<KidEduRepository>;

async function focusAndWait(result: { current: { isLoading: boolean } }) {
  await act(async () => {
    mockFocusCallback?.();
    await Promise.resolve();
  });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
}

function createDeferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}
