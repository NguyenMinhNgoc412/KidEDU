import * as SQLite from "expo-sqlite";

import { defaultLearningSettings } from "./learningSettings";
import { migrateKidEduDatabase } from "./migrations";
import { seedKidEduDatabaseInTransaction, type SeedKidEduDatabaseOptions } from "./seedDatabase";
import { isLoopMode, isSpeedPreset } from "./seedData";

export type KidEduDatabase = SQLite.SQLiteDatabase;
export { seedKidEduDatabaseInTransaction } from "./seedDatabase";
export type { SeedKidEduDatabaseOptions } from "./seedDatabase";

const accountDatabases = new Map<string, Promise<KidEduDatabase>>();
const closingDatabases = new Map<string, Promise<void>>();

export function openKidEduDatabase(accountId: string): Promise<KidEduDatabase> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId)) {
    throw new Error("Invalid account namespace");
  }
  const existing = accountDatabases.get(accountId);
  if (existing) return existing;
  const pending = (async () => {
    await closingDatabases.get(accountId);
    return initializeKidEduDatabase(accountId);
  })().catch((error: unknown) => {
    if (accountDatabases.get(accountId) === pending) accountDatabases.delete(accountId);
    throw error;
  });
  accountDatabases.set(accountId, pending);
  return pending;
}

export async function closeKidEduDatabase(accountId: string): Promise<void> {
  const pending = accountDatabases.get(accountId);
  if (!pending) return closingDatabases.get(accountId);
  accountDatabases.delete(accountId);
  const closing = (async () => {
    try {
      const db = await pending;
      await db.closeAsync();
    } catch {
      // Opening may already have failed; the namespace is still released.
    }
  })();
  closingDatabases.set(accountId, closing);
  try {
    await closing;
  } finally {
    if (closingDatabases.get(accountId) === closing) closingDatabases.delete(accountId);
  }
}

async function initializeKidEduDatabase(accountId: string): Promise<KidEduDatabase> {
  // Keep the pre-account legacy database quarantined; it has no trustworthy owner.
  const db = await SQLite.openDatabaseAsync(`kidedu-${accountId.toLowerCase()}.db`);
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
