import type { components } from "@/api/generated";
import type { LessonSession } from "@/features/lessonRuntime/sessionEngine";
import { restoreSession } from "@/features/lessonRuntime/restoreSession";
import { freezePreparedLesson, type PreparedLesson } from "@/features/lessonRuntime/prepareLesson";

export function scopePracticeLesson(prepared: PreparedLesson): PreparedLesson {
  return freezePreparedLesson({ ...prepared, generation: `practice:${prepared.generation}` });
}
export function practiceCheckpoint(
  session: LessonSession
): components["schemas"]["PracticeCheckpoint"] {
  return {
    schemaVersion: 1,
    lessonId: session.prepared.lesson.id,
    lessonVersion: session.prepared.lesson.version,
    revision: session.revision,
    index: session.index,
    phase: session.phase,
    resumePhase: session.resumePhase === "finished" ? null : session.resumePhase,
    waitRemainingMs: session.waitRemainingMs,
    promptLevel: session.promptLevel,
    repeats: session.repeats,
    deferred: session.deferred,
    ...(session.gameRounds ? { gameRounds: session.gameRounds } : {}),
    ...(session.gameStickers ? { gameStickers: session.gameStickers } : {}),
    ...(session.gameProgress ? { gameProgress: session.gameProgress } : {}),
    ...(session.rewardReceipts ? { rewardReceipts: session.rewardReceipts } : {}),
    ...(session.pendingReward ? { pendingReward: session.pendingReward } : {}),
    ...(session.course ? { course: session.course } : {})
  };
}
export function restorePracticeCheckpoint(
  sessionId: string,
  childId: string,
  prepared: PreparedLesson,
  checkpoint: components["schemas"]["PracticeCheckpoint"]
): LessonSession {
  if (
    !sessionId.startsWith("practice_") ||
    checkpoint.lessonId !== prepared.lesson.id ||
    checkpoint.lessonVersion !== prepared.lesson.version ||
    checkpoint.phase === "finished"
  )
    throw new Error("INVALID_CHECKPOINT");
  const state = {
    revision: checkpoint.revision,
    index: checkpoint.index,
    phase: checkpoint.phase,
    resumePhase: checkpoint.resumePhase,
    promptLevel: checkpoint.promptLevel,
    repeats: checkpoint.repeats,
    waitRemainingMs: checkpoint.waitRemainingMs,
    deferred: checkpoint.deferred,
    ...(checkpoint.gameRounds ? { gameRounds: checkpoint.gameRounds } : {}),
    ...(checkpoint.gameStickers ? { gameStickers: checkpoint.gameStickers } : {}),
    ...(checkpoint.gameProgress ? { gameProgress: checkpoint.gameProgress } : {}),
    ...(checkpoint.rewardReceipts ? { rewardReceipts: checkpoint.rewardReceipts } : {}),
    ...(checkpoint.pendingReward ? { pendingReward: checkpoint.pendingReward } : {}),
    ...(checkpoint.course ? { course: checkpoint.course } : {})
  };
  return restoreSession(JSON.stringify({ ...state, id: sessionId, childId, prepared }), childId);
}
