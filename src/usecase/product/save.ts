import {
  Product,
  UndefinedProductCategoryError,
} from '../../domain/product';
import { depend } from 'velona';
import { productRepository } from '../../repository/ProductRepository';
import { ok } from 'neverthrow';

interface ProductDTO {
  name: string;
  manufacturer: string;
  category: string;
  ingredients: string[];
}

export const save = depend(
  { repository: productRepository },
  ({ repository }, product: ProductDTO) =>
    Product.create(product)
      .asyncAndThen((product) => repository.save(product))
      .andThen((product) => ok(product))
      .mapErr((error) => {
        if (error instanceof UndefinedProductCategoryError) {
          // UndefinedProductCategoryErrorはログに出力して処理を続行
          return error;
        }
        console.error(error.message);
        return error;
      })
);
