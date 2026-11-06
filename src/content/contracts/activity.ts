import { z } from "zod";
import { playPresentationSchema } from "./playPresentation";

const id = z.string().regex(/^[a-z][a-z0-9_]{2,79}$/);
const text = z.string().trim().min(1).max(500);
const shortText = z.string().trim().min(1).max(160);
const ids = z.array(id).min(1).max(12);

const assetRole = z.enum([
  "semantic_visual",
  "canonical_audio",
  "mouth_video",
  "instruction_audio",
  "prompt_audio",
  "context_visual",
  "segment_audio",
  "motion"
]);

const asset = z.strictObject({ assetId: id, role: assetRole });
const prompt = z.strictObject({
  level: z.enum(["full_model", "partial_model", "visual_cue", "natural_cue", "independent"]),
  parentCue: text
});

const common = {
  schemaVersion: z.literal(1),
  id,
  version: z.number().int().positive(),
  status: z.enum(["draft", "in_review", "approved", "published", "retired"]),
  goalId: id,
  targetIds: ids,
  parentInstruction: text,
  expectedResponse: z.strictObject({
    canonical: shortText,
    acceptedVariants: z.array(shortText).max(12)
  }),
  promptLadder: z.array(prompt).min(1).max(5),
  timing: z.strictObject({
    waitMinMs: z.number().int().min(1000).max(30000),
    waitMaxMs: z.number().int().min(1000).max(30000)
  }),
  repetitionLimit: z.number().int().min(1).max(10),
  assets: z.strictObject({ required: z.array(asset).max(20), optional: z.array(asset).max(20) }),
  observationRubric: z.strictObject({
    independent: text,
    supported: text,
    notYet: text,
    promptLevels: z.array(prompt.shape.level).max(5)
  }),
  transfer: z.strictObject({
    preparation: text,
    parentAction: text,
    waitMs: z.number().int().min(1000).max(30000),
    observationHint: text
  }),
  skipRule: text,
  presentation: playPresentationSchema.optional()
};

const option = z.strictObject({ id, visualAssetId: id, label: shortText });

