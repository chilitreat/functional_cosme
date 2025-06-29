import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { DrizzleError } from 'drizzle-orm';

export type DatabaseConnection = BetterSQLite3Database<
  Record<string, never>
> & {
  $client: Database.Database;
};
export type DatabaseConnectionError = DrizzleError;

// テスト環境では :memory: を使用
const databaseFilePath =
  process.env.NODE_ENV === 'test' ? ':memory:' : './database.sqlite';

// いずれはDatabaseConnection(Live)に切り替える
const sqlite = new Database(databaseFilePath);

// テスト環境では手動でスキーマを作成
if (process.env.NODE_ENV === 'test') {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );

    CREATE TABLE IF NOT EXISTS products (
      product_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      category TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      review_id TEXT PRIMARY KEY NOT NULL,
      product_id INTEGER NOT NULL REFERENCES products(product_id),
      user_id INTEGER NOT NULL REFERENCES users(user_id),
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
  `);
}

export const databaseConnection: DatabaseConnection = drizzle(sqlite);
