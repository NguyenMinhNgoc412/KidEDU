import type { MediaRole, MediaType } from "./types";

export const bundledDefaultMediaScheme = "bundle://default/";

export type BundledAssetModule = number | string;

export const bundledDefaultVideoLimits = {
  maxDurationMs: 15_000,
  maxSizeBytes: 80 * 1024 * 1024,
  minLongEdge: 1280,
  minShortEdge: 720
} as const;

export interface BundledDefaultMediaFile {
  key: string;
  module: BundledAssetModule;
  mimeType: string;
}

export interface BundledDefaultVideoMetadata {
  codec: "h264";
  width: number;
  height: number;
}

export interface BundledDefaultMediaDefinition {
  itemId: string;
  role: MediaRole;
  type: MediaType;
  asset: BundledDefaultMediaFile;
  thumbnail?: BundledDefaultMediaFile;
  durationMs?: number;
  sizeBytes?: number;
  videoMetadata?: BundledDefaultVideoMetadata;
}

/**
 * Add default media here only after the real file exists under assets/default-media.
 * Metro requires every require(...) path to be a static literal, for example:
 *
 * {
 *   itemId: "item-me",
 *   role: "mouth_video",
 *   type: "video",
 *   durationMs: 2400,
 *   sizeBytes: 1200000,
 *   videoMetadata: {
 *     codec: "h264",
 *     width: 1280,
 *     height: 720
 *   },
 *   asset: {
 *     key: "item-me-mouth-video-v1",
 *     // eslint-disable-next-line @typescript-eslint/no-require-imports
 *     module: require("../../assets/default-media/item-me/mouth-video-v1.mp4"),
 *     mimeType: "video/mp4"
 *   },
 *   thumbnail: {
 *     key: "item-me-mouth-video-thumbnail-v1",
 *     // eslint-disable-next-line @typescript-eslint/no-require-imports
 *     module: require("../../assets/default-media/item-me/mouth-video-thumbnail-v1.jpg"),
 *     mimeType: "image/jpeg"
 *   }
 * }
 */
export const bundledDefaultMedia: readonly BundledDefaultMediaDefinition[] = [
  {
    itemId: "item-ba",
    role: "mouth_video",
    type: "video",
    durationMs: 10_006,
    sizeBytes: 2_565_229,
    videoMetadata: {
      codec: "h264",
      width: 1280,
      height: 720
    },
    asset: {
      key: "item-ba-mouth-video-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-ba/mouth-video-v1.mp4"),
      mimeType: "video/mp4"
    },
    thumbnail: {
      key: "item-ba-mouth-video-thumbnail-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-ba/mouth-video-thumbnail-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-me",
    role: "mouth_video",
    type: "video",
    durationMs: 10_006,
    sizeBytes: 2_582_259,
    videoMetadata: {
      codec: "h264",
      width: 1280,
      height: 720
    },
    asset: {
      key: "item-me-mouth-video-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-me/mouth-video-v1.mp4"),
      mimeType: "video/mp4"
    },
    thumbnail: {
      key: "item-me-mouth-video-thumbnail-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-me/mouth-video-thumbnail-v1.jpg"),
      mimeType: "image/jpeg"
    }
  }
];

export function createBundledDefaultMediaUri(key: string): string {
  return `${bundledDefaultMediaScheme}${encodeURIComponent(key)}`;
}

export function isBundledDefaultMediaUri(uri: string | null | undefined): uri is string {
  return Boolean(uri?.startsWith(bundledDefaultMediaScheme));
}

export function validateBundledDefaultMediaDefinitions(
  definitions: readonly BundledDefaultMediaDefinition[]
): string[] {
  const errors: string[] = [];
  const itemRoles = new Set<string>();
  const fileKeys = new Set<string>();

  for (const definition of definitions) {
    const itemRole = `${definition.itemId}:${definition.role}`;
    if (itemRoles.has(itemRole)) {
      errors.push(`Duplicate default media role: ${itemRole}`);
    }
    itemRoles.add(itemRole);

    const allowedTypes = mediaTypesForRole[definition.role];
    if (!allowedTypes.includes(definition.type)) {
      errors.push(
        `Default media ${itemRole} must use type ${allowedTypes.join(" or ")}, received ${definition.type}`
      );
    }

    const expectedMimePrefix = mimePrefixForMediaType(definition.type);
    if (!definition.asset.mimeType.startsWith(expectedMimePrefix)) {
      errors.push(
        `Default media asset ${definition.asset.key} must use a ${expectedMimePrefix}* MIME type`
      );
    }

    for (const file of [definition.asset, definition.thumbnail].filter(
      (entry): entry is BundledDefaultMediaFile => Boolean(entry)
    )) {
      if (!file.key.trim()) {
        errors.push(`Default media ${itemRole} has an empty asset key`);
      } else if (fileKeys.has(file.key)) {
        errors.push(`Duplicate default media asset key: ${file.key}`);
      }
      fileKeys.add(file.key);

      if (!file.mimeType.trim()) {
        errors.push(`Default media asset ${file.key || itemRole} has no MIME type`);
      }
    }

    if (definition.thumbnail && !definition.thumbnail.mimeType.startsWith("image/")) {
      errors.push(`Default media thumbnail ${definition.thumbnail.key} must be an image`);
    }

    validateBundledKey(definition.asset.key, definition.itemId, "asset", errors);
    if (definition.thumbnail) {
      validateBundledKey(definition.thumbnail.key, definition.itemId, "thumbnail", errors);
    }

    if (isRemoteAssetModule(definition.asset.module)) {
      errors.push(`Default media asset ${definition.asset.key} must be bundled, not a remote URL`);
    }
    if (definition.thumbnail && isRemoteAssetModule(definition.thumbnail.module)) {
      errors.push(
        `Default media thumbnail ${definition.thumbnail.key} must be bundled, not a remote URL`
      );
    }

    if (definition.role === "mouth_video") {
      validateBundledMouthVideo(definition, errors);
    }
  }

  return errors;
}

