import type { MediaRole, MediaType } from "./types";

export const bundledDefaultMediaScheme = "bundle://default/";

// This sound is a standalone bundled effect used by the review flow, not a
// learning-item media mapping.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const bundledCelebrationSoundModule = require("../../assets/default-media/sounds/kidedu-congratulations.mp3");

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

export const bundledDefaultMedia: readonly BundledDefaultMediaDefinition[] = [
  {
    itemId: "item-ba",
    role: "illustration",
    type: "image",
    asset: {
      key: "item-ba-illustration-v2",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-ba/illustration-v2.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-me",
    role: "illustration",
    type: "image",
    asset: {
      key: "item-me-illustration-v2",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-me/illustration-v2.jpg"),
      mimeType: "image/jpeg"
    }
  },
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
  },
  {
    itemId: "item-an",
    role: "illustration",
    type: "image",
    sizeBytes: 49472,
    asset: {
      key: "item-an-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-an/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-ba-noi",
    role: "illustration",
    type: "image",
    sizeBytes: 46815,
    asset: {
      key: "item-ba-noi-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-ba-noi/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-banh",
    role: "illustration",
    type: "image",
    sizeBytes: 32802,
    asset: {
      key: "item-banh-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-banh/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-be",
    role: "illustration",
    type: "image",
    sizeBytes: 45692,
    asset: {
      key: "item-be-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-be/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-bong",
    role: "illustration",
    type: "image",
    sizeBytes: 37266,
    asset: {
      key: "item-bong-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-bong/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-ca",
    role: "illustration",
    type: "image",
    sizeBytes: 33904,
    asset: {
      key: "item-ca-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-ca/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-chim",
    role: "illustration",
    type: "image",
    sizeBytes: 44990,
    asset: {
      key: "item-chim-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-chim/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-cho",
    role: "illustration",
    type: "image",
    sizeBytes: 40642,
    asset: {
      key: "item-cho-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-cho/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-dau",
    role: "illustration",
    type: "image",
    sizeBytes: 50263,
    asset: {
      key: "item-dau-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-dau/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-di",
    role: "illustration",
    type: "image",
    sizeBytes: 35152,
    asset: {
      key: "item-di-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-di/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-dong",
    role: "illustration",
    type: "image",
    sizeBytes: 40864,
    asset: {
      key: "item-dong-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-dong/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-dua",
    role: "illustration",
    type: "image",
    sizeBytes: 33503,
    asset: {
      key: "item-dua-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-dua/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-dung",
    role: "illustration",
    type: "image",
    sizeBytes: 33094,
    asset: {
      key: "item-dung-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-dung/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-ga",
    role: "illustration",
    type: "image",
    sizeBytes: 30996,
    asset: {
      key: "item-ga-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-ga/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-gau",
    role: "illustration",
    type: "image",
    sizeBytes: 54066,
    asset: {
      key: "item-gau-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-gau/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-khong",
    role: "illustration",
    type: "image",
    sizeBytes: 45418,
    asset: {
      key: "item-khong-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-khong/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-lay",
    role: "illustration",
    type: "image",
    sizeBytes: 36788,
    asset: {
      key: "item-lay-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-lay/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-ly",
    role: "illustration",
    type: "image",
    sizeBytes: 32687,
    asset: {
      key: "item-ly-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-ly/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-meo",
    role: "illustration",
    type: "image",
    sizeBytes: 47994,
    asset: {
      key: "item-meo-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-meo/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-mo",
    role: "illustration",
    type: "image",
    sizeBytes: 35718,
    asset: {
      key: "item-mo-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-mo/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-ngoi",
    role: "illustration",
    type: "image",
    sizeBytes: 33451,
    asset: {
      key: "item-ngoi-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-ngoi/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-ngu",
    role: "illustration",
    type: "image",
    sizeBytes: 46739,
    asset: {
      key: "item-ngu-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-ngu/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-nua",
    role: "illustration",
    type: "image",
    sizeBytes: 52830,
    asset: {
      key: "item-nua-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-nua/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-ong",
    role: "illustration",
    type: "image",
    sizeBytes: 49741,
    asset: {
      key: "item-ong-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-ong/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-sua",
    role: "illustration",
    type: "image",
    sizeBytes: 30125,
    asset: {
      key: "item-sua-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-sua/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-uong",
    role: "illustration",
    type: "image",
    sizeBytes: 42935,
    asset: {
      key: "item-uong-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-uong/illustration-v1.jpg"),
      mimeType: "image/jpeg"
    }
  },
  {
    itemId: "item-xe",
    role: "illustration",
    type: "image",
    sizeBytes: 41893,
    asset: {
      key: "item-xe-illustration-v1",
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module: require("../../assets/default-media/item-xe/illustration-v1.jpg"),
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

/** Images can be handed directly to Expo Image without async URI downloading. */
export function getBundledDefaultMediaFile(uri: string | null): BundledDefaultMediaFile | null {
  if (!uri) return null;
  const key = getBundledDefaultMediaKey(uri);
  if (!key) return null;
  for (const definition of bundledDefaultMedia) {
    if (definition.asset.key === key) return definition.asset;
    if (definition.thumbnail?.key === key) return definition.thumbnail;
  }
  return null;
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
