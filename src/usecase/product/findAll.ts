import { depend } from 'velona';
import { productRepository } from '../../repository/ProductRepository';

export const findAll = depend(
  { repository: productRepository },
  ({ repository }) => {
    return repository.findAll();
  }
);
