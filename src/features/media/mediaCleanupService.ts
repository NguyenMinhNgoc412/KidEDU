import * as FileSystem from "expo-file-system/legacy";

import type { KidEduRepository } from "@/data/types";

import { cleanupMediaFiles } from "./mediaImportService";

export interface MediaCleanupResult {
  deletedAssetCount: number;
  deletedFileCount: number;
  missingAssetCount: number;
  skipped: boolean;
}

interface MediaCleanupFileAdapter {
  deleteFiles(uris: string[]): Promise<void>;
  fileExists(uri: string): Promise<boolean>;
}

export async function cleanupOrphanedMediaFiles(
  repository: KidEduRepository,
  options?: {
    fileAdapter?: MediaCleanupFileAdapter;
    isPlaybackActive?: () => boolean;
  }
): Promise<MediaCleanupResult> {
  if (options?.isPlaybackActive?.()) {
    return {
      deletedAssetCount: 0,
      deletedFileCount: 0,
      missingAssetCount: 0,
      skipped: true
    };
  }

  const fileAdapter = options?.fileAdapter ?? defaultFileAdapter;
  const records = await repository.listMediaFilesForCleanup();
  const activeUris = new Set(records.filter((record) => record.isReferencedByActiveMedia).map((record) => record.uri));
  const missingAssetIds: string[] = [];
  const orphanAssetIds: string[] = [];
  const orphanUris: string[] = [];

  for (const record of records) {
    const exists = await fileAdapter.fileExists(record.uri);

    if (record.isReferencedByActiveMedia) {
      if (!exists && record.status === "active") {
        missingAssetIds.push(record.assetId);
      }
      continue;
    }

    if (exists && !activeUris.has(record.uri)) {
      orphanUris.push(record.uri);
    }

    if (record.status !== "deleted") {
      orphanAssetIds.push(record.assetId);
    }
  }

  await fileAdapter.deleteFiles([...new Set(orphanUris)]);
  await repository.markMediaAssetsMissing(missingAssetIds);
  await repository.markMediaAssetsDeleted(orphanAssetIds);

  return {
    deletedAssetCount: new Set(orphanAssetIds).size,
    deletedFileCount: new Set(orphanUris).size,
    missingAssetCount: new Set(missingAssetIds).size,
    skipped: false
  };
}

const defaultFileAdapter: MediaCleanupFileAdapter = {
  async fileExists(uri) {
    if (!uri.startsWith("file://")) {
      return false;
    }

    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info.exists;
    } catch {
      return false;
    }
  },
  async deleteFiles(uris) {
    await cleanupMediaFiles(uris);
  }
};
