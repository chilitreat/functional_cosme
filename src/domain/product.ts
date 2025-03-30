import { DatabaseConnectionError } from '../db/db';
import { Result, ok, err, ResultAsync } from 'neverthrow';

export type DomainError = UndefinedProductCategoryError;

// productCategory未定義のドメインエラー型
export class UndefinedProductCategoryError extends Error {
  type = 'UndefinedProductCategoryError';
  constructor(message: string) {
    super(message);
    this.name = 'UndefinedProductCategoryError';
  }
}

export type Product = {
  productId: productId;
  name: string;
  manufacturer: string;
  category: productCategory;
  ingredients: string[];
  createdAt: Date;
};

export const Product = {
  // of: (input: {
  //   id: number;
  //   name: string;
  //   manufacturer: string;
  //   category: string;
  //   ingredients: string[];
  //   createdAt: string;
  // }): Effect.Effect<Product, DomainError> => {
  //   if (!isValidProductCategory(input.category)) {
  //     return Effect.fail(new UndefinedProductCategoryError('Undefined product category'));
  //   }
  //   return Effect.succeed({
  //     productId: input.id,
  //     name: input.name,
  //     manufacturer: input.manufacturer,
  //     category: input.category,
  //     ingredients: input.ingredients,
  //     createdAt: new Date(input.createdAt),
  //   });
  // },
  of: (input: {
    id: number;
    name: string;
    manufacturer: string;
    category: string;
    ingredients: string[];
    createdAt: string;
  }): Result<Product, UndefinedProductCategoryError> => {
    if (!isValidProductCategory(input.category)) {
      return err(
        new UndefinedProductCategoryError('Undefined product category')
      );
    }
    return ok({
      productId: input.id,
      name: input.name,
      manufacturer: input.manufacturer,
      category: input.category,
      ingredients: input.ingredients,
      createdAt: new Date(input.createdAt),
    });
  },
};

export type UnsavedProduct = Omit<Product, 'productId'>;

export type productId = number;
export type productCategory =
  | 'skin_care'
  | 'makeup'
  | 'fragrance'
  | 'hair_care'
  | 'body_care';

export const isValidProductCategory = (
  category: string
): category is productCategory => {
  return [
    'skin_care',
    'makeup',
    'fragrance',
    'hair_care',
    'body_care',
  ].includes(category);
};

// export const createProduct = (input: {
//   name: string;
//   manufacturer: string;
//   category: string;
//   ingredients: string[];
// }): Effect.Effect<UnsavedProduct, DomainError> => {
//   if (!isValidProductCategory(input.category)) {
//     return Effect.fail(
//       new UndefinedProductCategoryError('Undefined product category')
//     );
//   }
//   return Effect.succeed({
//     name: input.name,
//     manufacturer: input.manufacturer,
//     category: input.category,
//     ingredients: input.ingredients,
//     createdAt: new Date(),
//   });
// };
export const createProduct = (input: {
  name: string;
  manufacturer: string;
  category: string;
  ingredients: string[];
}): Result<UnsavedProduct, UndefinedProductCategoryError> => {
  if (!isValidProductCategory(input.category)) {
    return err(new UndefinedProductCategoryError('Undefined product category'));
  }
  return ok({
    name: input.name,
    manufacturer: input.manufacturer,
    category: input.category,
    ingredients: input.ingredients,
    createdAt: new Date(),
  });
};

// export class ProductRepository extends Context.Tag('ProductRepository')<
//   ProductRepository,
//   {
//     findAll: () => Effect.Effect<Product[], DomainError>;
//     findById: (productId: productId) => Effect.Effect<Product | undefined, DomainError>;
//     save: (product: UnsavedProduct) => Effect.Effect<Product, DomainError>;
//   }
// >() {}

export interface ProductRepository {
  findAll: () => ResultAsync<Product[], DatabaseConnectionError>;
  findById: (
    productId: productId
  ) => ResultAsync<Product | undefined, DatabaseConnectionError>;
  save: (
    product: UnsavedProduct
  ) => ResultAsync<Product, DatabaseConnectionError>;
}
