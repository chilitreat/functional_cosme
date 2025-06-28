/**
 * E2Eテスト: レビュー投稿フロー
 * 商品詳細 → レビュー投稿 → 評価確認の完全なユーザーフロー
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { api } from '../../src/api/index';
import {
  setupTestDatabase,
  seedTestData,
  cleanupTestDatabase,
  TestDatabaseConnection,
} from '../setup/database';
import {
  createValidUserData,
  createValidProductData,
  createValidReviewData,
} from '../helpers/data';

describe.skip('Review Flow E2E Tests', () => {
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

  describe('完全なレビュー投稿フロー', () => {
    it('商品一覧取得 → 商品詳細確認 → ユーザー登録 → ログイン → レビュー投稿 → レビュー確認', async () => {
      // 1. 商品一覧を取得
      const productsResponse = await app.request('/api/products');
      expect(productsResponse.status).toBe(200);

      const products = await productsResponse.json();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      const targetProduct = products[0];
      const productId = targetProduct.id;

      // 2. 商品詳細を確認
      const productDetailResponse = await app.request(
        `/api/products/${productId}`
      );
      expect(productDetailResponse.status).toBe(200);

      const productDetail = await productDetailResponse.json();
      expect(productDetail.id).toBe(productId);
      expect(productDetail).toHaveProperty('name');
      expect(productDetail).toHaveProperty('manufacturer');

      // 3. 新しいユーザーを登録
      const userData = createValidUserData();
      const registerResponse = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      expect(registerResponse.status).toBe(200);
      const registerResult = await registerResponse.json();
      expect(registerResult).toHaveProperty('message');

      // 4. ユーザーログイン
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
      const { token } = await loginResponse.json();
      expect(token).toBeDefined();

      // 5. レビューを投稿
      const reviewData = {
        productId,
        rating: 5,
        comment:
          'この商品は本当に素晴らしいです！肌がとてもなめらかになりました。',
      };

      const reviewResponse = await app.request('/api/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      expect(reviewResponse.status).toBe(200);
      const reviewResult = await reviewResponse.json();
      expect(reviewResult).toHaveProperty('message');
      expect(reviewResult).toHaveProperty('review');
      expect(reviewResult.review.rating).toBe(reviewData.rating);
      expect(reviewResult.review.comment).toBe(reviewData.comment);

      const reviewId = reviewResult.review.id;

      // 6. 投稿されたレビューを確認
      const productReviewsResponse = await app.request(
        `/api/reviews?productId=${productId}`
      );
      expect(productReviewsResponse.status).toBe(200);

      const productReviewsData = await productReviewsResponse.json();
      expect(productReviewsData).toHaveProperty('reviews');
      expect(Array.isArray(productReviewsData.reviews)).toBe(true);

      const postedReview = productReviewsData.reviews.find(
        (review: { comment: string }) => review.comment === reviewData.comment
      );
      expect(postedReview).toBeDefined();
      expect(postedReview.rating).toBe(reviewData.rating);
      expect(postedReview.productId).toBe(productId);
    });

    it('複数ユーザーによる同一商品への複数レビュー投稿', async () => {
      const productId = 1; // シードデータの商品ID

      // ユーザー1のフロー
      const user1Data = createValidUserData();
      user1Data.email = 'user1@example.com';

      await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user1Data),
      });

      const login1Response = await app.request('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user1Data.email,
          password: user1Data.password,
        }),
      });

      const { token: token1 } = await login1Response.json();

      await app.request('/api/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token1}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: 5,
          comment: 'ユーザー1のレビューです。とても良い商品でした。',
        }),
      });

      // ユーザー2のフロー
      const user2Data = createValidUserData();
      user2Data.email = 'user2@example.com';

      await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user2Data),
      });

      const login2Response = await app.request('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user2Data.email,
          password: user2Data.password,
        }),
      });

      const { token: token2 } = await login2Response.json();

      await app.request('/api/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token2}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: 3,
          comment: 'ユーザー2のレビューです。まあまあでした。',
        }),
      });

      // 両方のレビューが投稿されたことを確認
      const reviewsResponse = await app.request(
        `/api/reviews?productId=${productId}`
      );
      const reviewsData = await reviewsResponse.json();

      expect(reviewsData).toHaveProperty('reviews');
      expect(reviewsData.reviews.length).toBeGreaterThanOrEqual(2); // シードデータ + 新規投稿

      const user1Review = reviewsData.reviews.find((r: { comment: string }) =>
        r.comment.includes('ユーザー1')
      );
      const user2Review = reviewsData.reviews.find((r: { comment: string }) =>
        r.comment.includes('ユーザー2')
      );

      expect(user1Review).toBeDefined();
      expect(user2Review).toBeDefined();
      expect(user1Review.rating).toBe(5);
      expect(user2Review.rating).toBe(3);
    });

    it('レビュー投稿から削除まで完全フロー', async () => {
      // ユーザー登録・ログイン
      const userData = createValidUserData();
      await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const loginResponse = await app.request('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
        }),
      });

      const { token } = await loginResponse.json();

      // レビュー投稿
      const reviewData = {
        productId: 1,
        rating: 4,
        comment: '削除予定のテストレビューです。',
      };

      const createResponse = await app.request('/api/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      expect(createResponse.status).toBe(200);
      const { review } = await createResponse.json();
      const reviewId = review.reviewId;

      // レビューが投稿されたことを確認
      const reviewsResponse = await app.request(
        `/api/reviews?productId=${reviewData.productId}`
      );
      const reviewsData = await reviewsResponse.json();
      const postedReview = reviewsData.reviews.find(
        (r: { reviewId: string }) => r.reviewId === reviewId
      );
      expect(postedReview).toBeDefined();

      // レビュー削除
      const deleteResponse = await app.request(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(deleteResponse.status).toBe(200);

      // レビューが削除されたことを確認
      const reviewsAfterDelete = await app.request(
        `/api/reviews?productId=${reviewData.productId}`
      );
      const reviewsAfterDeleteJson = await reviewsAfterDelete.json();
      const deletedReview = reviewsAfterDeleteJson.find(
        (r: { id: string }) => r.id === reviewId
      );
      expect(deletedReview).toBeUndefined();
    });
  });

  describe('エラーケースのE2Eテスト', () => {
    it('存在しない商品へのレビュー投稿エラー', async () => {
      // ユーザー登録・ログイン
      const userData = createValidUserData();
      await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const loginResponse = await app.request('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
        }),
      });

      const { token } = await loginResponse.json();

      // 存在しない商品IDでレビュー投稿
      const invalidReviewData = {
        productId: 99999,
        rating: 5,
        comment: '存在しない商品へのレビューです。',
      };

      const response = await app.request('/api/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidReviewData),
      });

      expect(response.status).toBe(404); // 商品が見つからないエラー
    });

    it('他人のレビュー削除試行はエラー', async () => {
      // ユーザー1がレビューを投稿
      const user1Data = createValidUserData();
      user1Data.email = 'owner@example.com';

      await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user1Data),
      });

      const login1Response = await app.request('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user1Data.email,
          password: user1Data.password,
        }),
      });

      const { token: token1 } = await login1Response.json();

      const reviewResponse = await app.request('/api/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token1}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: 1,
          rating: 5,
          comment: 'ユーザー1のレビューです。',
        }),
      });

      const { review } = await reviewResponse.json();
      const reviewId = review.id;

      // ユーザー2が登録・ログイン
      const user2Data = createValidUserData();
      user2Data.email = 'attacker@example.com';

      await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user2Data),
      });

      const login2Response = await app.request('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user2Data.email,
          password: user2Data.password,
        }),
      });

      const { token: token2 } = await login2Response.json();

      // ユーザー2が他人のレビューを削除試行
      const deleteResponse = await app.request(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token2}`,
        },
      });

      expect(deleteResponse.status).toBe(403); // 権限エラー
    });

    it('無効な評価値でのレビュー投稿エラー', async () => {
      // ユーザー登録・ログイン
      const userData = createValidUserData();
      await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const loginResponse = await app.request('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
        }),
      });

      const { token } = await loginResponse.json();

      // 範囲外の評価値でレビュー投稿
      const invalidRatingReview = {
        productId: 1,
        rating: 10, // 1-7の範囲外
        comment: '無効な評価値のレビューです。',
      };

      const response = await app.request('/api/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidRatingReview),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('error');
    });
  });
});
