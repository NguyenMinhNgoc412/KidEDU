import type { BackupDatabaseSnapshot, BackupMediaAssetRow } from "@/data/backupSnapshot";
import { bundledDefaultMediaScheme } from "@/data/defaultMediaRegistry";
import type { MediaStatus } from "@/data/types";

import {
  BackupManifestError,
  type PortableBackupDatabaseSnapshot,
  type PortableBackupMediaAssetRow
} from "./backupManifest";

export interface BackupLocalFileInfo {
  size: number;
  uri: string;
}

export interface PortableBackupFilePlan {
  path: string;
  size: number;
  sourceUri: string;
}

export function createPortableBackupPlan(
  snapshot: BackupDatabaseSnapshot,
  getLocalFile: (asset: BackupMediaAssetRow) => BackupLocalFileInfo | null
): {
  data: PortableBackupDatabaseSnapshot;
  files: PortableBackupFilePlan[];
  totalMediaBytes: number;
} {
  const filesByUri = new Map<string, PortableBackupFilePlan>();
  const portableAssets: PortableBackupMediaAssetRow[] = snapshot.media_assets.map((asset) => {
    const { uri, ...metadata } = asset;

    if (asset.source === "default") {
      return uri.startsWith(bundledDefaultMediaScheme)
        ? { ...metadata, storage: { kind: "bundle", uri } }
        : {
            ...metadata,
            size_bytes: null,
            status: "missing" as MediaStatus,
            storage: { kind: "missing" }
          };
    }

    const file = getLocalFile(asset);
    if (!file || !Number.isSafeInteger(file.size) || file.size < 0) {
      return {
        ...metadata,
        size_bytes: null,
        status: "missing" as MediaStatus,
        storage: { kind: "missing" }
      };
    }

    let planned = filesByUri.get(file.uri);
    if (!planned) {
      const path = makeArchiveMediaPath(filesByUri.size + 1, asset);
      planned = { path, size: file.size, sourceUri: file.uri };
      filesByUri.set(file.uri, planned);
    }

    return {
      ...metadata,
      size_bytes: planned.size,
      storage: { kind: "archive", path: planned.path }
    };
  });

  const files = [...filesByUri.values()];
  return {
    data: { ...snapshot, media_assets: portableAssets },
    files,
    totalMediaBytes: files.reduce((total, file) => total + file.size, 0)
  };
}

export function createRestoredDatabaseSnapshot(
  portable: PortableBackupDatabaseSnapshot,
  restoredUris: ReadonlyMap<string, string>
): BackupDatabaseSnapshot {
  return {
    ...portable,
    media_assets: portable.media_assets.map((asset) => {
      const { storage, ...metadata } = asset;
      if (storage.kind === "archive") {
        const uri = restoredUris.get(storage.path);
        if (!uri) {
          throw new BackupManifestError(
            "invalid_file",
            `Restored media path is missing: ${storage.path}`
          );
        }
        return { ...metadata, uri };
      }

      if (storage.kind === "bundle") {
        return { ...metadata, uri: storage.uri };
      }

      return {
        ...metadata,
        uri: `missing://backup/${encodeURIComponent(asset.id)}`,
        size_bytes: null,
        status: "missing" as MediaStatus
      };
    })
  };
}

function makeArchiveMediaPath(index: number, asset: BackupMediaAssetRow): string {
  return `media/${String(index).padStart(6, "0")}.${getMediaExtension(asset)}`;
}

function getMediaExtension(asset: BackupMediaAssetRow): string {
  const uriWithoutQuery = asset.uri.split(/[?#]/, 1)[0] ?? "";
  const uriExtension = uriWithoutQuery.split(".").pop()?.toLowerCase();
  if (uriExtension && /^[a-z0-9]{2,5}$/.test(uriExtension)) {
    return uriExtension === "jpeg" ? "jpg" : uriExtension;
  }

  const mimeExtensions: Record<string, string> = {
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/webm": "webm",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm"
  };
  return (asset.mime_type && mimeExtensions[asset.mime_type]) || "bin";
}
