import { Asset } from "expo-asset";

import {
  buildBundledFileMap,
  bundledDefaultMedia,
  getBundledDefaultMediaKey,
  isBundledDefaultMediaUri
} from "@/data/defaultMediaRegistry";

const bundledFilesByKey = buildBundledFileMap(bundledDefaultMedia);
const resolvedBundledUris = new Map<string, string>();
const pendingBundledUriResolutions = new Map<string, Promise<string | null>>();

export const bundledMediaResolveTimeoutMs = 8_000;

export function getCachedBundledDefaultMediaUri(uri: string): string | null {
  return resolvedBundledUris.get(uri) ?? null;
}

export async function resolveBundledDefaultMediaUri(uri: string): Promise<string | null> {
  const cachedUri = getCachedBundledDefaultMediaUri(uri);
  if (cachedUri) {
    return cachedUri;
  }

  const pendingResolution = pendingBundledUriResolutions.get(uri);
  if (pendingResolution) {
    return pendingResolution;
  }

  const underlyingResolution = resolveBundledDefaultMediaUriUncached(uri).then(
    (resolvedUri) => {
      if (resolvedUri && !resolvedBundledUris.has(uri)) {
        resolvedBundledUris.set(uri, resolvedUri);
      }
      return resolvedUri;
    },
    () => null
  );
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const timeoutResolution = new Promise<null>((resolve) => {
    timeout = setTimeout(() => resolve(null), bundledMediaResolveTimeoutMs);
  });
  const resolution = Promise.race([underlyingResolution, timeoutResolution]).finally(() => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    if (pendingBundledUriResolutions.get(uri) === resolution) {
      pendingBundledUriResolutions.delete(uri);
    }
  });
  pendingBundledUriResolutions.set(uri, resolution);

  return resolution;
}

async function resolveBundledDefaultMediaUriUncached(uri: string): Promise<string | null> {
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
