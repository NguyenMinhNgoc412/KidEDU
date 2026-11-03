import { activityJsonSchemaV1, activitySchemaV1 } from "../activity";

const common = {
  schemaVersion: 1,
  id: "activity_uong_01",
  version: 1,
  status: "published",
  goalId: "goal_request",
  targetIds: ["target_uong"],
  parentInstruction: "Cho con xem vật và chờ con đáp lại.",
  expectedResponse: { canonical: "uống", acceptedVariants: ["con uống"] },
  promptLadder: [{ level: "natural_cue", parentCue: "Chờ con nói." }],
  timing: { waitMinMs: 3000, waitMaxMs: 5000 },
  repetitionLimit: 3,
  assets: { required: [], optional: [] },
  observationRubric: {
    independent: "Con đáp lại mà không cần gợi ý.",
    supported: "Con đáp lại sau khi được gợi ý.",
    notYet: "Con chưa đáp lại trong cơ hội này.",
    promptLevels: ["natural_cue"]
  },
  transfer: {
    preparation: "Chuẩn bị cốc nước.",
    parentAction: "Mời con yêu cầu nước.",
    waitMs: 4000,
    observationHint: "Ghi nhận lời hoặc cử chỉ con dùng."
  },
  skipRule: "Dừng khi con không muốn tiếp tục."
};

const recognition = {
  ...common,
  type: "recognition",
  stimulus: {
    instructionAudioAssetId: "audio_instruction",
    options: [
      { id: "option_water", visualAssetId: "image_water", label: "nước" },
      { id: "option_milk", visualAssetId: "image_milk", label: "sữa" }
    ],
    correctOptionIds: ["option_water"],
    responseMode: "point"
  },
  assets: {
    required: [
      { assetId: "audio_instruction", role: "instruction_audio" },
      { assetId: "image_water", role: "semantic_visual" },
      { assetId: "image_milk", role: "semantic_visual" }
    ],
    optional: []
  }
};

describe("activity schema v1", () => {
  it.each([
    [
      "word_model",
      {
        visualAssetId: "image_water",
        canonicalAudioAssetId: "audio_water",
        variant: "semantic_model",
        mouthVideoAssetId: null
      },
      [
        { assetId: "image_water", role: "semantic_visual" },
        { assetId: "audio_water", role: "canonical_audio" }
      ]
    ],
    [
      "naming",
      { visualAssetId: "image_water", promptAudioAssetId: "audio_prompt", expressiveFirst: true },
      [
        { assetId: "image_water", role: "semantic_visual" },
        { assetId: "audio_prompt", role: "prompt_audio" }
      ]
    ],
    [
      "cloze_tail",
      {
        fullSentence: "Con muốn uống nước.",
        leadInText: "Con muốn uống...",
        completionText: "nước",
        leadInAudioAssetId: "audio_lead",
        fullAudioAssetId: "audio_full",
        pauseAfterLeadIn: true
      },
      [
        { assetId: "audio_lead", role: "segment_audio" },
        { assetId: "audio_full", role: "segment_audio" }
      ]
    ],
    [
      "functional_sentence",
      {
        contextVisualAssetId: "image_context",
        sentenceFrame: "Con muốn {vật}.",
        slotTargetIds: ["target_water"],
        communicationOpportunity: "Đưa ra lựa chọn."
      },
      [{ assetId: "image_context", role: "context_visual" }]
    ],
    [
      "visual_qa",
      {
        question: "Ai đang uống nước?",
        questionKind: "action",
        contextVisualAssetId: "image_context",
        expectedSentenceLength: 3
      },
      [{ assetId: "image_context", role: "context_visual" }]
    ],
    [
      "command",
      {
        preparation: "Chuẩn bị cốc và thìa.",
        orderedActions: ["Lấy cốc.", "Đưa cốc cho mẹ."],
        objects: ["cốc", "thìa"]
      },
      []
    ],
    [
      "functional_communication",
      {
        scenario: "request",
        opportunity: "Để cốc nước trong tầm nhìn.",
        partnerAction: "Chờ con yêu cầu.",
        naturalConsequence: "Đưa cốc nước cho con."
      },
      []
    ],
    [
      "parent_transfer",
      {
        preparation: "Chuẩn bị cốc nước.",
        parentAction: "Chờ con yêu cầu.",
        realWorldContext: "Trong giờ ăn."
      },
      []
    ]
  ])("accepts a %s stimulus", (type, stimulus, required) => {
    expect(
      activitySchemaV1.safeParse({ ...common, type, stimulus, assets: { required, optional: [] } })
        .success
    ).toBe(true);
  });

  it("accepts recognition without mouth video and exports a stable schema id", () => {
    expect(activitySchemaV1.safeParse(recognition).success).toBe(true);
    expect(activityJsonSchemaV1.$id).toBe("urn:kidedu:content:activity:v1");
  });

  it("rejects unknown activity types and missing type-specific fields", () => {
    expect(activitySchemaV1.safeParse({ ...recognition, type: "flashcard" }).success).toBe(false);
    expect(activitySchemaV1.safeParse({ ...recognition, stimulus: { options: [] } }).success).toBe(
      false
    );
  });

  it("rejects incorrect recognition answers and reversed wait range", () => {
    expect(
      activitySchemaV1.safeParse({
        ...recognition,
        stimulus: { ...recognition.stimulus, correctOptionIds: ["option_other"] }
      }).success
    ).toBe(false);
    expect(
      activitySchemaV1.safeParse({ ...recognition, timing: { waitMinMs: 5000, waitMaxMs: 3000 } })
        .success
    ).toBe(false);
  });

  it("requires every stimulus asset with its authored role", () => {
    expect(
      activitySchemaV1.safeParse({ ...recognition, assets: { required: [], optional: [] } }).success
    ).toBe(false);
    expect(
      activitySchemaV1.safeParse({
        ...recognition,
        assets: {
          required: recognition.assets.required.map((asset) =>
            asset.assetId === "audio_instruction" ? { ...asset, role: "canonical_audio" } : asset
          ),
          optional: []
        }
      }).success
    ).toBe(false);
  });

  it("requires a factual yes/no truth but no authored truth for preference", () => {
    const preference = {
      ...common,
      type: "yes_no",
      stimulus: {
        question: "Con muốn nước không?",
        kind: "preference",
        authoredTruth: null,
        contextVisualAssetId: null
      }
    };
    expect(activitySchemaV1.safeParse(preference).success).toBe(true);
    expect(
      activitySchemaV1.safeParse({
        ...preference,
        stimulus: { ...preference.stimulus, authoredTruth: true }
      }).success
    ).toBe(false);
  });
});
