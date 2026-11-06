import { playSampleLessons } from "@/features/lessonRuntime/playSampleLessons";
import { prepareSampleLesson } from "@/features/lessonRuntime/lessonCatalog";
import { createLessonSession, transition } from "@/features/lessonRuntime/sessionEngine";
import { restoreSession } from "@/features/lessonRuntime/restoreSession";
import { practiceCheckpoint, restorePracticeCheckpoint } from "../practiceCheckpoint";
import { emptyWordGameProgress } from "@/content/contracts/wordGameProgress";
import { wordGameSteps } from "../wordGameSteps";
import { checkpointSchema } from "../../../../apps/api/src/practice/practice.schemas";

const sample = playSampleLessons.find(({ presentation }) => presentation.wordGames)!;
test("partial work in each game survives pause, process restart and cloud checkpoint restoration", () => {
  const child = "22222222-2222-4222-8222-222222222222";
  const prepared = prepareSampleLesson(true, sample.id),
    activityId = prepared.activities[0]!.id;
  let session = transition(createLessonSession("practice_recovery", child, prepared), {
    type: "start"
  });
  for (const id of ["ball_a", "ball_b", "bear_a"])
    session = transition(session, { type: "game_input", input: { type: "flip", id } });
  expect(session.gameProgress![activityId]!.memoryMatched).toEqual(["ball"]);
  expect(session.gameProgress![activityId]!.memoryOpen).toEqual(["bear_a"]);
  for (const round of [0, 1, 2]) {
    if (round > 0) session = transition(session, { type: "game_round", round });
    if (round === 1)
      session = transition(session, { type: "game_input", input: { type: "find", id: "ball" } });
    if (round === 2)
      session = transition(session, {
        type: "game_input",
        input: { type: "place", id: "bear", place: "bear_pair" }
      });
    const paused = transition(session, { type: "pause" });
    expect(restoreSession(JSON.stringify(paused), child).gameProgress).toEqual(
      session.gameProgress
    );
    const checkpoint = practiceCheckpoint(paused);
    expect(checkpointSchema.safeParse(checkpoint).success).toBe(true);
    expect(restorePracticeCheckpoint(session.id, child, prepared, checkpoint).gameProgress).toEqual(
      session.gameProgress
    );
  }
  expect(session.gameProgress![activityId]!.found).toEqual(["ball"]);
  expect(session.gameProgress![activityId]!.placed).toEqual(["bear"]);
  const corrupt = {
    ...session,
    gameProgress: { [activityId]: { ...emptyWordGameProgress(), placed: ["unknown"] } }
  };
  expect(() => restoreSession(JSON.stringify(corrupt), child)).toThrow("INVALID_CHECKPOINT");
  expect(session).not.toHaveProperty("observation");
});
test("each configured step rejects unrelated input and scores only valid matching references", () => {
  const progress = emptyWordGameProgress(),
    game = sample.presentation;
  for (const step of wordGameSteps) expect(step.complete(game, progress)).toBe(false);
  expect(wordGameSteps[0]!.update(game, progress, { type: "find", id: "ball" }, "seed")).toBe(
    progress
  );
  expect(wordGameSteps[1]!.update(game, progress, { type: "find", id: "unknown" }, "seed")).toBe(
    progress
  );
  expect(
    wordGameSteps[2]!.update(
      game,
      progress,
      { type: "place", id: "ball", place: "bear_pair" },
      "seed"
    )
  ).toBe(progress);
  expect(
    wordGameSteps[2]!.update(
      game,
      progress,
      { type: "place", id: "ball", place: "ball_pair" },
      "seed"
    ).placed
  ).toEqual(["ball"]);
});
