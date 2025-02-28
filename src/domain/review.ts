import { productId } from './product';
import { UserId } from './user';

export type Review = {
  reviewId: reviewId;
  productId: productId;
  userId: UserId;
  rating: reviewRating;
  comment: string;
  createdAt: Date;
};
export type reviewId = number;
type reviewRating = 1 | 2 | 3 | 4 | 5 | 6 | 7;
