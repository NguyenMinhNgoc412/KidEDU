import type { BackupDatabaseSnapshot } from "./backupSnapshot";

export type EntityStatus = "active" | "hidden" | "archived";

export type LearningStatus = "new" | "practicing" | "familiar";

export type MediaRole = "illustration" | "mouth_video" | "pronunciation_audio" | "sfx";

export type MediaType = "image" | "animated_image" | "video" | "audio" | "thumbnail";

export type MediaSource = "default" | "custom" | "generated";

export type MediaStatus = "active" | "missing" | "deleted" | "processing" | "failed";

<<<<<<< Updated upstream
export type PracticeMode = "single_item" | "auto_play_deck";
=======
export type PracticeMode = "single_item" | "auto_play_deck" | "mini_test" | "puzzle_game" | "memory_game";
>>>>>>> Stashed changes

export type PracticeSessionStatus = "active" | "completed" | "cancelled" | "interrupted";

export type PracticeEventType = "viewed" | "replayed" | "completed_item" | "skipped";

export type SpeedPreset = "slow" | "normal" | "fast";

export type LoopMode = "once" | "three_times" | "continuous";

export type PlaybackSpeed = 0.85 | 1 | 1.15;

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isDefault: boolean;
}

export interface MediaAsset {
  id: string;
  type: MediaType;
  source: MediaSource;
  uri: string;
  thumbnailAssetId: string | null;
  thumbnailUri: string | null;
  durationMs: number | null;
  sizeBytes: number | null;
  mimeType: string | null;
  status: MediaStatus;
}

export interface LearningItemMedia {
  id: string;
  learningItemId: string;
  mediaAssetId: string;
  role: MediaRole;
  priority: number;
  isActive: boolean;
  asset: MediaAsset;
}

export interface LearningItem {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  status: EntityStatus;
  learningStatus: LearningStatus;
  note: string | null;
  media: LearningItemMedia[];
}

export interface Deck {
  id: string;
  title: string;
  description: string | null;
  status: EntityStatus;
  itemCount: number;
}

export interface DeckDetail extends Deck {
  items: LearningItem[];
}

export interface LearningSettings {
  speedPreset: SpeedPreset;
  playbackSpeed: PlaybackSpeed;
  loopMode: LoopMode;
  loopCount: number | null;
  reinforcementEnabled: boolean;
  sfxEnabled: boolean;
}

export interface PracticeSession {
  id: string;
  mode: PracticeMode;
  deckId: string | null;
  startedAt: string;
  endedAt: string | null;
  status: PracticeSessionStatus;
}

export interface ProgressSummaryItem {
  learningItemId: string;
  title: string;
  viewCount: number;
  practiceCount: number;
  lastPracticedAt: string | null;
  parentMark: LearningStatus;
}

export interface PrivacyDataSummary {
  learningItemCount: number;
  deckCount: number;
  practiceSessionCount: number;
  practiceEventCount: number;
  learningProgressCount: number;
  personalizedMediaCount: number;
  personalizedMediaBytes: number;
}

export interface CreateLearningItemInput {
  title: string;
  categoryId: string;
  note?: string | null;
}

export interface UpdateLearningItemInput {
  title: string;
  categoryId: string;
  learningStatus: LearningStatus;
  note?: string | null;
  status: EntityStatus;
}

export interface UpsertCustomMediaInput {
  learningItemId: string;
  role: MediaRole;
  type: MediaType;
  uri: string;
  thumbnailUri?: string | null;
  durationMs?: number | null;
  sizeBytes?: number | null;
  mimeType?: string | null;
}

export interface DeleteCustomMediaInput {
  learningItemId: string;
  role: MediaRole;
}

export interface MediaFileCleanupRecord {
  assetId: string;
  uri: string;
  status: MediaStatus;
  isReferencedByActiveMedia: boolean;
}

export interface UpdateProgressParentMarkInput {
  learningItemId: string;
  parentMark: LearningStatus;
}

export interface CreateDeckInput {
  title: string;
  description?: string | null;
  itemIds: string[];
}

export interface UpdateDeckInput {
  title: string;
  description?: string | null;
  status: EntityStatus;
  itemIds: string[];
}

export interface KidEduRepository {
  createBackupSnapshot(): Promise<BackupDatabaseSnapshot>;
  replaceFromBackup(snapshot: BackupDatabaseSnapshot): Promise<string[]>;
  getPrivacyDataSummary(): Promise<PrivacyDataSummary>;
  clearLearningHistory(): Promise<void>;
  deleteAllPersonalizedMedia(): Promise<string[]>;
  resetAllLocalData(): Promise<string[]>;
  listCategories(): Promise<Category[]>;
  listLearningItems(options?: {
    includeArchived?: boolean;
    childOnly?: boolean;
  }): Promise<LearningItem[]>;
  getLearningItem(itemId: string): Promise<LearningItem | null>;
  createLearningItem(input: CreateLearningItemInput): Promise<string>;
  updateLearningItem(itemId: string, input: UpdateLearningItemInput): Promise<void>;
  archiveLearningItem(itemId: string): Promise<void>;
  upsertCustomMediaForItem(input: UpsertCustomMediaInput): Promise<string[]>;
  deleteCustomMediaForItem(input: DeleteCustomMediaInput): Promise<string[]>;
  listMediaFilesForCleanup(): Promise<MediaFileCleanupRecord[]>;
  markMediaAssetsMissing(assetIds: string[]): Promise<void>;
  markMediaAssetsDeleted(assetIds: string[]): Promise<void>;
  listDecks(options?: { includeArchived?: boolean; childOnly?: boolean }): Promise<Deck[]>;
  getDeckDetail(deckId: string): Promise<DeckDetail | null>;
  createDeck(input: CreateDeckInput): Promise<string>;
  updateDeck(deckId: string, input: UpdateDeckInput): Promise<void>;
  archiveDeck(deckId: string): Promise<void>;
  getLearningSettings(): Promise<LearningSettings>;
  updateLearningSettings(settings: LearningSettings): Promise<void>;
  startPracticeSession(input: { mode: PracticeMode; deckId?: string | null }): Promise<string>;
  recoverActivePracticeSessions(): Promise<void>;
  recordPracticeEvent(input: {
    sessionId: string;
    learningItemId: string;
    eventType: PracticeEventType;
  }): Promise<void>;
  finishPracticeSession(input: { sessionId: string; status: PracticeSessionStatus }): Promise<void>;
  listProgressSummary(): Promise<ProgressSummaryItem[]>;
  updateProgressParentMark(input: UpdateProgressParentMarkInput): Promise<void>;
}
