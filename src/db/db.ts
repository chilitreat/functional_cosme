import { BunSQLiteDatabase, drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { DrizzleError } from 'drizzle-orm';

const databaseFilePath = './database.sqlite';

// いずれはDatabaseConnection(Live)に切り替える
const sqlite = new Database(databaseFilePath);

export type DatabaseConnection = BunSQLiteDatabase<Record<string, never>> & {
  $client: Database;
};
export type DatabaseConnectionError = DrizzleError;

export const databaseConnection: DatabaseConnection = drizzle(sqlite);
