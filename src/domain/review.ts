import { z } from 'zod';
import { ProductId, ProductIdSchema } from './product';
import { UserId, UserIdSchema } from './user';
import { randomUUID } from 'crypto';
import { Result, ResultAsync } from 'neverthrow';
import { DatabaseConnectionError } from '../db/db';

const ReviewIdBrand = Symbol('ReviewIdBrand');
export const ReviewIdSchema = z.string().uuid().brand(ReviewIdBrand);

export type ReviewId = z.infer<typeof ReviewIdSchema>;

const ReviewSchema = z.object({
  reviewId: ReviewIdSchema,
  productId: ProductIdSchema,
  userId: UserIdSchema,
  rating: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
  ]),
  comment: z.string(),
  createdAt: z.date(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const UnsavedReviewSchema = ReviewSchema.omit({ createdAt: true });
export type UnsavedReview = z.infer<typeof UnsavedReviewSchema>;

export const ReviewId = {
  of: (id: string): ReviewId => ReviewIdSchema.parse(id),
};

export const Review = {
  of: (input: {
    reviewId: string;
    productId: number;
    userId: number;
    rating: number;
    comment: string;
    createdAt?: string;
  }): Review => {
    return ReviewSchema.parse({
      reviewId: ReviewId.of(input.reviewId),
      productId: ProductId.of(input.productId),
      userId: UserId.of(input.userId),
      rating: input.rating,
      comment: input.comment,
      createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
    });
  },
  create: (input: {
    productId: number;
    userId: number;
    rating: number;
    comment: string;
  }) =>
    Result.fromThrowable(UnsavedReviewSchema.parse, (error) => {
      // console.error('Error creating review:', error);
      throw new Error('Invalid review data: ' + error);
    })({ ...input, reviewId: randomUUID() }),
};

export interface ReviewRepositoryInterface {
  save: (review: UnsavedReview) => ResultAsync<Review, DatabaseConnectionError>;
  findByProductId: (
    productId: ProductId
  ) => ResultAsync<Review[], DatabaseConnectionError>;
  erase(reviewId: ReviewId): ResultAsync<void, DatabaseConnectionError>;
}
