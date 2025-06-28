import { depend } from 'velona';
import {
  Review,
  ReviewId,
  ReviewRepositoryInterface,
  UnsavedReview,
} from '../domain/';
import * as schema from '../db/schema';
import { databaseConnection, DatabaseConnectionError } from '../db/db';
import { ResultAsync } from 'neverthrow';
import { desc, sql, eq } from 'drizzle-orm';
import { ProductId } from '../domain';

const save = depend(
  { db: databaseConnection },
  (
    { db },
    review: UnsavedReview
  ): ResultAsync<Review, DatabaseConnectionError> => {
    return ResultAsync.fromPromise(
      db
        .insert(schema.reviews)
        .values({
          reviewId: review.reviewId,
          productId: review.productId,
          userId: review.userId,
          rating: Number(review.rating),
          comment: review.comment,
          createdAt: new Date().toISOString(),
        })
        .returning({
          id: schema.reviews.reviewId,
          createdAt: schema.reviews.createdAt,
        })
        .execute()
        .then((rows) => {
          if (rows.length === 0) {
            throw new Error('Failed to save review');
          }
          const [row] = rows;
          return {
            reviewId: review.reviewId,
            productId: review.productId,
            userId: review.userId,
            rating: review.rating,
            comment: review.comment,
            createdAt: new Date(row.createdAt),
          };
        }),
      (e: any) => {
        console.error('Error saving review:', e);
        // SQLite外部キー制約エラーを適切な形に変換
        if (e.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
          return new Error('Product or User not found') as DatabaseConnectionError;
        }
        return e as DatabaseConnectionError;
      }
    );
  }
);

const findByProductId = depend(
  { db: databaseConnection },
  (
    { db },
    productId: ProductId
  ): ResultAsync<Review[], DatabaseConnectionError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(schema.reviews)
        .where(eq(schema.reviews.productId, productId))
        .orderBy(desc(schema.reviews.createdAt))
        .execute()
        .then((rows) => {
          console.log('Fetched reviews:', rows);
          return rows.map((row) =>
            Review.of({
              reviewId: row.reviewId,
              productId: row.productId,
              userId: row.userId,
              rating: row.rating,
              comment: row.comment,
              createdAt: row.createdAt,
            })
          );
        }),
      (e) => {
        console.error('Error finding reviews by product ID:', e);
        return e as DatabaseConnectionError;
      }
    )
);

const erase = depend(
  { db: databaseConnection },
  ({ db }, reviewId: ReviewId): ResultAsync<void, DatabaseConnectionError> =>
    ResultAsync.fromPromise(
      db
        .delete(schema.reviews)
        .where(sql`${schema.reviews.reviewId} = ${reviewId}`)
        .execute(),
      (e) => {
        console.error('Error deleting review:', e);
        return e as DatabaseConnectionError;
      }
    ).map(() => undefined)
);

export const reviewRepository = {
  save,
  findByProductId,
  erase,
};
