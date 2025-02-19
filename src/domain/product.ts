import { Effect } from "effect";

export type DomainError = UndefinedProductCategoryError;

// productCategory未定義のドメインエラー型
export type UndefinedProductCategoryError = {
  type: 'UndefinedProductCategoryError';
};


export type Product = {
  productId: productId;
  name: string;
  manufacturer: string;
  category: productCategory;
  ingredients: string[];
  createdAt: Date;
};

export type UnsavedProduct = Omit<Product, 'productId'>;

export type productId = number;
type productCategory = 'skin_care' | 'makeup' | 'fragrance' | 'hair_care' | 'body_care';

export const isValidProductCategory = (category: string): category is productCategory => {
  return ['skin_care', 'makeup', 'fragrance', 'hair_care', 'body_care'].includes(category);
};

export const createProduct = (input: {
  name: string;
  manufacturer: string;
  category: string;
  ingredients: string[];
}): Effect.Effect<UnsavedProduct, DomainError> => {
  if (!isValidProductCategory(input.category)) {
    return Effect.fail({ type: 'UndefinedProductCategoryError' });
  }
  return Effect.succeed({
    name: input.name,
    manufacturer: input.manufacturer,
    category: input.category,
    ingredients: input.ingredients,
    createdAt: new Date(),
  });
}