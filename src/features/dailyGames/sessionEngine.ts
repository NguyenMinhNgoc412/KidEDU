import {
  dailyGamePlanSchemaV1,
  validateDailyGameCheckpoint,
  type DailyGameCheckpointV1,
  type DailyGamePlanV1
} from "../../content/contracts/dailyGame";

export type DailyGameAction =
  | { type: "place_shadow"; roundId: string; targetId: string; slotTargetId: string }
  | { type: "choose_listen"; roundId: string; targetId: string }
  | { type: "open_memory"; cardId: string }
  | { type: "close_unmatched"; cardIds: readonly string[] };

export function initialDailyGameCheckpoint(planInput: unknown): DailyGameCheckpointV1 {
  const plan = dailyGamePlanSchemaV1.parse(planInput);
  return {
    schemaVersion: 1,
    kind: "daily_game",
    contentVersion: plan.contentVersion,
    shadowScreenIndex: 0,
    placedTargetIds: [],
    listenRoundIndex: 0,
    memoryMatchedTargetIds: [],
    memoryOpenCardIds: []
  };
}

export function dailyGamePhase(plan: DailyGamePlanV1, checkpoint: DailyGameCheckpointV1) {
  if (checkpoint.shadowScreenIndex < plan.shadowScreens.length) return "shadow";
  if (checkpoint.listenRoundIndex < plan.listenRounds.length) return "listen";
  if (checkpoint.memoryMatchedTargetIds.length < plan.memoryTargetIds.length) return "memory";
  return "completed";
}

/** Prepared local domain only: no network, timers, observations, entitlement or rewards.
 * Persist the returned checkpoint before presenting the next round. The coordinator
 * must check reset/access at boundaries and use the server's pinned plan on restore.
 */
export function advanceDailyGame(
  planInput: unknown,
  checkpointInput: unknown,
  action: DailyGameAction
): { checkpoint: DailyGameCheckpointV1; feedback: "correct" | "try_again" | "none" } {
  const plan = dailyGamePlanSchemaV1.parse(planInput);
  const checkpoint = validateDailyGameCheckpoint(plan, checkpointInput);
  const phase = dailyGamePhase(plan, checkpoint);
  const unchanged = { checkpoint, feedback: "none" as const };
  if (phase === "shadow" && action.type === "place_shadow") {
    const screen = plan.shadowScreens[checkpoint.shadowScreenIndex]!;
    if (action.roundId !== screen.id) return unchanged;
    const targets = screen.targetIds;
    if (
      !targets.includes(action.targetId) ||
      !targets.includes(action.slotTargetId) ||
      checkpoint.placedTargetIds.includes(action.targetId)
    )
      return unchanged;
    if (action.targetId !== action.slotTargetId) return { checkpoint, feedback: "try_again" };
    const placed = [...checkpoint.placedTargetIds, action.targetId];
    const done = placed.length === targets.length;
    return {
      checkpoint: {
        ...checkpoint,
        shadowScreenIndex: checkpoint.shadowScreenIndex + (done ? 1 : 0),
        placedTargetIds: done ? [] : placed
      },
      feedback: "correct"
    };
  }
  if (phase === "listen" && action.type === "choose_listen") {
    const round = plan.listenRounds[checkpoint.listenRoundIndex]!;
    if (action.roundId !== round.id || !round.optionTargetIds.includes(action.targetId))
      return unchanged;
    if (round.targetId !== action.targetId) return { checkpoint, feedback: "try_again" };
    return {
      checkpoint: { ...checkpoint, listenRoundIndex: checkpoint.listenRoundIndex + 1 },
      feedback: "correct"
    };
  }
  if (phase === "memory") {
    if (
      action.type === "close_unmatched" &&
      checkpoint.memoryOpenCardIds.length === 2 &&
      action.cardIds.length === 2 &&
      action.cardIds.every((id, i) => id === checkpoint.memoryOpenCardIds[i])
    )
      return { checkpoint: { ...checkpoint, memoryOpenCardIds: [] }, feedback: "none" };
    if (action.type !== "open_memory" || checkpoint.memoryOpenCardIds.length === 2)
      return unchanged;
    const target = action.cardId.slice(0, -2);
    if (
      !/:[ab]$/.test(action.cardId) ||
      !plan.memoryTargetIds.includes(target) ||
      checkpoint.memoryMatchedTargetIds.includes(target) ||
      checkpoint.memoryOpenCardIds.includes(action.cardId)
    )
      return unchanged;
    const opened = [...checkpoint.memoryOpenCardIds, action.cardId];
    if (opened.length === 1)
      return { checkpoint: { ...checkpoint, memoryOpenCardIds: opened }, feedback: "none" };
    if (opened[0]!.slice(0, -2) !== target)
      return { checkpoint: { ...checkpoint, memoryOpenCardIds: opened }, feedback: "try_again" };
    return {
      checkpoint: {
        ...checkpoint,
        memoryOpenCardIds: [],
        memoryMatchedTargetIds: [...checkpoint.memoryMatchedTargetIds, target]
      },
      feedback: "correct"
    };
  }
  return unchanged;
}
