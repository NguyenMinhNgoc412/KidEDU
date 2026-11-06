import { z } from "zod";

const id = z.string().regex(/^[a-z][a-z0-9_]{1,79}$/);
const label = z.string().trim().min(1).max(160);
export const playPictureSchema = z.enum([
  "item-bong",
  "item-gau",
  "item-banh",
  "item-sua",
  "item-meo",
  "item-ca",
  "item-chim",
  "item-cho",
  "item-xe",
  "item-ly",
  "item-ba",
  "item-me",
  "item-an",
  "item-uong",
  "item-ngu",
  "icon:box",
  "icon:home",
  "icon:tree",
  "icon:water",
  "icon:seed",
  "icon:child",
  "icon:heart",
  "icon:door"
]);
const piece = z.strictObject({ id, label, picture: playPictureSchema });
/** Authored presentation variants, not additional activity types or automatic assessments. */
export const playPresentationSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    kind: z.enum(["pair", "sort", "sequence", "sentence", "hunt", "scene", "turns"]),
    wordGames: z.literal(true).optional(),
    instruction: z.string().trim().min(1).max(500),
    pieces: z.array(piece).min(1).max(8),
    places: z.array(piece).max(8),
    matches: z.record(id, id),
    sequence: z.array(id).max(8),
    dialogue: z
      .array(
        z.strictObject({
          line: label,
          choices: z
            .array(z.strictObject({ label, reply: label }))
            .min(1)
            .max(3)
        })
      )
      .max(4)
  })
  .superRefine((game, context) => {
    const pieces = new Set(game.pieces.map((item) => item.id));
    const places = new Set(game.places.map((item) => item.id));
    if (
      (game.wordGames &&
        (game.kind !== "pair" ||
          pieces.size < 3 ||
          pieces.size > 5 ||
          game.places.length !== pieces.size ||
          new Set(Object.values(game.matches)).size !== pieces.size ||
          game.pieces.some(
            (piece) =>
              game.places.find((place) => place.id === game.matches[piece.id])?.picture !==
              piece.picture
          ))) ||
      pieces.size !== game.pieces.length ||
      places.size !== game.places.length ||
      Object.entries(game.matches).some(([from, to]) => !pieces.has(from) || !places.has(to)) ||
      game.sequence.some((id) => !pieces.has(id)) ||
      new Set(game.sequence).size !== game.sequence.length ||
      (["pair", "sort"].includes(game.kind) &&
        (Object.keys(game.matches).length !== pieces.size || places.size === 0)) ||
      (["sequence", "sentence"].includes(game.kind) && game.sequence.length !== pieces.size) ||
      (game.kind === "scene" && game.dialogue.length === 0) ||
      (game.kind === "turns" && pieces.size !== 2)
    )
      context.addIssue({ code: "custom", message: "Invalid authored play references" });
  });
export type PlayPresentation = z.infer<typeof playPresentationSchema>;
export type PlayPiece = PlayPresentation["pieces"][number];
