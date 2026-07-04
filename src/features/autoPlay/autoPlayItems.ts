import type { LearningItem } from "@/data/types";

export function getAutoPlayItems(deckItems: LearningItem[]): LearningItem[] {
  return deckItems.filter((item) => item.status === "active");
}
