import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { getDevelopmentLesson } from "../developmentLesson";
import { createLessonSession, transition } from "../sessionEngine";
import { restoreSession } from "../restoreSession";
import { useParentGateStore } from "@/features/parent/parentGate";
import { useLessonSession } from "../useLessonSession";
import { prepareSampleLesson } from "../lessonCatalog";
import { combinePracticeLessons } from "@/features/practice/preparePracticeCourse";
const courseIds = ["fixture_lesson_put_ball", "fixture_lesson_refusal"];

it("rejects the retired word-game deep link instead of opening an unlimited learning course", async () => {
  const { result } = await renderHook(() => useLessonSession(childId, "fixture_play_today_words"), {
    wrapper
  });
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(mockPreparePractice).not.toHaveBeenCalled();
  expect(mockRepository.start).not.toHaveBeenCalled();
});
const mockAccess = { status: "allowed" };

const childId = "10000000-0000-4000-8000-000000000011";
const mockAuth = {
  accountId: "10000000-0000-4000-8000-000000000010",
  accessToken: "synthetic-token",
  expiresAt: "2030-01-01T00:00:00Z"
};
const mockChildren = jest.fn();
const mockPreparePractice = jest.fn();
const mockPracticeCheckpoints = jest.fn();
const mockRepository = {
  stickerCollection: jest.fn().mockResolvedValue([]),
  selectedLesson: jest.fn().mockResolvedValue(null),
  load: jest.fn(),
  start: jest.fn(),
  checkpoint: jest.fn(),
  commitObservation: jest.fn(),
  hasSession: jest.fn().mockResolvedValue(false)
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
  useLearningAccess: () => mockAccess
}));
jest.mock("../LessonRuntimeProvider", () => ({
  useLessonRuntimeRepository: () => ({ repository: mockRepository, error: false })
}));
jest.mock("@/api/localClient", () => ({
  createLocalApiClient: () => ({
    listChildren: mockChildren,
    preparePracticeLesson: mockPreparePractice,
    getPracticeCatalog: async () => ({
      schemaVersion: 1,
      version: "practice_fixture_v1",
      source: "development_fixture",
      learningAllowed: true,
      goals: [],
      lessons: courseIds.map((id) => ({
        id,
        goalId: "command",
        title: id,
        preparation: "",
        itemId: "item-bong",
        version: 1,
        prerequisiteLessonIds: [],
        activityTypes: []
      }))
    }),
    getPracticePlan: async () => ({ revision: 0, document: null }),
    getPracticeCheckpoints: mockPracticeCheckpoints
  })
}));
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  jest.clearAllMocks();
  mockListeners.clear();
  mockAccess.status = "allowed";
  mockChildren.mockResolvedValue([{ id: childId }]);
  mockRepository.load.mockResolvedValue(
    createLessonSession("fixture_test", childId, getDevelopmentLesson(true))
  );
  mockRepository.start.mockResolvedValue(undefined);
  mockRepository.checkpoint.mockResolvedValue(undefined);
  mockPreparePractice.mockResolvedValue({
    source: "development_fixture",
    lessonId: "fixture_lesson_put_ball",
    lessonVersion: 1,
    curriculumVersion: "practice_fixture_v1",
    lessonIds: courseIds
  });
  mockPracticeCheckpoints.mockResolvedValue({ checkpoints: [] });
  mockRepository.hasSession.mockResolvedValue(false);
});
test("parents can resume and finish saved end-of-session reviews after learning access expires", async () => {
  const prepared = {
    ...combinePracticeLessons(courseIds.map((id) => prepareSampleLesson(true, id))),
    media: {
      retired_image: {
        uri: "file:///missing.jpg",
        accountId: mockAuth.accountId,
        childId,
        type: "image" as const,
        mimeType: "image/jpeg",
        role: "semantic_visual" as const
      }
    }
  };
  let saved = transition(createLessonSession("practice_review", childId, prepared), {
    type: "start"
  });
  saved = transition(saved, { type: "defer" });
  saved = transition(saved, { type: "defer" });
  mockRepository.load.mockResolvedValue(restoreSession(JSON.stringify(saved), childId));
  mockAccess.status = "expired";
  useParentGateStore.getState().unlock();
  const view = await renderHook(() => useLessonSession(childId, courseIds[0]), { wrapper });
  await waitFor(() => expect(view.result.current.session?.resumePhase).toBe("observation"));
  expect(mockPreparePractice).not.toHaveBeenCalled();
  await act(async () => {
    await view.result.current.apply({ type: "resume" });
  });
  await act(async () => {
    await view.result.current.observe("not_observed");
  });
  expect(view.result.current.session?.phase).toBe("observation");
  expect(view.result.current.session?.course?.reviewIndex).toBe(1);
  expect(mockRepository.commitObservation).toHaveBeenCalledTimes(1);
  await view.unmount();
  useParentGateStore.getState().lock();
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

test("practice uses server preparation and a separate generation without changing the Học selection", async () => {
  mockRepository.load.mockResolvedValue(null);
  const view = await renderHook(() => useLessonSession(childId, "fixture_lesson_put_ball"), {
    wrapper
  });
  await waitFor(() => expect(view.result.current.session?.phase).toBe("overview"));
  expect(mockPreparePractice).toHaveBeenCalledWith(childId, "fixture_lesson_put_ball", courseIds);
  expect(mockRepository.selectedLesson).not.toHaveBeenCalled();
  expect(view.result.current.session?.prepared.generation).toBe(
    "practice-course:fixture:fixture_lesson_put_ball:1"
  );
  await act(async () => {
    await view.result.current.apply({ type: "start" });
  });
  await act(async () => {
    await view.result.current.apply({ type: "begin_wait" });
  });
  expect(mockPreparePractice).toHaveBeenCalledTimes(1);
  expect(mockChildren).toHaveBeenCalledTimes(1);
  await view.unmount();
});
test("a denied preparation never starts a local practice session", async () => {
  mockRepository.load.mockResolvedValue(null);
  mockPreparePractice.mockRejectedValueOnce(new Error("FORBIDDEN"));
  const view = await renderHook(() => useLessonSession(childId, "fixture_lesson_put_ball"), {
    wrapper
  });
  await waitFor(() => expect(view.result.current.error).not.toBeNull());
  expect(mockRepository.start).not.toHaveBeenCalled();
  await view.unmount();
});
test("remote checkpoint restores paused; a locally completed ID is not resurrected", async () => {
  const checkpoint = {
    sessionId: "practice_remote",
    document: {
      schemaVersion: 1,
      lessonId: "fixture_lesson_put_ball",
      lessonVersion: 1,
      revision: 3,
      index: 0,
      phase: "waiting",
      resumePhase: null,
      promptLevel: 0,
      repeats: 0,
      waitRemainingMs: 1000,
      deferred: false,
      course: { lessonIds: courseIds, attempts: [], reviewIndex: 0 }
    }
  };
  mockRepository.load.mockResolvedValue(null);
  mockPracticeCheckpoints.mockResolvedValue({ checkpoints: [checkpoint] });
  const view = await renderHook(() => useLessonSession(childId, "fixture_lesson_put_ball"), {
    wrapper
  });
  await waitFor(() => expect(view.result.current.session?.phase).toBe("paused"));
  expect(view.result.current.session?.id).toBe("practice_remote");
  await view.unmount();
  mockRepository.load.mockResolvedValueOnce(null);
  mockRepository.hasSession.mockResolvedValueOnce(true);
  const second = await renderHook(() => useLessonSession(childId, "fixture_lesson_put_ball"), {
    wrapper
  });
  await waitFor(() => expect(second.result.current.session?.phase).toBe("overview"));
  expect(second.result.current.session?.id).not.toBe("practice_remote");
  await second.unmount();
});
