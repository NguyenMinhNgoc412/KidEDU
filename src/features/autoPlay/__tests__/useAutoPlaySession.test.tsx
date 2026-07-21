import { act, renderHook, waitFor } from "@testing-library/react-native";

import type { DeckDetail, KidEduRepository, LearningSettings } from "@/data/types";

import { useAutoPlaySession } from "../useAutoPlaySession";

const mockUseKidEduRepository = jest.fn<KidEduRepository, []>();
const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
const mockQueryClient = { invalidateQueries: mockInvalidateQueries };

jest.mock("@/data/KidEduDataProvider", () => ({
  useKidEduRepository: () => mockUseKidEduRepository()
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient
}));

jest.mock("react-native", () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() }))
  }
}));

jest.mock("react-native-web/dist/exports/AppState", () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() }))
}));

describe("useAutoPlaySession lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      media: []
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
