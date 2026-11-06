/* eslint-disable @typescript-eslint/no-require-imports -- Metro requires static bundled asset paths. */
import type { IllustrationAnimation } from "@/data/illustrationAnimations";
type GameArtwork = IllustrationAnimation & { columns: number; rows: number };
const sheet = (itemId: string, source: number | string): GameArtwork => ({
  itemId,
  label: itemId,
  source,
  frameCount: 4,
  frameDurationMs: 400,
  staticFrame: 0,
  columns: 2,
  rows: 2
});
export const wordGameArtwork: Readonly<Record<string, GameArtwork>> = {
  "item-bong": sheet(
    "item-bong",
    require("../../../assets/word-game-art/ball-v1.png") as number | string
  ),
  "item-gau": sheet(
    "item-gau",
    require("../../../assets/word-game-art/bear-v1.png") as number | string
  ),
  "item-xe": sheet(
    "item-xe",
    require("../../../assets/word-game-art/car-v1.png") as number | string
  ),
  "item-banh": sheet(
    "item-banh",
    require("../../../assets/word-game-art/cake-v1.png") as number | string
  ),
  "item-sua": sheet(
    "item-sua",
    require("../../../assets/word-game-art/milk-v1.png") as number | string
  )
};
