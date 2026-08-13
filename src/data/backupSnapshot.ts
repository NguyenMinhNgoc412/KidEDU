import type {
  EntityStatus,
  LearningStatus,
  MediaRole,
  MediaSource,
  MediaStatus,
  MediaType,
  PracticeEventType,
  PracticeMode,
  PracticeSessionStatus
} from "./types";

export interface BackupChildRow {
  id: string;
  name: string;
  avatar_asset_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackupCategoryRow {
  id: string;
  name: string;
  sort_order: number;
  is_default: number;
}

export interface BackupLearningItemRow {
  id: string;
  title: string;
  category_id: string;
  status: EntityStatus;
  learning_status: LearningStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackupMediaAssetRow {
  id: string;
  type: MediaType;
  source: MediaSource;
  uri: string;
  thumbnail_asset_id: string | null;
  duration_ms: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  status: MediaStatus;
  created_at: string;
  updated_at: string;
}

export interface BackupLearningItemMediaRow {
  id: string;
  learning_item_id: string;
  media_asset_id: string;
  role: MediaRole;
  priority: number;
  is_active: number;
  puzzle_template_key?: string | null;
  created_at: string;
}

export interface BackupDeckRow {
  id: string;
  title: string;
  description: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface BackupDeckItemRow {
  id: string;
  deck_id: string;
  learning_item_id: string;
  sort_order: number;
}

export interface BackupPracticeSessionRow {
  id: string;
  child_id: string;
  mode: PracticeMode;
  deck_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: PracticeSessionStatus;
}

export interface BackupPracticeEventRow {
  id: string;
  session_id: string;
  learning_item_id: string;
  event_type: PracticeEventType;
  created_at: string;
}

export interface BackupLearningProgressRow {
  id: string;
  child_id: string;
  learning_item_id: string;
  view_count: number;
  practice_count: number;
  last_practiced_at: string | null;
  parent_mark: LearningStatus;
}

export interface BackupSettingRow {
  key: string;
  value: string;
  updated_at: string;
}

/**
 * Logical database snapshot used by the backup feature.
 *
 * Media URIs are source-device URIs on export and must be replaced with newly
 * imported durable URIs before this snapshot is passed back to the repository.
 * `schema_versions` is intentionally not part of the snapshot.
 */
export interface BackupDatabaseSnapshot {
  schemaVersion: number;
  createdAt: string;
  children: BackupChildRow[];
  categories: BackupCategoryRow[];
  learning_items: BackupLearningItemRow[];
  media_assets: BackupMediaAssetRow[];
  learning_item_media: BackupLearningItemMediaRow[];
  decks: BackupDeckRow[];
  deck_items: BackupDeckItemRow[];
  practice_sessions: BackupPracticeSessionRow[];
  practice_events: BackupPracticeEventRow[];
  learning_progress: BackupLearningProgressRow[];
  settings: BackupSettingRow[];
}