export function getBundledDefaultMediaKey(uri: string): string | null {
  if (!isBundledDefaultMediaUri(uri)) {
    return null;
  }

  const encodedKey = uri.slice(bundledDefaultMediaScheme.length);
  if (!encodedKey) {
    return null;
  }

  try {
    return decodeURIComponent(encodedKey);
  } catch {
    return null;
  }
}

export function buildBundledFileMap(
  definitions: readonly BundledDefaultMediaDefinition[]
): ReadonlyMap<string, BundledDefaultMediaFile> {
  const files = new Map<string, BundledDefaultMediaFile>();

  for (const definition of definitions) {
    files.set(definition.asset.key, definition.asset);
    if (definition.thumbnail) {
      files.set(definition.thumbnail.key, definition.thumbnail);
    }
  }

  return files;
}

const mediaTypesForRole: Record<MediaRole, readonly MediaType[]> = {
  illustration: ["image", "animated_image"],
  mouth_video: ["video"],
  pronunciation_audio: ["audio"],
  sfx: ["audio"]
};

function mimePrefixForMediaType(type: MediaType): "audio/" | "image/" | "video/" {
  if (type === "audio") {
    return "audio/";
  }

  if (type === "video") {
    return "video/";
  }

  return "image/";
}

function validateBundledKey(
  key: string,
  itemId: string,
  fileRole: "asset" | "thumbnail",
  errors: string[]
): void {
  if (!key.startsWith(`${itemId}-`)) {
    errors.push(`Default media ${fileRole} key ${key} must start with ${itemId}-`);
  }

  if (!/-v[1-9]\d*$/.test(key)) {
    errors.push(`Default media ${fileRole} key ${key} must end with a revision such as -v1`);
  }
}

function validateBundledMouthVideo(
  definition: BundledDefaultMediaDefinition,
  errors: string[]
): void {
  const itemRole = `${definition.itemId}:${definition.role}`;

  if (definition.asset.mimeType !== "video/mp4") {
    errors.push(`Default media ${itemRole} must use video/mp4 for offline playback`);
  }

  if (!definition.thumbnail) {
    errors.push(`Default media ${itemRole} requires a bundled thumbnail`);
  } else if (!["image/jpeg", "image/webp"].includes(definition.thumbnail.mimeType)) {
    errors.push(`Default media ${itemRole} thumbnail must use image/jpeg or image/webp`);
  }

  if (
    !Number.isInteger(definition.durationMs) ||
    !definition.durationMs ||
    definition.durationMs < 1 ||
    definition.durationMs > bundledDefaultVideoLimits.maxDurationMs
  ) {
    errors.push(
      `Default media ${itemRole} durationMs must be between 1 and ${bundledDefaultVideoLimits.maxDurationMs}`
    );
  }

  if (
    !Number.isInteger(definition.sizeBytes) ||
    !definition.sizeBytes ||
    definition.sizeBytes < 1 ||
    definition.sizeBytes > bundledDefaultVideoLimits.maxSizeBytes
  ) {
    errors.push(
      `Default media ${itemRole} sizeBytes must be between 1 and ${bundledDefaultVideoLimits.maxSizeBytes}`
    );
  }

  const metadata = definition.videoMetadata;
  if (!metadata) {
    errors.push(`Default media ${itemRole} requires H.264 video metadata`);
    return;
  }

  if (metadata.codec !== "h264") {
    errors.push(`Default media ${itemRole} codec must be h264`);
  }

  const longEdge = Math.max(metadata.width, metadata.height);
  const shortEdge = Math.min(metadata.width, metadata.height);
  if (
    !Number.isInteger(metadata.width) ||
    !Number.isInteger(metadata.height) ||
    longEdge < bundledDefaultVideoLimits.minLongEdge ||
    shortEdge < bundledDefaultVideoLimits.minShortEdge
  ) {
    errors.push(
      `Default media ${itemRole} resolution must be at least ${bundledDefaultVideoLimits.minLongEdge} × ${bundledDefaultVideoLimits.minShortEdge}`
    );
  }
}

function isRemoteAssetModule(module: BundledAssetModule): boolean {
  return typeof module === "string" && /^https?:\/\//i.test(module);
}
