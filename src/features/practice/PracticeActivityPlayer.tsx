import { LearningMediaPlayer } from "@/features/learning/LearningMediaPlayer";
import type { PracticeActivityPlayerProps } from "./practiceActivityPlayer.types";

export function PracticeActivityPlayer(props: PracticeActivityPlayerProps) {
  return <LearningMediaPlayer hideUnusedMedia {...props} />;
}
