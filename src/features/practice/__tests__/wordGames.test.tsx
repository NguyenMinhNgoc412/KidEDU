import {
  closeMemoryMismatch,
  flipMemory,
  giftChoices,
  memoryDeck,
  type MemoryState
} from "../wordGames";
import { playSampleLessons } from "@/features/lessonRuntime/playSampleLessons";
import { prepareSampleLesson } from "@/features/lessonRuntime/lessonCatalog";
import { createLessonSession, transition } from "@/features/lessonRuntime/sessionEngine";
import { restoreSession } from "@/features/lessonRuntime/restoreSession";
import { practiceCheckpoint } from "../practiceCheckpoint";
import { checkpointSchema } from "../../../../apps/api/src/practice/practice.schemas";
import { combinePracticeLessons } from "../preparePracticeCourse";
const sample = playSampleLessons.find((item) => item.id === "fixture_play_today_words")!;
const game = sample.presentation;

test("a paused child game can be deferred in a single durable revision, but review cannot", () => {
  const child = "22222222-2222-4222-8222-222222222222";
  const prepared = combinePracticeLessons([prepareSampleLesson(true, sample.id)]);
  let state = createLessonSession("practice_pause_skip", child, prepared);
  state = transition(transition(state, { type: "start" }), { type: "pause" });
  const skipped = transition(state, { type: "defer" });
  expect(skipped.revision).toBe(state.revision + 1);
  expect(skipped.phase).toBe("observation");
  expect(skipped.resumePhase).toBeNull();
  expect(skipped.course!.attempts[0]!.deferred).toBe(true);
  expect(restoreSession(JSON.stringify(skipped), child).course).toEqual(skipped.course);
  const pausedReview = transition(skipped, { type: "pause" });
  expect(transition(pausedReview, { type: "defer" })).toBe(pausedReview);
});
test("ten cards use the same five words; mismatch, duplicate taps and unknown cards never earn a pair", () => {
  const deck = memoryDeck(game.pieces, "test");
  expect(deck).toHaveLength(10);
  expect(new Set(deck.map((card) => card.wordId)).size).toBe(5);
  let state: MemoryState = { open: [], matched: [], feedback: "" };
  const first = deck[0]!,
    different = deck.find((card) => card.wordId !== first.wordId)!;
  state = flipMemory(deck, state, first.id);
  expect(flipMemory(deck, state, first.id)).toBe(state);
  expect(flipMemory(deck, state, "unknown")).toBe(state);
  state = flipMemory(deck, state, different.id);
  expect(state.matched).toHaveLength(0);
  expect(flipMemory(deck, state, deck[2]!.id)).toBe(state);
  state = closeMemoryMismatch(state);
  expect(state.open).toHaveLength(0);
  for (const word of game.pieces) {
    const cards = deck.filter((card) => card.wordId === word.id);
    state = flipMemory(deck, state, cards[0]!.id);
    state = flipMemory(deck, state, cards[1]!.id);
  }
  expect(state.matched).toHaveLength(5);
});
test("round checkpoints are sequential, idempotent and restore without fabricating parent observations", () => {
  const prepared = prepareSampleLesson(true, sample.id);
  const child = "22222222-2222-4222-8222-222222222222";
  let session = transition(createLessonSession("practice_words", child, prepared), {
    type: "start"
  });
  expect(transition(session, { type: "game_round", round: 2 })).toBe(session);
  expect(transition(session, { type: "observe" })).toBe(session);
  expect(transition(session, { type: "finish_games" })).toBe(session);
  session = transition(session, { type: "game_round", round: 1 });
  expect(transition(session, { type: "game_round", round: 1 })).toBe(session);
  expect(restoreSession(JSON.stringify(session), child).gameRounds).toEqual(session.gameRounds);
  const checkpoint = practiceCheckpoint(session);
  expect(checkpointSchema.safeParse(checkpoint).success).toBe(true);
  expect(
    checkpointSchema.safeParse({ ...checkpoint, gameRounds: { [prepared.activities[0]!.id]: 4 } })
      .success
  ).toBe(false);
  expect(session.phase).toBe("presenting");
  expect(session).not.toHaveProperty("observation");
  session = transition(session, { type: "game_round", round: 2 });
  session = transition(session, { type: "game_round", round: 3 });
  expect(transition(session, { type: "finish_games" })).toBe(session);
  const gift = giftChoices(`${session.id}:${prepared.activities[0]!.id}`)[0]!;
  session = transition(session, { type: "claim_game_gift", sticker: gift });
  expect(transition(session, { type: "claim_game_gift", sticker: gift })).toBe(session);
  expect(transition(session, { type: "claim_game_gift", sticker: "forged" })).toBe(session);
  expect(restoreSession(JSON.stringify(session), child).gameStickers).toEqual(session.gameStickers);
  expect(transition(session, { type: "game_round", round: 4 })).toBe(session);
  expect(
    transition(transition(session, { type: "pause" }), { type: "game_round", round: 3 }).phase
  ).toBe("paused");
  const finished = transition(session, { type: "finish_games" });
  expect(finished.phase).toBe("observation");
  expect(finished.gameRounds).toEqual(session.gameRounds);
  expect(finished).not.toHaveProperty("observation");
});
