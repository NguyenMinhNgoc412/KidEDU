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
  MediaRole,
  MediaSource,
  MediaStatus,
  MediaType,
  PracticeEventType,
  PracticeMode,
  PracticeSessionStatus,
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

export class SQLiteKidEduRepository implements KidEduRepository {
  private transactionQueue: Promise<void> = Promise.resolve();

  constructor(private readonly db: KidEduDatabase) {}

  async listCategories(): Promise<Category[]> {
    const rows = await this.db.getAllAsync<CategoryRow>(
      "SELECT id, name, sort_order, is_default FROM categories ORDER BY sort_order ASC"
    );
    return rows.map(mapCategoryRow);
  }

  async listLearningItems(options?: { includeArchived?: boolean; childOnly?: boolean }): Promise<LearningItem[]> {
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

    return Promise.all(rows.map((row) => this.mapLearningItemRow(row)));
  }

  async getLearningItem(itemId: string): Promise<LearningItem | null> {
    const row = await this.db.getFirstAsync<LearningItemRow>(
      `SELECT li.id, li.title, li.category_id, c.name AS category_name, li.status, li.learning_status, li.note
       FROM learning_items li
       JOIN categories c ON c.id = li.category_id
       WHERE li.id = ?`,
      [itemId]
    );

    return row ? this.mapLearningItemRow(row) : null;
  }

  async createLearningItem(input: CreateLearningItemInput): Promise<string> {
    const now = new Date().toISOString();
    const itemId = makeId("item");

    await this.db.runAsync(
      `INSERT INTO learning_items
        (id, title, category_id, status, learning_status, note, created_at, updated_at)
       VALUES (?, ?, ?, 'active', 'new', ?, ?, ?)`,
      [itemId, input.title.trim(), input.categoryId, input.note?.trim() || null, now, now]
    );

    return itemId;
  }

  async updateLearningItem(itemId: string, input: UpdateLearningItemInput): Promise<void> {
    await this.db.runAsync(
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
    );
  }

  async archiveLearningItem(itemId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.runInTransaction(async (db) => {
      await db.runAsync("UPDATE learning_items SET status = 'archived', updated_at = ? WHERE id = ?", [
        now,
        itemId
      ]);
      await db.runAsync("DELETE FROM deck_items WHERE learning_item_id = ?", [itemId]);
    });
  }

  async upsertCustomMediaForItem(input: UpsertCustomMediaInput): Promise<string[]> {
    const now = new Date().toISOString();
    const mediaAssetId = makeId("media");
    const mappingId = makeId("item-media");
    const thumbnailAssetId = input.thumbnailUri && input.thumbnailUri !== input.uri ? makeId("media-thumb") : null;
    const oldUris = await this.getActiveCustomMediaUris(input.learningItemId, input.role);

    await this.runInTransaction(async (db) => {
      await this.markActiveCustomMediaDeleted(db, input.learningItemId, input.role);

      if (thumbnailAssetId && input.thumbnailUri) {
        await db.runAsync(
          `INSERT INTO media_assets
            (id, type, source, uri, thumbnail_asset_id, duration_ms, size_bytes, mime_type, status, created_at, updated_at)
           VALUES (?, 'thumbnail', 'custom', ?, NULL, NULL, NULL, ?, 'active', ?, ?)`,
          [thumbnailAssetId, input.thumbnailUri, input.mimeType ?? null, now, now]
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

      await db.runAsync("UPDATE learning_items SET updated_at = ? WHERE id = ?", [now, input.learningItemId]);
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

    const items = await Promise.all(itemRows.map((row) => this.mapLearningItemRow(row)));
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
        [input.title.trim(), input.description?.trim() || null, input.status, new Date().toISOString(), deckId]
      );
      await this.replaceDeckItems(db, deckId, input.itemIds);
    });
  }

  async archiveDeck(deckId: string): Promise<void> {
    await this.db.runAsync("UPDATE decks SET status = 'archived', updated_at = ? WHERE id = ?", [
      new Date().toISOString(),
      deckId
    ]);
  }

  async getLearningSettings(): Promise<LearningSettings> {
    const rows = await this.db.getAllAsync<SettingRow>("SELECT key, value FROM settings ORDER BY updated_at ASC");
    const values = new Map(rows.map((row) => [row.key, row.value]));
    const legacySpeedPreset = normalizeSpeedPreset(values.get(learningSettingKeys.speedPreset));
    const savedPlaybackSpeed = normalizePlaybackSpeed(values.get(learningSettingKeys.playbackSpeed), legacySpeedPreset);
    const playbackSpeed =
      savedPlaybackSpeed === playbackSpeedsByPreset.normal && legacySpeedPreset !== "normal"
        ? playbackSpeedsByPreset[legacySpeedPreset]
        : savedPlaybackSpeed;
    const speedPreset = values.has(learningSettingKeys.playbackSpeed)
      ? getSpeedPresetForPlaybackSpeed(playbackSpeed)
      : legacySpeedPreset;
    const legacyLoopMode = normalizeLoopMode(values.get(learningSettingKeys.loopMode));
    const savedLoopCount = normalizeLoopCount(values.get(learningSettingKeys.loopCount), legacyLoopMode);
    const loopCount =
      savedLoopCount === loopCountsByMode.once && legacyLoopMode !== "once" ? loopCountsByMode[legacyLoopMode] : savedLoopCount;
    const loopMode = values.has(learningSettingKeys.loopCount) ? getLoopModeForCount(loopCount) : legacyLoopMode;

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
      [learningSettingKeys.reinforcementEnabled, nextSettings.reinforcementEnabled ? "true" : "false"],
      [learningSettingKeys.sfxEnabled, nextSettings.sfxEnabled ? "true" : "false"]
    ] as const;

    await this.runInTransaction(async (db) => {
      for (const [key, value] of entries) {
        await db.runAsync(
          "UPDATE settings SET value = ?, updated_at = ? WHERE key = ?",
          [value, now, key]
        );
        await db.runAsync(
          "INSERT INTO settings (key, value, updated_at) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = ?)",
          [key, value, now, key]
        );
      }
    });
  }

