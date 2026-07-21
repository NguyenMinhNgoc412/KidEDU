import * as SQLite from "expo-sqlite";

import { defaultLearningSettings } from "./learningSettings";
import { migrateKidEduDatabase } from "./migrations";
import { seedKidEduDatabaseInTransaction, type SeedKidEduDatabaseOptions } from "./seedDatabase";
import { isLoopMode, isSpeedPreset } from "./seedData";

export type KidEduDatabase = SQLite.SQLiteDatabase;
export { seedKidEduDatabaseInTransaction } from "./seedDatabase";
export type { SeedKidEduDatabaseOptions } from "./seedDatabase";

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
  await seedKidEduDatabase(db);
  return db;
}

async function configureKidEduDatabase(db: KidEduDatabase): Promise<void> {
  const isWebRuntime = "document" in globalThis;
  const statements = ["PRAGMA busy_timeout = 5000;", "PRAGMA foreign_keys = ON;"];

  if (!isWebRuntime) {
    statements.unshift("PRAGMA journal_mode = WAL;");
  }

  await db.execAsync(statements.join("\n"));
}

export async function seedKidEduDatabase(
  db: KidEduDatabase,
  options: SeedKidEduDatabaseOptions = {}
): Promise<void> {
  await runDatabaseTransaction(db, (transaction) =>
    seedKidEduDatabaseInTransaction(transaction, options)
  );
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

export function normalizeSpeedPreset(value: string | null) {
  return isSpeedPreset(value) ? value : defaultLearningSettings.speedPreset;
}

export function normalizeLoopMode(value: string | null) {
  return isLoopMode(value) ? value : defaultLearningSettings.loopMode;
}
