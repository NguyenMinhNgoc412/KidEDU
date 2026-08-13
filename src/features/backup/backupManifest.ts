import { z } from "zod";

import type {
  BackupCategoryRow,
  BackupChildRow,
  BackupDatabaseSnapshot,
  BackupDeckItemRow,
  BackupDeckRow,
  BackupLearningItemMediaRow,
  BackupLearningItemRow,
  BackupLearningProgressRow,
  BackupMediaAssetRow,
  BackupPracticeEventRow,
  BackupPracticeSessionRow,
  BackupSettingRow
} from "@/data/backupSnapshot";
import { bundledDefaultMediaScheme } from "@/data/defaultMediaRegistry";
import { schemaVersion } from "@/data/schema";

export const kidEduBackupFormat = "kidedu-local-backup" as const;
export const kidEduBackupFormatVersion = 1 as const;
export const kidEduBackupExtension = ".kidedu" as const;
export const kidEduBackupMimeType = "application/octet-stream" as const;
export const kidEduBackupManifestMaxBytes = 16 * 1024 * 1024;

export type PortableMediaStorage =
  { kind: "archive"; path: string } | { kind: "bundle"; uri: string } | { kind: "missing" };

export type PortableBackupMediaAssetRow = Omit<BackupMediaAssetRow, "uri"> & {
  storage: PortableMediaStorage;
};

export type PortableBackupDatabaseSnapshot = Omit<BackupDatabaseSnapshot, "media_assets"> & {
  media_assets: PortableBackupMediaAssetRow[];
};

export interface BackupArchiveFileDescriptor {
  path: string;
  offset: number;
  size: number;
  checksum: {
    algorithm: "crc32";
    value: string;
  };
}

export interface KidEduBackupCounts {
  children: number;
  categories: number;
  learningItems: number;
  mediaAssets: number;
  mediaFiles: number;
  decks: number;
  practiceSessions: number;
  practiceEvents: number;
}

export interface KidEduBackupManifest {
  format: typeof kidEduBackupFormat;
  formatVersion: typeof kidEduBackupFormatVersion;
  appVersion: string;
  createdAt: string;
  counts: KidEduBackupCounts;
  totalMediaBytes: number;
  files: BackupArchiveFileDescriptor[];
  data: PortableBackupDatabaseSnapshot;
}

export type BackupManifestErrorCode = "invalid_file" | "incompatible_version";

export class BackupManifestError extends Error {
  constructor(
    readonly code: BackupManifestErrorCode,
    message: string
  ) {
    super(message);
    this.name = "BackupManifestError";
  }
}

const idSchema = z.string().min(1).max(256);
const shortTextSchema = z.string().max(2_000);
const longTextSchema = z.string().max(100_000);
const timestampSchema = z.string().datetime({ offset: true });
const nullableTimestampSchema = timestampSchema.nullable();
const nullableIdSchema = idSchema.nullable();
const nonNegativeIntegerSchema = z.number().int().safe().nonnegative();
const nullableNonNegativeIntegerSchema = nonNegativeIntegerSchema.nullable();
const booleanIntegerSchema = z.union([z.literal(0), z.literal(1)]);
const entityStatusSchema = z.enum(["active", "hidden", "archived"]);
const learningStatusSchema = z.enum(["new", "practicing", "familiar"]);
const mediaRoleSchema = z.enum(["illustration", "mouth_video", "pronunciation_audio", "sfx"]);
const mediaTypeSchema = z.enum(["image", "animated_image", "video", "audio", "thumbnail"]);
const mediaSourceSchema = z.enum(["default", "custom", "generated"]);
const mediaStatusSchema = z.enum(["active", "missing", "deleted", "processing", "failed"]);
const practiceModeSchema = z.enum(["single_item", "auto_play_deck", "puzzle_game", "memory_game"]);
const practiceSessionStatusSchema = z.enum(["active", "completed", "cancelled", "interrupted"]);
const practiceEventTypeSchema = z.enum(["viewed", "replayed", "completed_item", "skipped"]);

const childSchema: z.ZodType<BackupChildRow> = z.strictObject({
  id: idSchema,
  name: shortTextSchema,
  avatar_asset_id: nullableIdSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema
});

const categorySchema: z.ZodType<BackupCategoryRow> = z.strictObject({
  id: idSchema,
  name: shortTextSchema,
  sort_order: z.number().int().safe(),
  is_default: booleanIntegerSchema
});

