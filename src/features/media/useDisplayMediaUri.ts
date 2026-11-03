import { useEffect, useState } from "react";

import { isBundledDefaultMediaUri } from "@/data/defaultMediaRegistry";
import {
  getCachedBundledDefaultMediaUri,
  resolveBundledDefaultMediaUri
} from "@/features/media/bundledMediaAssetResolver";
import { getWebMediaObjectUrl, isWebMediaUri } from "@/features/media/webMediaStore";
import { useMediaAccountId } from "./MediaAccountBoundary";
import { mediaUriAllowedForAccount } from "./accountMediaScope";

export type DisplayMediaResolutionStatus = "ready" | "resolving" | "unavailable";

export interface DisplayMediaResolution {
  status: DisplayMediaResolutionStatus;
  uri: string | null;
}

interface DisplayMediaResolutionState extends DisplayMediaResolution {
  sourceUri: string | null;
}

export function useDisplayMedia(uri: string | null): DisplayMediaResolution {
  const accountId = useMediaAccountId();
  const permitted = mediaUriAllowedForAccount(uri, accountId);
  uri = permitted ? uri : null;
  const [resolved, setResolved] = useState<DisplayMediaResolutionState>(() =>
    getImmediateDisplayMediaResolution(uri)
  );

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    async function resolveUri() {
      if (!uri) {
        setResolved({ sourceUri: null, status: "unavailable", uri: null });
        return;
      }

      if (!isWebMediaUri(uri) && !isBundledDefaultMediaUri(uri)) {
        setResolved({ sourceUri: uri, status: "ready", uri });
        return;
      }

      if (isBundledDefaultMediaUri(uri)) {
        const cachedUri = getCachedBundledDefaultMediaUri(uri);
        if (cachedUri) {
          setResolved((current) =>
            current.sourceUri === uri && current.uri === cachedUri
              ? current
              : { sourceUri: uri, status: "ready", uri: cachedUri }
          );
          return;
        }
      }

      setResolved({ sourceUri: uri, status: "resolving", uri: null });

      try {
        const resolvedUri = isWebMediaUri(uri)
          ? await getWebMediaObjectUrl(uri)
          : await resolveBundledDefaultMediaUri(uri);
        objectUrl = isWebMediaUri(uri) ? resolvedUri : null;

        if (!isMounted) {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          return;
        }

        setResolved({
          sourceUri: uri,
          status: resolvedUri ? "ready" : "unavailable",
          uri: resolvedUri
        });
      } catch {
        if (isMounted) {
          setResolved({ sourceUri: uri, status: "unavailable", uri: null });
        }
      }
    }

    void resolveUri();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [uri]);

  const current = resolved.sourceUri === uri ? resolved : getImmediateDisplayMediaResolution(uri);
  return {
    status: current.status,
    uri: current.uri
  };
}

export function useDisplayMediaUri(uri: string | null): string | null {
  return useDisplayMedia(uri).uri;
}

function getImmediateDisplayMediaResolution(uri: string | null): DisplayMediaResolutionState {
  if (!uri || isWebMediaUri(uri)) {
    return {
      sourceUri: uri,
      status: uri ? "resolving" : "unavailable",
      uri: null
    };
  }

  if (isBundledDefaultMediaUri(uri)) {
    const cachedUri = getCachedBundledDefaultMediaUri(uri);
    return {
      sourceUri: uri,
      status: cachedUri ? "ready" : "resolving",
      uri: cachedUri
    };
  }

  return {
    sourceUri: uri,
    status: "ready",
    uri
  };
}
