import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { useParentGateStore } from "@/features/parent/parentGate";
import { localFixtureEnabled } from "./fixtureBoundary";
import { findSampleLesson, sampleLessons } from "./lessonCatalog";
import { useLessonRuntimeRepository } from "./LessonRuntimeProvider";
import { recommendPractice } from "./lessonRecommendation";

export function useLessonSelection(childId: string | undefined) {
  const { session } = useAuth();
  const { repository, error } = useLessonRuntimeRepository();
  const client = useQueryClient();
  const key = ["lesson-selection", session?.accountId, childId];
  const query = useQuery({
    queryKey: key,
    enabled: localFixtureEnabled() && Boolean(repository && childId),
    queryFn: async () => {
      const selected = await repository!.selectedLesson(childId!);
      return selected && selected !== "fixture_play_today_words" ? selected : sampleLessons[0].id;
    }
  });
  const mutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (
        !localFixtureEnabled() ||
        !repository ||
        !childId ||
        !session ||
        !useParentGateStore.getState().isUnlocked ||
        !findSampleLesson(lessonId) ||
        lessonId === "fixture_play_today_words"
      )
        throw new Error("SELECTION_NOT_ALLOWED");
      await repository.selectLesson(childId, lessonId);
      return lessonId;
    },
    onSuccess: (lessonId) => {
      client.setQueryData(key, lessonId);
    }
  });
  const history = useQuery({
    queryKey: ["lesson-runtime-history", session?.accountId, childId],
    enabled: localFixtureEnabled() && Boolean(repository && childId),
    queryFn: () => repository!.history(childId!)
  });
  const recommendations =
    localFixtureEnabled() && childId && history.data
      ? Object.fromEntries(
          sampleLessons.map((sample) => {
            return [
              sample.id,
              recommendPractice(
                history.data.map(({ event }) => event),
                {
                  childId,
                  goalId: `fixture_goal_${sample.goal}`,
                  targetId:
                    sample.id === "fixture_lesson_request"
                      ? "fixture_target_water"
                      : `${sample.id}_target`
                }
              )
            ];
          })
        )
      : {};
  return {
    recommendations,
    historyError: history.isError,
    lesson: findSampleLesson(query.data ?? sampleLessons[0].id) ?? sampleLessons[0],
    loading: !repository || query.isPending,
    saving: mutation.isPending,
    error: error || query.isError || mutation.isError,
    select: mutation.mutateAsync
  };
}
