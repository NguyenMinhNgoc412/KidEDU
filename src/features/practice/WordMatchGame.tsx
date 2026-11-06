import { WordMatchingBoard } from "./WordMatchingBoard";
import type { WordGameViewProps } from "./wordGameViewTypes";
export function WordMatchGame(props: WordGameViewProps) {
  return <WordMatchingBoard {...props} placed={props.progress.placed} />;
}
