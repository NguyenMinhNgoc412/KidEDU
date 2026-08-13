import type { SchemaMigration } from "./types";

export const addPuzzleTemplateKeyMigration: SchemaMigration = {
  version: 2,
  name: "add_puzzle_template_key",
  migrate: (db) => db.execAsync("ALTER TABLE learning_item_media ADD COLUMN puzzle_template_key TEXT")
};
