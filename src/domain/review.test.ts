import { describe, it, expect } from 'vitest';
import { Review, ReviewId } from './review';

describe('Reviewドメインのテスト', () => {
  describe('ReviewId', () => {
    it('有効なUUIDからReviewIdを作成できること', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const reviewId = ReviewId.of(uuid);
      expect(reviewId).toBe(uuid);
    });

    it('無効なUUIDでエラーが発生すること', () => {
      const invalidUuid = 'invalid-uuid';
      expect(() => ReviewId.of(invalidUuid)).toThrow();
    });
  });

  describe('Review.of', () => {
    it('有効なデータからReviewオブジェクトを作成できること', () => {
      const reviewData = {
        reviewId: '550e8400-e29b-41d4-a716-446655440000',
        productId: 1,
        userId: 1,
        rating: 5,
        comment: 'とても良い商品です',
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const review = Review.of(reviewData);
      
      expect(review.reviewId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(review.productId).toBe(1);
      expect(review.userId).toBe(1);
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('とても良い商品です');
      expect(review.createdAt).toBeInstanceOf(Date);
    });

    it('createdAtを省略した場合、現在時刻が設定されること', () => {
      const reviewData = {
        reviewId: '550e8400-e29b-41d4-a716-446655440000',
        productId: 1,
        userId: 1,
        rating: 4,
        comment: 'まあまあです'
      };

      const review = Review.of(reviewData);
      
      expect(review.createdAt).toBeInstanceOf(Date);
      expect(review.createdAt.getTime()).toBeCloseTo(new Date().getTime(), -2); // 100ms以内
    });

    it('無効な評価値でエラーが発生すること', () => {
      const reviewData = {
        reviewId: '550e8400-e29b-41d4-a716-446655440000',
        productId: 1,
        userId: 1,
        rating: 8, // 1-7の範囲外
        comment: 'テストコメント'
      };

      expect(() => Review.of(reviewData)).toThrow();
    });
  });

  describe('Review.create', () => {
    it('有効なデータからレビューを作成できること', () => {
      const reviewData = {
        productId: 1,
        userId: 1,
        rating: 5,
        comment: 'とても満足しています'
      };

      const result = Review.create(reviewData);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const review = result.value;
        expect(review.productId).toBe(1);
        expect(review.userId).toBe(1);
        expect(review.rating).toBe(5);
        expect(review.comment).toBe('とても満足しています');
        expect(review.reviewId).toBeDefined();
        expect(review.reviewId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      }
    });

    it('無効な評価値でエラーが発生すること', () => {
      const reviewData = {
        productId: 1,
        userId: 1,
        rating: 0, // 1-7の範囲外
        comment: 'テストコメント'
      };

      expect(() => Review.create(reviewData)).toThrow('Invalid review data');
    });

    it('評価値が上限を超える場合エラーが発生すること', () => {
      const reviewData = {
        productId: 1,
        userId: 1,
        rating: 8, // 1-7の範囲外
        comment: 'テストコメント'
      };

      expect(() => Review.create(reviewData)).toThrow('Invalid review data');
    });

    it('各評価値で正常に作成できること', () => {
      const validRatings = [1, 2, 3, 4, 5, 6, 7];
      
      validRatings.forEach(rating => {
        const reviewData = {
          productId: 1,
          userId: 1,
          rating,
          comment: `評価${rating}のテストコメント`
        };

        const result = Review.create(reviewData);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.rating).toBe(rating);
        }
      });
    });
  });
});