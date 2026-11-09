import type { Asset } from "expo-asset";

export async function cacheBundledArtwork(asset: Asset): Promise<string> {
  await asset.downloadAsync();
  return asset.localUri ?? asset.uri;
}
