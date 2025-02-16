/**
 * DB: SQLite
 * ORM: drizzle-orm
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  userId: integer('user_id').primaryKey({ autoIncrement: true }).notNull(), // ユーザーID
  name: text('name').notNull(), // ユーザー名
  email: text('email').notNull().unique(), // メールアドレス（ユニーク制約）
  passwordHash: text('password_hash').notNull(), // ハッシュ化されたパスワード
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`), // 作成日時
});

export const products = sqliteTable('products', {
  productId: integer('product_id').primaryKey({ autoIncrement: true }).notNull(), // 商品ID
  name: text('name').notNull(), // 商品名
  manufacturer: text('manufacturer').notNull(), // メーカー
  category: text('category').notNull(), // カテゴリ
  ingredients: text('ingredients').notNull(), // 成分
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`), // 作成日時
});

export const reviews = sqliteTable('reviews', {
  reviewId: text('review_id').primaryKey().notNull(), // クチコミID
  productId: text('product_id')
    .notNull()
    .references(() => products.productId), // 商品ID
  userId: text('user_id')
    .notNull()
    .references(() => users.userId), // ユーザーID
  rating: integer('rating').notNull(), // 評価 (1~7)
  comment: text('comment').notNull(), // コメント
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`), // 作成日時
});
