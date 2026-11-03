import type { components } from "@/api/generated";
import type { PreparedLesson } from "./prepareLesson";

export type ObservationResult = components["schemas"]["ObservationEvent"]["payload"]["result"];
export type LessonEvent = components["schemas"]["ObservationEvent"];
export type Phase = "overview" | "presenting" | "waiting" | "observation" | "paused" | "finished";
export interface LessonSession {
  id: string;
  childId: string;
  revision: number;
  prepared: PreparedLesson;
  index: number;
  phase: Phase;
  resumePhase: Exclude<Phase, "paused"> | null;
  waitRemainingMs: number;
  promptLevel: number;
  repeats: number;
  deferred: boolean;
}
export type Action =
  | { type: "start" }
  | { type: "begin_wait" }
  | { type: "elapsed"; ms: number }
  | { type: "prompt" }
  | { type: "replay" }
  | { type: "observe" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "defer" }
  | { type: "confirm_prompt"; level: number };

export function createLessonSession(
  id: string,
  childId: string,
  prepared: PreparedLesson
): LessonSession {
  return {
    id,
    childId,
    prepared,
    revision: 0,
    index: 0,
    phase: "overview",
    resumePhase: null,
    waitRemainingMs: 0,
    promptLevel: 0,
    repeats: 0,
    deferred: false
  };
}
export function transition(session: LessonSession, action: Action): LessonSession {
  const activity = session.prepared.activities[session.index];
  if (!activity || session.phase === "finished") return session;
  let next = { ...session };
  switch (action.type) {
    case "defer":
      if (session.phase !== "presenting" && session.phase !== "waiting") return session;
      next.phase = "observation";
      next.deferred = true;
      break;
    case "confirm_prompt":
      if (
        session.phase !== "observation" ||
        !Number.isInteger(action.level) ||
        action.level < session.promptLevel ||
        action.level >= activity.promptLadder.length
      )
        return session;
      next.promptLevel = action.level;
      break;
    case "pause":
      if (session.phase === "paused") return session;
      next = { ...next, phase: "paused", resumePhase: session.phase };
      break;
    case "resume":
      if (session.phase !== "paused" || !session.resumePhase) return session;
      next = { ...next, phase: session.resumePhase, resumePhase: null };
      break;
    case "start":
      if (session.phase !== "overview") return session;
      next.phase = "presenting";
      break;
    case "begin_wait":
      if (session.phase !== "presenting") return session;
      next.phase = "waiting";
      next.waitRemainingMs = activity.timing.waitMinMs;
      break;
    case "elapsed":
      if (session.phase !== "waiting" || !Number.isFinite(action.ms) || action.ms <= 0)
        return session;
      next.waitRemainingMs = Math.max(0, session.waitRemainingMs - action.ms);
      break;
    case "prompt":
      if (session.phase !== "waiting" || session.waitRemainingMs > 0) return session;
      if (session.promptLevel >= activity.promptLadder.length - 1) return session;
      next.promptLevel += 1;
      next.waitRemainingMs = activity.timing.waitMinMs;
      break;
    case "replay":
      if (session.phase !== "waiting" || session.repeats >= activity.repetitionLimit)
        return session;
      next.repeats += 1;
      next.phase = "presenting";
      break;
    case "observe":
      if (session.phase !== "waiting" || session.waitRemainingMs > 0) return session;
      next.phase = "observation";
      break;
  }
  return { ...next, revision: session.revision + 1 };
}

export function recordObservation(
  session: LessonSession,
  result: ObservationResult,
  occurredAt: string,
  parentAuthorized: boolean
): { next: LessonSession; event: LessonEvent } {
  if (!parentAuthorized || session.phase !== "observation")
    throw new Error("PARENT_OBSERVATION_REQUIRED");
  const activity = session.prepared.activities[session.index]!;
  if (result === "independent" && session.promptLevel > 0)
    throw new Error("PROMPT_RESULT_CONFLICT");
  if (result === "supported" && session.promptLevel === 0)
    throw new Error("PROMPT_CONFIRMATION_REQUIRED");
  if (session.deferred && result !== "not_observed") throw new Error("DEFERRED_NOT_OBSERVED");
  const levels = { independent: 0, natural_cue: 0, visual_cue: 1, partial_model: 2, full_model: 3 };
  const prompt = activity.promptLadder[session.promptLevel]!;
  const event: LessonEvent = {
    schemaVersion: 1,
    eventType: "observation.recorded",
    eventId: `${session.id}:${session.index}`,
    childId: session.childId,
    occurredAt,
    payload: {
      goalId: activity.goalId,
      targetId: activity.targetIds[0]!,
      activityType: activity.type,
      contentVersion: activity.version,
      result,
      promptLevel: result === "not_observed" ? null : levels[prompt.level],
      context: activity.type === "parent_transfer" ? "parent_guided" : "in_app",
      sessionId: session.id
    }
  };
  const index = session.index + 1;
  return {
    event,
    next: {
      ...session,
      revision: session.revision + 1,
      index,
      phase: index === session.prepared.activities.length ? "finished" : "presenting",
      resumePhase: null,
      promptLevel: 0,
      repeats: 0,
      waitRemainingMs: 0,
      deferred: false
    }
  };
}
