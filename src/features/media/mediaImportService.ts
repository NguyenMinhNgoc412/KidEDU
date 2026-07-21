import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Platform } from "react-native";

import type { MediaRole, MediaType } from "@/data/types";

import {
  getMediaTypeForRole,
  MediaImportError,
  mediaImportLimits,
  validatePickedMediaAsset
} from "./mediaImportValidation";
import { deleteWebMediaUris, saveWebMediaBlob } from "./webMediaStore";

export { getMediaTypeForRole, MediaImportError, mediaImportLimits, validatePickedMediaAsset };

export interface SavedPickedMedia {
  type: MediaType;
  uri: string;
  thumbnailUri: string | null;
  durationMs: number | null;
  sizeBytes: number | null;
  mimeType: string | null;
}

export interface StagedMediaImport extends SavedPickedMedia {
  role: MediaRole;
}

export async function stageImagePickerAssetForPreview(
  asset: ImagePickerAsset,
  role: MediaRole
): Promise<StagedMediaImport> {
  validatePickedMediaAsset(asset, role);

  const type = getMediaTypeForRole(role, asset);
  const extension = getFileExtension(asset.fileName, asset.mimeType, type);

  if (Platform.OS === "web" && asset.file) {
    const webUri = await saveWebMediaBlob(asset.file, asset.mimeType);

    return {
      role,
      type,
      uri: webUri,
      thumbnailUri: null,
      durationMs: asset.duration ?? null,
      sizeBytes: asset.fileSize ?? asset.file.size ?? null,
      mimeType: asset.mimeType ?? asset.file.type ?? inferMimeType(type, extension)
    };
  }

  const stagingDir = await ensureTempImportDirectory();
  const stagedUri = `${stagingDir}${makeFileName(extension)}`;
  const processedUri = type === "image" ? await compressImageForStorage(asset.uri) : asset.uri;

  try {
    await FileSystem.copyAsync({ from: processedUri, to: stagedUri });
  } catch (error) {
    await cleanupMediaFiles([stagedUri]);
    throw error;
  } finally {
    if (processedUri !== asset.uri) {
      await cleanupMediaFiles([processedUri]);
    }
  }

  const info = await FileSystem.getInfoAsync(stagedUri);

  return {
    role,
    type,
    uri: stagedUri,
    thumbnailUri: null,
    durationMs: asset.duration ?? null,
    sizeBytes: info.exists && "size" in info ? info.size : (asset.fileSize ?? null),
    mimeType: asset.mimeType ?? inferMimeType(type, extension)
  };
}

export async function stageRecordedAudioForPreview(input: {
  uri: string;
  durationMs?: number | null;
  mimeType?: string | null;
}): Promise<StagedMediaImport> {
  if (!input.uri) {
    throw new MediaImportError("Không đọc được tệp thu âm.");
  }

  const extension = getFileExtension(input.uri, input.mimeType ?? undefined, "audio");

  if (Platform.OS === "web" && input.uri.startsWith("blob:")) {
    const response = await fetch(input.uri);
    const blob = await response.blob();
    const webUri = await saveWebMediaBlob(blob, input.mimeType ?? blob.type);

    return {
      role: "pronunciation_audio",
      type: "audio",
      uri: webUri,
      thumbnailUri: null,
      durationMs: input.durationMs ?? null,
      sizeBytes: blob.size,
      mimeType: input.mimeType ?? blob.type ?? inferMimeType("audio", extension)
    };
  }

  const stagingDir = await ensureTempImportDirectory();
  const stagedUri = `${stagingDir}${makeFileName(extension)}`;
  let didCopy = false;

  try {
    await FileSystem.copyAsync({ from: input.uri, to: stagedUri });
    didCopy = true;
  } catch (error) {
    await cleanupMediaFiles([stagedUri]);
    throw error;
  } finally {
    if (didCopy) {
      await cleanupMediaFiles([input.uri]);
    }
  }

  const info = await FileSystem.getInfoAsync(stagedUri);

  return {
    role: "pronunciation_audio",
    type: "audio",
    uri: stagedUri,
    thumbnailUri: null,
    durationMs: input.durationMs ?? null,
    sizeBytes: info.exists && "size" in info ? info.size : null,
    mimeType: input.mimeType ?? inferMimeType("audio", extension)
  };
}

export async function commitStagedMediaToAppStorage(
  staged: StagedMediaImport
): Promise<SavedPickedMedia> {
  if (Platform.OS === "web") {
    return staged;
  }

  const extension = getFileExtension(staged.uri, staged.mimeType ?? undefined, staged.type);
  const durableDir = await ensureMediaDirectory(staged.type);
  const destinationUri = `${durableDir}${makeFileName(extension)}`;

  try {
    await FileSystem.copyAsync({ from: staged.uri, to: destinationUri });
    const info = await FileSystem.getInfoAsync(destinationUri);
    const thumbnailUri =
      staged.type === "video" ? await createVideoThumbnail(destinationUri) : null;

    return {
      type: staged.type,
      uri: destinationUri,
      thumbnailUri,
      durationMs: staged.durationMs,
      sizeBytes: info.exists && "size" in info ? info.size : staged.sizeBytes,
      mimeType: staged.mimeType
    };
  } catch (error) {
    await cleanupMediaFiles([destinationUri]);
    throw error;
  }
}

export async function discardStagedMedia(
  staged: StagedMediaImport | null | undefined
): Promise<void> {
  if (!staged) {
    return;
  }

  await cleanupMediaFiles([staged.uri, staged.thumbnailUri]);
}

