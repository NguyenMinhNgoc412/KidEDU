import type { BackupDatabaseSnapshot } from "./backupSnapshot";
import type { KidEduDatabase } from "./database";
import {
  completeLearningSettings,
  getLoopModeForCount,
  getSpeedPresetForPlaybackSpeed,
  loopCountsByMode,
  normalizeLoopCount,
  normalizeLoopMode,
  normalizePlaybackSpeed,
  normalizeSpeedPreset,
  playbackSpeedsByPreset
} from "./learningSettings";
import { defaultChildId, learningSettingKeys } from "./seedData";
import { seedKidEduDatabaseInTransaction } from "./seedDatabase";
import { schemaVersion } from "./schema";
import type {
  Category,
  CreateDeckInput,
  CreateLearningItemInput,
  Deck,
  DeckDetail,
  DeleteCustomMediaInput,
  EntityStatus,
  KidEduRepository,
  LearningItem,
  LearningItemMedia,
  LearningSettings,
  LearningStatus,
  MediaAsset,
  MediaFileCleanupRecord,
  MediaRole,
  MediaSource,
  MediaStatus,
  MediaType,
  PracticeEventType,
  PracticeMode,
  PracticeSessionStatus,
  PrivacyDataSummary,
  ProgressSummaryItem,
  UpdateDeckInput,
  UpdateLearningItemInput,
  UpdateProgressParentMarkInput,
  UpsertCustomMediaInput
} from "./types";

interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
  is_default: number;
}

interface LearningItemRow {
  id: string;
  title: string;
  category_id: string;
  category_name: string;
  status: EntityStatus;
  learning_status: LearningStatus;
  note: string | null;
}

interface LearningItemMediaRow {
  id: string;
  learning_item_id: string;
  media_asset_id: string;
  role: MediaRole;
  priority: number;
  is_active: number;
  asset_id: string;
  type: MediaType;
  source: MediaSource;
  uri: string;
  thumbnail_asset_id: string | null;
  thumbnail_uri: string | null;
  duration_ms: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  asset_status: MediaStatus;
}

interface DeckRow {
  id: string;
  title: string;
  description: string | null;
  status: EntityStatus;
  item_count: number;
}

interface SettingRow {
  key: string;
  value: string;
}

interface ProgressRow {
  learning_item_id: string;
  title: string;
  view_count: number;
  practice_count: number;
  last_practiced_at: string | null;
  parent_mark: LearningStatus;
}

interface MediaFileRow {
  uri: string;
  thumbnail_uri: string | null;
}

interface MediaCleanupRow {
  asset_id: string;
  uri: string;
  status: MediaStatus;
  is_referenced_by_active_media: number;
}

interface SchemaVersionRow {
  version: number;
}

interface PersonalizedMediaUriRow {
  uri: string;
}

interface ForeignKeyViolationRow {
  table: string;
  rowid: number | null;
  parent: string;
  fkid: number;
}

interface PrivacyDataSummaryRow {
  learning_item_count: number;
  deck_count: number;
  practice_session_count: number;
  practice_event_count: number;
  learning_progress_count: number;
  personalized_media_count: number;
  personalized_media_bytes: number | null;
}

export class SQLiteKidEduRepository implements KidEduRepository {
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(private readonly db: KidEduDatabase) {}

