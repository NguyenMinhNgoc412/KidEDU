import type { LearningItem, LearningItemMedia } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";

export interface MiniTestQuestion {
  target: LearningItem;
  targetAudio: LearningItemMedia;
  choices: readonly LearningItem[];
}

export function getMiniTestChoiceCount(age?: number): 2 | 4 | 6 {
  if (!age || age < 4) {
    return 2;
  }

  return age === 4 ? 4 : 6;
}

/** Builds audio-only questions from the completed deck without repeating a target item. */
export function createMiniTestQuestions(
  items: readonly LearningItem[],
  allItems: readonly LearningItem[] = items,
  options: { age?: number; random?: () => number } = {}
): MiniTestQuestion[] {
  const eligible = items.filter(isMiniTestEligible);
  const count = Math.min(5, eligible.length);
  const choiceCount = getMiniTestChoiceCount(options.age);
  const random = options.random;

  if (count < 2) {
    return [];
  }

  const targets = random ? shuffle(eligible, random).slice(0, count) : eligible.slice(0, count);
  const localIllustrations = uniqueIllustrationItems(items);
  const fallbackIllustrations = uniqueIllustrationItems(allItems);

  return targets.map((target) => {
    const targetAudio = resolveLearningItemMedia(target).byRole.pronunciation_audio;

    if (!targetAudio) {
      throw new Error("Mini test target lost its pronunciation audio during preparation.");
    }

    const distractors = uniqueById([...localIllustrations, ...fallbackIllustrations])
      .filter((item) => item.id !== target.id)
      .slice(0, choiceCount - 1);
    const choices = random
      ? shuffle([target, ...distractors], random)
      : [target, ...distractors];

    return {
      target,
      targetAudio,
      choices
    };
  });
}

export function isMiniTestEligible(item: LearningItem): boolean {
  const media = resolveLearningItemMedia(item).byRole;
  return Boolean(media.illustration && media.pronunciation_audio);
}

function uniqueIllustrationItems(items: readonly LearningItem[]): LearningItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id) || !resolveLearningItemMedia(item).byRole.illustration) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }
  return shuffled;
}

function uniqueById(items: readonly LearningItem[]): LearningItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}
