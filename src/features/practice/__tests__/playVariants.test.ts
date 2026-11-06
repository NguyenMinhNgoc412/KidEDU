import { playSampleLessons } from "@/features/lessonRuntime/playSampleLessons";
import { prepareSampleLesson } from "@/features/lessonRuntime/lessonCatalog";
import { playPresentationSchema } from "@/content/contracts/playPresentation";
import { initialPlayState, updatePlay } from "../playState";
import {
  createLessonSession,
  recordObservation,
  transition
} from "@/features/lessonRuntime/sessionEngine";
import { combinePracticeLessons } from "../preparePracticeCourse";
import { restoreSession } from "@/features/lessonRuntime/restoreSession";
import { practicePlayLessons } from "../../../../apps/api/src/practice/practice-play.catalog";
import { illustrationAnimations } from "@/data/illustrationAnimations";

test("fourteen authored samples cover seven play mechanics with valid local visuals and backend metadata", () => {
  expect(playSampleLessons).toHaveLength(14);
  expect(new Set(playSampleLessons.map((sample) => sample.presentation.kind)).size).toBe(7);
  for (const sample of playSampleLessons) {
    expect(playPresentationSchema.safeParse(sample.presentation).success).toBe(true);
    const prepared = prepareSampleLesson(true, sample.id);
    expect(prepared.activities[0]!.presentation).toEqual(sample.presentation);
    expect(practicePlayLessons.find((item) => item.id === sample.id)).toMatchObject({
      title: sample.title,
      goalId: sample.goal
    });
    for (const piece of [...sample.presentation.pieces, ...sample.presentation.places])
      if (piece.picture.startsWith("item-"))
        expect(illustrationAnimations[piece.picture]).toBeDefined();
  }
});
test("wrong drops do not change placement; correct drops attach once without creating an observation", () => {
  const pair = playSampleLessons.find(
    (sample) => sample.presentation.kind === "pair"
  )!.presentation;
  let state = updatePlay(pair, initialPlayState(), {
    type: "place",
    id: pair.pieces[0]!.id,
    place: pair.places[1]!.id
  });
  expect(state.placed).toEqual({});
  expect(state).not.toHaveProperty("result");
  state = updatePlay(pair, state, {
    type: "place",
    id: pair.pieces[1]!.id,
    place: pair.matches[pair.pieces[1]!.id]!
  });
  expect(Object.keys(state.placed)).toHaveLength(1);
  expect(updatePlay(pair, state, { type: "place", id: "unknown", place: pair.places[0]!.id })).toBe(
    state
  );
  const sort = playSampleLessons.find(
    (sample) => sample.presentation.kind === "sort"
  )!.presentation;
  let basket = initialPlayState();
  for (const piece of sort.pieces)
    basket = updatePlay(sort, basket, {
      type: "place",
      id: piece.id,
      place: sort.matches[piece.id]!
    });
  expect(Object.keys(basket.placed)).toHaveLength(sort.pieces.length);
  expect(new Set(Object.values(basket.placed)).size).toBeLessThan(sort.pieces.length);
  const saved = basket;
  expect(
    updatePlay(sort, saved, {
      type: "place",
      id: sort.pieces[0]!.id,
      place: sort.matches[sort.pieces[0]!.id]!
    })
  ).toBe(saved);
});
test("sequence, hidden objects, dialogue and turn taking each preserve their own interaction state", () => {
  const sequence = playSampleLessons.find(
    (sample) => sample.presentation.kind === "sentence"
  )!.presentation;
  let state = initialPlayState();
  expect(updatePlay(sequence, state, { type: "append", id: sequence.sequence[1]! })).toBe(state);
  for (const piece of sequence.pieces)
    state = updatePlay(sequence, state, { type: "append", id: piece.id });
  expect(state.order).toHaveLength(3);
  expect(updatePlay(sequence, state, { type: "append", id: sequence.pieces[0]!.id })).toBe(state);
  expect(updatePlay(sequence, state, { type: "undo" }).order).toHaveLength(2);
  const hunt = playSampleLessons.find(
    (sample) => sample.presentation.kind === "hunt"
  )!.presentation;
  const revealed = updatePlay(hunt, initialPlayState(), { type: "reveal", id: hunt.pieces[0]!.id });
  expect(revealed.selected).toBeNull();
  expect(updatePlay(hunt, revealed, { type: "reveal", id: hunt.pieces[0]!.id }).selected).toBe(
    hunt.pieces[0]!.id
  );
  const scene = playSampleLessons.find(
    (sample) => sample.presentation.kind === "scene"
  )!.presentation;
  const reply = updatePlay(scene, initialPlayState(), { type: "reply", index: 0 });
  expect(reply.reply).toBeTruthy();
  expect(updatePlay(scene, reply, { type: "scene_next" }).scene).toBe(1);
  const turns = playSampleLessons.find(
    (sample) => sample.presentation.kind === "turns"
  )!.presentation;
  expect(updatePlay(turns, initialPlayState(), { type: "turn" }).turn).toBe(1);
});
test("game observations remain parent-authored in-app evidence and course presentations restore safely", () => {
  const childId = "22222222-2222-4222-8222-222222222222";
  const prepared = combinePracticeLessons(
    playSampleLessons.map((sample) => prepareSampleLesson(true, sample.id))
  );
  let state = transition(createLessonSession("practice_play", childId, prepared), {
    type: "start"
  });
  for (const sample of playSampleLessons) {
    void sample;
    state = transition(state, { type: "defer" });
  }
  const restored = restoreSession(JSON.stringify(state), childId);
  expect(restored.prepared.activities[0]!.presentation).toEqual(
    prepared.activities[0]!.presentation
  );
  const event = recordObservation(state, "not_observed", new Date().toISOString(), true).event;
  expect(event.payload.context).toBe("in_app");
  expect(event.payload.result).toBe("not_observed");
  expect(() => recordObservation(state, "independent", new Date().toISOString(), false)).toThrow(
    "PARENT_OBSERVATION_REQUIRED"
  );
  expect(
    playPresentationSchema.safeParse({
      ...playSampleLessons[0]!.presentation,
      matches: { unknown: "unknown" }
    }).success
  ).toBe(false);
});