  async createBackupSnapshot(): Promise<BackupDatabaseSnapshot> {
    return this.runInTransaction(async (db) => {
      const createdAt = new Date().toISOString();
      const storedSchemaVersion = await db.getFirstAsync<SchemaVersionRow>(
        "SELECT version FROM schema_versions WHERE id = 1",
        []
      );

      if (!storedSchemaVersion) {
        throw new Error("KidEDU local database has no schema version.");
      }

      const children = await db.getAllAsync<BackupDatabaseSnapshot["children"][number]>(
        `SELECT id, name, avatar_asset_id, created_at, updated_at
         FROM children
         ORDER BY id ASC`
      );
      const categories = await db.getAllAsync<BackupDatabaseSnapshot["categories"][number]>(
        `SELECT id, name, sort_order, is_default
         FROM categories
         ORDER BY id ASC`
      );
      const learningItems = await db.getAllAsync<BackupDatabaseSnapshot["learning_items"][number]>(
        `SELECT id, title, category_id, status, learning_status, note, created_at, updated_at
         FROM learning_items
         ORDER BY id ASC`
      );
      const mediaAssets = await db.getAllAsync<BackupDatabaseSnapshot["media_assets"][number]>(
        `SELECT ma.id, ma.type, ma.source, ma.uri, ma.thumbnail_asset_id,
                ma.duration_ms, ma.size_bytes, ma.mime_type, ma.status,
                ma.created_at, ma.updated_at
         FROM media_assets ma
         WHERE ma.source = 'default'
            OR ma.id IN (
              SELECT lim.media_asset_id
              FROM learning_item_media lim
              JOIN media_assets mapped_asset ON mapped_asset.id = lim.media_asset_id
              WHERE lim.is_active = 1
                AND mapped_asset.source IN ('custom', 'generated')
            )
            OR ma.id IN (
              SELECT mapped_asset.thumbnail_asset_id
              FROM learning_item_media lim
              JOIN media_assets mapped_asset ON mapped_asset.id = lim.media_asset_id
              WHERE lim.is_active = 1
                AND mapped_asset.source IN ('custom', 'generated')
                AND mapped_asset.thumbnail_asset_id IS NOT NULL
            )
            OR ma.id IN (
              SELECT avatar_asset_id
              FROM children
              WHERE avatar_asset_id IS NOT NULL
            )
            OR ma.id IN (
              SELECT avatar_asset.thumbnail_asset_id
              FROM children child
              JOIN media_assets avatar_asset ON avatar_asset.id = child.avatar_asset_id
              WHERE avatar_asset.thumbnail_asset_id IS NOT NULL
            )
         ORDER BY ma.id ASC`
      );
      const learningItemMedia = await db.getAllAsync<
        BackupDatabaseSnapshot["learning_item_media"][number]
      >(
        `SELECT lim.id, lim.learning_item_id, lim.media_asset_id, lim.role,
                lim.priority, lim.is_active, lim.created_at
         FROM learning_item_media lim
         JOIN media_assets ma ON ma.id = lim.media_asset_id
         WHERE ma.source = 'default'
            OR (ma.source IN ('custom', 'generated') AND lim.is_active = 1)
         ORDER BY lim.id ASC`
      );
      const decks = await db.getAllAsync<BackupDatabaseSnapshot["decks"][number]>(
        `SELECT id, title, description, status, created_at, updated_at
         FROM decks
         ORDER BY id ASC`
      );
      const deckItems = await db.getAllAsync<BackupDatabaseSnapshot["deck_items"][number]>(
        `SELECT id, deck_id, learning_item_id, sort_order
         FROM deck_items
         ORDER BY deck_id ASC, sort_order ASC, id ASC`
      );
      const practiceSessions = await db.getAllAsync<
        BackupDatabaseSnapshot["practice_sessions"][number]
      >(
        `SELECT id, child_id, mode, deck_id, started_at, ended_at, status
         FROM practice_sessions
         ORDER BY started_at ASC, id ASC`
      );
      const practiceEvents = await db.getAllAsync<
        BackupDatabaseSnapshot["practice_events"][number]
      >(
        `SELECT id, session_id, learning_item_id, event_type, created_at
         FROM practice_events
         ORDER BY created_at ASC, id ASC`
      );
      const learningProgress = await db.getAllAsync<
        BackupDatabaseSnapshot["learning_progress"][number]
      >(
        `SELECT id, child_id, learning_item_id, view_count, practice_count,
                last_practiced_at, parent_mark
         FROM learning_progress
         ORDER BY id ASC`
      );
      const settings = await db.getAllAsync<BackupDatabaseSnapshot["settings"][number]>(
        `SELECT key, value, updated_at
         FROM settings
         ORDER BY key ASC`
      );

      return {
        schemaVersion: storedSchemaVersion.version,
        createdAt,
        children,
        categories,
        learning_items: learningItems,
        media_assets: mediaAssets,
        learning_item_media: learningItemMedia,
        decks,
        deck_items: deckItems,
        practice_sessions: practiceSessions.map((session) =>
          session.status === "active"
            ? { ...session, ended_at: createdAt, status: "interrupted" }
            : session
        ),
        practice_events: practiceEvents,
        learning_progress: learningProgress,
        settings
      };
    });
  }

  async replaceFromBackup(snapshot: BackupDatabaseSnapshot): Promise<string[]> {
    if (snapshot.schemaVersion !== schemaVersion) {
      throw new Error(
        `Unsupported KidEDU backup schema version ${snapshot.schemaVersion}; expected ${schemaVersion}.`
      );
    }

    return this.runInTransaction(async (db) => {
      const previousMediaUris = await this.listPersonalizedMediaUris(db);

      await this.deleteBackupTables(db);
      await this.insertBackupSnapshot(db, snapshot);

      const violations = await db.getAllAsync<ForeignKeyViolationRow>("PRAGMA foreign_key_check");
      if (violations.length > 0) {
        const first = violations[0];
        throw new Error(
          `Restored KidEDU backup violates a foreign key in ${first?.table ?? "unknown table"}.`
        );
      }

      return previousMediaUris;
    });
  }

  async getPrivacyDataSummary(): Promise<PrivacyDataSummary> {
    return this.runInTransaction(async (db) => {
      const row = await db.getFirstAsync<PrivacyDataSummaryRow>(
        `SELECT
           (SELECT COUNT(*) FROM learning_items) AS learning_item_count,
           (SELECT COUNT(*) FROM decks) AS deck_count,
           (SELECT COUNT(*) FROM practice_sessions) AS practice_session_count,
           (SELECT COUNT(*) FROM practice_events) AS practice_event_count,
           (SELECT COUNT(*) FROM learning_progress) AS learning_progress_count,
           (SELECT COUNT(*)
              FROM media_assets
             WHERE source IN ('custom', 'generated')) AS personalized_media_count,
           (SELECT COALESCE(SUM(size_bytes), 0)
              FROM media_assets
             WHERE source IN ('custom', 'generated')) AS personalized_media_bytes`,
        []
      );

      return {
        learningItemCount: row?.learning_item_count ?? 0,
        deckCount: row?.deck_count ?? 0,
        practiceSessionCount: row?.practice_session_count ?? 0,
        practiceEventCount: row?.practice_event_count ?? 0,
        learningProgressCount: row?.learning_progress_count ?? 0,
        personalizedMediaCount: row?.personalized_media_count ?? 0,
        personalizedMediaBytes: row?.personalized_media_bytes ?? 0
      };
    });
  }

  async clearLearningHistory(): Promise<void> {
    const now = new Date().toISOString();

    await this.runInTransaction(async (db) => {
      await db.runAsync("DELETE FROM practice_events", []);
      await db.runAsync("DELETE FROM learning_progress", []);
      await db.runAsync("DELETE FROM practice_sessions", []);
      await db.runAsync(
        `UPDATE learning_items
         SET learning_status = 'new', updated_at = ?
         WHERE learning_status != 'new'`,
        [now]
      );
    });
  }

