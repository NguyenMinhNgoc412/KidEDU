import type { MediaRole, MediaType } from "./types";

export const bundledDefaultMediaScheme = "bundle://default/";

export type BundledAssetModule = number | string;

export interface BundledDefaultMediaFile {
  key: string;
  module: BundledAssetModule;
  mimeType: string;
}

export interface BundledDefaultMediaDefinition {
  itemId: string;
  role: MediaRole;
  type: MediaType;
  asset: BundledDefaultMediaFile;
  thumbnail?: BundledDefaultMediaFile;
  durationMs?: number;
  sizeBytes?: number;
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
export const bundledDefaultMedia: readonly BundledDefaultMediaDefinition[] = [];

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
