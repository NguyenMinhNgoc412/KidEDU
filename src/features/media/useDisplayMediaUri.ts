import { useEffect, useState } from "react";

import { getWebMediaObjectUrl, isWebMediaUri } from "@/features/media/webMediaStore";

export function useDisplayMediaUri(uri: string | null): string | null {
  const [displayUri, setDisplayUri] = useState<string | null>(uri);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    async function resolveUri() {
      if (!uri || !isWebMediaUri(uri)) {
        setDisplayUri(uri);
        return;
      }

      const resolvedUri = await getWebMediaObjectUrl(uri);
      objectUrl = resolvedUri;

      if (!isMounted) {
        if (resolvedUri) {
          URL.revokeObjectURL(resolvedUri);
        }
        return;
      }

      setDisplayUri(resolvedUri);
    }

    void resolveUri();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [uri]);

  return displayUri;
}