  async deleteAllPersonalizedMedia(): Promise<string[]> {
    return this.runInTransaction(async (db) => {
      const mediaUris = await this.listPersonalizedMediaUris(db);
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE children
         SET avatar_asset_id = NULL, updated_at = ?
         WHERE avatar_asset_id IN (
           SELECT id FROM media_assets WHERE source IN ('custom', 'generated')
         )`,
        [now]
      );
      await db.runAsync(
        `DELETE FROM learning_item_media
         WHERE media_asset_id IN (
           SELECT id FROM media_assets WHERE source IN ('custom', 'generated')
         )`,
        []
      );
      await db.runAsync(
        `UPDATE media_assets
         SET thumbnail_asset_id = NULL, updated_at = ?
         WHERE source = 'default'
           AND thumbnail_asset_id IN (
             SELECT id FROM media_assets WHERE source IN ('custom', 'generated')
           )`,
        [now]
      );
      await db.runAsync("DELETE FROM media_assets WHERE source IN ('custom', 'generated')", []);

      await this.assertForeignKeysValid(db, "Deleting personalized media");
      return mediaUris;
    });
  }

  async resetAllLocalData(): Promise<string[]> {
    return this.runInTransaction(async (db) => {
      const mediaUris = await this.listPersonalizedMediaUris(db);

      await this.deleteBackupTables(db);
      await seedKidEduDatabaseInTransaction(db, { preserveExistingSettings: false });
      await this.assertForeignKeysValid(db, "Resetting KidEDU local data");

      return mediaUris;
    });
  }

  async listCategories(): Promise<Category[]> {
    const rows = await this.db.getAllAsync<CategoryRow>(
      "SELECT id, name, sort_order, is_default FROM categories ORDER BY sort_order ASC"
    );
    return rows.map(mapCategoryRow);
  }

  async listLearningItems(options?: {
    includeArchived?: boolean;
    childOnly?: boolean;
  }): Promise<LearningItem[]> {
    const whereParts = options?.includeArchived ? [] : ["li.status != 'archived'"];

    if (options?.childOnly) {
      whereParts.push("li.status = 'active'");
    }

    const rows = await this.db.getAllAsync<LearningItemRow>(
      `SELECT li.id, li.title, li.category_id, c.name AS category_name, li.status, li.learning_status, li.note
       FROM learning_items li
       JOIN categories c ON c.id = li.category_id
       ${whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : ""}
       ORDER BY li.created_at DESC, c.sort_order ASC, li.title ASC`
    );

    return this.mapLearningItemRows(rows);
  }

  async getLearningItem(itemId: string): Promise<LearningItem | null> {
    const row = await this.db.getFirstAsync<LearningItemRow>(
      `SELECT li.id, li.title, li.category_id, c.name AS category_name, li.status, li.learning_status, li.note
       FROM learning_items li
       JOIN categories c ON c.id = li.category_id
       WHERE li.id = ?`,
      [itemId]
    );

    return row ? this.mapLearningItemRow(row, await this.getMediaForItem(row.id)) : null;
  }

  async createLearningItem(input: CreateLearningItemInput): Promise<string> {
    const now = new Date().toISOString();
    const itemId = makeId("item");

    await this.runWrite((db) =>
      db.runAsync(
        `INSERT INTO learning_items
          (id, title, category_id, status, learning_status, note, created_at, updated_at)
         VALUES (?, ?, ?, 'active', 'new', ?, ?, ?)`,
        [itemId, input.title.trim(), input.categoryId, input.note?.trim() || null, now, now]
      )
    );

    return itemId;
  }

  async updateLearningItem(itemId: string, input: UpdateLearningItemInput): Promise<void> {
    await this.runWrite((db) =>
      db.runAsync(
        `UPDATE learning_items
         SET title = ?, category_id = ?, learning_status = ?, note = ?, status = ?, updated_at = ?
         WHERE id = ?`,
        [
          input.title.trim(),
          input.categoryId,
          input.learningStatus,
          input.note?.trim() || null,
          input.status,
          new Date().toISOString(),
          itemId
        ]
      )
    );
  }

  async archiveLearningItem(itemId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.runInTransaction(async (db) => {
      await db.runAsync(
        "UPDATE learning_items SET status = 'archived', updated_at = ? WHERE id = ?",
        [now, itemId]
      );
      await db.runAsync("DELETE FROM deck_items WHERE learning_item_id = ?", [itemId]);
      await db.runAsync(
        `UPDATE learning_item_media
         SET is_active = 0
         WHERE id IN (
           SELECT lim.id
           FROM learning_item_media lim
           JOIN media_assets ma ON ma.id = lim.media_asset_id
           WHERE lim.learning_item_id = ?
             AND lim.is_active = 1
             AND ma.source = 'custom'
         )`,
        [itemId]
      );
      await db.runAsync(
        `UPDATE media_assets
         SET status = 'deleted', updated_at = ?
         WHERE id IN (
           SELECT ma.id
           FROM learning_item_media lim
           JOIN media_assets ma ON ma.id = lim.media_asset_id
           WHERE lim.learning_item_id = ?
             AND ma.source = 'custom'
         )
           AND NOT EXISTS (
             SELECT 1
             FROM learning_item_media active_lim
             WHERE active_lim.media_asset_id = media_assets.id
               AND active_lim.is_active = 1
           )`,
        [now, itemId]
      );
      await db.runAsync(
        `UPDATE media_assets
         SET status = 'deleted', updated_at = ?
         WHERE id IN (
           SELECT custom_asset.thumbnail_asset_id
           FROM learning_item_media lim
           JOIN media_assets custom_asset ON custom_asset.id = lim.media_asset_id
           WHERE lim.learning_item_id = ?
             AND custom_asset.source = 'custom'
             AND custom_asset.thumbnail_asset_id IS NOT NULL
         )
           AND NOT EXISTS (
             SELECT 1
             FROM learning_item_media active_lim
             JOIN media_assets active_asset ON active_asset.id = active_lim.media_asset_id
             WHERE active_asset.thumbnail_asset_id = media_assets.id
               AND active_lim.is_active = 1
           )`,
        [now, itemId]
      );
    });
  }

  async upsertCustomMediaForItem(input: UpsertCustomMediaInput): Promise<string[]> {
    const now = new Date().toISOString();
    const mediaAssetId = makeId("media");
    const mappingId = makeId("item-media");
    const thumbnailAssetId =
      input.thumbnailUri && input.thumbnailUri !== input.uri ? makeId("media-thumb") : null;
    const oldUris = await this.getActiveCustomMediaUris(input.learningItemId, input.role);

    await this.runInTransaction(async (db) => {
      await this.markActiveCustomMediaDeleted(db, input.learningItemId, input.role);

      if (thumbnailAssetId && input.thumbnailUri) {
        await db.runAsync(
          `INSERT INTO media_assets
            (id, type, source, uri, thumbnail_asset_id, duration_ms, size_bytes, mime_type, status, created_at, updated_at)
           VALUES (?, 'thumbnail', 'custom', ?, NULL, NULL, NULL, ?, 'active', ?, ?)`,
          [thumbnailAssetId, input.thumbnailUri, "image/jpeg", now, now]
        );
      }

      await db.runAsync(
        `INSERT INTO media_assets
          (id, type, source, uri, thumbnail_asset_id, duration_ms, size_bytes, mime_type, status, created_at, updated_at)
         VALUES (?, ?, 'custom', ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [
          mediaAssetId,
          input.type,
          input.uri,
          thumbnailAssetId,
          input.durationMs ?? null,
          input.sizeBytes ?? null,
          input.mimeType ?? null,
          now,
          now
        ]
      );

      await db.runAsync(
        `INSERT INTO learning_item_media
          (id, learning_item_id, media_asset_id, role, priority, is_active, created_at)
         VALUES (?, ?, ?, ?, 100, 1, ?)`,
        [mappingId, input.learningItemId, mediaAssetId, input.role, now]
      );

      await db.runAsync("UPDATE learning_items SET updated_at = ? WHERE id = ?", [
        now,
        input.learningItemId
      ]);
    });

    return oldUris.filter((uri) => uri !== input.uri && uri !== input.thumbnailUri);
  }

