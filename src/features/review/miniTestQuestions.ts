import type { LearningItem, LearningItemMedia } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";

export interface MiniTestQuestion {
  target: LearningItem;
  targetAudio: LearningItemMedia;
  choices: readonly [LearningItem, LearningItem];
}

/** Builds audio-only questions from the completed deck without repeating a target item. */
export function createMiniTestQuestions(items: readonly LearningItem[]): MiniTestQuestion[] {
  const eligible = items.filter(isMiniTestEligible);
  const count = Math.min(5, eligible.length);

  if (count < 2) {
    return [];
  }

  return eligible.slice(0, count).map((target, index) => {
    const distractor = eligible[(index + 1) % eligible.length]!;
    const targetAudio = resolveLearningItemMedia(target).byRole.pronunciation_audio;

    if (!targetAudio) {
      throw new Error("Mini test target lost its pronunciation audio during preparation.");
    }

    return {
      target,
      targetAudio,
      choices: index % 2 === 0 ? [target, distractor] : [distractor, target]
    };
  });
}

export function isMiniTestEligible(item: LearningItem): boolean {
  const media = resolveLearningItemMedia(item).byRole;
  return Boolean(media.illustration && media.pronunciation_audio);
}
