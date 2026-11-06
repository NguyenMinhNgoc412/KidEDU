import { z } from "zod";

export const practiceCourseStateSchema = z.strictObject({
  lessonIds: z
    .array(z.string().regex(/^[a-z][a-z0-9_:-]{2,159}$/))
    .min(1)
    .max(30)
    .refine((ids) => new Set(ids).size === ids.length),
  attempts: z
    .array(
      z.strictObject({
        index: z.number().int().min(0).max(29),
        promptLevel: z.number().int().min(0).max(4),
        repeats: z.number().int().min(0).max(10),
        deferred: z.boolean(),
        occurredAt: z.iso.datetime()
      })
    )
    .max(30),
  reviewIndex: z.number().int().min(0).max(30)
});
export type PracticeCourseState = z.infer<typeof practiceCourseStateSchema>;