  async deleteCustomMediaForItem(input: DeleteCustomMediaInput): Promise<string[]> {
    const oldUris = await this.getActiveCustomMediaUris(input.learningItemId, input.role);

    await this.runInTransaction(async (db) => {
      await this.markActiveCustomMediaDeleted(db, input.learningItemId, input.role);
      await db.runAsync("UPDATE learning_items SET updated_at = ? WHERE id = ?", [
        new Date().toISOString(),
        input.learningItemId
      ]);
    });

    return oldUris;
  }

  async listMediaFilesForCleanup(): Promise<MediaFileCleanupRecord[]> {
    const rows = await this.db.getAllAsync<MediaCleanupRow>(
      `SELECT ma.id AS asset_id,
              ma.uri,
              ma.status,
              CASE
                WHEN EXISTS (
                  SELECT 1
                  FROM learning_item_media lim
                  WHERE lim.media_asset_id = ma.id
                    AND lim.is_active = 1
                )
                OR EXISTS (
                  SELECT 1
                  FROM learning_item_media lim
                  JOIN media_assets parent ON parent.id = lim.media_asset_id
                  WHERE parent.thumbnail_asset_id = ma.id
                    AND lim.is_active = 1
                )
                OR EXISTS (
                  SELECT 1
                  FROM children c
                  WHERE c.avatar_asset_id = ma.id
                )
                OR EXISTS (
                  SELECT 1
                  FROM children c
                  JOIN media_assets avatar ON avatar.id = c.avatar_asset_id
                  WHERE avatar.thumbnail_asset_id = ma.id
                )
                THEN 1
                ELSE 0
              END AS is_referenced_by_active_media
       FROM media_assets ma
       WHERE ma.source IN ('custom', 'generated')
         AND ma.uri LIKE 'file://%'`
    );

    return rows.map((row) => ({
      assetId: row.asset_id,
      uri: row.uri,
      status: row.status,
      isReferencedByActiveMedia: row.is_referenced_by_active_media === 1
    }));
  }

  async markMediaAssetsMissing(assetIds: string[]): Promise<void> {
    await this.markMediaAssetsStatus(assetIds, "missing", { onlyActive: true });
  }

  async markMediaAssetsDeleted(assetIds: string[]): Promise<void> {
    await this.markMediaAssetsStatus(assetIds, "deleted");
  }

  async listDecks(options?: { includeArchived?: boolean; childOnly?: boolean }): Promise<Deck[]> {
    const whereParts = options?.includeArchived ? [] : ["d.status != 'archived'"];

    if (options?.childOnly) {
      whereParts.push("d.status = 'active'");
    }

    const rows = await this.db.getAllAsync<DeckRow>(
      `SELECT d.id, d.title, d.description, d.status, COUNT(li.id) AS item_count
       FROM decks d
       LEFT JOIN deck_items di ON di.deck_id = d.id
       LEFT JOIN learning_items li ON li.id = di.learning_item_id AND li.status = 'active'
       ${whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : ""}
       GROUP BY d.id
       ORDER BY d.created_at DESC`
    );

    return rows.map(mapDeckRow);
  }

