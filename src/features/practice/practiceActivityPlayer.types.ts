import type { ComponentProps } from "react";
import type { LearningMediaPlayer } from "@/features/learning/LearningMediaPlayer";
export type PracticeActivityPlayerProps = Pick<
  ComponentProps<typeof LearningMediaPlayer>,
  | "illustration"
  | "pronunciationAudio"
  | "mouthVideo"
  | "paused"
  | "autoPlayKey"
  | "onAutoPlaySampleEnd"
>;
