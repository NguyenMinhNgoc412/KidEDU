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

export async function saveImagePickerAssetToAppStorage(asset: ImagePickerAsset, role: MediaRole): Promise<SavedPickedMedia> {
  validatePickedMediaAsset(asset, role);

  const type = getMediaTypeForRole(role, asset);
  const extension = getFileExtension(asset.fileName, asset.mimeType, type);

  if (Platform.OS === "web" && asset.file) {
    const webUri = await saveWebMediaBlob(asset.file, asset.mimeType);

    return {
      type,
      uri: webUri,
      thumbnailUri: null,
      durationMs: asset.duration ?? null,
      sizeBytes: asset.fileSize ?? asset.file.size ?? null,
      mimeType: asset.mimeType ?? asset.file.type ?? inferMimeType(type, extension)
    };
  }

  const durableDir = await ensureMediaDirectory(type);
  const destinationUri = `${durableDir}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const processedUri = type === "image" ? await compressImageForStorage(asset.uri) : asset.uri;

  try {
    await FileSystem.copyAsync({ from: processedUri, to: destinationUri });
  } catch (error) {
    await cleanupMediaFiles([destinationUri]);
    throw error;
  } finally {
    if (processedUri !== asset.uri) {
      await cleanupMediaFiles([processedUri]);
    }
  }

  const info = await FileSystem.getInfoAsync(destinationUri);
  const storedSize = info.exists && "size" in info ? info.size : asset.fileSize ?? null;
  const thumbnailUri = type === "video" ? await createVideoThumbnail(destinationUri) : null;

  return {
    type,
    uri: destinationUri,
    thumbnailUri,
    durationMs: asset.duration ?? null,
    sizeBytes: storedSize,
    mimeType: asset.mimeType ?? inferMimeType(type, extension)
  };
}

export async function saveRecordedAudioToAppStorage(input: {
  uri: string;
  durationMs?: number | null;
  mimeType?: string | null;
}): Promise<SavedPickedMedia> {
  if (!input.uri) {
    throw new MediaImportError("Không đọc được tệp thu âm.");
  }

  const extension = getFileExtension(input.uri, input.mimeType ?? undefined, "audio");

  if (Platform.OS === "web" && input.uri.startsWith("blob:")) {
    const response = await fetch(input.uri);
    const blob = await response.blob();
    const webUri = await saveWebMediaBlob(blob, input.mimeType ?? blob.type);

    return {
      type: "audio",
      uri: webUri,
      thumbnailUri: null,
      durationMs: input.durationMs ?? null,
      sizeBytes: blob.size,
      mimeType: input.mimeType ?? blob.type ?? inferMimeType("audio", extension)
    };
  }

  const durableDir = await ensureMediaDirectory("audio");
  const destinationUri = `${durableDir}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  let didCopy = false;

  try {
    await FileSystem.copyAsync({ from: input.uri, to: destinationUri });
    didCopy = true;
  } catch (error) {
    await cleanupMediaFiles([destinationUri]);
    throw error;
  } finally {
    if (didCopy) {
      await cleanupMediaFiles([input.uri]);
    }
  }

  const info = await FileSystem.getInfoAsync(destinationUri);
  const storedSize = info.exists && "size" in info ? info.size : null;

  return {
    type: "audio",
    uri: destinationUri,
    thumbnailUri: null,
    durationMs: input.durationMs ?? null,
    sizeBytes: storedSize,
    mimeType: input.mimeType ?? inferMimeType("audio", extension)
  };
}

export async function cleanupMediaFiles(uris: Array<string | null | undefined>): Promise<void> {
  const uniqueUris = [...new Set(uris.filter((uri): uri is string => Boolean(uri)))];
  try {
    await deleteWebMediaUris(uniqueUris);
  } catch {
    // Cleanup is best effort; failed cleanup should not roll back valid media metadata.
  }

  await Promise.all(
    uniqueUris.map(async (uri) => {
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
    const result = await manipulateAsync(uri, [{ resize: { width: mediaImportLimits.imageMaxWidth } }], {
      compress: 0.82,
      format: SaveFormat.JPEG
    });

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
    const result = await manipulateAsync(uri, [{ resize: { width: mediaImportLimits.thumbnailMaxWidth } }], {
      compress: 0.76,
      format: SaveFormat.JPEG
    });

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

function getTempImportDirectory(): string | null {
  return FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}kidedu/imports/` : null;
}

function getFileExtension(fileName: string | null | undefined, mimeType: string | undefined, type: MediaType): string {
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
