/**
 * テスト用データ作成ヘルパー
 * テストで使用するエンティティの作成をサポート
 */

import { Product } from '../../src/domain/product';
import { Review } from '../../src/domain/review';
import { User } from '../../src/domain/user';
import { randomUUID } from 'node:crypto';

/**
 * 有効な商品データを作成
 */
export const createValidProductData = () => ({
  name: 'Test Product',
  manufacturer: 'Test Manufacturer',
  category: 'skin_care' as const,
  ingredients: ['Test ingredient 1', 'Test ingredient 2'],
});

/**
 * 有効なユーザーデータを作成
 */
export const createValidUserData = () => ({
  name: 'Test User',
  email: `test-${Date.now()}@example.com`, // ユニーク性を保証
  password: 'testpassword123',
});

/**
 * 有効なレビューデータを作成
 */
export const createValidReviewData = (productId: number, userId: number) => ({
  productId,
  userId,
  rating: 5,
  comment: 'This is a test review comment.',
});

/**
 * 複数の商品データを作成
 */
export const createMultipleProductData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    name: `Test Product ${i + 1}`,
    manufacturer: `Test Manufacturer ${i + 1}`,
    category: 'skin_care' as const,
    ingredients: [`Test ingredient ${i + 1}`, `Test ingredient ${i + 2}`],
  }));
};

/**
 * 複数のユーザーデータを作成
 */
export const createMultipleUserData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    name: `Test User ${i + 1}`,
    email: `test${i + 1}-${Date.now()}@example.com`,
    password: `testpassword${i + 1}`,
  }));
};

/**
 * 複数のレビューデータを作成
 */
export const createMultipleReviewData = (productId: number, userIds: number[]) => {
  return userIds.map((userId, i) => ({
    productId,
    userId,
    rating: Math.floor(Math.random() * 7) + 1, // 1-7のランダム評価
    comment: `Test review comment ${i + 1}`,
  }));
};

/**
 * 無効な商品データを作成（バリデーションテスト用）
 */
export const createInvalidProductData = () => ({
  name: '', // 空の名前
  manufacturer: 'Test Manufacturer',
  category: 'invalid_category', // 無効なカテゴリ
  ingredients: ['Test ingredient 1', 'Test ingredient 2'],
});

/**
 * 無効なユーザーデータを作成（バリデーションテスト用）
 */
export const createInvalidUserData = () => ({
  name: '', // 空の名前
  email: 'invalid-email', // 無効なメール形式
  password: '123', // 短すぎるパスワード
});

/**
 * 無効なレビューデータを作成（バリデーションテスト用）
 */
export const createInvalidReviewData = (productId: number, userId: number) => ({
  productId,
  userId,
  rating: 10, // 範囲外の評価（1-7が有効）
  comment: '', // 空のコメント
});

