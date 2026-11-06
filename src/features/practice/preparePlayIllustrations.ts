import { Asset } from "expo-asset";
import { illustrationAnimations } from "@/data/illustrationAnimations";
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
  await Promise.all(
    pictures.map(async (id) => {
      const illustration = illustrationAnimations[id];
      if (!illustration) throw new Error("PLAY_VISUAL_UNAVAILABLE");
      await Asset.fromModule(illustration.source).downloadAsync();
    })
  );
}
