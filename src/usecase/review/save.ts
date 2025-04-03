import { depend } from 'velona';
import { reviewRepository } from '../../repository/ReviewRepository';
import { Review } from '../../domain';

interface ReviewDTO {
  productId: number;
  userId: number;
  rating: number;
  comment: string;
}

export const save = depend(
  { repository: reviewRepository },
  ({ repository }, review: ReviewDTO) =>
    Review.create(review).asyncAndThen((review) => repository.save(review))
);