const learningItemSchema: z.ZodType<BackupLearningItemRow> = z.strictObject({
  id: idSchema,
  title: shortTextSchema,
  category_id: idSchema,
  status: entityStatusSchema,
  learning_status: learningStatusSchema,
  note: longTextSchema.nullable(),
  created_at: timestampSchema,
  updated_at: timestampSchema
});

const portableStorageSchema: z.ZodType<PortableMediaStorage> = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("archive"), path: z.string().min(1).max(512) }),
  z.strictObject({ kind: z.literal("bundle"), uri: z.string().min(1).max(2_048) }),
  z.strictObject({ kind: z.literal("missing") })
]);

const mediaAssetSchema: z.ZodType<PortableBackupMediaAssetRow> = z.strictObject({
  id: idSchema,
  type: mediaTypeSchema,
  source: mediaSourceSchema,
  storage: portableStorageSchema,
  thumbnail_asset_id: nullableIdSchema,
  duration_ms: nullableNonNegativeIntegerSchema,
  size_bytes: nullableNonNegativeIntegerSchema,
  mime_type: z.string().max(256).nullable(),
  status: mediaStatusSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema
});

const learningItemMediaSchema: z.ZodType<BackupLearningItemMediaRow> = z.strictObject({
  id: idSchema,
  learning_item_id: idSchema,
  media_asset_id: idSchema,
  role: mediaRoleSchema,
  priority: z.number().int().safe(),
  is_active: booleanIntegerSchema,
  puzzle_template_key: z.string().max(128).nullable().optional().default(null),
  created_at: timestampSchema
});

const deckSchema: z.ZodType<BackupDeckRow> = z.strictObject({
  id: idSchema,
  title: shortTextSchema,
  description: longTextSchema.nullable(),
  status: entityStatusSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema
});

const deckItemSchema: z.ZodType<BackupDeckItemRow> = z.strictObject({
  id: idSchema,
  deck_id: idSchema,
  learning_item_id: idSchema,
  sort_order: z.number().int().safe()
});

const practiceSessionSchema: z.ZodType<BackupPracticeSessionRow> = z.strictObject({
  id: idSchema,
  child_id: idSchema,
  mode: practiceModeSchema,
  deck_id: nullableIdSchema,
  started_at: timestampSchema,
  ended_at: nullableTimestampSchema,
  status: practiceSessionStatusSchema
});

const practiceEventSchema: z.ZodType<BackupPracticeEventRow> = z.strictObject({
  id: idSchema,
  session_id: idSchema,
  learning_item_id: idSchema,
  event_type: practiceEventTypeSchema,
  created_at: timestampSchema
});

const learningProgressSchema: z.ZodType<BackupLearningProgressRow> = z.strictObject({
  id: idSchema,
  child_id: idSchema,
  learning_item_id: idSchema,
  view_count: nonNegativeIntegerSchema,
  practice_count: nonNegativeIntegerSchema,
  last_practiced_at: nullableTimestampSchema,
  parent_mark: learningStatusSchema
});

const settingSchema: z.ZodType<BackupSettingRow> = z.strictObject({
  key: idSchema,
  value: longTextSchema,
  updated_at: timestampSchema
});

const databaseSnapshotSchema: z.ZodType<PortableBackupDatabaseSnapshot> = z.strictObject({
  schemaVersion: nonNegativeIntegerSchema,
  createdAt: timestampSchema,
  children: z.array(childSchema).max(1_000),
  categories: z.array(categorySchema).max(10_000),
  learning_items: z.array(learningItemSchema).max(100_000),
  media_assets: z.array(mediaAssetSchema).max(500_000),
  learning_item_media: z.array(learningItemMediaSchema).max(500_000),
  decks: z.array(deckSchema).max(100_000),
  deck_items: z.array(deckItemSchema).max(500_000),
  practice_sessions: z.array(practiceSessionSchema).max(500_000),
  practice_events: z.array(practiceEventSchema).max(1_000_000),
  learning_progress: z.array(learningProgressSchema).max(500_000),
  settings: z.array(settingSchema).max(10_000)
});

const archiveFileSchema: z.ZodType<BackupArchiveFileDescriptor> = z.strictObject({
  path: z.string().min(1).max(512),
  offset: nonNegativeIntegerSchema,
  size: nonNegativeIntegerSchema,
  checksum: z.strictObject({
    algorithm: z.literal("crc32"),
    value: z.string().regex(/^[0-9a-f]{8}$/)
  })
});

