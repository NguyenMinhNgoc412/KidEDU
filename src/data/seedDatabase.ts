import {
  bundledDefaultMedia,
  createBundledDefaultMediaUri,
  validateBundledDefaultMediaDefinitions
} from "./defaultMediaRegistry";
import {
  defaultLearningSettings,
  loopCountsByMode,
  normalizeLoopMode,
  normalizeSpeedPreset,
  playbackSpeedsByPreset
} from "./learningSettings";
import type { MigrationDatabase } from "./migrations";
import {
  defaultChildId,
  learningSettingKeys,
  seedCategories,
  seedDecks,
  seedLearningItems
} from "./seedData";

type SeedDatabase = Pick<MigrationDatabase, "getFirstAsync" | "runAsync">;

interface SettingValueRow {
  value: string;
}

export interface SeedKidEduDatabaseOptions {
  preserveExistingSettings?: boolean;
}

export async function seedKidEduDatabaseInTransaction(
  db: SeedDatabase,
  options: SeedKidEduDatabaseOptions = {}
): Promise<void> {
  const now = new Date().toISOString();
  const preserveExistingSettings = options.preserveExistingSettings ?? true;
  const existingSpeedPreset = preserveExistingSettings
    ? normalizeSpeedPreset(await getSettingValue(db, learningSettingKeys.speedPreset))
    : defaultLearningSettings.speedPreset;
  const existingLoopMode = preserveExistingSettings
    ? normalizeLoopMode(await getSettingValue(db, learningSettingKeys.loopMode))
    : defaultLearningSettings.loopMode;
  assertValidBundledDefaultMedia();

  await db.runAsync(
    "INSERT OR IGNORE INTO children (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
    [defaultChildId, "Con", now, now]
  );

  for (const category of seedCategories) {
    await db.runAsync(
      "INSERT OR IGNORE INTO categories (id, name, sort_order, is_default) VALUES (?, ?, ?, ?)",
      [category.id, category.name, category.sortOrder, category.isDefault ? 1 : 0]
    );
  }

  // Older builds inserted seed:// placeholders as if they were playable assets. Reset all
  // bundled defaults first, then reactivate only files that are present in the static registry.
  await db.runAsync(
    "UPDATE media_assets SET status = 'missing', updated_at = ? WHERE source = 'default'",
    [now]
  );
  await db.runAsync(
    `UPDATE learning_item_media
     SET is_active = 0
     WHERE media_asset_id IN (SELECT id FROM media_assets WHERE source = 'default')`,
    []
  );

  for (const item of seedLearningItems) {
    await db.runAsync(
      `INSERT OR IGNORE INTO learning_items
        (id, title, category_id, status, learning_status, note, created_at, updated_at)
       VALUES (?, ?, ?, 'active', 'new', NULL, ?, ?)`,
      [item.id, item.title, item.categoryId, now, now]
    );

    for (const definition of bundledDefaultMedia.filter((media) => media.itemId === item.id)) {
      const assetId = `media-${item.id}-${definition.role}-default`;
      const mappingId = `map-${item.id}-${definition.role}-default`;
      const thumbnailAssetId = definition.thumbnail
        ? `media-${item.id}-${definition.role}-thumbnail-default`
        : null;

      if (definition.thumbnail && thumbnailAssetId) {
        await db.runAsync(
          `INSERT INTO media_assets
            (id, type, source, uri, thumbnail_asset_id, duration_ms, size_bytes, mime_type, status, created_at, updated_at)
           VALUES (?, 'thumbnail', 'default', ?, NULL, NULL, NULL, ?, 'active', ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             type = excluded.type,
             source = excluded.source,
             uri = excluded.uri,
             thumbnail_asset_id = NULL,
             duration_ms = NULL,
             size_bytes = NULL,
             mime_type = excluded.mime_type,
             status = 'active',
             updated_at = excluded.updated_at`,
          [
            thumbnailAssetId,
            createBundledDefaultMediaUri(definition.thumbnail.key),
            definition.thumbnail.mimeType,
            now,
            now
          ]
        );
      }

      await db.runAsync(
        `INSERT INTO media_assets
          (id, type, source, uri, thumbnail_asset_id, duration_ms, size_bytes, mime_type, status, created_at, updated_at)
         VALUES (?, ?, 'default', ?, ?, ?, ?, ?, 'active', ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           type = excluded.type,
           source = excluded.source,
           uri = excluded.uri,
           thumbnail_asset_id = excluded.thumbnail_asset_id,
           duration_ms = excluded.duration_ms,
           size_bytes = excluded.size_bytes,
           mime_type = excluded.mime_type,
           status = 'active',
           updated_at = excluded.updated_at`,
        [
          assetId,
          definition.type,
          createBundledDefaultMediaUri(definition.asset.key),
          thumbnailAssetId,
          definition.durationMs ?? null,
          definition.sizeBytes ?? null,
          definition.asset.mimeType,
          now,
          now
        ]
      );

      await db.runAsync(
        `INSERT INTO learning_item_media
          (id, learning_item_id, media_asset_id, role, priority, is_active, created_at)
         VALUES (?, ?, ?, ?, 10, 1, ?)
         ON CONFLICT(id) DO UPDATE SET
           learning_item_id = excluded.learning_item_id,
           media_asset_id = excluded.media_asset_id,
           role = excluded.role,
           priority = excluded.priority,
           is_active = 1`,
        [mappingId, item.id, assetId, definition.role, now]
      );
    }
  }

  for (const deck of seedDecks) {
    await db.runAsync(
      "INSERT OR IGNORE INTO decks (id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)",
      [deck.id, deck.title, deck.description, now, now]
    );

    for (const [index, itemId] of deck.itemIds.entries()) {
      await db.runAsync(
        "INSERT OR IGNORE INTO deck_items (id, deck_id, learning_item_id, sort_order) VALUES (?, ?, ?, ?)",
        [`deck-item-${deck.id}-${itemId}`, deck.id, itemId, index + 1]
      );
    }
  }

  await seedSetting(db, learningSettingKeys.speedPreset, defaultLearningSettings.speedPreset, now);
  await seedSetting(
    db,
    learningSettingKeys.playbackSpeed,
    String(playbackSpeedsByPreset[existingSpeedPreset]),
    now
  );
  await seedSetting(db, learningSettingKeys.loopMode, defaultLearningSettings.loopMode, now);
  await seedSetting(
    db,
    learningSettingKeys.loopCount,
    String(loopCountsByMode[existingLoopMode]),
    now
  );
  await seedSetting(
    db,
    learningSettingKeys.reinforcementEnabled,
    defaultLearningSettings.reinforcementEnabled ? "true" : "false",
    now
  );
  await seedSetting(
    db,
    learningSettingKeys.sfxEnabled,
    defaultLearningSettings.sfxEnabled ? "true" : "false",
    now
  );
}

function assertValidBundledDefaultMedia(): void {
  const errors = validateBundledDefaultMediaDefinitions(bundledDefaultMedia);
  const seedItemIds = new Set(seedLearningItems.map((item) => item.id));

  for (const definition of bundledDefaultMedia) {
    if (!seedItemIds.has(definition.itemId)) {
      errors.push(`Default media references unknown seed item: ${definition.itemId}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid bundled default media registry:\n${errors.join("\n")}`);
  }
}

async function getSettingValue(db: SeedDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<SettingValueRow>(
    "SELECT value FROM settings WHERE key = ? ORDER BY updated_at DESC",
    [key]
  );
  return row?.value ?? null;
}

async function seedSetting(
  db: SeedDatabase,
  key: string,
  value: string,
  updatedAt: string
): Promise<void> {
  await db.runAsync("INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)", [
    key,
    value,
    updatedAt
  ]);
}