  async getDeckDetail(deckId: string): Promise<DeckDetail | null> {
    const deckRow = await this.db.getFirstAsync<DeckRow>(
      `SELECT d.id, d.title, d.description, d.status, COUNT(li.id) AS item_count
       FROM decks d
       LEFT JOIN deck_items di ON di.deck_id = d.id
       LEFT JOIN learning_items li ON li.id = di.learning_item_id AND li.status != 'archived'
       WHERE d.id = ?
       GROUP BY d.id`,
      [deckId]
    );

    if (!deckRow) {
      return null;
    }

    const itemRows = await this.db.getAllAsync<LearningItemRow>(
      `SELECT li.id, li.title, li.category_id, c.name AS category_name, li.status, li.learning_status, li.note
       FROM deck_items di
       JOIN learning_items li ON li.id = di.learning_item_id
       JOIN categories c ON c.id = li.category_id
       WHERE di.deck_id = ? AND li.status = 'active'
       ORDER BY di.sort_order ASC`,
      [deckId]
    );

    const items = await this.mapLearningItemRows(itemRows);
    return { ...mapDeckRow(deckRow), items };
  }

  async createDeck(input: CreateDeckInput): Promise<string> {
    const deckId = makeId("deck");
    const now = new Date().toISOString();

    await this.runInTransaction(async (db) => {
      await db.runAsync(
        "INSERT INTO decks (id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)",
        [deckId, input.title.trim(), input.description?.trim() || null, now, now]
      );
      await this.replaceDeckItems(db, deckId, input.itemIds);
    });

    return deckId;
  }

  async updateDeck(deckId: string, input: UpdateDeckInput): Promise<void> {
    await this.runInTransaction(async (db) => {
      await db.runAsync(
        "UPDATE decks SET title = ?, description = ?, status = ?, updated_at = ? WHERE id = ?",
        [
          input.title.trim(),
          input.description?.trim() || null,
          input.status,
          new Date().toISOString(),
          deckId
        ]
      );
      await this.replaceDeckItems(db, deckId, input.itemIds);
    });
  }

  async archiveDeck(deckId: string): Promise<void> {
    await this.runWrite((db) =>
      db.runAsync("UPDATE decks SET status = 'archived', updated_at = ? WHERE id = ?", [
        new Date().toISOString(),
        deckId
      ])
    );
  }

  async getLearningSettings(): Promise<LearningSettings> {
    const rows = await this.db.getAllAsync<SettingRow>(
      "SELECT key, value FROM settings ORDER BY updated_at ASC"
    );
    const values = new Map(rows.map((row) => [row.key, row.value]));
    const legacySpeedPreset = normalizeSpeedPreset(values.get(learningSettingKeys.speedPreset));
    const savedPlaybackSpeed = normalizePlaybackSpeed(
      values.get(learningSettingKeys.playbackSpeed),
      legacySpeedPreset
    );
    const playbackSpeed =
      savedPlaybackSpeed === playbackSpeedsByPreset.normal && legacySpeedPreset !== "normal"
        ? playbackSpeedsByPreset[legacySpeedPreset]
        : savedPlaybackSpeed;
    const speedPreset = values.has(learningSettingKeys.playbackSpeed)
      ? getSpeedPresetForPlaybackSpeed(playbackSpeed)
      : legacySpeedPreset;
    const legacyLoopMode = normalizeLoopMode(values.get(learningSettingKeys.loopMode));
    const savedLoopCount = normalizeLoopCount(
      values.get(learningSettingKeys.loopCount),
      legacyLoopMode
    );
    const loopCount =
      savedLoopCount === loopCountsByMode.once && legacyLoopMode !== "once"
        ? loopCountsByMode[legacyLoopMode]
        : savedLoopCount;
    const loopMode = values.has(learningSettingKeys.loopCount)
      ? getLoopModeForCount(loopCount)
      : legacyLoopMode;

    return {
      speedPreset,
      playbackSpeed,
      loopMode,
      loopCount,
      reinforcementEnabled: values.get(learningSettingKeys.reinforcementEnabled) !== "false",
      sfxEnabled: values.get(learningSettingKeys.sfxEnabled) === "true"
    };
  }

  async updateLearningSettings(settings: LearningSettings): Promise<void> {
    const now = new Date().toISOString();
    const nextSettings = completeLearningSettings(settings);
    const entries = [
      [learningSettingKeys.speedPreset, nextSettings.speedPreset],
      [learningSettingKeys.playbackSpeed, String(nextSettings.playbackSpeed)],
      [learningSettingKeys.loopMode, nextSettings.loopMode],
      [learningSettingKeys.loopCount, String(nextSettings.loopCount)],
      [
        learningSettingKeys.reinforcementEnabled,
        nextSettings.reinforcementEnabled ? "true" : "false"
      ],
      [learningSettingKeys.sfxEnabled, nextSettings.sfxEnabled ? "true" : "false"]
    ] as const;

    await this.runInTransaction(async (db) => {
      for (const [key, value] of entries) {
        await db.runAsync("UPDATE settings SET value = ?, updated_at = ? WHERE key = ?", [
          value,
          now,
          key
        ]);
        await db.runAsync(
          "INSERT INTO settings (key, value, updated_at) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = ?)",
          [key, value, now, key]
        );
      }
    });
  }

