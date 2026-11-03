import { z } from "zod";
import { activityTypeSchema } from "./target";

const id = z.string().regex(/^[a-z][a-z0-9_]{2,79}$/);
const activityRef = z.strictObject({
  id,
  version: z.number().int().positive(),
  type: activityTypeSchema
});

export const lessonSchemaV1 = z
  .strictObject({
    schemaVersion: z.literal(1),
    id,
    version: z.number().int().positive(),
    status: z.enum(["draft", "in_review", "approved", "published", "retired"]),
    primaryGoalId: id,
    supportingGoalId: id.nullable(),
    parentPurpose: z.string().trim().min(1).max(500),
    activitySequence: z.array(activityRef).min(2).max(64),
    transferActivityRef: activityRef
  })
  .superRefine((lesson, context) => {
    if (lesson.supportingGoalId === lesson.primaryGoalId) {
      context.addIssue({
        code: "custom",
        path: ["supportingGoalId"],
        message: "Supporting goal must differ from primary goal"
      });
    }
    const keys = lesson.activitySequence.map((activity) => `${activity.id}:${activity.version}`);
    if (new Set(keys).size !== keys.length) {
      context.addIssue({
        code: "custom",
        path: ["activitySequence"],
        message: "A lesson cannot repeat an activity version"
      });
    }
    const transferKey = `${lesson.transferActivityRef.id}:${lesson.transferActivityRef.version}`;
    const transferInSequence = lesson.activitySequence.some(
      (activity) =>
        `${activity.id}:${activity.version}` === transferKey && activity.type === "parent_transfer"
    );
    if (lesson.transferActivityRef.type !== "parent_transfer" || !transferInSequence) {
      context.addIssue({
        code: "custom",
        path: ["transferActivityRef"],
        message: "Transfer must reference a parent transfer activity in the sequence"
      });
    }
    if (!lesson.activitySequence.some((activity) => activity.type !== "parent_transfer")) {
      context.addIssue({
        code: "custom",
        path: ["activitySequence"],
        message: "Lesson needs a learning activity before transfer"
      });
    }
  });

export type LessonV1 = z.infer<typeof lessonSchemaV1>;
export const lessonJsonSchemaV1 = {
  ...z.toJSONSchema(lessonSchemaV1, { target: "draft-2020-12" }),
  $id: "urn:kidedu:content:lesson:v1"
};
