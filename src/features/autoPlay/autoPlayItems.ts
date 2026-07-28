import type { LearningItem } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";

export function getAutoPlayItems(deckItems: LearningItem[]): LearningItem[] {
  return deckItems.filter((item) => resolveLearningItemMedia(item).isPlayableInAutoPlay);
}
