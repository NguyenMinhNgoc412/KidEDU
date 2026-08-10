import type { LearningItem } from "@/data/types";

import {
  createMemoryCards,
  createMemoryLevels,
  createPuzzleRounds,
  getPuzzleTemplate,
  isPuzzleDropInsideTarget
} from "../miniGames";

function makeItem(id: string, withIllustration = true): LearningItem {
  return {
    id,
    title: id,
    categoryId: "category",
    categoryName: "Nhóm",
    status: "active",
    learningStatus: "new",
    note: null,
    media: withIllustration
      ? [
          {
            id: `${id}-image`,
            learningItemId: id,
            mediaAssetId: `${id}-image`,
            role: "illustration",
            priority: 10,
            isActive: true,
            asset: {
              id: `${id}-image`,
              type: "image",
              source: "default",
              uri: `file://${id}.jpg`,
              thumbnailAssetId: null,
              thumbnailUri: null,
              durationMs: null,
              sizeBytes: null,
              mimeType: "image/jpeg",
              status: "active"
            }
          }
        ]
      : []
  };
}

describe("mini games", () => {
  it("builds a 2 → 3 → 4-piece puzzle progression from up to three unique illustrations", () => {
    const rounds = createPuzzleRounds(
      [makeItem("a"), makeItem("no-image", false), makeItem("b"), makeItem("c"), makeItem("d")],
      [],
      () => 0.5
    );

    expect(rounds.map(({ pieceCount }) => pieceCount)).toEqual([2, 3, 4]);
    expect(new Set(rounds.map(({ item }) => item.id)).size).toBe(3);
    expect(rounds).toHaveLength(3);
  });

  it("prefers illustrations that were not used in the previous puzzle run", () => {
    const rounds = createPuzzleRounds(
      [makeItem("a"), makeItem("b"), makeItem("c"), makeItem("d")],
      ["a", "b", "c"],
      () => 0.5
    );

    expect(rounds[0]?.item.id).toBe("d");
  });

  it("creates exactly two shuffled cards per randomly selected item", () => {
    const cards = createMemoryCards([makeItem("a"), makeItem("b"), makeItem("c")], 3, () => 0.5);
    expect(cards).toHaveLength(6);
    expect(cards.filter(({ item }) => item.id === "a")).toHaveLength(2);
    expect(cards.filter(({ item }) => item.id === "b")).toHaveLength(2);
    expect(cards.filter(({ item }) => item.id === "c")).toHaveLength(2);
  });

  it("supports only 2 to 5 pairs and refuses incomplete levels", () => {
    expect(() => createMemoryCards([makeItem("a"), makeItem("b")], 1)).toThrow("between 2 and 5");
    expect(createMemoryCards([makeItem("a"), makeItem("b")], 3)).toEqual([]);
  });

  it("builds the required automatic level progression from eligible images", () => {
    expect(createMemoryLevels([makeItem("a")])).toEqual([]);
    expect(createMemoryLevels([makeItem("a"), makeItem("b")])).toEqual([2]);
    expect(
      createMemoryLevels([makeItem("a"), makeItem("b"), makeItem("c"), makeItem("d")])
    ).toEqual([2, 3, 4]);
    expect(
      createMemoryLevels([
        makeItem("a"),
        makeItem("b"),
        makeItem("c"),
        makeItem("d"),
        makeItem("e"),
        makeItem("f")
      ])
    ).toEqual([2, 3, 4, 5]);
  });

  it("accepts a puzzle drop only inside the matching target of the active template", () => {
    const origin = { x: 20, y: 40 };
    const template = getPuzzleTemplate(4);

    expect(isPuzzleDropInsideTarget({ x: 171, y: 191 }, origin, 3, 150, 150, template)).toBe(true);
    expect(isPuzzleDropInsideTarget({ x: 169, y: 191 }, origin, 3, 150, 150, template)).toBe(false);
    expect(isPuzzleDropInsideTarget({ x: 171, y: 189 }, origin, 3, 150, 150, template)).toBe(false);
  });
});
