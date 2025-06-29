import { depend } from 'velona';
import { reviewRepository } from '../../repository/ReviewRepository';
import { ReviewId } from '../../domain';

export const findById = depend(
  { repository: reviewRepository },
  ({ repository }, reviewId: string) => {
    try {
      return repository.findById(ReviewId.of(reviewId));
    } catch (error) {
      // UUIDバリデーションエラーの場合は適切なエラーを返す
      throw new Error('Invalid review ID format');
    }
  }
);