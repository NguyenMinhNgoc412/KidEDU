import type { ImagePickerAsset } from "expo-image-picker";

import type { MediaRole, MediaType } from "@/data/types";

export const mediaImportLimits = {
  imageMaxBytes: 8 * 1024 * 1024,
  videoMaxBytes: 80 * 1024 * 1024,
  videoMaxDurationMs: 15_000,
  videoMinLongEdge: 1280,
  videoMinShortEdge: 720,
  imageMaxWidth: 1280,
  thumbnailMaxWidth: 640
};

export class MediaImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaImportError";
  }
}

export function getMediaTypeForRole(
  role: MediaRole,
  asset: Pick<ImagePickerAsset, "type" | "mimeType">
): MediaType {
  if (role === "mouth_video") {
    return "video";
  }

  if (role === "illustration") {
    return asset.mimeType === "image/gif" ? "animated_image" : "image";
  }

  if (role === "pronunciation_audio") {
    return "audio";
  }

  return "audio";
}

export function validatePickedMediaAsset(asset: ImagePickerAsset, role: MediaRole): void {
  if (!asset.uri) {
    throw new MediaImportError("Không đọc được tệp media đã chọn.");
  }

  if (asset.base64) {
    throw new MediaImportError("Media không được lưu dạng base64.");
  }

  if (role === "illustration") {
    if (asset.type && asset.type !== "image") {
      throw new MediaImportError("Vui lòng chọn một ảnh minh họa.");
    }

    if (asset.fileSize && asset.fileSize > mediaImportLimits.imageMaxBytes) {
      throw new MediaImportError("Ảnh quá lớn. Hãy chọn ảnh dưới 8 MB.");
    }

    return;
  }

  if (role === "mouth_video") {
    if (asset.type && asset.type !== "video") {
      throw new MediaImportError("Vui lòng chọn một video khẩu hình.");
    }

    if (asset.fileSize && asset.fileSize > mediaImportLimits.videoMaxBytes) {
      throw new MediaImportError("Video quá lớn. Hãy chọn video dưới 80 MB.");
    }

    if (asset.duration && asset.duration > mediaImportLimits.videoMaxDurationMs) {
      throw new MediaImportError("Video quá dài. Hãy chọn hoặc quay video tối đa 15 giây.");
    }

    const longEdge = Math.max(asset.width, asset.height);
    const shortEdge = Math.min(asset.width, asset.height);
    if (
      longEdge > 0 &&
      shortEdge > 0 &&
      (longEdge < mediaImportLimits.videoMinLongEdge ||
        shortEdge < mediaImportLimits.videoMinShortEdge)
    ) {
      throw new MediaImportError(
        "Video có độ phân giải thấp. Hãy dùng video HD 1280 × 720 trở lên."
      );
    }

    return;
  }

  throw new MediaImportError("Luồng chọn media này chưa hỗ trợ vai trò đã chọn.");
}
