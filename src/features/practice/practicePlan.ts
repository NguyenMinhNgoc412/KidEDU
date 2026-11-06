import type { components } from "@/api/generated";
export type PracticeCatalog = components["schemas"]["PracticeCatalog"];
export type PracticeDocument = components["schemas"]["PracticeDocument"];
export type PracticePlan = components["schemas"]["PracticePlan"];

/** Client-owned explainable composition; the server validates/persists the choice. */
export function composePractice(catalog: PracticeCatalog, document: PracticeDocument | null) {
  if (document?.lessonIds !== undefined) {
    const lessons = document.lessonIds.flatMap((id) => {
      const lesson = catalog.lessons.find(
        (item) => item.id === id && !document.deferredLessonIds.includes(id)
      );
      return lesson ? [lesson] : [];
    });
    return {
      lesson: lessons[0] ?? null,
      lessons,
      reason: lessons.length
        ? "Các bài và thứ tự do phụ huynh chọn cho phiên học."
        : "Phiên chưa có bài. Nhờ phụ huynh thêm bài trước khi bắt đầu."
    };
  }
  const goals = document?.goalIds ?? [];
  const available = catalog.lessons.filter(
    (lesson) => !document?.deferredLessonIds.includes(lesson.id)
  );
  const selected = available.find((lesson) => lesson.id === document?.selectedLessonId);
  const lesson =
    selected ??
    available.find(
      (lesson) => goals.includes(lesson.goalId) && lesson.prerequisiteLessonIds.length === 0
    ) ??
    available.find((lesson) => lesson.prerequisiteLessonIds.length === 0) ??
    available[0] ??
    null;
  return {
    lesson,
    lessons: lesson ? [lesson, ...available.filter((item) => item.id !== lesson.id)] : [],
    reason: selected
      ? "Buổi bạn đã chọn cho mục tiêu hiện tại."
      : lesson
        ? "Bắt đầu bằng một cơ hội quen thuộc trong mục tiêu bạn chọn."
        : goals.length
          ? "Các buổi phù hợp đang được để lúc khác. Bạn có thể chọn lại khi sẵn sàng."
          : "Cùng phụ huynh chọn điều con đang muốn luyện."
  };
}

export function changePracticeGoal(
  catalog: PracticeCatalog,
  document: PracticeDocument | null,
  goalId: string
): PracticeDocument {
  if (!catalog.goals.some((goal) => goal.id === goalId)) throw new Error("UNKNOWN_GOAL");
  const goalIds = document?.goalIds.includes(goalId)
    ? document.goalIds.filter((id) => id !== goalId)
    : [...(document?.goalIds ?? []), goalId];
  const next: PracticeDocument = {
    schemaVersion: 1,
    curriculumVersion: catalog.version,
    goalIds,
    selectedLessonId: document?.selectedLessonId ?? null,
    deferredLessonIds: document?.deferredLessonIds ?? [],
    ...(document?.lessonIds !== undefined ? { lessonIds: document.lessonIds } : {})
  };
  const first = composePractice(catalog, next).lesson;
  next.selectedLessonId = first && goalIds.includes(first.goalId) ? first.id : null;
  return next;
}

export function setPracticeLessons(
  catalog: PracticeCatalog,
  document: PracticeDocument | null,
  lessonIds: string[]
): PracticeDocument {
  if (
    lessonIds.length > 30 ||
    new Set(lessonIds).size !== lessonIds.length ||
    lessonIds.some((id) => !catalog.lessons.some((item) => item.id === id))
  )
    throw new Error("INVALID_SESSION_LESSONS");
  const lessons = lessonIds.map((id) => catalog.lessons.find((item) => item.id === id)!);
  return {
    schemaVersion: 1,
    curriculumVersion: catalog.version,
    goalIds: [...new Set([...(document?.goalIds ?? []), ...lessons.map((item) => item.goalId)])],
    selectedLessonId: lessonIds[0] ?? null,
    lessonIds,
    deferredLessonIds: catalog.lessons
      .filter((item) => !lessonIds.includes(item.id))
      .map((item) => item.id)
  };
}
