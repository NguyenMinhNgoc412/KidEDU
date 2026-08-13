import { schemaVersion } from "../schema";

import { initialLocalFirstSchemaMigration } from "./001-initial-local-first-schema";
import { addPuzzleTemplateKeyMigration } from "./002-add-puzzle-template-key";
import type { MigrationDatabase, SchemaMigration } from "./types";

export type { MigrationBindParams, MigrationBindValue, MigrationDatabase, SchemaMigration } from "./types";

interface SchemaVersionRow {
  version: number;
}

const createSchemaVersionTableSql = `
CREATE TABLE IF NOT EXISTS schema_versions (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL
);
`;

export const schemaMigrations: SchemaMigration[] = [
  initialLocalFirstSchemaMigration,
  addPuzzleTemplateKeyMigration
];

export async function migrateKidEduDatabase(
  db: MigrationDatabase,
  targetVersion = schemaVersion
): Promise<void> {
  await db.execAsync(createSchemaVersionTableSql);

  const currentVersion = await getCurrentSchemaVersion(db);
  if (currentVersion > targetVersion) {
    throw new Error(
      `KidEDU local database version ${currentVersion} is newer than app schema version ${targetVersion}.`
    );
  }

  if (currentVersion === targetVersion) {
    return;
  }

  const pendingMigrations = schemaMigrations
    .filter((migration) => migration.version > currentVersion && migration.version <= targetVersion)
    .sort((left, right) => left.version - right.version);

  ensureCompleteMigrationPath(currentVersion, targetVersion, pendingMigrations);

  for (const migration of pendingMigrations) {
    await runMigrationTransaction(db, async (transaction) => {
      await migration.migrate(transaction);
      await setSchemaVersion(transaction, migration.version);
    });
  }
}

async function getCurrentSchemaVersion(db: MigrationDatabase): Promise<number> {
  const row = await db.getFirstAsync<SchemaVersionRow>("SELECT version FROM schema_versions WHERE id = 1", []);
  return row?.version ?? 0;
}

function ensureCompleteMigrationPath(
  currentVersion: number,
  targetVersion: number,
  migrations: SchemaMigration[]
): void {
  let expectedVersion = currentVersion + 1;

  for (const migration of migrations) {
    if (migration.version !== expectedVersion) {
      throw new Error(
        `Missing KidEDU local database migration v${expectedVersion} before ${migration.name}.`
      );
    }

    expectedVersion += 1;
  }

  if (expectedVersion !== targetVersion + 1) {
    throw new Error(`Missing KidEDU local database migration v${expectedVersion}.`);
  }
}

async function setSchemaVersion(db: MigrationDatabase, version: number): Promise<void> {
  await db.runAsync(
    "INSERT INTO schema_versions (id, version) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET version = excluded.version",
    [version]
  );
}

async function runMigrationTransaction(
  db: MigrationDatabase,
  task: (transaction: MigrationDatabase) => Promise<void>
): Promise<void> {
  const isWebRuntime = "document" in globalThis;

  if (!isWebRuntime && db.withExclusiveTransactionAsync) {
    await db.withExclusiveTransactionAsync(task);
    return;
  }

  if (db.withTransactionAsync) {
    await db.withTransactionAsync(() => task(db));
    return;
  }

  await task(db);
}
