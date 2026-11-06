import { prepareSampleLesson } from "@/features/lessonRuntime/lessonCatalog";
import { createLessonSession, transition } from "@/features/lessonRuntime/sessionEngine";
import { restoreSession } from "@/features/lessonRuntime/restoreSession";
import { emptyWordGameProgress } from "@/content/contracts/wordGameProgress";
import { practiceCheckpoint } from "../practiceCheckpoint";
import { prepareReward, puzzlePieces, rewardStickers } from "../rewardCatalog";
import { checkpointSchema } from "../../../../apps/api/src/practice/practice.schemas";
const child = "22222222-2222-4222-8222-222222222222";
function ready() {
  const session = transition(
    createLessonSession(
      "practice_reward_test",
      child,
      prepareSampleLesson(true, "fixture_play_today_words")
    ),
    { type: "start" }
  );
  const id = session.prepared.activities[0]!.id;
  return {
    ...session,
    gameProgress: {
      [id]: { ...emptyWordGameProgress(), memoryMatched: ["ball", "bear", "car", "cake", "milk"] }
    }
  };
}
test("unsolved play cannot earn a reward; selected box survives restart and opens once", () => {
  let session = ready();
  const activityId = session.prepared.activities[0]!.id;
  const unsolved = { ...session, gameProgress: {} };
  expect(
    transition(unsolved, { type: "begin_round_reward", activityId, round: 1, inventory: [] })
  ).toBe(unsolved);
  session = transition(session, {
    type: "begin_round_reward",
    activityId,
    round: 1,
    inventory: []
  }) as typeof session;
  const key = session.pendingReward!.key;
  expect(transition(session, { type: "advance_reward", key })).toBe(session);
  session = transition(session, {
    type: "choose_reward",
    key,
    kind: "puzzle_piece"
  }) as typeof session;
  const candidate = session.pendingReward!.pieceCandidate;
  session = transition(restoreSession(JSON.stringify(session), child), {
    type: "resume"
  }) as typeof session;
  expect(session.pendingReward!.pieceCandidate).toBe(candidate);
  session = transition(session, { type: "open_reward", key }) as typeof session;
  expect(session.rewardReceipts![key]).toEqual({ kind: "puzzle_piece", itemId: candidate });
  expect(transition(session, { type: "open_reward", key })).toBe(session);
  expect(transition(session, { type: "choose_reward", key, kind: "sticker" })).toBe(session);
  expect(checkpointSchema.safeParse(practiceCheckpoint(session)).success).toBe(true);
  const corrupt = structuredClone(session);
  corrupt.pendingReward!.pieceCandidate =
    "piece_space_3" === candidate ? "piece_space_2" : "piece_space_3";
  expect(() => restoreSession(JSON.stringify(corrupt), child)).toThrow();
  expect(checkpointSchema.safeParse(practiceCheckpoint(corrupt)).success).toBe(false);
  const next = transition(session, { type: "advance_reward", key });
  expect(next.gameRounds![activityId]).toBe(1);
  expect(next.pendingReward).toBeUndefined();
  expect(next.rewardReceipts).toEqual(session.rewardReceipts);
  expect(transition(next, { type: "advance_reward", key })).toBe(next);
  expect(next.phase).toBe("presenting");
});
test("candidate is stable, avoids owned items and finishes an active puzzle", () => {
  const inventory = [
    "piece_garden_0",
    "piece_garden_1",
    "piece_garden_2",
    ...rewardStickers.slice(0, 17)
  ];
  const reward = prepareReward("activity_test", "play", "seed", inventory, {});
  expect(reward).toEqual(prepareReward("activity_test", "play", "seed", inventory, {}));
  expect(reward.pieceCandidate).toBe("piece_garden_3");
  expect(reward.stickerCandidate).toBe(rewardStickers[17]);
  expect(
    prepareReward("activity_test", "play", "seed", puzzlePieces, {}).pieceCandidate
  ).toBeNull();
});

test("all three games grant separate receipts then final box ends the lesson, without parent observations", () => {
  let session = ready();
  const activityId = session.prepared.activities[0]!.id;
  for (const round of [1, 2, 3]) {
    if (round === 2)
      for (const id of ["ball", "bear", "car", "cake", "milk"])
        session = transition(session, {
          type: "game_input",
          input: { type: "find", id }
        }) as typeof session;
    if (round === 3)
      for (const id of ["ball", "bear", "car", "cake", "milk"])
        session = transition(session, {
          type: "game_input",
          input: { type: "place", id, place: `${id}_pair` }
        }) as typeof session;
    session = transition(session, {
      type: "begin_round_reward",
      activityId,
      round,
      inventory: []
    }) as typeof session;
    const key = session.pendingReward!.key;
    session = transition(session, {
      type: "choose_reward",
      key,
      kind: "sticker"
    }) as typeof session;
    session = transition(session, { type: "open_reward", key }) as typeof session;
    session = transition(session, { type: "advance_reward", key }) as typeof session;
    expect(session.gameRounds![activityId]).toBe(round);
    expect(session.phase).toBe("presenting");
  }
  session = transition(session, {
    type: "begin_lesson_reward",
    activityId,
    inventory: []
  }) as typeof session;
  const key = session.pendingReward!.key;
  session = transition(session, {
    type: "choose_reward",
    key,
    kind: "puzzle_piece"
  }) as typeof session;
  session = transition(session, { type: "open_reward", key }) as typeof session;
  session = transition(session, { type: "advance_reward", key }) as typeof session;
  expect(Object.keys(session.rewardReceipts!)).toHaveLength(4);
  expect(session.phase).toBe("observation");
  expect(session).not.toHaveProperty("observation");
  expect(checkpointSchema.safeParse(practiceCheckpoint(session)).success).toBe(true);
});
