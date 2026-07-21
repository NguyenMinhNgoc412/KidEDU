import { act, renderHook, waitFor } from "@testing-library/react-native";

import type { KidEduRepository } from "@/data/types";

import { useSingleItemProgress } from "../useSingleItemProgress";

const mockUseKidEduRepository = jest.fn<KidEduRepository, []>();
const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
const mockQueryClient = { invalidateQueries: mockInvalidateQueries };

jest.mock("@/data/KidEduDataProvider", () => ({
  useKidEduRepository: () => mockUseKidEduRepository()
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient
}));

describe("useSingleItemProgress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("interrupts the session without recording completion when leaving before the sample ends", async () => {
    const repository = makeRepository("session-interrupted");
    mockUseKidEduRepository.mockReturnValue(repository);

    const { unmount } = await renderHook(() => useSingleItemProgress("item-1"));

    await waitFor(() => {
      expect(repository.recordPracticeEvent).toHaveBeenCalledWith({
        sessionId: "session-interrupted",
        learningItemId: "item-1",
        eventType: "viewed"
      });
    });

    await unmount();

    await waitFor(() => {
      expect(repository.finishPracticeSession).toHaveBeenCalledWith({
        sessionId: "session-interrupted",
        status: "interrupted"
      });
    });
    expect(repository.recordPracticeEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "completed_item" })
    );
  });

  it("records one completed item and completes the session after the sample really ends", async () => {
    const repository = makeRepository("session-completed");
    mockUseKidEduRepository.mockReturnValue(repository);

    const { result, unmount } = await renderHook(() => useSingleItemProgress("item-1"));

    await waitFor(() => expect(repository.startPracticeSession).toHaveBeenCalledTimes(1));
    await act(() => {
      result.current.recordSampleCompleted();
      result.current.recordSampleCompleted();
    });

    await waitFor(() => {
      expect(repository.recordPracticeEvent).toHaveBeenCalledWith({
        sessionId: "session-completed",
        learningItemId: "item-1",
        eventType: "completed_item"
      });
    });

    await unmount();

    await waitFor(() => {
      expect(repository.finishPracticeSession).toHaveBeenCalledWith({
        sessionId: "session-completed",
        status: "completed"
      });
    });
    expect(repository.recordPracticeEvent).toHaveBeenCalledTimes(2);
  });

  it("interrupts a session that finishes starting after the learning screen unmounts", async () => {
    const deferredSession = createDeferred<string>();
    const repository = makeRepository("unused");
    (repository.startPracticeSession as jest.Mock).mockReturnValueOnce(deferredSession.promise);
    mockUseKidEduRepository.mockReturnValue(repository);

    const { unmount } = await renderHook(() => useSingleItemProgress("item-delayed"));

    await unmount();
    await act(async () => {
      deferredSession.resolve("session-delayed");
      await deferredSession.promise;
    });

    await waitFor(() => {
      expect(repository.finishPracticeSession).toHaveBeenCalledWith({
        sessionId: "session-delayed",
        status: "interrupted"
      });
    });
    expect(repository.recordPracticeEvent).not.toHaveBeenCalled();
  });

  it("does not complete practice when the sample media is unavailable", async () => {
    const repository = makeRepository("session-unavailable");
    mockUseKidEduRepository.mockReturnValue(repository);

    const { result, unmount } = await renderHook(() => useSingleItemProgress("item-1"));

    await waitFor(() => expect(repository.startPracticeSession).toHaveBeenCalledTimes(1));
    await act(() => result.current.recordSampleCompleted("unavailable"));
    await unmount();

    await waitFor(() => {
      expect(repository.finishPracticeSession).toHaveBeenCalledWith({
        sessionId: "session-unavailable",
        status: "interrupted"
      });
    });
    expect(repository.recordPracticeEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "completed_item" })
    );
  });
});

function makeRepository(sessionId: string): KidEduRepository {
  return {
    startPracticeSession: jest.fn(async () => sessionId),
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
