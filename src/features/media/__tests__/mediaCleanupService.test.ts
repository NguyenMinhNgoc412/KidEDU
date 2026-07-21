import type { KidEduRepository, MediaFileCleanupRecord } from "@/data/types";

jest.mock("expo-file-system/legacy", () => ({
  deleteAsync: jest.fn(async () => undefined),
  getInfoAsync: jest.fn(async () => ({ exists: false }))
}));

jest.mock("../mediaImportService", () => ({
  cleanupMediaFiles: jest.fn(async () => undefined)
}));

import {
  cleanupOrphanedMediaFiles,
  cleanupUnreferencedManagedMediaFiles
} from "../mediaCleanupService";

describe("cleanupOrphanedMediaFiles", () => {
  it("deletes orphan files but preserves a URI that is still shared by active media", async () => {
    const records: MediaFileCleanupRecord[] = [
      makeRecord("active-shared", "file:///media/shared.mp4", true),
      makeRecord("orphan-shared", "file:///media/shared.mp4", false),
      makeRecord("orphan-only", "file:///media/orphan.mp4", false)
    ];
    const deleteFiles = jest.fn(async () => undefined);
    const markMediaAssetsDeleted = jest.fn(async () => undefined);
    const markMediaAssetsMissing = jest.fn(async () => undefined);
    const repository = {
      listMediaFilesForCleanup: jest.fn(async () => records),
      markMediaAssetsDeleted,
      markMediaAssetsMissing
    } as unknown as KidEduRepository;

    const result = await cleanupOrphanedMediaFiles(repository, {
      fileAdapter: {
        deleteFiles,
        fileExists: jest.fn(async () => true)
      }
    });

    expect(deleteFiles).toHaveBeenCalledWith(["file:///media/orphan.mp4"]);
    expect(markMediaAssetsDeleted).toHaveBeenCalledWith(["orphan-shared", "orphan-only"]);
    expect(markMediaAssetsMissing).toHaveBeenCalledWith([]);
    expect(result).toEqual({
      deletedAssetCount: 2,
      deletedFileCount: 1,
      missingAssetCount: 0,
      skipped: false
    });
  });
});

describe("cleanupUnreferencedManagedMediaFiles", () => {
  it("deletes only app-owned files that no active DB media references", async () => {
    const records: MediaFileCleanupRecord[] = [
      makeRecord("active-photo", "file:///media/images/custom/photo.jpg", true),
      makeRecord("deleted-voice", "file:///media/audio/custom/voice.m4a", false)
    ];
    const deleteFiles = jest.fn(async () => undefined);
    const repository = {
      listMediaFilesForCleanup: jest.fn(async () => records)
    } as unknown as KidEduRepository;

    const result = await cleanupUnreferencedManagedMediaFiles(repository, {
      storageAdapter: {
        deleteFiles,
        listManagedFileUris: jest.fn(async () => [
          "file:///media/images/custom/photo.jpg",
          "file:///media/audio/custom/voice.m4a",
          "file:///media/restores/old/video.mp4",
          "file:///media/restores/old/video.mp4",
          "content://outside-app/file"
        ])
      }
    });

    expect(deleteFiles).toHaveBeenCalledWith([
      "file:///media/audio/custom/voice.m4a",
      "file:///media/restores/old/video.mp4"
    ]);
    expect(result).toEqual({ deletedFileCount: 2, skipped: false });
  });

  it("skips the directory sweep while playback is active", async () => {
    const repository = {
      listMediaFilesForCleanup: jest.fn()
    } as unknown as KidEduRepository;
    const listManagedFileUris = jest.fn();

    await expect(
      cleanupUnreferencedManagedMediaFiles(repository, {
        isPlaybackActive: () => true,
        storageAdapter: {
          deleteFiles: jest.fn(),
          listManagedFileUris
        }
      })
    ).resolves.toEqual({ deletedFileCount: 0, skipped: true });

    expect(repository.listMediaFilesForCleanup).not.toHaveBeenCalled();
    expect(listManagedFileUris).not.toHaveBeenCalled();
  });

  it("keeps startup available when a best-effort sweep fails", async () => {
    const repository = {
      listMediaFilesForCleanup: jest.fn(async () => {
        throw new Error("database unavailable");
      })
    } as unknown as KidEduRepository;

    await expect(
      cleanupUnreferencedManagedMediaFiles(repository, {
        storageAdapter: {
          deleteFiles: jest.fn(),
          listManagedFileUris: jest.fn(async () => [])
        }
      })
    ).resolves.toEqual({ deletedFileCount: 0, skipped: false });
  });
});

function makeRecord(
  assetId: string,
  uri: string,
  isReferencedByActiveMedia: boolean
): MediaFileCleanupRecord {
  return {
    assetId,
    isReferencedByActiveMedia,
    status: "active",
    uri
  };
}