const countsSchema: z.ZodType<KidEduBackupCounts> = z.strictObject({
  children: nonNegativeIntegerSchema,
  categories: nonNegativeIntegerSchema,
  learningItems: nonNegativeIntegerSchema,
  mediaAssets: nonNegativeIntegerSchema,
  mediaFiles: nonNegativeIntegerSchema,
  decks: nonNegativeIntegerSchema,
  practiceSessions: nonNegativeIntegerSchema,
  practiceEvents: nonNegativeIntegerSchema
});

const manifestSchema: z.ZodType<KidEduBackupManifest> = z.strictObject({
  format: z.literal(kidEduBackupFormat),
  formatVersion: z.literal(kidEduBackupFormatVersion),
  appVersion: z.string().min(1).max(64),
  createdAt: timestampSchema,
  counts: countsSchema,
  totalMediaBytes: nonNegativeIntegerSchema,
  files: z.array(archiveFileSchema).max(500_000),
  data: databaseSnapshotSchema
});

export function validateKidEduBackupManifest(value: unknown): KidEduBackupManifest {
  assertCompatibleVersion(value);

  const parsed = manifestSchema.safeParse(value);
  if (!parsed.success) {
    throw new BackupManifestError("invalid_file", "Backup manifest does not match the v1 schema.");
  }

  validateManifestRelationships(parsed.data);
  return parsed.data;
}

export function createKidEduBackupCounts(
  data: PortableBackupDatabaseSnapshot,
  files: readonly BackupArchiveFileDescriptor[]
): KidEduBackupCounts {
  return {
    children: data.children.length,
    categories: data.categories.length,
    learningItems: data.learning_items.length,
    mediaAssets: data.media_assets.length,
    mediaFiles: files.length,
    decks: data.decks.length,
    practiceSessions: data.practice_sessions.length,
    practiceEvents: data.practice_events.length
  };
}

export function isSafeBackupArchivePath(path: string): boolean {
  if (
    !path.startsWith("media/") ||
    path.includes("\\") ||
    path.startsWith("/") ||
    path.endsWith("/")
  ) {
    return false;
  }

  const segments = path.split("/");
  return (
    segments.length === 2 &&
    segments.every(
      (segment) =>
        Boolean(segment) && segment !== "." && segment !== ".." && /^[a-zA-Z0-9._-]+$/.test(segment)
    )
  );
}

function assertCompatibleVersion(value: unknown): void {
  if (!isRecord(value) || value.format !== kidEduBackupFormat) {
    return;
  }

  if (value.formatVersion !== kidEduBackupFormatVersion) {
    throw new BackupManifestError(
      "incompatible_version",
      `Unsupported KidEDU backup format version: ${String(value.formatVersion)}`
    );
  }

  const data = value.data;
  if (isRecord(data) && (typeof data.schemaVersion !== "number" || data.schemaVersion > schemaVersion)) {
    throw new BackupManifestError(
      "incompatible_version",
      `Unsupported KidEDU database schema version: ${String(data.schemaVersion)}`
    );
  }
}

