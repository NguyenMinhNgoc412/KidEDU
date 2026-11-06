import type { components } from "@/api/generated";
import type { PreparedLesson } from "./prepareLesson";
import type { ActivityV1 } from "@/content/contracts/activity";
import type { PracticeCourseState } from "@/features/practice/practiceCourseState";
import { giftChoices, type StickerPicture } from "@/features/practice/wordGames";
import { emptyWordGameProgress, type WordGameProgress } from "@/content/contracts/wordGameProgress";
import { wordGameSteps, type WordGameInput } from "@/features/practice/wordGameSteps";
import { isPlaySolved, type PlayState } from "@/features/practice/playState";
import type { PendingReward, RewardReceipt, RewardKind } from "@/content/contracts/gameReward";
import { prepareReward } from "@/features/practice/rewardCatalog";

const promptLevels = {
  independent: 0,
  natural_cue: 0,
  visual_cue: 1,
  partial_model: 2,
  full_model: 3
};
export function hasAssistance(activity: ActivityV1, promptIndex: number) {
  // Prompt position is authored ordering, not a measure of assistance.
  return promptLevels[activity.promptLadder[promptIndex]!.level] > 0;
}

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
  course?: PracticeCourseState;
  gameRounds?: Record<string, number>;
  gameStickers?: Record<string, StickerPicture>;
  gameProgress?: Record<string, WordGameProgress>;
  rewardReceipts?: Record<string, RewardReceipt>;
  pendingReward?: PendingReward;
}
export type Action =
  | { type: "begin_play_reward"; activityId: string; state: PlayState; inventory: string[] }
  | { type: "begin_round_reward"; activityId: string; round: number; inventory: string[] }
  | { type: "begin_lesson_reward"; activityId: string; inventory: string[] }
  | { type: "choose_reward"; key: string; kind: RewardKind }
  | { type: "open_reward"; key: string }
  | { type: "advance_reward"; key: string }
  | { type: "finish_play"; activityId: string; state: PlayState }
  | { type: "game_input"; input: WordGameInput }
  | { type: "claim_game_gift"; sticker: string }
  | { type: "finish_games" }
  | { type: "game_round"; round: number }
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
    deferred: false,
    ...(prepared.courseLessonIds
      ? { course: { lessonIds: prepared.courseLessonIds, attempts: [], reviewIndex: 0 } }
      : {})
  };
}
export function sessionActivityIndex(session: LessonSession) {
  return session.course &&
    (session.phase === "observation" ||
      (session.phase === "paused" && session.resumePhase === "observation"))
    ? session.course.reviewIndex
    : session.index;
}
export function sessionActivity(session: LessonSession) {
  return session.prepared.activities[sessionActivityIndex(session)];
}
function completeCourseLesson(session: LessonSession, deferred: boolean): LessonSession {
  const course = session.course!;
  const attempts = [
    ...course.attempts,
    {
      index: session.index,
      promptLevel: session.promptLevel,
      repeats: session.repeats,
      deferred,
      occurredAt: new Date().toISOString()
    }
  ];
  const reviewing = attempts.length === course.lessonIds.length;
  const first = attempts[0]!;
  return {
    ...session,
    pendingReward: undefined,
    revision: session.revision + 1,
    index: reviewing ? session.index : session.index + 1,
    phase: reviewing ? "observation" : "presenting",
    resumePhase: null,
    waitRemainingMs: 0,
    promptLevel: reviewing ? first.promptLevel : 0,
    repeats: reviewing ? first.repeats : 0,
    deferred: reviewing ? first.deferred : false,
    course: { ...course, attempts }
  };
}
export function transition(session: LessonSession, action: Action): LessonSession {
  const activity = sessionActivity(session);
  if (!activity || session.phase === "finished") return session;
  if (
    session.pendingReward &&
    !["choose_reward", "open_reward", "advance_reward", "pause", "resume", "defer"].includes(
      action.type
    )
  )
    return session;
  if (
    action.type === "observe" &&
    activity.presentation?.wordGames &&
    (session.gameRounds?.[activity.id] ?? 0) < wordGameSteps.length
  )
    return session;
  let next = { ...session };
  switch (action.type) {
    case "begin_play_reward":
    case "begin_round_reward":
    case "begin_lesson_reward": {
      if (
        !activity.presentation ||
        action.activityId !== activity.id ||
        session.pendingReward ||
        !["presenting", "waiting"].includes(session.phase)
      )
        return session;
      let slot: PendingReward["slot"];
      if (action.type === "begin_play_reward") {
        if (activity.presentation.wordGames || !isPlaySolved(activity.presentation, action.state))
          return session;
        slot = "play";
      } else if (action.type === "begin_round_reward") {
        const previous = session.gameRounds?.[activity.id] ?? 0;
        const step = wordGameSteps[previous];
        if (
          !activity.presentation.wordGames ||
          action.round !== previous + 1 ||
          !step ||
          !step.complete(
            activity.presentation,
            session.gameProgress?.[activity.id] ?? emptyWordGameProgress()
          )
        )
          return session;
        slot = `round_${action.round}` as PendingReward["slot"];
      } else {
        if (
          !activity.presentation.wordGames ||
          session.gameRounds?.[activity.id] !== wordGameSteps.length ||
          session.gameStickers?.[activity.id]
        )
          return session;
        slot = "lesson";
      }
      return {
        ...session,
        revision: session.revision + 1,
        pendingReward: prepareReward(
          activity.id,
          slot,
          session.id,
          action.inventory,
          session.rewardReceipts ?? {}
        )
      };
    }
    case "choose_reward": {
      const pending = session.pendingReward;
      if (
        !pending ||
        pending.key !== action.key ||
        session.rewardReceipts?.[pending.key] ||
        !["presenting", "waiting"].includes(session.phase) ||
        (action.kind === "puzzle_piece" && !pending.pieceCandidate) ||
        !["sticker", "puzzle_piece"].includes(action.kind) ||
        pending.selectedKind === action.kind
      )
        return session;
      return {
        ...session,
        revision: session.revision + 1,
        pendingReward: { ...pending, selectedKind: action.kind }
      };
    }
    case "open_reward": {
      const pending = session.pendingReward;
      if (
        !pending ||
        pending.key !== action.key ||
        !pending.selectedKind ||
        session.rewardReceipts?.[pending.key] ||
        !["presenting", "waiting"].includes(session.phase)
      )
        return session;
      const itemId =
        pending.selectedKind === "sticker" ? pending.stickerCandidate : pending.pieceCandidate;
      if (!itemId) return session;
      return {
        ...session,
        revision: session.revision + 1,
        rewardReceipts: {
          ...session.rewardReceipts,
          [pending.key]: { kind: pending.selectedKind, itemId }
        }
      };
    }
    case "advance_reward": {
      const pending = session.pendingReward;
      if (
        !pending ||
        pending.key !== action.key ||
        !session.rewardReceipts?.[pending.key] ||
        !["presenting", "waiting"].includes(session.phase)
      )
        return session;
      const base = { ...session };
      delete base.pendingReward;
      if (pending.slot.startsWith("round_"))
        return transition(base, { type: "game_round", round: Number(pending.slot.slice(-1)) });
      if (session.course) return completeCourseLesson(base, false);
      return { ...base, revision: session.revision + 1, phase: "observation", waitRemainingMs: 0 };
    }
    case "finish_play":
      if (
        !activity.presentation ||
        activity.presentation.wordGames ||
        action.activityId !== activity.id ||
        !["presenting", "waiting"].includes(session.phase) ||
        !isPlaySolved(activity.presentation, action.state)
      )
        return session;
      if (session.course) return completeCourseLesson(session, false);
      return {
        ...session,
        revision: session.revision + 1,
        phase: "observation",
        waitRemainingMs: 0
      };
    case "game_input": {
      if (!activity.presentation?.wordGames || !["presenting", "waiting"].includes(session.phase))
        return session;
      const step = wordGameSteps[session.gameRounds?.[activity.id] ?? 0];
      if (!step) return session;
      const previous = session.gameProgress?.[activity.id] ?? emptyWordGameProgress();
      const progress = step.update(
        activity.presentation,
        previous,
        action.input,
        `${session.id}:${activity.id}`
      );
      if (progress === previous) return session;
      return {
        ...session,
        revision: session.revision + 1,
        gameProgress: { ...session.gameProgress, [activity.id]: progress }
      };
    }
    case "claim_game_gift": {
      const sticker = giftChoices(`${session.id}:${activity.id}`).find(
        (id) => id === action.sticker
      );
      if (
        !activity.presentation?.wordGames ||
        !["presenting", "waiting"].includes(session.phase) ||
        session.gameRounds?.[activity.id] !== wordGameSteps.length ||
        session.gameStickers?.[activity.id] ||
        !sticker
      )
        return session;
      return {
        ...session,
        revision: session.revision + 1,
        gameStickers: { ...session.gameStickers, [activity.id]: sticker }
      };
    }
    case "finish_games":
      if (
        !activity.presentation?.wordGames ||
        !["presenting", "waiting"].includes(session.phase) ||
        (session.gameRounds?.[activity.id] ?? 0) !== wordGameSteps.length ||
        !session.gameStickers?.[activity.id]
      )
        return session;
      if (session.course) return completeCourseLesson(session, false);
      return { ...session, revision: session.revision + 1, phase: "observation" };
    case "game_round": {
      const previous = session.gameRounds?.[activity.id] ?? 0;
      if (
        !activity.presentation?.wordGames ||
        !["presenting", "waiting"].includes(session.phase) ||
        action.round !== previous + 1 ||
        action.round > wordGameSteps.length
      )
        return session;
      return {
        ...session,
        revision: session.revision + 1,
        gameRounds: { ...session.gameRounds, [activity.id]: action.round }
      };
    }
    case "defer": {
      const pausedGame =
        session.phase === "paused" &&
        activity.presentation &&
        (session.resumePhase === "presenting" || session.resumePhase === "waiting");
      if (session.phase !== "presenting" && session.phase !== "waiting" && !pausedGame)
        return session;
      if (session.course) return completeCourseLesson(session, true);
      next.phase = "observation";
      next.resumePhase = null;
      delete next.pendingReward;
      next.deferred = true;
      break;
    }
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
      if (session.course) return completeCourseLesson(session, false);
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
  const activity = sessionActivity(session)!;
  const assisted = hasAssistance(activity, session.promptLevel);
  if (result === "independent" && assisted) throw new Error("PROMPT_RESULT_CONFLICT");
  if (result === "supported" && !assisted) throw new Error("PROMPT_CONFIRMATION_REQUIRED");
  if (session.deferred && result !== "not_observed") throw new Error("DEFERRED_NOT_OBSERVED");
  const prompt = activity.promptLadder[session.promptLevel]!;
  const event: LessonEvent = {
    schemaVersion: 1,
    eventType: "observation.recorded",
    eventId: `${session.id}:${sessionActivityIndex(session)}`,
    childId: session.childId,
    occurredAt: session.course?.attempts[session.course.reviewIndex]?.occurredAt ?? occurredAt,
    payload: {
      goalId: activity.goalId,
      targetId: activity.targetIds[0]!,
      activityType: activity.type,
      contentVersion: activity.version,
      result,
      promptLevel: result === "not_observed" ? null : promptLevels[prompt.level],
      context:
        activity.type === "parent_transfer" ||
        (activity.type === "command" && !activity.presentation)
          ? "parent_guided"
          : "in_app",
      sessionId: session.id
    }
  };
  const index = session.index + 1;
  if (session.course) {
    const reviewIndex = session.course.reviewIndex + 1;
    const attempt = session.course.attempts[reviewIndex];
    return {
      event,
      next: {
        ...session,
        revision: session.revision + 1,
        phase: attempt ? "observation" : "finished",
        index: attempt ? session.index : session.course.lessonIds.length,
        course: { ...session.course, reviewIndex },
        promptLevel: attempt?.promptLevel ?? 0,
        repeats: attempt?.repeats ?? 0,
        deferred: attempt?.deferred ?? false,
        waitRemainingMs: 0,
        resumePhase: null
      }
    };
  }
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
