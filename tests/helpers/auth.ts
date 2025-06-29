/**
 * テスト用認証ヘルパー
 * JWT認証フローのテストをサポート
 */

import { sign } from 'hono/jwt';
import { User } from '../../src/domain/user';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

/**
 * テスト用ユーザーデータを作成
 */
// Removed unused helper function `createTestUserData`.

/**
 * テスト用ユーザーを作成
 */
// Removed unused helper function `createTestUser`.

/**
 * ユーザー用のJWTトークンを生成（実際のアプリと同じ形式）
 */
export const generateAuthToken = async (userId: number): Promise<string> => {
  const payload = {
    user: { id: userId },
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24時間
  };
  return await sign(payload, JWT_SECRET);
};

/**
 * JWT認証用のAuthorizationヘッダーを生成
 */
export const getAuthHeaders = async (userId: number): Promise<Record<string, string>> => {
  const token = await generateAuthToken(userId);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * パスワードのハッシュ化（テスト用）
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

/**
 * パスワードの検証（テスト用）
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * 複数のテストユーザーを作成
 */
export const createMultipleTestUsers = async (count: number) => {
  const users = [];
  for (let i = 1; i <= count; i++) {
    const userData = {
      name: `Test User ${i}`,
      email: `test${i}@example.com`,
      password: `password${i}`,
    };
    const userResult = await User.create(userData);
    if (userResult.isOk()) {
      users.push(userResult.value);
    }
  }
  return users;
};