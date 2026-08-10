import type { LearningItem } from "@/data/types";

import { createMiniTestQuestions } from "../miniTestQuestions";

const makeItem = (id: string, options: { image?: boolean; audio?: boolean } = {}): LearningItem => ({
  id,
  title: id,
  categoryId: "category",
  categoryName: "Nhóm",
  status: "active",
  learningStatus: "new",
  note: null,
  media: [
    ...(options.image === false ? [] : [media(id, "illustration", "image")]),
    ...(options.audio === false ? [] : [media(id, "pronunciation_audio", "audio")])
  ]
});

function media(id: string, role: "illustration" | "pronunciation_audio", type: "image" | "audio") {
  return {
    id: `${id}-${role}`,
    learningItemId: id,
    mediaAssetId: `${id}-${role}`,
    role,
    priority: 10,
    isActive: true,
    asset: {
      id: `${id}-${role}`,
      type,
      source: "default" as const,
      uri: `file://${id}-${role}`,
      thumbnailAssetId: null,
      thumbnailUri: null,
      durationMs: null,
      sizeBytes: null,
      mimeType: null,
      status: "active" as const
    }
  };
}

describe("createMiniTestQuestions", () => {
  it("requires at least two items with both an illustration and audio", () => {
    expect(createMiniTestQuestions([makeItem("a"), makeItem("b", { audio: false })])).toEqual([]);
  });

  it("uses only eligible deck items and caps a turn at five questions", () => {
    const questions = createMiniTestQuestions([
      ...["a", "b", "c", "d", "e", "f"].map((id) => makeItem(id)),
      makeItem("no-image", { image: false })
    ]);

    expect(questions).toHaveLength(5);
    expect(questions.map(({ target }) => target.id)).toEqual(["a", "b", "c", "d", "e"]);
    for (const question of questions) {
      expect(question.choices.map(({ id }) => id)).toContain(question.target.id);
      expect(new Set(question.choices.map(({ id }) => id)).size).toBe(2);
    }
  });
});
