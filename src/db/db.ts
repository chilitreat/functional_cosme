import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { DrizzleError } from 'drizzle-orm';

const databaseFilePath = './database.sqlite';

// いずれはDatabaseConnection(Live)に切り替える
const sqlite = new Database(databaseFilePath);

export type DatabaseConnection = BetterSQLite3Database<Record<string, never>> & {
  $client: Database.Database;
};
export type DatabaseConnectionError = DrizzleError;

export const databaseConnection: DatabaseConnection = drizzle(sqlite);
