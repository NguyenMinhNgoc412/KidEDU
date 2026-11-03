import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { useParentGateStore } from "@/features/parent/parentGate";
import { localFixtureEnabled } from "./fixtureBoundary";
import { findSampleLesson, sampleLessons } from "./lessonCatalog";
import { useLessonRuntimeRepository } from "./LessonRuntimeProvider";

export function useLessonSelection(childId: string | undefined) {
  const { session } = useAuth();
  const { repository, error } = useLessonRuntimeRepository();
  const client = useQueryClient();
  const key = ["lesson-selection", session?.accountId, childId];
  const query = useQuery({
    queryKey: key,
    enabled: localFixtureEnabled() && Boolean(repository && childId),
    queryFn: async () => (await repository!.selectedLesson(childId!)) ?? sampleLessons[0].id
  });
  const mutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (
        !localFixtureEnabled() ||
        !repository ||
        !childId ||
        !session ||
        !useParentGateStore.getState().isUnlocked ||
        !findSampleLesson(lessonId)
      )
        throw new Error("SELECTION_NOT_ALLOWED");
      await repository.selectLesson(childId, lessonId);
      return lessonId;
    },
    onSuccess: (lessonId) => {
      client.setQueryData(key, lessonId);
    }
  });
  return {
    lesson: findSampleLesson(query.data ?? sampleLessons[0].id) ?? sampleLessons[0],
    loading: !repository || query.isPending,
    saving: mutation.isPending,
    error: error || query.isError || mutation.isError,
    select: mutation.mutateAsync
  };
}
