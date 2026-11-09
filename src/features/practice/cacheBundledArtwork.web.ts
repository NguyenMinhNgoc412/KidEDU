import type { Asset } from "expo-asset";

// Only the fixed public bundled catalog calls this adapter. Blob URLs live with the page;
// SVG and HTML image loaders can share them even when Metro sends no-cache headers.
const cached = new Map<string, Promise<string>>();
export function cacheBundledArtwork(asset: Asset): Promise<string> {
  const existing = cached.get(asset.uri);
  if (existing) return existing;
  const pending = fetch(asset.uri)
    .then(async (response) => {
      if (!response.ok) throw new Error("PLAY_VISUAL_UNAVAILABLE");
      return URL.createObjectURL(await response.blob());
    })
    .catch((error: unknown) => {
      cached.delete(asset.uri);
      throw error;
    });
  cached.set(asset.uri, pending);
  return pending;
}
