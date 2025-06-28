/**
 * 認証フローの統合テスト
 * ユーザー登録からログイン、保護されたリソースアクセスまでの一連のフロー
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { api } from '../index';
import { setupTestDatabase, seedTestData, cleanupTestDatabase, TestDatabaseConnection } from '../../../tests/setup/database';
import { createValidUserData, createValidProductData } from '../../../tests/helpers/data';

describe('Authentication Flow Integration Tests', () => {
  let testDb: TestDatabaseConnection;
  let app: OpenAPIHono;

  beforeEach(async () => {
    testDb = await setupTestDatabase();
    await seedTestData(testDb);

    app = new OpenAPIHono();
    app.route('/', api);
  });

  afterEach(() => {
    cleanupTestDatabase(testDb);
  });

  describe('完全な認証フロー', () => {
    it('ユーザー登録 → ログイン → 保護されたリソースアクセス', async () => {
      const userData = createValidUserData();
      const productData = createValidProductData();

      // 1. ユーザー登録
      const registerResponse = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      expect(registerResponse.status).toBe(200);
      const registerResult = await registerResponse.json();
      expect(registerResult).toHaveProperty('message');
      expect(registerResult.message).toContain('registered');

      // 2. ログイン
      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      const loginResponse = await app.request('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      expect(loginResponse.status).toBe(200);
      const loginResult = await loginResponse.json();
      expect(loginResult).toHaveProperty('token');
      expect(typeof loginResult.token).toBe('string');

      const token = loginResult.token;

      // 3. 保護されたリソース（商品作成）へのアクセス
      const protectedResponse = await app.request('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      expect(protectedResponse.status).toBe(200);
      const productResult = await protectedResponse.json();
      expect(productResult).toHaveProperty('product');
      expect(productResult.product.name).toBe(productData.name);
    });

    it('無効なログイン認証情報でのアクセス拒否', async () => {
      // 間違ったパスワードでのログイン試行
      const invalidLoginData = {
        email: 'test1@example.com', // 既存のユーザー
        password: 'wrong-password',
      };

      const loginResponse = await app.request('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidLoginData),
      });

      expect(loginResponse.status).toBe(401);
      const result = await loginResponse.json();
      expect(result).toHaveProperty('error');
    });

    it('存在しないユーザーでのログイン試行', async () => {
      const nonExistentUserData = {
        email: 'nonexistent@example.com',
        password: 'anypassword',
      };

      const loginResponse = await app.request('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nonExistentUserData),
      });

      expect(loginResponse.status).toBe(401);
      const result = await loginResponse.json();
      expect(result).toHaveProperty('error');
    });
  });

  describe('JWTトークンの検証', () => {
    it('有効なトークンで保護されたリソースにアクセス可能', async () => {
      // 既存のテストユーザーでログイン
      const loginData = {
        email: 'test1@example.com',
        password: 'password', // seedDataで設定されたパスワード
      };

      const loginResponse = await app.request('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      expect(loginResponse.status).toBe(200);
      const { token } = await loginResponse.json();

      // ユーザー一覧の取得（保護されたリソース）
      const usersResponse = await app.request('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(usersResponse.status).toBe(200);
      const users = await usersResponse.json();
      expect(Array.isArray(users)).toBe(true);
    });

    it('無効なトークンでアクセス拒否', async () => {
      const invalidToken = 'invalid.jwt.token';

      const response = await app.request('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${invalidToken}`,
        },
      });

      expect(response.status).toBe(401);
    });

    it('トークンなしでアクセス拒否', async () => {
      const response = await app.request('/api/users', {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });

    it('Bearer形式でないAuthorizationヘッダーでアクセス拒否', async () => {
      const response = await app.request('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': 'Basic sometoken',
        },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('ユーザー登録のバリデーション', () => {
    it('既存のメールアドレスでの登録は拒否される', async () => {
      const existingUserData = {
        name: 'New User',
        email: 'test1@example.com', // 既に存在するメールアドレス
        password: 'newpassword123',
      };

      const response = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existingUserData),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result).toHaveProperty('error');
    });

    it('無効なメール形式での登録は拒否される', async () => {
      const invalidEmailData = {
        name: 'Test User',
        email: 'invalid-email-format',
        password: 'password123',
      };

      const response = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEmailData),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result).toHaveProperty('error');
    });

    it('短すぎるパスワードでの登録は拒否される', async () => {
      const shortPasswordData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123', // 短すぎるパスワード
      };

      const response = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shortPasswordData),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result).toHaveProperty('error');
    });

    it('必須フィールドが欠けている場合は登録拒否', async () => {
      const incompleteData = {
        name: 'Test User',
        // email, password が欠けている
      };

      const response = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteData),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result).toHaveProperty('error');
    });
  });

  describe('複数ユーザーでの並行アクセス', () => {
    it('複数ユーザーが同時にログインして異なるリソースにアクセス', async () => {
      // 並行してユーザー1とユーザー2のログインを実行
      const loginData1 = {
        email: 'test1@example.com',
        password: 'password',
      };
      const loginData2 = {
        email: 'test2@example.com',
        password: 'password',
      };

      const [loginResponse1, loginResponse2] = await Promise.all([
        app.request('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData1),
        }),
        app.request('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData2),
        }),
      ]);

      const { token: token1 } = await loginResponse1.json();
      const { token: token2 } = await loginResponse2.json();

      // 並行して両方のトークンでリソースにアクセス
      const [user1Response, user2Response] = await Promise.all([
        app.request('/api/users', {
          headers: { 'Authorization': `Bearer ${token1}` },
        }),
        app.request('/api/users', {
          headers: { 'Authorization': `Bearer ${token2}` },
        }),
      ]);
      expect(user1Response.status).toBe(200);
      expect(user2Response.status).toBe(200);
    });
  });
});