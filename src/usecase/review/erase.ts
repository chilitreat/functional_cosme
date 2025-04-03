import { depend } from 'velona';
import { reviewRepository } from '../../repository/ReviewRepository';
import { ReviewId } from '../../domain/review';

export const erase = depend(
  { repository: reviewRepository },
  ({ repository }, reviewId: string) => {
    return repository.erase(ReviewId.of(reviewId));
  }
);
