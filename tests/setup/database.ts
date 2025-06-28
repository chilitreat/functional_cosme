/**
 * テスト用データベース設定
 * インメモリSQLiteを使用してテスト環境を構築
 */

import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-kit/api';
import * as schema from '../../src/db/schema';
import { sql } from 'drizzle-orm';
import { hashPassword } from '../helpers/auth';

export type TestDatabaseConnection = BetterSQLite3Database<Record<string, never>> & {
  $client: Database.Database;
};

/**
 * テスト用インメモリデータベースを作成し、マイグレーションを実行
 */
export const setupTestDatabase = async (): Promise<TestDatabaseConnection> => {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite) as TestDatabaseConnection;

  // スキーマを手動で作成（マイグレーションファイルの代わり）
  sqlite.exec(`
    CREATE TABLE users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );

    CREATE TABLE products (
      product_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      category TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );

    CREATE TABLE reviews (
      review_id TEXT PRIMARY KEY NOT NULL,
      product_id INTEGER NOT NULL REFERENCES products(product_id),
      user_id INTEGER NOT NULL REFERENCES users(user_id),
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
  `);

  return db;
};

/**
 * テスト用シードデータを投入
 */
export const seedTestData = async (db: TestDatabaseConnection) => {
  // パスワードをハッシュ化
  const passwordHash = await hashPassword('password');

  // テストユーザー作成
  await db.insert(schema.users).values([
    {
      userId: 1,
      name: 'Test User 1',
      email: 'test1@example.com',
      passwordHash,
    },
    {
      userId: 2,
      name: 'Test User 2',
      email: 'test2@example.com',
      passwordHash,
    },
  ]);

  // テスト商品作成
  await db.insert(schema.products).values([
    {
      productId: 1,
      name: 'Test Product 1',
      manufacturer: 'Test Manufacturer 1',
      category: 'skin_care',
      ingredients: 'Test Ingredient 1, Test Ingredient 2',
    },
    {
      productId: 2,
      name: 'Test Product 2',
      manufacturer: 'Test Manufacturer 2',
      category: 'makeup',
      ingredients: 'Test Ingredient 3, Test Ingredient 4',
    },
  ]);

  // テストレビュー作成
  await db.insert(schema.reviews).values([
    {
      reviewId: 'test-review-1',
      productId: 1,
      userId: 1,
      rating: 5,
      comment: 'Great product for testing!',
    },
  ]);
};

/**
 * テストデータベースのクリーンアップ
 */
export const cleanupTestDatabase = (db: TestDatabaseConnection) => {
  db.$client.close();
};

/**
 * テーブルの全データを削除（テスト間のクリーンアップ用）
 */
export const clearAllTables = async (db: TestDatabaseConnection) => {
  await db.delete(schema.reviews);
  await db.delete(schema.products);
  await db.delete(schema.users);
};