  async startPracticeSession(input: {
    mode: PracticeMode;
    deckId?: string | null;
  }): Promise<string> {
    const sessionId = makeId("session");
    const now = new Date().toISOString();

    await this.runWrite((db) =>
      db.runAsync(
        `INSERT INTO practice_sessions
          (id, child_id, mode, deck_id, started_at, ended_at, status)
         VALUES (?, ?, ?, ?, ?, NULL, 'active')`,
        [sessionId, defaultChildId, input.mode, input.deckId ?? null, now]
      )
    );

    return sessionId;
  }

  async recordPracticeEvent(input: {
    sessionId: string;
    learningItemId: string;
    eventType: PracticeEventType;
  }): Promise<void> {
    const now = new Date().toISOString();
    const eventId = makeId("event");
    const practiceIncrement = input.eventType === "completed_item" ? 1 : 0;
    const viewIncrement = input.eventType === "viewed" || input.eventType === "replayed" ? 1 : 0;

    await this.runInTransaction(async (db) => {
      await db.runAsync(
        "INSERT INTO practice_events (id, session_id, learning_item_id, event_type, created_at) VALUES (?, ?, ?, ?, ?)",
        [eventId, input.sessionId, input.learningItemId, input.eventType, now]
      );

      if (practiceIncrement > 0 || viewIncrement > 0) {
        await db.runAsync(
          `INSERT INTO learning_progress
            (id, child_id, learning_item_id, view_count, practice_count, last_practiced_at, parent_mark)
           VALUES (?, ?, ?, ?, ?, ?, 'new')
           ON CONFLICT(child_id, learning_item_id)
           DO UPDATE SET
             view_count = view_count + excluded.view_count,
             practice_count = practice_count + excluded.practice_count,
             last_practiced_at = excluded.last_practiced_at`,
          [
            `progress-${defaultChildId}-${input.learningItemId}`,
            defaultChildId,
            input.learningItemId,
            viewIncrement,
            practiceIncrement,
            now
          ]
        );
      }
    });
  }

  async finishPracticeSession(input: {
    sessionId: string;
    status: PracticeSessionStatus;
  }): Promise<void> {
    await this.runWrite((db) =>
      db.runAsync("UPDATE practice_sessions SET status = ?, ended_at = ? WHERE id = ?", [
        input.status,
        new Date().toISOString(),
        input.sessionId
      ])
    );
  }

  async listProgressSummary(): Promise<ProgressSummaryItem[]> {
    const rows = await this.db.getAllAsync<ProgressRow>(
      `SELECT lp.learning_item_id, li.title, lp.view_count, lp.practice_count, lp.last_practiced_at, lp.parent_mark
       FROM learning_progress lp
       JOIN learning_items li ON li.id = lp.learning_item_id
       WHERE li.status != 'archived'
       ORDER BY lp.last_practiced_at DESC`
    );

    return rows.map((row) => ({
      learningItemId: row.learning_item_id,
      title: row.title,
      viewCount: row.view_count,
      practiceCount: row.practice_count,
      lastPracticedAt: row.last_practiced_at,
      parentMark: row.parent_mark
    }));
  }

  async updateProgressParentMark(input: UpdateProgressParentMarkInput): Promise<void> {
    const now = new Date().toISOString();

    await this.runInTransaction(async (db) => {
      await db.runAsync(
        `INSERT INTO learning_progress
          (id, child_id, learning_item_id, view_count, practice_count, last_practiced_at, parent_mark)
         VALUES (?, ?, ?, 0, 0, NULL, ?)
         ON CONFLICT(child_id, learning_item_id)
         DO UPDATE SET parent_mark = excluded.parent_mark`,
        [
          `progress-${defaultChildId}-${input.learningItemId}`,
          defaultChildId,
          input.learningItemId,
          input.parentMark
        ]
      );

      await db.runAsync(
        "UPDATE learning_items SET learning_status = ?, updated_at = ? WHERE id = ?",
        [input.parentMark, now, input.learningItemId]
      );
    });
  }

  private async listPersonalizedMediaUris(db: KidEduDatabase): Promise<string[]> {
    const rows = await db.getAllAsync<PersonalizedMediaUriRow>(
      `SELECT DISTINCT uri
       FROM media_assets
       WHERE source IN ('custom', 'generated')
       ORDER BY uri ASC`
    );

    return [...new Set(rows.map((row) => row.uri))];
  }

  private async assertForeignKeysValid(db: KidEduDatabase, operation: string): Promise<void> {
    const violations = await db.getAllAsync<ForeignKeyViolationRow>("PRAGMA foreign_key_check");
    if (violations.length === 0) {
      return;
    }

    const first = violations[0];
    throw new Error(`${operation} violates a foreign key in ${first?.table ?? "unknown table"}.`);
  }

  private async deleteBackupTables(db: KidEduDatabase): Promise<void> {
    const tables = [
      "practice_events",
      "learning_progress",
      "practice_sessions",
      "deck_items",
      "learning_item_media",
      "learning_items",
      "decks",
      "children",
      "categories",
      "media_assets",
      "settings"
    ] as const;

    for (const table of tables) {
      await db.runAsync(`DELETE FROM ${table}`, []);
    }
  }

