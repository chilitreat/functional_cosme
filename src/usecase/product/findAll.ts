import { depend } from 'velona';
import { productRepository } from '../../repository/ProductRepositoryLive';

export const findAll = depend({repository: productRepository}, ({repository}) => {
  return repository.findAll();
});
