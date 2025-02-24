import { BunSQLiteDatabase, drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { Context, Effect, Layer } from 'effect';

const databaseFilePath = './database/database.sqlite';

// いずれはDatabaseConnection(Live)に切り替える
const sqlite = new Database(databaseFilePath);
export const db = drizzle(sqlite);

export class DatabaseConnection extends Context.Tag('DatabaseConnection')<
  DatabaseConnection,
  {
    db: BunSQLiteDatabase<Record<string, never>> & {
      $client: Database;
    };
  }
>() {}

export const DatabaseConnectionLive = Layer.succeed(DatabaseConnection, { db });
