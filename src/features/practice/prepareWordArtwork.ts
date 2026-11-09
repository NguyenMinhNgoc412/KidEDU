import { Asset } from "expo-asset";
import { Image } from "expo-image";
import { illustrationAnimations } from "@/data/illustrationAnimations";
import { wordGameArtwork } from "./wordGameArtwork";
import { cacheBundledArtwork } from "./cacheBundledArtwork";

const localSources = new Map<string, { uri: string }>();
export function wordArtworkSource(picture: string) {
  const artwork = wordGameArtwork[picture] ?? illustrationAnimations[picture];
  if (!artwork) throw new Error("PLAY_VISUAL_UNAVAILABLE");
  return localSources.get(picture) ?? artwork.source;
}

/** Public bundled art only: never put family media or protected pack URLs in this cache. */
export async function prepareWordArtwork(pictures: readonly string[]) {
  const unique = [...new Set(pictures)];
  // Bound simultaneous downloads/decodes on smaller devices.
  for (let start = 0; start < unique.length; start += 3) {
    await Promise.all(
      unique.slice(start, start + 3).map(async (picture) => {
        const artwork = wordGameArtwork[picture] ?? illustrationAnimations[picture];
        if (!artwork) throw new Error("PLAY_VISUAL_UNAVAILABLE");
        const uri = await cacheBundledArtwork(Asset.fromModule(artwork.source));
        if (!(await Image.prefetch(uri, "memory-disk"))) throw new Error("PLAY_VISUAL_UNAVAILABLE");
        localSources.set(picture, { uri });
      })
    );
  }
}
