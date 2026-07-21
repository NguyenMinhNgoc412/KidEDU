import { Asset } from "expo-asset";

import {
  buildBundledFileMap,
  bundledDefaultMedia,
  getBundledDefaultMediaKey,
  isBundledDefaultMediaUri
} from "@/data/defaultMediaRegistry";

const bundledFilesByKey = buildBundledFileMap(bundledDefaultMedia);

export async function resolveBundledDefaultMediaUri(uri: string): Promise<string | null> {
  const key = getBundledDefaultMediaKey(uri);
  if (!key) {
    return null;
  }

  const file = bundledFilesByKey.get(key);
  if (!file) {
    return null;
  }

  const asset = Asset.fromModule(file.module);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }

  return asset.localUri ?? asset.uri ?? null;
}

export async function preloadBundledDefaultMediaUris(uris: readonly string[]): Promise<void> {
  const bundledUris = [...new Set(uris.filter(isBundledDefaultMediaUri))];
  await Promise.allSettled(bundledUris.map((uri) => resolveBundledDefaultMediaUri(uri)));
}