  private async insertBackupSnapshot(
    db: KidEduDatabase,
    snapshot: BackupDatabaseSnapshot
  ): Promise<void> {
    for (const category of snapshot.categories) {
      await db.runAsync(
        "INSERT INTO categories (id, name, sort_order, is_default) VALUES (?, ?, ?, ?)",
        [category.id, category.name, category.sort_order, category.is_default]
      );
    }

    for (const asset of snapshot.media_assets) {
      await db.runAsync(
        `INSERT INTO media_assets
          (id, type, source, uri, thumbnail_asset_id, duration_ms, size_bytes, mime_type,
           status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          asset.id,
          asset.type,
          asset.source,
          asset.uri,
          asset.thumbnail_asset_id,
          asset.duration_ms,
          asset.size_bytes,
          asset.mime_type,
          asset.status,
          asset.created_at,
          asset.updated_at
        ]
      );
    }

    for (const child of snapshot.children) {
      await db.runAsync(
        `INSERT INTO children (id, name, avatar_asset_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [child.id, child.name, child.avatar_asset_id, child.created_at, child.updated_at]
      );
    }

    for (const item of snapshot.learning_items) {
      await db.runAsync(
        `INSERT INTO learning_items
          (id, title, category_id, status, learning_status, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.title,
          item.category_id,
          item.status,
          item.learning_status,
          item.note,
          item.created_at,
          item.updated_at
        ]
      );
    }

    for (const deck of snapshot.decks) {
      await db.runAsync(
        `INSERT INTO decks (id, title, description, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [deck.id, deck.title, deck.description, deck.status, deck.created_at, deck.updated_at]
      );
    }

    for (const setting of snapshot.settings) {
      await db.runAsync("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)", [
        setting.key,
        setting.value,
        setting.updated_at
      ]);
    }

    for (const mapping of snapshot.learning_item_media) {
      await db.runAsync(
        `INSERT INTO learning_item_media
          (id, learning_item_id, media_asset_id, role, priority, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          mapping.id,
          mapping.learning_item_id,
          mapping.media_asset_id,
          mapping.role,
          mapping.priority,
          mapping.is_active,
          mapping.created_at
        ]
      );
    }

    for (const deckItem of snapshot.deck_items) {
      await db.runAsync(
        `INSERT INTO deck_items (id, deck_id, learning_item_id, sort_order)
         VALUES (?, ?, ?, ?)`,
        [deckItem.id, deckItem.deck_id, deckItem.learning_item_id, deckItem.sort_order]
      );
    }

    for (const session of snapshot.practice_sessions) {
      const isActive = session.status === "active";
      await db.runAsync(
        `INSERT INTO practice_sessions
          (id, child_id, mode, deck_id, started_at, ended_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.child_id,
          session.mode,
          session.deck_id,
          session.started_at,
          isActive ? snapshot.createdAt : session.ended_at,
          isActive ? "interrupted" : session.status
        ]
      );
    }

    for (const event of snapshot.practice_events) {
      await db.runAsync(
        `INSERT INTO practice_events
          (id, session_id, learning_item_id, event_type, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [event.id, event.session_id, event.learning_item_id, event.event_type, event.created_at]
      );
    }

    for (const progress of snapshot.learning_progress) {
      await db.runAsync(
        `INSERT INTO learning_progress
          (id, child_id, learning_item_id, view_count, practice_count,
           last_practiced_at, parent_mark)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          progress.id,
          progress.child_id,
          progress.learning_item_id,
          progress.view_count,
          progress.practice_count,
          progress.last_practiced_at,
          progress.parent_mark
        ]
      );
    }
  }

  private async replaceDeckItems(
    db: KidEduDatabase,
    deckId: string,
    itemIds: string[]
  ): Promise<void> {
    await db.runAsync("DELETE FROM deck_items WHERE deck_id = ?", [deckId]);
    for (const [index, itemId] of itemIds.entries()) {
      await db.runAsync(
        "INSERT INTO deck_items (id, deck_id, learning_item_id, sort_order) VALUES (?, ?, ?, ?)",
        [`deck-item-${deckId}-${itemId}-${index + 1}`, deckId, itemId, index + 1]
      );
    }
  }

  private async mapLearningItemRows(rows: LearningItemRow[]): Promise<LearningItem[]> {
    const mediaByItemId = await this.getMediaForItems(rows.map((row) => row.id));

    return rows.map((row) => this.mapLearningItemRow(row, mediaByItemId.get(row.id) ?? []));
  }

  private mapLearningItemRow(row: LearningItemRow, media: LearningItemMedia[]): LearningItem {
    return {
      id: row.id,
      title: row.title,
      categoryId: row.category_id,
      categoryName: row.category_name,
      status: row.status,
      learningStatus: row.learning_status,
      note: row.note,
      media
    };
  }

  private async getMediaForItem(itemId: string): Promise<LearningItemMedia[]> {
    const mediaByItemId = await this.getMediaForItems([itemId]);
    return mediaByItemId.get(itemId) ?? [];
  }

  private async getMediaForItems(itemIds: string[]): Promise<Map<string, LearningItemMedia[]>> {
    const uniqueItemIds = [...new Set(itemIds)];
    const mediaByItemId = new Map<string, LearningItemMedia[]>();

    if (uniqueItemIds.length === 0) {
      return mediaByItemId;
    }

    const rows: LearningItemMediaRow[] = [];

    for (const chunk of chunkArray(uniqueItemIds, 250)) {
      const placeholders = chunk.map(() => "?").join(", ");
      rows.push(
        ...(await this.db.getAllAsync<LearningItemMediaRow>(
          `SELECT lim.id, lim.learning_item_id, lim.media_asset_id, lim.role, lim.priority, lim.is_active,
                  ma.id AS asset_id, ma.type, ma.source, ma.uri, ma.thumbnail_asset_id,
                  thumb.uri AS thumbnail_uri, ma.duration_ms,
                  ma.size_bytes, ma.mime_type, ma.status AS asset_status
           FROM learning_item_media lim
           JOIN media_assets ma ON ma.id = lim.media_asset_id
           LEFT JOIN media_assets thumb ON thumb.id = ma.thumbnail_asset_id
           WHERE lim.learning_item_id IN (${placeholders}) AND lim.is_active = 1
           ORDER BY lim.learning_item_id ASC, lim.role ASC, lim.priority DESC`,
          chunk
        ))
      );
    }

    for (const row of rows) {
      const itemMedia = mediaByItemId.get(row.learning_item_id) ?? [];
      itemMedia.push(mapLearningItemMediaRow(row));
      mediaByItemId.set(row.learning_item_id, itemMedia);
    }

    return mediaByItemId;
  }

  private async getActiveCustomMediaUris(itemId: string, role: MediaRole): Promise<string[]> {
    const rows = await this.db.getAllAsync<MediaFileRow>(
      `SELECT ma.uri, thumb.uri AS thumbnail_uri
       FROM learning_item_media lim
       JOIN media_assets ma ON ma.id = lim.media_asset_id
       LEFT JOIN media_assets thumb ON thumb.id = ma.thumbnail_asset_id
       WHERE lim.learning_item_id = ?
         AND lim.role = ?
         AND lim.is_active = 1
         AND ma.source = 'custom'
         AND ma.status = 'active'`,
      [itemId, role]
    );

    return rows.flatMap((row) =>
      [row.uri, row.thumbnail_uri].filter((uri): uri is string => Boolean(uri))
    );
  }

  private async markActiveCustomMediaDeleted(
    db: KidEduDatabase,
    itemId: string,
    role: MediaRole
  ): Promise<void> {
    await db.runAsync(
      `UPDATE media_assets
       SET status = 'deleted', updated_at = ?
       WHERE id IN (
         SELECT thumb.id
         FROM learning_item_media lim
         JOIN media_assets ma ON ma.id = lim.media_asset_id
         JOIN media_assets thumb ON thumb.id = ma.thumbnail_asset_id
         WHERE lim.learning_item_id = ?
           AND lim.role = ?
           AND lim.is_active = 1
           AND ma.source = 'custom'
       )`,
      [new Date().toISOString(), itemId, role]
    );

    await db.runAsync(
      `UPDATE media_assets
       SET status = 'deleted', updated_at = ?
       WHERE id IN (
         SELECT ma.id
         FROM learning_item_media lim
         JOIN media_assets ma ON ma.id = lim.media_asset_id
         WHERE lim.learning_item_id = ?
           AND lim.role = ?
           AND lim.is_active = 1
           AND ma.source = 'custom'
       )`,
      [new Date().toISOString(), itemId, role]
    );

    await db.runAsync(
      `UPDATE learning_item_media
       SET is_active = 0
       WHERE id IN (
         SELECT lim.id
         FROM learning_item_media lim
         JOIN media_assets ma ON ma.id = lim.media_asset_id
         WHERE lim.learning_item_id = ?
           AND lim.role = ?
           AND lim.is_active = 1
           AND ma.source = 'custom'
       )`,
      [itemId, role]
    );
  }

  private async markMediaAssetsStatus(
    assetIds: string[],
    status: MediaStatus,
    options?: { onlyActive?: boolean }
  ): Promise<void> {
    const uniqueAssetIds = [...new Set(assetIds)];
    if (uniqueAssetIds.length === 0) {
      return;
    }

    const now = new Date().toISOString();

    await this.runWrite(async (db) => {
      for (const chunk of chunkArray(uniqueAssetIds, 250)) {
        const placeholders = chunk.map(() => "?").join(", ");
        await db.runAsync(
          `UPDATE media_assets
           SET status = ?, updated_at = ?
           WHERE id IN (${placeholders})
           ${options?.onlyActive ? "AND status = 'active'" : ""}`,
          [status, now, ...chunk]
        );
      }
    });
  }

  private async runWrite<T>(task: (db: KidEduDatabase) => Promise<T>): Promise<T> {
    return this.enqueueWrite(() => task(this.db));
  }

  private async runInTransaction<T>(task: (db: KidEduDatabase) => Promise<T>): Promise<T> {
    return this.enqueueWrite(async () => {
      const isWebRuntime = "document" in globalThis;

      if (!isWebRuntime && typeof this.db.withExclusiveTransactionAsync === "function") {
        let result!: T;
        await this.db.withExclusiveTransactionAsync(async (transaction) => {
          result = await task(transaction);
        });
        return result;
      }

      let result!: T;
      await this.db.withTransactionAsync(async () => {
        result = await task(this.db);
      });
      return result;
    });
  }

  private async enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
    const queued = this.writeQueue.then(task, task);
    this.writeQueue = queued.catch(() => undefined);
    return queued;
  }
}

function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    isDefault: row.is_default === 1
  };
}

function mapDeckRow(row: DeckRow): Deck {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    itemCount: row.item_count
  };
}

function mapLearningItemMediaRow(row: LearningItemMediaRow): LearningItemMedia {
  const asset: MediaAsset = {
    id: row.asset_id,
    type: row.type,
    source: row.source,
    uri: row.uri,
    thumbnailAssetId: row.thumbnail_asset_id,
    thumbnailUri: row.thumbnail_uri,
    durationMs: row.duration_ms,
    sizeBytes: row.size_bytes,
    mimeType: row.mime_type,
    status: row.asset_status
  };

  return {
    id: row.id,
    learningItemId: row.learning_item_id,
    mediaAssetId: row.media_asset_id,
    role: row.role,
    priority: row.priority,
    isActive: row.is_active === 1,
    asset
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