export const activitySchemaV1 = z
  .discriminatedUnion("type", [
    z.strictObject({
      ...common,
      type: z.literal("word_model"),
      stimulus: z.strictObject({
        visualAssetId: id,
        canonicalAudioAssetId: id,
        variant: z.enum(["semantic_model", "articulation_model"]),
        mouthVideoAssetId: id.nullable()
      })
    }),
    z.strictObject({
      ...common,
      type: z.literal("recognition"),
      stimulus: z.strictObject({
        instructionAudioAssetId: id,
        options: z.array(option).min(2).max(4),
        correctOptionIds: ids,
        responseMode: z.enum(["point", "choose", "real_object"])
      })
    }),
    z.strictObject({
      ...common,
      type: z.literal("naming"),
      stimulus: z.strictObject({
        visualAssetId: id,
        promptAudioAssetId: id,
        expressiveFirst: z.literal(true)
      })
    }),
    z.strictObject({
      ...common,
      type: z.literal("cloze_tail"),
      stimulus: z.strictObject({
        fullSentence: text,
        leadInText: text,
        completionText: shortText,
        leadInAudioAssetId: id,
        fullAudioAssetId: id,
        pauseAfterLeadIn: z.literal(true)
      })
    }),
    z.strictObject({
      ...common,
      type: z.literal("functional_sentence"),
      stimulus: z.strictObject({
        contextVisualAssetId: id,
        sentenceFrame: text,
        slotTargetIds: ids,
        communicationOpportunity: text
      })
    }),
    z.strictObject({
      ...common,
      type: z.literal("yes_no"),
      stimulus: z.strictObject({
        question: text,
        kind: z.enum(["factual", "preference", "confirmation"]),
        authoredTruth: z.boolean().nullable(),
        contextVisualAssetId: id.nullable()
      })
    }),
    z.strictObject({
      ...common,
      type: z.literal("visual_qa"),
      stimulus: z.strictObject({
        question: text,
        questionKind: z.enum(["identity", "purpose", "action"]),
        contextVisualAssetId: id,
        expectedSentenceLength: z.number().int().min(1).max(8)
      })
    }),
    z.strictObject({
      ...common,
      type: z.literal("command"),
      stimulus: z.strictObject({
        preparation: text,
        orderedActions: z.array(text).min(1).max(2),
        objects: z.array(shortText).min(1).max(4)
      })
    }),
    z.strictObject({
      ...common,
      type: z.literal("functional_communication"),
      stimulus: z.strictObject({
        scenario: z.enum([
          "request",
          "choice",
          "refusal",
          "call",
          "greeting",
          "invite",
          "turn_taking",
          "possession"
        ]),
        opportunity: text,
        partnerAction: text,
        naturalConsequence: text
      })
    }),
    z.strictObject({
      ...common,
      type: z.literal("parent_transfer"),
      stimulus: z.strictObject({ preparation: text, parentAction: text, realWorldContext: text })
    })
  ])
  .superRefine((activity, context) => {
    if (
      activity.presentation &&
      activity.type !== "command" &&
      activity.type !== "functional_communication"
    )
      context.addIssue({
        code: "custom",
        message: "Play presentation needs an authored command or communication scenario"
      });
    if (activity.timing.waitMinMs > activity.timing.waitMaxMs) {
      context.addIssue({
        code: "custom",
        path: ["timing"],
        message: "Minimum wait exceeds maximum wait"
      });
    }
    const allAssets = [...activity.assets.required, ...activity.assets.optional];
    if (new Set(allAssets.map((item) => item.assetId)).size !== allAssets.length) {
      context.addIssue({
        code: "custom",
        path: ["assets"],
        message: "Asset references must be unique"
      });
    }
    const requireAsset = (assetId: string, role: z.infer<typeof assetRole>, required = true) => {
      const group = required ? activity.assets.required : activity.assets.optional;
      if (!group.some((item) => item.assetId === assetId && item.role === role)) {
        context.addIssue({
          code: "custom",
          path: ["assets", required ? "required" : "optional"],
          message: `Stimulus asset ${assetId} must declare role ${role}`
        });
      }
    };
    switch (activity.type) {
      case "word_model":
        requireAsset(activity.stimulus.visualAssetId, "semantic_visual");
        requireAsset(activity.stimulus.canonicalAudioAssetId, "canonical_audio");
        if (activity.stimulus.variant === "articulation_model") {
          if (activity.stimulus.mouthVideoAssetId === null) {
            context.addIssue({
              code: "custom",
              path: ["stimulus", "mouthVideoAssetId"],
              message: "Articulation model requires reviewed mouth video"
            });
          } else {
            requireAsset(activity.stimulus.mouthVideoAssetId, "mouth_video");
          }
        } else if (activity.stimulus.mouthVideoAssetId !== null) {
          requireAsset(activity.stimulus.mouthVideoAssetId, "mouth_video", false);
        }
        break;
      case "recognition":
        requireAsset(activity.stimulus.instructionAudioAssetId, "instruction_audio");
        activity.stimulus.options.forEach((option) =>
          requireAsset(option.visualAssetId, "semantic_visual")
        );
        break;
      case "naming":
        requireAsset(activity.stimulus.visualAssetId, "semantic_visual");
        requireAsset(activity.stimulus.promptAudioAssetId, "prompt_audio");
        break;
      case "cloze_tail":
        requireAsset(activity.stimulus.leadInAudioAssetId, "segment_audio");
        requireAsset(activity.stimulus.fullAudioAssetId, "segment_audio");
        break;
      case "functional_sentence":
        requireAsset(activity.stimulus.contextVisualAssetId, "context_visual");
        break;
      case "visual_qa":
        requireAsset(activity.stimulus.contextVisualAssetId, "context_visual");
        break;
      case "yes_no":
        if (activity.stimulus.contextVisualAssetId !== null) {
          requireAsset(activity.stimulus.contextVisualAssetId, "context_visual");
        }
        break;
      case "command":
      case "functional_communication":
      case "parent_transfer":
        break;
    }
    if (new Set(activity.targetIds).size !== activity.targetIds.length) {
      context.addIssue({
        code: "custom",
        path: ["targetIds"],
        message: "Target references must be unique"
      });
    }
    if (activity.type === "recognition") {
      const optionIds = new Set(activity.stimulus.options.map((item) => item.id));
      if (
        optionIds.size !== activity.stimulus.options.length ||
        activity.stimulus.correctOptionIds.some((value) => !optionIds.has(value))
      ) {
        context.addIssue({
          code: "custom",
          path: ["stimulus", "correctOptionIds"],
          message: "Correct options must reference unique visible options"
        });
      }
    }
    if (
      activity.type === "yes_no" &&
      (activity.stimulus.kind === "factual") !== (activity.stimulus.authoredTruth !== null)
    ) {
      context.addIssue({
        code: "custom",
        path: ["stimulus", "authoredTruth"],
        message: "Only factual questions carry authored truth"
      });
    }
  });

export type ActivityV1 = z.infer<typeof activitySchemaV1>;
export const activityJsonSchemaV1 = {
  ...z.toJSONSchema(activitySchemaV1, { target: "draft-2020-12" }),
  $id: "urn:kidedu:content:activity:v1"
};