  async startPracticeSession(input: { mode: PracticeMode; deckId?: string | null }): Promise<string> {
    const sessionId = makeId("session");
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO practice_sessions
        (id, child_id, mode, deck_id, started_at, ended_at, status)
       VALUES (?, ?, ?, ?, ?, NULL, 'active')`,
      [sessionId, defaultChildId, input.mode, input.deckId ?? null, now]
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

  async finishPracticeSession(input: { sessionId: string; status: PracticeSessionStatus }): Promise<void> {
    await this.db.runAsync("UPDATE practice_sessions SET status = ?, ended_at = ? WHERE id = ?", [
      input.status,
      new Date().toISOString(),
      input.sessionId
    ]);
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
        [`progress-${defaultChildId}-${input.learningItemId}`, defaultChildId, input.learningItemId, input.parentMark]
      );

      await db.runAsync("UPDATE learning_items SET learning_status = ?, updated_at = ? WHERE id = ?", [
        input.parentMark,
        now,
        input.learningItemId
      ]);
    });
  }

  private async replaceDeckItems(db: KidEduDatabase, deckId: string, itemIds: string[]): Promise<void> {
    await db.runAsync("DELETE FROM deck_items WHERE deck_id = ?", [deckId]);
    for (const [index, itemId] of itemIds.entries()) {
      await db.runAsync(
        "INSERT INTO deck_items (id, deck_id, learning_item_id, sort_order) VALUES (?, ?, ?, ?)",
        [`deck-item-${deckId}-${itemId}-${index + 1}`, deckId, itemId, index + 1]
      );
    }
  }

  private async mapLearningItemRow(row: LearningItemRow): Promise<LearningItem> {
    return {
      id: row.id,
      title: row.title,
      categoryId: row.category_id,
      categoryName: row.category_name,
      status: row.status,
      learningStatus: row.learning_status,
      note: row.note,
      media: await this.getMediaForItem(row.id)
    };
  }

  private async getMediaForItem(itemId: string): Promise<LearningItemMedia[]> {
    const rows = await this.db.getAllAsync<LearningItemMediaRow>(
      `SELECT lim.id, lim.learning_item_id, lim.media_asset_id, lim.role, lim.priority, lim.is_active,
              ma.id AS asset_id, ma.type, ma.source, ma.uri, ma.thumbnail_asset_id, ma.duration_ms,
              ma.size_bytes, ma.mime_type, ma.status AS asset_status
       FROM learning_item_media lim
       JOIN media_assets ma ON ma.id = lim.media_asset_id
       WHERE lim.learning_item_id = ? AND lim.is_active = 1
       ORDER BY lim.role ASC, lim.priority DESC`,
      [itemId]
    );

    return rows.map(mapLearningItemMediaRow);
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

    return rows.flatMap((row) => [row.uri, row.thumbnail_uri].filter((uri): uri is string => Boolean(uri)));
  }

  private async markActiveCustomMediaDeleted(db: KidEduDatabase, itemId: string, role: MediaRole): Promise<void> {
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

  private async runInTransaction(task: (db: KidEduDatabase) => Promise<void>): Promise<void> {
    const run = async () => {
      const isWebRuntime = "document" in globalThis;

      if (!isWebRuntime && typeof this.db.withExclusiveTransactionAsync === "function") {
        await this.db.withExclusiveTransactionAsync((transaction) => task(transaction));
        return;
      }

      await this.db.withTransactionAsync(() => task(this.db));
    };
    const queued = this.transactionQueue.then(run, run);
    this.transactionQueue = queued.catch(() => undefined);
    await queued;
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

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
