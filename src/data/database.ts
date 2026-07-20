import * as SQLite from "expo-sqlite";

import {
  defaultLearningSettings,
  loopCountsByMode,
  normalizeLoopMode as normalizeStoredLoopMode,
  normalizeSpeedPreset as normalizeStoredSpeedPreset,
  playbackSpeedsByPreset
} from "./learningSettings";
import { migrateKidEduDatabase } from "./migrations";
import {
  defaultChildId,
  isLoopMode,
  isSpeedPreset,
  learningSettingKeys,
  mediaTypeForRole,
  seedCategories,
  seedDecks,
  seedLearningItems
} from "./seedData";

export type KidEduDatabase = SQLite.SQLiteDatabase;

interface SettingValueRow {
  value: string;
}

let openDatabasePromise: Promise<KidEduDatabase> | null = null;

export function openKidEduDatabase(): Promise<KidEduDatabase> {
  openDatabasePromise ??= initializeKidEduDatabase().catch((error: unknown) => {
    openDatabasePromise = null;
    throw error;
  });

  return openDatabasePromise;
}

async function initializeKidEduDatabase(): Promise<KidEduDatabase> {
  const db = await SQLite.openDatabaseAsync("kidedu.db");
  await configureKidEduDatabase(db);
  await migrateKidEduDatabase(db);
  await seedDatabase(db);
  return db;
}

async function configureKidEduDatabase(db: KidEduDatabase): Promise<void> {
  const isWebRuntime = "document" in globalThis;
  const statements = [
    "PRAGMA busy_timeout = 5000;",
    "PRAGMA foreign_keys = ON;"
  ];

  if (!isWebRuntime) {
    statements.unshift("PRAGMA journal_mode = WAL;");
  }

  await db.execAsync(statements.join("\n"));
}

async function seedDatabase(db: KidEduDatabase): Promise<void> {
  const now = new Date().toISOString();
  const existingSpeedPreset = normalizeStoredSpeedPreset(await getSettingValue(db, learningSettingKeys.speedPreset));
  const existingLoopMode = normalizeStoredLoopMode(await getSettingValue(db, learningSettingKeys.loopMode));

  await runDatabaseTransaction(db, async (transaction) => {
    await transaction.runAsync(
      "INSERT OR IGNORE INTO children (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [defaultChildId, "Con", now, now]
    );

    for (const category of seedCategories) {
      await transaction.runAsync(
        "INSERT OR IGNORE INTO categories (id, name, sort_order, is_default) VALUES (?, ?, ?, ?)",
        [category.id, category.name, category.sortOrder, category.isDefault ? 1 : 0]
      );
    }

    for (const item of seedLearningItems) {
      await transaction.runAsync(
        `INSERT OR IGNORE INTO learning_items
          (id, title, category_id, status, learning_status, note, created_at, updated_at)
         VALUES (?, ?, ?, 'active', 'new', NULL, ?, ?)`,
        [item.id, item.title, item.categoryId, now, now]
      );

      for (const role of item.mediaRoles) {
        const assetId = `media-${item.id}-${role}-default`;
        const mappingId = `map-${item.id}-${role}-default`;

        await transaction.runAsync(
          `INSERT OR IGNORE INTO media_assets
            (id, type, source, uri, thumbnail_asset_id, duration_ms, size_bytes, mime_type, status, created_at, updated_at)
           VALUES (?, ?, 'default', ?, NULL, NULL, NULL, NULL, 'active', ?, ?)`,
          [assetId, mediaTypeForRole(role), `seed://${item.id}/${role}`, now, now]
        );

        await transaction.runAsync(
          `INSERT OR IGNORE INTO learning_item_media
            (id, learning_item_id, media_asset_id, role, priority, is_active, created_at)
           VALUES (?, ?, ?, ?, 10, 1, ?)`,
          [mappingId, item.id, assetId, role, now]
        );
      }
    }

    for (const deck of seedDecks) {
      await transaction.runAsync(
        "INSERT OR IGNORE INTO decks (id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)",
        [deck.id, deck.title, deck.description, now, now]
      );

      for (const [index, itemId] of deck.itemIds.entries()) {
        await transaction.runAsync(
          "INSERT OR IGNORE INTO deck_items (id, deck_id, learning_item_id, sort_order) VALUES (?, ?, ?, ?)",
          [`deck-item-${deck.id}-${itemId}`, deck.id, itemId, index + 1]
        );
      }
    }

    await seedSetting(transaction, learningSettingKeys.speedPreset, defaultLearningSettings.speedPreset, now);
    await seedSetting(transaction, learningSettingKeys.playbackSpeed, String(playbackSpeedsByPreset[existingSpeedPreset]), now);
    await seedSetting(transaction, learningSettingKeys.loopMode, defaultLearningSettings.loopMode, now);
    await seedSetting(transaction, learningSettingKeys.loopCount, String(loopCountsByMode[existingLoopMode]), now);
    await seedSetting(
      transaction,
      learningSettingKeys.reinforcementEnabled,
      defaultLearningSettings.reinforcementEnabled ? "true" : "false",
      now
    );
    await seedSetting(transaction, learningSettingKeys.sfxEnabled, defaultLearningSettings.sfxEnabled ? "true" : "false", now);
  });
}

async function runDatabaseTransaction(
  db: KidEduDatabase,
  task: (transaction: KidEduDatabase) => Promise<void>
): Promise<void> {
  const isWebRuntime = "document" in globalThis;

  if (!isWebRuntime && typeof db.withExclusiveTransactionAsync === "function") {
    await db.withExclusiveTransactionAsync((transaction) => task(transaction));
    return;
  }

  await db.withTransactionAsync(() => task(db));
}

async function getSettingValue(db: KidEduDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<SettingValueRow>("SELECT value FROM settings WHERE key = ? ORDER BY updated_at DESC", [
    key
  ]);
  return row?.value ?? null;
}

async function seedSetting(db: KidEduDatabase, key: string, value: string, updatedAt: string): Promise<void> {
  await db.runAsync("INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)", [
    key,
    value,
    updatedAt
  ]);
}

export function normalizeSpeedPreset(value: string | null) {
  return isSpeedPreset(value) ? value : defaultLearningSettings.speedPreset;
}

export function normalizeLoopMode(value: string | null) {
  return isLoopMode(value) ? value : defaultLearningSettings.loopMode;
}
