import { act, renderHook, waitFor } from "@testing-library/react-native";

import type { DeckDetail, KidEduRepository, LearningSettings } from "@/data/types";

import { useAutoPlaySession } from "../useAutoPlaySession";

const mockUseKidEduRepository = jest.fn<KidEduRepository, []>();
const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
const mockQueryClient = { invalidateQueries: mockInvalidateQueries };
let mockAppStateListener: ((state: "active" | "background" | "inactive") => void) | null = null;

jest.mock("@/data/KidEduDataProvider", () => ({
  useKidEduRepository: () => mockUseKidEduRepository()
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient
}));

jest.mock("react-native", () => ({
  AppState: {
    addEventListener: jest.fn(
      (
        _eventName: string,
        listener: (state: "active" | "background" | "inactive") => void
      ) => {
        mockAppStateListener = listener;
        return { remove: jest.fn() };
      }
    )
  }
}));

jest.mock("react-native-web/dist/exports/AppState", () => ({
  addEventListener: jest.fn(
    (
      _eventName: string,
      listener: (state: "active" | "background" | "inactive") => void
    ) => {
      mockAppStateListener = listener;
      return { remove: jest.fn() };
    }
  )
}));

describe("useAutoPlaySession lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAppStateListener = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts a new practice session when the deck is restarted", async () => {
    const repository = makeRepository(["session-1", "session-2"]);
    mockUseKidEduRepository.mockReturnValue(repository);

    const { result, unmount } = await renderHook(() => useAutoPlaySession(deck, settings));

    await waitFor(() => {
      expect(repository.startPracticeSession).toHaveBeenCalledTimes(1);
      expect(repository.recordPracticeEvent).toHaveBeenCalledWith({
        sessionId: "session-1",
        learningItemId: "item-1",
        eventType: "viewed"
      });
    });

    await act(() => result.current.restart());

    await waitFor(() => {
      expect(repository.finishPracticeSession).toHaveBeenCalledWith({
        sessionId: "session-1",
        status: "cancelled"
      });
      expect(repository.startPracticeSession).toHaveBeenCalledTimes(2);
      expect(repository.recordPracticeEvent).toHaveBeenCalledWith({
        sessionId: "session-2",
        learningItemId: "item-1",
        eventType: "viewed"
      });
    });

    await unmount();

    await waitFor(() => {
      expect(repository.finishPracticeSession).toHaveBeenCalledWith({
        sessionId: "session-2",
        status: "interrupted"
      });
    });
  });

  it("finalizes an active session as interrupted when the screen unmounts", async () => {
    const repository = makeRepository(["session-back"]);
    mockUseKidEduRepository.mockReturnValue(repository);

    const { unmount } = await renderHook(() => useAutoPlaySession(deck, settings));

    await waitFor(() => expect(repository.startPracticeSession).toHaveBeenCalledTimes(1));
    await unmount();

    await waitFor(() => {
      expect(repository.finishPracticeSession).toHaveBeenCalledTimes(1);
      expect(repository.finishPracticeSession).toHaveBeenCalledWith({
        sessionId: "session-back",
        status: "interrupted"
      });
    });
  });

  it("finalizes a session that finishes starting after the screen already unmounted", async () => {
    const deferredSession = createDeferred<string>();
    const repository = makeRepository([]);
    (repository.startPracticeSession as jest.Mock).mockReturnValueOnce(deferredSession.promise);
    mockUseKidEduRepository.mockReturnValue(repository);

    const { unmount } = await renderHook(() => useAutoPlaySession(deck, settings));

    expect(repository.startPracticeSession).toHaveBeenCalledTimes(1);
    await unmount();
    await act(async () => {
      deferredSession.resolve("session-delayed-back");
      await deferredSession.promise;
    });

    await waitFor(() => {
      expect(repository.finishPracticeSession).toHaveBeenCalledWith({
        sessionId: "session-delayed-back",
        status: "interrupted"
      });
    });
  });

  it("keeps an explicit exit cancelled instead of overwriting it during unmount", async () => {
    const repository = makeRepository(["session-exit"]);
    mockUseKidEduRepository.mockReturnValue(repository);

    const { result, unmount } = await renderHook(() => useAutoPlaySession(deck, settings));

    await waitFor(() => expect(repository.startPracticeSession).toHaveBeenCalledTimes(1));
    await act(() => result.current.exit());
    await unmount();

    await waitFor(() => {
      expect(repository.finishPracticeSession).toHaveBeenCalledTimes(1);
      expect(repository.finishPracticeSession).toHaveBeenCalledWith({
        sessionId: "session-exit",
        status: "cancelled"
      });
    });
  });

  it("keeps a real video in the sample phase until playback reports completion", async () => {
    jest.useFakeTimers();
    const repository = makeRepository(["session-video"]);
    mockUseKidEduRepository.mockReturnValue(repository);

    const { result, unmount } = await renderHook(() => useAutoPlaySession(videoDeck, settings));

    expect(result.current.state.phase).toBe("attention");

    await act(async () => {
      jest.advanceTimersByTime(700);
    });
    expect(result.current.state.phase).toBe("sample");

    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(result.current.state.phase).toBe("sample");

    await act(async () => {
      result.current.completeCurrentSample();
    });
    expect(result.current.state.phase).toBe("speak");

    await unmount();
  });

  it("ignores inactive state and keeps a background pause until the user resumes", async () => {
    const repository = makeRepository(["session-app-state"]);
    mockUseKidEduRepository.mockReturnValue(repository);

    const { result, unmount } = await renderHook(() => useAutoPlaySession(deck, settings));

    await waitFor(() => expect(mockAppStateListener).not.toBeNull());

    await act(() => mockAppStateListener?.("inactive"));
    expect(result.current.state.phase).toBe("attention");

    await act(() => mockAppStateListener?.("background"));
    expect(result.current.state.phase).toBe("paused");
    expect(result.current.state.previousPhase).toBe("attention");

    await act(() => mockAppStateListener?.("active"));
    expect(result.current.state.phase).toBe("paused");
    expect(result.current.state.previousPhase).toBe("attention");

    await act(() => result.current.resume());
    expect(result.current.state.phase).toBe("attention");
    expect(result.current.state.previousPhase).toBeNull();

    await unmount();
  });

  it("does not auto-resume a pause requested by the user", async () => {
    const repository = makeRepository(["session-manual-pause"]);
    mockUseKidEduRepository.mockReturnValue(repository);

    const { result, unmount } = await renderHook(() => useAutoPlaySession(deck, settings));

    await waitFor(() => expect(mockAppStateListener).not.toBeNull());
    await act(() => result.current.pause());
    expect(result.current.state.phase).toBe("paused");

    await act(() => mockAppStateListener?.("background"));
    await act(() => mockAppStateListener?.("active"));
    expect(result.current.state.phase).toBe("paused");

    await unmount();
  });

  it("does not auto-resume after a short native background transition", async () => {
    const repository = makeRepository(["session-transient-background"]);
    mockUseKidEduRepository.mockReturnValue(repository);

    const { result, unmount } = await renderHook(() => useAutoPlaySession(deck, settings));

    await waitFor(() => expect(mockAppStateListener).not.toBeNull());
    await act(() => mockAppStateListener?.("background"));
    expect(result.current.state.phase).toBe("paused");

    await act(() => mockAppStateListener?.("active"));

    expect(result.current.state.phase).toBe("paused");
    await unmount();
  });
});

