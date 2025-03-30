import { NotFound } from '../../api/common-error';
import { depend } from 'velona';
import { productRepository } from '../../repository/ProductRepository';
import { err, ok } from 'neverthrow';

export const findById = depend(
  { repository: productRepository },
  ({ repository }, id: number) => {
    return repository.findById(id).andThen((product) => {
      if (!product) {
        return err(new NotFound('Product not found'));
      }
      return ok(product);
    });
  }
);
