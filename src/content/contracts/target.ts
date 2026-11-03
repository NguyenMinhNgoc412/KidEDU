import { z } from "zod";

// B01 target contract. Keep this independent of the legacy LearningItem model.
const identifier = z.string().regex(/^[a-z][a-z0-9_]{2,79}$/);
const shortText = z.string().trim().min(1).max(160);

export const activityTypeSchema = z.enum([
  "word_model",
  "recognition",
  "naming",
  "cloze_tail",
  "functional_sentence",
  "yes_no",
  "visual_qa",
  "command",
  "functional_communication",
  "parent_transfer"
]);

export const targetSchemaV1 = z
  .strictObject({
    schemaVersion: z.literal(1),
    id: identifier,
    version: z.number().int().positive(),
    status: z.enum(["draft", "in_review", "approved", "published", "retired"]),
    canonicalText: shortText,
    normalizedSearchText: z.string().trim().min(1).max(160),
    targetType: z.enum(["person", "object", "action", "attribute", "phrase", "sentence"]),
    skillDomainId: identifier,
    topicIds: z.array(identifier).min(1).max(12),
    semanticTags: z.array(identifier).max(20),
    complexity: z.number().int().min(1).max(5),
    regionAccentNote: z.string().trim().max(300).nullable(),
    prerequisiteTargetIds: z.array(identifier).max(20),
    allowedActivityTypes: z.array(activityTypeSchema).min(1).max(10),
    safetyNote: z.string().trim().max(500).nullable(),
    provenanceRef: identifier
  })
  .superRefine((target, context) => {
    const uniqueFields = [
      "topicIds",
      "semanticTags",
      "prerequisiteTargetIds",
      "allowedActivityTypes"
    ] as const;
    for (const field of uniqueFields) {
      if (new Set(target[field]).size !== target[field].length) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Duplicate values are not allowed"
        });
      }
    }
    if (target.prerequisiteTargetIds.includes(target.id)) {
      context.addIssue({
        code: "custom",
        path: ["prerequisiteTargetIds"],
        message: "A target cannot depend on itself"
      });
    }
  });

export type TargetV1 = z.infer<typeof targetSchemaV1>;

export const targetJsonSchemaV1 = {
  ...z.toJSONSchema(targetSchemaV1, { target: "draft-2020-12" }),
  $id: "urn:kidedu:content:target:v1"
};
