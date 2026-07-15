import { createSchemaSql } from "../schema";

import type { SchemaMigration } from "./types";

export const initialLocalFirstSchemaMigration: SchemaMigration = {
  version: 1,
  name: "initial_local_first_schema",
  migrate: (db) => db.execAsync(createSchemaSql)
};