const deck: DeckDetail = {
  id: "deck-1",
  title: "Gia đình",
  description: null,
  status: "active",
  itemCount: 1,
  items: [
    {
      id: "item-1",
      title: "mẹ",
      categoryId: "category-1",
      categoryName: "Gia đình",
      status: "active",
      learningStatus: "new",
      note: null,
      media: [
        {
          id: "mapping-illustration",
          learningItemId: "item-1",
          mediaAssetId: "asset-illustration",
          role: "illustration",
          priority: 10,
          isActive: true,
          asset: {
            id: "asset-illustration",
            type: "image",
            source: "default",
            uri: "asset://default/item-1/illustration",
            thumbnailAssetId: null,
            thumbnailUri: null,
            durationMs: null,
            sizeBytes: null,
            mimeType: "image/webp",
            status: "active"
          }
        }
      ]
    }
  ]
};

const settings: LearningSettings = {
  speedPreset: "normal",
  playbackSpeed: 1,
  loopMode: "once",
  loopCount: 1,
  reinforcementEnabled: false,
  sfxEnabled: false
};

const videoDeck: DeckDetail = {
  ...deck,
  id: "deck-video",
  items: [
    {
      ...deck.items[0]!,
      media: [
        {
          id: "mapping-video",
          learningItemId: "item-1",
          mediaAssetId: "asset-video",
          role: "mouth_video",
          priority: 100,
          isActive: true,
          asset: {
            id: "asset-video",
            type: "video",
            source: "custom",
            uri: "file:///media/videos/custom/mouth.mp4",
            thumbnailAssetId: null,
            thumbnailUri: null,
            durationMs: 15_000,
            sizeBytes: 20_000_000,
            mimeType: "video/mp4",
            status: "active"
          }
        }
      ]
    }
  ]
};

function makeRepository(sessionIds: string[]): KidEduRepository {
  let nextSessionIndex = 0;

  return {
    startPracticeSession: jest.fn(async () => sessionIds[nextSessionIndex++]!),
    recordPracticeEvent: jest.fn(async () => undefined),
    finishPracticeSession: jest.fn(async () => undefined)
  } as unknown as KidEduRepository;
}

function createDeferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}
