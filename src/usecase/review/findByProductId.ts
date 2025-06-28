import { depend } from 'velona';
import { reviewRepository } from '../../repository/ReviewRepository';
import { ProductId } from '../../domain';

export const findByProductId = depend(
  { repository: reviewRepository },
  ({ repository }, productId: number) => {
    return repository.findByProductId(ProductId.of(productId));
  }
);