import { playSampleLessons } from "@/features/lessonRuntime/playSampleLessons";
import { prepareSampleLesson } from "@/features/lessonRuntime/lessonCatalog";
import { combinePracticeLessons } from "../preparePracticeCourse";
import { initialPlayState, isPlaySolved, type PlayState } from "../playState";
import {
  createLessonSession,
  sessionActivity,
  transition,
  recordObservation
} from "@/features/lessonRuntime/sessionEngine";
import { restoreSession } from "@/features/lessonRuntime/restoreSession";

const samples = playSampleLessons.filter((sample) => !sample.presentation.wordGames);
function solved(index: number): PlayState {
  const game = samples[index]!.presentation;
  return {
    ...initialPlayState(),
    placed: { ...game.matches },
    order: [...game.sequence],
    revealed: game.pieces.map((piece) => piece.id),
    turn: game.pieces.length,
    scene: Math.max(0, game.dialogue.length - 1),
    reply: game.dialogue.at(-1)?.choices[0]?.reply ?? null
  };
}
test("all authored game types have a finite completion rule, rejecting partial work", () => {
  for (const [index, sample] of samples.entries()) {
    expect(isPlaySolved(sample.presentation, initialPlayState())).toBe(false);
    expect(isPlaySolved(sample.presentation, solved(index))).toBe(true);
  }
  const game = samples[0]!.presentation;
  expect(
    isPlaySolved(game, {
      ...solved(0),
      placed: { [game.pieces[0]!.id]: game.matches[game.pieces[0]!.id]! }
    })
  ).toBe(false);
});
test("games advance through the entire course without begin_wait or observe; observations stay at the end", () => {
  const child = "22222222-2222-4222-8222-222222222222";
  const prepared = combinePracticeLessons(
    samples.map((sample) => prepareSampleLesson(true, sample.id))
  );
  let session = transition(createLessonSession("practice_auto", child, prepared), {
    type: "start"
  });
  for (const [index] of samples.entries()) {
    const activityId = sessionActivity(session)!.id;
    expect(
      transition(session, { type: "finish_play", activityId, state: initialPlayState() })
    ).toBe(session);
    expect(
      transition(session, {
        type: "finish_play",
        activityId: "stale_activity",
        state: solved(index)
      })
    ).toBe(session);
    const paused = transition(session, { type: "pause" });
    expect(transition(paused, { type: "finish_play", activityId, state: solved(index) })).toBe(
      paused
    );
    const previous = session;
    session = transition(session, { type: "finish_play", activityId, state: solved(index) });
    expect(session.revision).toBe(previous.revision + 1);
    expect(session.course!.attempts).toHaveLength(index + 1);
    expect(session.course!.attempts[index]!.deferred).toBe(false);
    expect(session.phase).toBe(index === samples.length - 1 ? "observation" : "presenting");
    expect(() =>
      recordObservation(previous, "not_observed", new Date().toISOString(), true)
    ).toThrow("PARENT_OBSERVATION_REQUIRED");
    expect(restoreSession(JSON.stringify(session), child).course).toEqual(session.course);
    expect(transition(session, { type: "finish_play", activityId, state: solved(index) })).toBe(
      session
    );
  }
  expect(session.course!.reviewIndex).toBe(0);
  expect(() => recordObservation(session, "not_observed", new Date().toISOString(), false)).toThrow(
    "PARENT_OBSERVATION_REQUIRED"
  );
});