export async function saveImagePickerAssetToAppStorage(
  asset: ImagePickerAsset,
  role: MediaRole
): Promise<SavedPickedMedia> {
  let staged: StagedMediaImport | null = null;

  try {
    staged = await stageImagePickerAssetForPreview(asset, role);
    const saved = await commitStagedMediaToAppStorage(staged);
    if (saved.uri !== staged.uri) {
      await discardStagedMedia(staged);
    }
    return saved;
  } catch (error) {
    await discardStagedMedia(staged);
    throw error;
  }
}

export async function saveRecordedAudioToAppStorage(input: {
  uri: string;
  durationMs?: number | null;
  mimeType?: string | null;
}): Promise<SavedPickedMedia> {
  let staged: StagedMediaImport | null = null;

  try {
    staged = await stageRecordedAudioForPreview(input);
    const saved = await commitStagedMediaToAppStorage(staged);
    if (saved.uri !== staged.uri) {
      await discardStagedMedia(staged);
    }
    return saved;
  } catch (error) {
    await discardStagedMedia(staged);
    throw error;
  }
}

export async function cleanupMediaFiles(uris: Array<string | null | undefined>): Promise<void> {
  const uniqueUris = [...new Set(uris.filter((uri): uri is string => Boolean(uri)))];
  try {
    await deleteWebMediaUris(uniqueUris);
  } catch {
    // Cleanup is best effort; failed cleanup should not roll back valid media metadata.
  }

  const cleanupConcurrency = 4;
  for (let index = 0; index < uniqueUris.length; index += cleanupConcurrency) {
    await Promise.all(
      uniqueUris.slice(index, index + cleanupConcurrency).map(async (uri) => {
        if (!uri.startsWith("file://")) {
          return;
        }

        try {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch {
          // File cleanup is best effort; DB state must remain the source of truth.
        }
      })
    );
  }
}

export async function cleanupTempMediaImports(): Promise<void> {
  const tempDir = getTempImportDirectory();
  if (!tempDir) {
    return;
  }

  try {
    await FileSystem.deleteAsync(tempDir, { idempotent: true });
  } catch {
    return;
  }
}

async function compressImageForStorage(uri: string): Promise<string> {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: mediaImportLimits.imageMaxWidth } }],
      {
        compress: 0.82,
        format: SaveFormat.JPEG
      }
    );

    return result.uri;
  } catch {
    return uri;
  }
}

async function createVideoThumbnail(videoUri: string): Promise<string | null> {
  const tempUris: string[] = [];
  let destinationUri: string | null = null;

  try {
    const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
      quality: 0.76,
      time: 0
    });
    tempUris.push(thumbnail.uri);

    const processedUri = await compressVideoThumbnailForStorage(thumbnail.uri);
    if (processedUri !== thumbnail.uri) {
      tempUris.push(processedUri);
    }

    const durableDir = await ensureMediaDirectory("thumbnail");
    destinationUri = `${durableDir}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    await FileSystem.copyAsync({ from: processedUri, to: destinationUri });

    return destinationUri;
  } catch {
    await cleanupMediaFiles([destinationUri]);
    return null;
  } finally {
    await cleanupMediaFiles(tempUris);
  }
}

async function compressVideoThumbnailForStorage(uri: string): Promise<string> {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: mediaImportLimits.thumbnailMaxWidth } }],
      {
        compress: 0.76,
        format: SaveFormat.JPEG
      }
    );

    return result.uri;
  } catch {
    return uri;
  }
}

async function ensureMediaDirectory(type: MediaType): Promise<string> {
  const root = FileSystem.documentDirectory;
  if (!root) {
    throw new MediaImportError("Thiết bị chưa cấp vùng lưu trữ nội bộ cho ứng dụng.");
  }

  const directoryName =
    type === "video"
      ? "videos"
      : type === "audio"
        ? "audio"
        : type === "thumbnail"
          ? "thumbnails"
          : "images";
  const directory = `${root}media/${directoryName}/custom/`;
  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }

  return directory;
}

async function ensureTempImportDirectory(): Promise<string> {
  const directory = getTempImportDirectory();
  if (!directory) {
    throw new MediaImportError("Thiết bị chưa cấp vùng lưu tạm cho ứng dụng.");
  }

  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }

  return directory;
}

function makeFileName(extension: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
}

function getTempImportDirectory(): string | null {
  return FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}kidedu/imports/` : null;
}

function getFileExtension(
  fileName: string | null | undefined,
  mimeType: string | undefined,
  type: MediaType
): string {
  const extension = fileName?.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]{2,5}$/.test(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/gif") {
    return "gif";
  }

  if (mimeType === "video/quicktime") {
    return "mov";
  }

  if (mimeType === "audio/webm") {
    return "webm";
  }

  if (mimeType === "audio/mp4" || mimeType === "audio/m4a") {
    return "m4a";
  }

  if (type === "video") {
    return "mp4";
  }

  if (type === "audio") {
    return "m4a";
  }

  return "jpg";
}

function inferMimeType(type: MediaType, extension: string): string | null {
  if (type === "audio") {
    return extension === "webm" ? "audio/webm" : "audio/m4a";
  }

  if (type === "video") {
    return extension === "mov" ? "video/quicktime" : "video/mp4";
  }

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "gif") {
    return "image/gif";
  }

  if (type === "image" || type === "animated_image") {
    return "image/jpeg";
  }

  return null;
}
