import { useEffect, useState } from "react";

import { isBundledDefaultMediaUri } from "@/data/defaultMediaRegistry";
import { resolveBundledDefaultMediaUri } from "@/features/media/bundledMediaAssetResolver";
import { getWebMediaObjectUrl, isWebMediaUri } from "@/features/media/webMediaStore";

export function useDisplayMediaUri(uri: string | null): string | null {
  const [resolved, setResolved] = useState(() => ({
    sourceUri: uri,
    displayUri: getImmediateDisplayUri(uri)
  }));

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    async function resolveUri() {
      if (!uri) {
        setResolved({ sourceUri: null, displayUri: null });
        return;
      }

      if (!isWebMediaUri(uri) && !isBundledDefaultMediaUri(uri)) {
        setResolved({ sourceUri: uri, displayUri: uri });
        return;
      }

      setResolved({ sourceUri: uri, displayUri: null });

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

        setResolved({ sourceUri: uri, displayUri: resolvedUri });
      } catch {
        if (isMounted) {
          setResolved({ sourceUri: uri, displayUri: null });
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

  return resolved.sourceUri === uri ? resolved.displayUri : getImmediateDisplayUri(uri);
}

function getImmediateDisplayUri(uri: string | null): string | null {
  if (!uri || isWebMediaUri(uri) || isBundledDefaultMediaUri(uri)) {
    return null;
  }

  return uri;
}
