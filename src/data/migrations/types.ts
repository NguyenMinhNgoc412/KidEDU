export type MigrationBindValue = string | number | null | boolean | Uint8Array;
export type MigrationBindParams = Record<string, MigrationBindValue> | MigrationBindValue[];

export interface MigrationDatabase {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string, params: MigrationBindParams): Promise<T | null>;
  runAsync(sql: string, params: MigrationBindParams): Promise<unknown>;
  withTransactionAsync?(callback: () => Promise<void>): Promise<void>;
  withExclusiveTransactionAsync?(callback: (transaction: MigrationDatabase) => Promise<void>): Promise<void>;
}

export interface SchemaMigration {
  version: number;
  name: string;
  migrate(db: MigrationDatabase): Promise<void>;
}
