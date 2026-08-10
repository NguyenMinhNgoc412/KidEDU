import type { LearningItem } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";

export interface PuzzleRound {
  item: LearningItem;
  pieceCount: PuzzlePieceCount;
}

export type PuzzlePieceCount = 2 | 3 | 4;

export interface PuzzleTemplate {
  columns: number;
  pieceCount: PuzzlePieceCount;
  rows: number;
}

export interface MemoryCard {
  id: string;
  item: LearningItem;
}

export interface PuzzlePoint {
  x: number;
  y: number;
}

/**
 * Creates the approved 2 → 3 → 4-piece progression using up to three unique
 * illustrations. Replays prefer images that were not used in the prior run.
 */
export function createPuzzleRounds(
  items: readonly LearningItem[],
  previousItemIds: readonly string[] = [],
  random: () => number = Math.random
): PuzzleRound[] {
  const eligible = items.filter(hasIllustration);
  const previousIds = new Set(previousItemIds);
  const fresh = eligible.filter((item) => !previousIds.has(item.id));
  const reused = eligible.filter((item) => previousIds.has(item.id));
  const selected = [...shuffle(fresh, random), ...shuffle(reused, random)].slice(0, 3);

  return selected.map((item, index) => ({
    item,
    pieceCount: (index + 2) as PuzzlePieceCount
  }));
}

/** Creates a shuffled layout of unique illustration pairs for one memory-game level. */
export function createMemoryCards(
  items: readonly LearningItem[],
  pairCount: number,
  random: () => number = Math.random
): MemoryCard[] {
  if (!Number.isInteger(pairCount) || pairCount < 2 || pairCount > 5) {
    throw new Error("Memory game pair count must be an integer between 2 and 5.");
  }

  const eligible = shuffle(items.filter(hasIllustration), random).slice(0, pairCount);
  if (eligible.length < pairCount) {
    return [];
  }

  const firstHalf = eligible.map((item) => ({ id: `${item.id}:a`, item }));
  const secondHalf = eligible.map((item) => ({ id: `${item.id}:b`, item }));

  return shuffle([...firstHalf, ...secondHalf], random);
}

/** Returns the required 2 → 5 progression, capped by available unique illustrations. */
export function createMemoryLevels(items: readonly LearningItem[]): number[] {
  const highestLevel = Math.min(5, items.filter(hasIllustration).length);
  return highestLevel < 2 ? [] : Array.from({ length: highestLevel - 1 }, (_, index) => index + 2);
}

export function hasIllustration(item: LearningItem): boolean {
  return Boolean(resolveLearningItemMedia(item).byRole.illustration);
}

/** Safe fallback templates preserve the complete image without cropping any area away. */
export function getPuzzleTemplate(pieceCount: PuzzlePieceCount): PuzzleTemplate {
  switch (pieceCount) {
    case 2:
      return { columns: 2, pieceCount, rows: 1 };
    case 3:
      return { columns: 3, pieceCount, rows: 1 };
    case 4:
      return { columns: 2, pieceCount, rows: 2 };
  }
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }
  return shuffled;
}

export function isPuzzleDropInsideTarget(
  drop: PuzzlePoint,
  boardOrigin: PuzzlePoint,
  pieceIndex: number,
  pieceWidth: number,
  pieceHeight: number,
  template: PuzzleTemplate
): boolean {
  const column = pieceIndex % template.columns;
  const row = Math.floor(pieceIndex / template.columns);
  const left = boardOrigin.x + column * pieceWidth;
  const top = boardOrigin.y + row * pieceHeight;

  return (
    drop.x >= left && drop.x <= left + pieceWidth && drop.y >= top && drop.y <= top + pieceHeight
  );
}
