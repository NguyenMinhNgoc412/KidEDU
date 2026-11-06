import {
  rewardCatalogJsonSchemaV1,
  rewardCatalogSchemaV1,
  type RewardCatalogV1
} from "../rewardCatalog";
import { rewardReceiptSchema } from "../gameReward";

// Synthetic metadata only; not reviewed artwork or a publishable production pack.
function fixture(): RewardCatalogV1 {
  const asset = {
    assetId: "asset_test",
    version: 1,
    sha256: "a".repeat(64),
    provenanceRef: "provenance_test",
    rightsRef: "rights_test",
    reviewRef: "review_test",
    formatProfileRef: "format_test",
    accessibleLabel: "Hình minh họa"
  };
  const pictures: RewardCatalogV1["pictures"] = [];
  const items: RewardCatalogV1["items"] = [];
  const pictureThemes: RewardCatalogV1["pictureThemes"] = [];
  const stickerThemes: RewardCatalogV1["stickerThemes"] = [];
  for (const group of ["boy", "girl"] as const) {
    for (let t = 0; t < 3; t++) {
      const themeId = `theme_${group}_${t}`;
      pictureThemes.push({ id: themeId, label: "Chủ đề", groups: [group] });
      stickerThemes.push({ id: themeId, label: "Chủ đề", groups: [group] });
      for (let p = 0; p < 5; p++) {
        const pictureId = `picture_${group}_${t}_${p}`;
        const pieceIds = Array.from({ length: 5 }, (_, i) => `${pictureId}_piece_${i}`);
        pictures.push({
          id: pictureId,
          themeId,
          label: "Tranh",
          groups: [group],
          artwork: asset,
          preview: asset,
          pieceIds
        });
        pieceIds.forEach((id, position) =>
          items.push({ id, kind: "puzzle_piece", pictureId, position, mask: asset })
        );
      }
      for (let i = 0; i < 15; i++)
        items.push({
          id: `new_sticker_${group}_${t}_${i}`,
          kind: "sticker",
          themeId,
          groups: [group],
          artwork: asset
        });
    }
  }
  return {
    schemaVersion: 1,
    id: "catalog_test",
    version: 1,
    pictures,
    items,
    pictureThemes,
    stickerThemes
  };
}

describe("C50 reward catalog content boundary", () => {
  it("accepts a full-size catalog without encoding catalog membership in IDs", () => {
    expect(rewardCatalogSchemaV1.parse(fixture()).items).toHaveLength(240);
    expect(rewardCatalogJsonSchemaV1.$id).toBe("urn:kidedu:content:reward-catalog:v1");
  });
  it("rejects unknown versions and unknown fields", () => {
    expect(rewardCatalogSchemaV1.safeParse({ ...fixture(), schemaVersion: 2 }).success).toBe(false);
    expect(
      rewardCatalogSchemaV1.safeParse({ ...fixture(), signedUrl: "https://example.test" }).success
    ).toBe(false);
  });
  it.each([
    "duplicate",
    "orphan",
    "position",
    "missing",
    "group",
    "cardinality",
    "rights",
    "hash",
    "label"
  ])("rejects %s corruption", (kind) => {
    const value = fixture();
    const picture = value.pictures[0]!;
    const piece = value.items[0]!;
    if (kind === "duplicate") value.items.push(piece);
    if (kind === "orphan" && piece.kind === "puzzle_piece") piece.pictureId = "picture_missing";
    if (kind === "position" && piece.kind === "puzzle_piece") piece.position = 1;
    if (kind === "missing") picture.pieceIds[0] = "piece_missing";
    if (kind === "group") picture.groups = ["girl"];
    if (kind === "cardinality") value.items.pop();
    if (kind === "rights") picture.artwork = { ...picture.artwork, rightsRef: "" };
    if (kind === "hash") picture.artwork = { ...picture.artwork, sha256: "invalid" };
    if (kind === "label") picture.artwork = { ...picture.artwork, accessibleLabel: " " };
    expect(rewardCatalogSchemaV1.safeParse(value).success).toBe(false);
  });
  it("retains all C49 receipt IDs without rewriting or re-awarding inventory", () => {
    for (const theme of ["animals", "heroes", "princesses"]) {
      for (let i = 1; i <= 6; i++)
        expect(
          rewardReceiptSchema.safeParse({ kind: "sticker", itemId: `sticker_${theme}_${i}` })
            .success
        ).toBe(true);
    }
    for (const picture of ["garden", "space"]) {
      for (let i = 0; i < 4; i++)
        expect(
          rewardReceiptSchema.safeParse({ kind: "puzzle_piece", itemId: `piece_${picture}_${i}` })
            .success
        ).toBe(true);
    }
  });
});
