import { depend } from 'velona';
import { reviewRepository } from '../../repository/ReviewRepository';
import { ProductId } from '../../domain';

export const findByProductId = depend(
  { repository: reviewRepository },
  ({ repository }, productId: number) => {
    // 数値の有効性チェック
    if (isNaN(productId) || productId <= 0) {
      throw new Error('Invalid product ID');
    }
    return repository.findByProductId(ProductId.of(productId));
  }
);