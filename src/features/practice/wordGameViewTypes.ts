import type { PlayPresentation } from "@/content/contracts/playPresentation";
import type { WordGameProgress } from "@/content/contracts/wordGameProgress";
import type { WordGameInput } from "./wordGameSteps";
export interface WordGameViewProps {
  game: PlayPresentation;
  paused: boolean;
  saving: boolean;
  seed: string;
  progress: WordGameProgress;
  onInput(input: WordGameInput): void;
  onArtworkError?(): void;
}
