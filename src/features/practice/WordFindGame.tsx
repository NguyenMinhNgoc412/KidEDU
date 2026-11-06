import type { WordGameViewProps } from "./wordGameViewTypes";
import { WordMatchingBoard } from "./WordMatchingBoard";
export function WordFindGame(props: WordGameViewProps) {
  return (
    <WordMatchingBoard
      {...props}
      seed={`${props.seed}:find`}
      placed={props.progress.found}
      pictureTargets
    />
  );
}
