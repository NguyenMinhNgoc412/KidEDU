import { prepareWordArtwork } from "./prepareWordArtwork";
import type { PlayPresentation } from "@/content/contracts/playPresentation";

/** Bundle-owned sample visuals are checked before entering the activity loop. */
export async function preparePlayIllustrations(game: PlayPresentation) {
  const pictures = [
    ...new Set(
      [...game.pieces, ...game.places]
        .map((piece) => piece.picture)
        .filter((id) => id.startsWith("item-"))
    )
  ];
  await prepareWordArtwork(pictures);
}
