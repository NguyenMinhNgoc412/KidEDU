import * as FileSystem from "expo-file-system/legacy";

import type { KidEduRepository } from "@/data/types";

import { cleanupMediaFiles } from "./mediaImportService";
import { accountMediaDirectory, mediaUriAllowedForAccount } from "./accountMediaScope";

export interface MediaCleanupResult {
  deletedAssetCount: number;
  deletedFileCount: number;
  missingAssetCount: number;
  skipped: boolean;
}

export interface ManagedMediaSweepResult {
  deletedFileCount: number;
  skipped: boolean;
}

interface MediaCleanupFileAdapter {
  deleteFiles(uris: string[]): Promise<void>;
  fileExists(uri: string): Promise<boolean>;
}

interface ManagedMediaStorageAdapter {
  deleteFiles(uris: string[]): Promise<void>;
  listManagedFileUris(): Promise<string[]>;
}

export async function cleanupOrphanedMediaFiles(
  repository: KidEduRepository,
  options?: {
    fileAdapter?: MediaCleanupFileAdapter;
    isPlaybackActive?: () => boolean;
    accountId?: string;
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
  const activeUris = new Set(
    records.filter((record) => record.isReferencedByActiveMedia).map((record) => record.uri)
  );
  const missingAssetIds: string[] = [];
  const orphanAssetIds: string[] = [];
  const orphanUris: string[] = [];

  for (const record of records) {
    if (options?.accountId && !mediaUriAllowedForAccount(record.uri, options.accountId)) continue;
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

/**
 * Removes app-owned media/cache files that no longer have an active DB reference.
 * Running this on startup recovers the window where SQLite committed but the process
 * stopped before post-commit file cleanup completed.
 */
export async function cleanupUnreferencedManagedMediaFiles(
  repository: KidEduRepository,
  options?: {
    storageAdapter?: ManagedMediaStorageAdapter;
    isPlaybackActive?: () => boolean;
    accountId?: string;
  }
): Promise<ManagedMediaSweepResult> {
  if (options?.isPlaybackActive?.()) {
    return { deletedFileCount: 0, skipped: true };
  }

  // A per-account DB cannot decide whether files from other namespaces are orphaned.
  if (!options?.storageAdapter && !options?.accountId)
    return { deletedFileCount: 0, skipped: true };

  try {
    const storageAdapter =
      options?.storageAdapter ?? managedMediaStorageForAccount(options!.accountId!);
    const [records, managedFileUris] = await Promise.all([
      repository.listMediaFilesForCleanup(),
      storageAdapter.listManagedFileUris()
    ]);
    const referencedUris = new Set(
      records
        .filter((record) => record.isReferencedByActiveMedia)
        .map((record) => normalizeFileUri(record.uri))
    );
    const orphanUris = [
      ...new Set(
        managedFileUris.filter(
          (uri) =>
            uri.startsWith("file://") &&
            (!options?.accountId || mediaUriAllowedForAccount(uri, options.accountId)) &&
            !referencedUris.has(normalizeFileUri(uri))
        )
      )
    ];

    await storageAdapter.deleteFiles(orphanUris);
    return { deletedFileCount: orphanUris.length, skipped: false };
  } catch {
    // A sweep is recovery/best-effort work and must never block app startup or undo a DB commit.
    return { deletedFileCount: 0, skipped: false };
  }
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

function managedMediaStorageForAccount(accountId: string): ManagedMediaStorageAdapter {
  return {
    async listManagedFileUris() {
      const roots = FileSystem.documentDirectory
        ? [accountMediaDirectory(FileSystem.documentDirectory, accountId)]
        : [];
      const files: string[] = [];

      for (const root of roots) {
        files.push(...(await listFilesRecursively(root)));
      }

      return files;
    },
    async deleteFiles(uris) {
      await cleanupMediaFiles(uris);
    }
  };
}

async function listFilesRecursively(directoryUri: string): Promise<string[]> {
  try {
    const info = await FileSystem.getInfoAsync(directoryUri);
    if (!info.exists) {
      return [];
    }
    if (!info.isDirectory) {
      return [directoryUri];
    }

    const names = await FileSystem.readDirectoryAsync(directoryUri);
    const files: string[] = [];
    const normalizedDirectory = directoryUri.endsWith("/") ? directoryUri : `${directoryUri}/`;

    for (const name of names) {
      const childUri = `${normalizedDirectory}${name}`;
      const childInfo = await FileSystem.getInfoAsync(childUri);
      if (!childInfo.exists) {
        continue;
      }
      if (childInfo.isDirectory) {
        files.push(...(await listFilesRecursively(`${childUri}/`)));
      } else {
        files.push(childUri);
      }
    }

    return files;
  } catch {
    return [];
  }
}

function normalizeFileUri(uri: string): string {
  return uri.replace(/\/+$/, "");
}
