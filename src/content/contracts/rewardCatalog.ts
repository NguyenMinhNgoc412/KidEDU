import { z } from "zod";

// C50 P1: PRD-REWARD-002/003, PRD-CONT-005/006, TA-ADR-014.
// Content validation only: this never grants ownership or authorizes a claim.
const id = z.string().regex(/^[a-z][a-z0-9_:-]{2,159}$/);
const label = z.string().trim().min(1).max(160);
export const rewardGroupSchema = z.enum(["boy", "girl"]);
const groups = z
  .array(rewardGroupSchema)
  .min(1)
  .max(2)
  .refine((v) => new Set(v).size === v.length);
const asset = z.strictObject({
  assetId: id,
  version: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  provenanceRef: id,
  rightsRef: id,
  reviewRef: id,
  formatProfileRef: id,
  accessibleLabel: label
});
const theme = z.strictObject({ id, label, groups });
const picture = z.strictObject({
  id,
  themeId: id,
  label,
  groups,
  artwork: asset,
  preview: asset,
  pieceIds: z.array(id).min(5).max(6)
});
const item = z.discriminatedUnion("kind", [
  z.strictObject({ id, kind: z.literal("sticker"), themeId: id, groups, artwork: asset }),
  z.strictObject({
    id,
    kind: z.literal("puzzle_piece"),
    pictureId: id,
    position: z.number().int().min(0).max(5),
    mask: asset
  })
]);

export const rewardCatalogSchemaV1 = z
  .strictObject({
    schemaVersion: z.literal(1),
    id,
    version: z.number().int().positive(),
    pictureThemes: z.array(theme).min(3).max(8),
    stickerThemes: z.array(theme).min(3).max(8),
    pictures: z.array(picture).min(30).max(40),
    items: z.array(item).min(150).max(400)
  })
  .superRefine((catalog, context) => {
    const issue = (path: (string | number)[], message: string) =>
      context.addIssue({ code: "custom", path, message });
    for (const field of ["pictureThemes", "stickerThemes", "pictures", "items"] as const) {
      if (new Set(catalog[field].map((value) => value.id)).size !== catalog[field].length)
        issue([field], "IDs must be unique within the catalog collection");
    }
    const pictures = new Map(catalog.pictures.map((value) => [value.id, value]));
    const items = new Map(catalog.items.map((value) => [value.id, value]));
    const pictureThemes = new Map(catalog.pictureThemes.map((value) => [value.id, value]));
    const stickerThemes = new Map(catalog.stickerThemes.map((value) => [value.id, value]));
    catalog.pictures.forEach((value, index) => {
      const parent = pictureThemes.get(value.themeId);
      if (!parent || value.groups.some((group) => !parent.groups.includes(group)))
        issue(
          ["pictures", index, "themeId"],
          "Picture must belong to a theme supporting its groups"
        );
      if (new Set(value.pieceIds).size !== value.pieceIds.length)
        issue(["pictures", index, "pieceIds"], "Piece references must be unique");
      value.pieceIds.forEach((pieceId, position) => {
        const piece = items.get(pieceId);
        if (
          piece?.kind !== "puzzle_piece" ||
          piece.pictureId !== value.id ||
          piece.position !== position
        )
          issue(
            ["pictures", index, "pieceIds", position],
            "Piece must match its picture and ordered position"
          );
      });
    });
    catalog.items.forEach((value, index) => {
      if (value.kind === "puzzle_piece") {
        if (pictures.get(value.pictureId)?.pieceIds[value.position] !== value.id)
          issue(["items", index, "pictureId"], "Orphan or conflicting puzzle piece");
      } else {
        const parent = stickerThemes.get(value.themeId);
        if (!parent || value.groups.some((group) => !parent.groups.includes(group)))
          issue(
            ["items", index, "themeId"],
            "Sticker must belong to a theme supporting its groups"
          );
      }
    });
    for (const group of rewardGroupSchema.options) {
      const groupPictures = catalog.pictures.filter((value) => value.groups.includes(group));
      if (groupPictures.length < 15 || groupPictures.length > 20)
        issue(["pictures"], "Each group requires 15–20 pictures");
      for (const field of ["pictureThemes", "stickerThemes"] as const) {
        const groupThemes = catalog[field].filter((value) => value.groups.includes(group));
        if (groupThemes.length < 3 || groupThemes.length > 4)
          issue([field], "Each group requires 3–4 themes");
        for (const groupTheme of groupThemes) {
          if (field === "pictureThemes") {
            if (!groupPictures.some((value) => value.themeId === groupTheme.id))
              issue([field], "Picture themes must contain a picture for every declared group");
          } else {
            const count = catalog.items.filter(
              (value) =>
                value.kind === "sticker" &&
                value.themeId === groupTheme.id &&
                value.groups.includes(group)
            ).length;
            if (count < 15 || count > 20)
              issue([field], "Each sticker theme requires 15–20 stickers per group");
          }
        }
      }
    }
  });

export type RewardCatalogV1 = z.infer<typeof rewardCatalogSchemaV1>;
export const rewardCatalogJsonSchemaV1 = {
  ...z.toJSONSchema(rewardCatalogSchemaV1, { target: "draft-2020-12" }),
  $id: "urn:kidedu:content:reward-catalog:v1"
};