function validateManifestRelationships(manifest: KidEduBackupManifest): void {
  const { data } = manifest;
  if (data.schemaVersion > schemaVersion || data.createdAt !== manifest.createdAt) {
    invalid("Backup timestamps or database schema do not match.");
  }

  if (data.children.length === 0 || data.categories.length === 0) {
    invalid("Backup must contain a child profile and at least one category.");
  }

  const expectedCounts = createKidEduBackupCounts(data, manifest.files);
  for (const key of Object.keys(expectedCounts) as Array<keyof KidEduBackupCounts>) {
    if (manifest.counts[key] !== expectedCounts[key]) {
      invalid(`Backup count does not match for ${key}.`);
    }
  }

  const totalMediaBytes = manifest.files.reduce((total, file) => total + file.size, 0);
  if (!Number.isSafeInteger(totalMediaBytes) || totalMediaBytes !== manifest.totalMediaBytes) {
    invalid("Backup media byte count does not match.");
  }

  assertUnique(data.children, (row) => row.id, "child");
  assertUnique(data.categories, (row) => row.id, "category");
  assertUnique(data.learning_items, (row) => row.id, "learning item");
  assertUnique(data.media_assets, (row) => row.id, "media asset");
  assertUnique(data.learning_item_media, (row) => row.id, "learning item media");
  assertUnique(data.decks, (row) => row.id, "deck");
  assertUnique(data.deck_items, (row) => row.id, "deck item");
  assertUnique(data.practice_sessions, (row) => row.id, "practice session");
  assertUnique(data.practice_events, (row) => row.id, "practice event");
  assertUnique(data.learning_progress, (row) => row.id, "learning progress");
  assertUnique(data.settings, (row) => row.key, "setting");
  assertUnique(manifest.files, (file) => file.path, "archive file");

  const childIds = new Set(data.children.map((row) => row.id));
  const categoryIds = new Set(data.categories.map((row) => row.id));
  const learningItemIds = new Set(data.learning_items.map((row) => row.id));
  const mediaById = new Map(data.media_assets.map((row) => [row.id, row]));
  const deckIds = new Set(data.decks.map((row) => row.id));
  const sessionIds = new Set(data.practice_sessions.map((row) => row.id));
  const fileByPath = new Map(manifest.files.map((file) => [file.path, file]));
  const referencedArchivePaths = new Set<string>();

  for (const child of data.children) {
    if (child.avatar_asset_id && !mediaById.has(child.avatar_asset_id)) {
      invalid(`Child ${child.id} references unknown avatar media.`);
    }
  }

  for (const item of data.learning_items) {
    if (!categoryIds.has(item.category_id)) {
      invalid(`Learning item ${item.id} references unknown category.`);
    }
  }

  for (const asset of data.media_assets) {
    if (asset.thumbnail_asset_id && !mediaById.has(asset.thumbnail_asset_id)) {
      invalid(`Media asset ${asset.id} references unknown thumbnail.`);
    }

    if (asset.storage.kind === "archive") {
      if (asset.source === "default" || !isSafeBackupArchivePath(asset.storage.path)) {
        invalid(`Media asset ${asset.id} has invalid archive storage.`);
      }

      const file = fileByPath.get(asset.storage.path);
      if (!file || asset.size_bytes !== file.size) {
        invalid(`Media asset ${asset.id} does not match its archived file.`);
      }
      referencedArchivePaths.add(asset.storage.path);
    } else if (asset.storage.kind === "bundle") {
      if (asset.source !== "default" || !asset.storage.uri.startsWith(bundledDefaultMediaScheme)) {
        invalid(`Media asset ${asset.id} has invalid bundled storage.`);
      }
    }
  }

  if (
    referencedArchivePaths.size !== fileByPath.size ||
    [...fileByPath.keys()].some((path) => !referencedArchivePaths.has(path))
  ) {
    invalid("Backup contains an unreferenced or missing media file.");
  }

  for (const mapping of data.learning_item_media) {
    if (!learningItemIds.has(mapping.learning_item_id) || !mediaById.has(mapping.media_asset_id)) {
      invalid(`Learning media mapping ${mapping.id} has a missing reference.`);
    }
  }

  for (const deckItem of data.deck_items) {
    if (!deckIds.has(deckItem.deck_id) || !learningItemIds.has(deckItem.learning_item_id)) {
      invalid(`Deck item ${deckItem.id} has a missing reference.`);
    }
  }

  for (const session of data.practice_sessions) {
    if (!childIds.has(session.child_id) || (session.deck_id && !deckIds.has(session.deck_id))) {
      invalid(`Practice session ${session.id} has a missing reference.`);
    }
  }

  for (const event of data.practice_events) {
    if (!sessionIds.has(event.session_id) || !learningItemIds.has(event.learning_item_id)) {
      invalid(`Practice event ${event.id} has a missing reference.`);
    }
  }

  const progressPairs = new Set<string>();
  for (const progress of data.learning_progress) {
    if (!childIds.has(progress.child_id) || !learningItemIds.has(progress.learning_item_id)) {
      invalid(`Learning progress ${progress.id} has a missing reference.`);
    }

    const pair = `${progress.child_id}\u0000${progress.learning_item_id}`;
    if (progressPairs.has(pair)) {
      invalid("Backup contains duplicate child/item progress.");
    }
    progressPairs.add(pair);
  }
}

function assertUnique<T>(rows: readonly T[], getKey: (row: T) => string, label: string): void {
  const keys = new Set<string>();
  for (const row of rows) {
    const key = getKey(row);
    if (keys.has(key)) {
      invalid(`Backup contains duplicate ${label}: ${key}`);
    }
    keys.add(key);
  }
}

function invalid(message: string): never {
  throw new BackupManifestError("invalid_file", message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
