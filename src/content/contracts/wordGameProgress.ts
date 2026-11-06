import { z } from "zod";
import type { PlayPresentation } from "./playPresentation";

const ids = (max: number, length = 80) =>
  z
    .array(
      z
        .string()
        .regex(/^[a-z][a-z0-9_]+$/)
        .max(length)
    )
    .max(max)
    .refine((values) => new Set(values).size === values.length);
export const wordGameProgressSchema = z.strictObject({
  schemaVersion: z.literal(1),
  memoryOpen: ids(2, 82),
  memoryMatched: ids(5),
  found: ids(5),
  placed: ids(5)
});
export const wordGameProgressMapSchema = z
  .record(z.string().regex(/^[a-z][a-z0-9_:-]{2,159}$/), wordGameProgressSchema)
  .refine((value) => Object.keys(value).length <= 30);
export type WordGameProgress = z.infer<typeof wordGameProgressSchema>;
export function emptyWordGameProgress(): WordGameProgress {
  return { schemaVersion: 1, memoryOpen: [], memoryMatched: [], found: [], placed: [] };
}
export function validWordGameProgress(game: PlayPresentation, value: WordGameProgress) {
  const pieces = new Set(game.pieces.map(({ id }) => id));
  const cards = new Set(game.pieces.flatMap(({ id }) => [`${id}_a`, `${id}_b`]));
  return (
    [value.memoryMatched, value.found, value.placed].every((ids) =>
      ids.every((id) => pieces.has(id))
    ) &&
    value.memoryOpen.every(
      (id) =>
        cards.has(id) &&
        !value.memoryMatched.some((word) => id === `${word}_a` || id === `${word}_b`)
    ) &&
    !(
      value.memoryOpen.length === 2 &&
      value.memoryOpen[0]!.slice(0, -2) === value.memoryOpen[1]!.slice(0, -2)
    )
  );
}
