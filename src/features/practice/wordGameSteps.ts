import type { PlayPresentation } from "@/content/contracts/playPresentation";
import type { WordGameProgress } from "@/content/contracts/wordGameProgress";
import { flipMemory, memoryDeck } from "./wordGames";

export type WordGameInput =
  | { type: "flip"; id: string }
  | { type: "close_mismatch" }
  | { type: "find"; id: string }
  | { type: "place"; id: string; place: string };
interface WordGameStep {
  id: "memory" | "find" | "match";
  name: string;
  complete(game: PlayPresentation, progress: WordGameProgress): boolean;
  update(
    game: PlayPresentation,
    progress: WordGameProgress,
    input: WordGameInput,
    seed: string
  ): WordGameProgress;
}
/** Mechanics and completion rules are independent of React, persistence and parent observations. */
export const wordGameSteps: readonly WordGameStep[] = [
  {
    id: "memory",
    name: "Lật thẻ tìm cặp",
    complete: (game, progress) => progress.memoryMatched.length === game.pieces.length,
    update(game, progress, input, seed) {
      if (input.type === "close_mismatch")
        return progress.memoryOpen.length === 2 ? { ...progress, memoryOpen: [] } : progress;
      if (input.type !== "flip") return progress;
      const previous = { open: progress.memoryOpen, matched: progress.memoryMatched, feedback: "" };
      const next = flipMemory(memoryDeck(game.pieces, seed), previous, input.id);
      return next === previous
        ? progress
        : { ...progress, memoryOpen: next.open, memoryMatched: next.matched };
    }
  },
  {
    id: "find",
    name: "Tìm hình theo từ",
    complete: (game, progress) => progress.found.length === game.pieces.length,
    update(game, progress, input) {
      return input.type === "find" &&
        game.pieces.some(({ id }) => id === input.id) &&
        !progress.found.includes(input.id)
        ? { ...progress, found: [...progress.found, input.id] }
        : progress;
    }
  },
  {
    id: "match",
    name: "Kéo hình vào ô",
    complete: (game, progress) => progress.placed.length === game.pieces.length,
    update(game, progress, input) {
      return input.type === "place" &&
        game.pieces.some(({ id }) => id === input.id) &&
        game.matches[input.id] === input.place &&
        !progress.placed.includes(input.id)
        ? { ...progress, placed: [...progress.placed, input.id] }
        : progress;
    }
  }
];
