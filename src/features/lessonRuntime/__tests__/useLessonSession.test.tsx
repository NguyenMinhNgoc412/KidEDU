import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { getDevelopmentLesson } from "../developmentLesson";
import { createLessonSession } from "../sessionEngine";
import { useLessonSession } from "../useLessonSession";
import { prepareSampleLesson } from "../lessonCatalog";

const childId = "10000000-0000-4000-8000-000000000011";
const mockAuth = {
  accountId: "10000000-0000-4000-8000-000000000010",
  accessToken: "synthetic-token",
  expiresAt: "2030-01-01T00:00:00Z"
};
const mockChildren = jest.fn();
const mockRepository = {
  selectedLesson: jest.fn().mockResolvedValue(null),
  load: jest.fn(),
  start: jest.fn(),
  checkpoint: jest.fn(),
  commitObservation: jest.fn()
};
const mockListeners = new Set<(state: string) => void>();
jest.mock("react-native-web/dist/exports/AppState", () => ({
  __esModule: true,
  default: {
    currentState: "active",
    addEventListener: (_type: string, callback: (state: string) => void) => {
      mockListeners.add(callback);
      return { remove: () => mockListeners.delete(callback) };
    }
  }
}));
jest.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ session: mockAuth, accessTokenValid: true })
}));
jest.mock("@/features/entitlement/LearningAccessProvider", () => ({
  useLearningAccess: () => ({ status: "allowed" })
}));
jest.mock("../LessonRuntimeProvider", () => ({
  useLessonRuntimeRepository: () => ({ repository: mockRepository, error: false })
}));
jest.mock("@/api/localClient", () => ({
  createLocalApiClient: () => ({ listChildren: mockChildren })
}));
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  jest.clearAllMocks();
  mockListeners.clear();
  mockChildren.mockResolvedValue([{ id: childId }]);
  mockRepository.load.mockResolvedValue(
    createLessonSession("fixture_test", childId, getDevelopmentLesson(true))
  );
  mockRepository.start.mockResolvedValue(undefined);
  mockRepository.checkpoint.mockResolvedValue(undefined);
});
test("background during pending checkpoint queues pause; foreground does not resume", async () => {
  const view = await renderHook(() => useLessonSession(childId), { wrapper });
  await waitFor(() => expect(view.result.current.session?.phase).toBe("overview"));
  let complete!: () => void;
  mockRepository.checkpoint.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      })
  );
  let started: Promise<void> | undefined;
  await act(() => {
    started = view.result.current.apply({ type: "start" });
  });
  await act(() => {
    mockListeners.forEach((listener) => listener("background"));
  });
  await act(async () => {
    complete();
    await started;
  });
  await waitFor(() => expect(view.result.current.session?.phase).toBe("paused"));
  await act(() => {
    mockListeners.forEach((listener) => listener("active"));
  });
  expect(view.result.current.session?.phase).toBe("paused");
  expect(mockChildren).toHaveBeenCalledTimes(1);
  await view.unmount();
});
test("unowned child fails preparation before local session is created", async () => {
  mockChildren.mockResolvedValue([]);
  const view = await renderHook(() => useLessonSession(childId), { wrapper });
  await waitFor(() => expect(view.result.current.error).not.toBeNull());
  expect(mockRepository.load).not.toHaveBeenCalled();
  expect(mockRepository.start).not.toHaveBeenCalled();
  await view.unmount();
});

test("selected lesson prepares and resumes by its generation instead of another open lesson", async () => {
  mockRepository.selectedLesson.mockResolvedValueOnce("fixture_lesson_ball");
  mockRepository.load.mockResolvedValueOnce(null);
  const view = await renderHook(() => useLessonSession(childId), { wrapper });
  await waitFor(() =>
    expect(view.result.current.session?.prepared.lesson.id).toBe("fixture_lesson_ball")
  );
  expect(mockRepository.load).toHaveBeenCalledWith(
    childId,
    prepareSampleLesson(true, "fixture_lesson_ball").generation
  );
  expect(mockRepository.start).toHaveBeenCalledTimes(1);
  await view.unmount();
});

test("unknown selected lesson cannot silently open the default lesson", async () => {
  mockRepository.selectedLesson.mockResolvedValueOnce("not_a_lesson");
  const view = await renderHook(() => useLessonSession(childId), { wrapper });
  await waitFor(() => expect(view.result.current.error).not.toBeNull());
  expect(mockRepository.load).not.toHaveBeenCalled();
  expect(mockRepository.start).not.toHaveBeenCalled();
  await view.unmount();
});
