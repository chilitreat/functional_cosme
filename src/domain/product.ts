import { z } from 'zod';
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

const productCategorySchema = z.enum([
  'skin_care',
  'makeup',
  'fragrance',
  'hair_care',
  'body_care',
]);

export type productCategory = z.infer<typeof productCategorySchema>;

const isValidProductCategory = (
  category: string
): category is productCategory => {
  return productCategorySchema.safeParse(category).success;
};

const ProductIdBrand = Symbol('ProductIdBrand');
export const ProductIdSchema = z
  .number()
  .int()
  .positive()
  .brand(ProductIdBrand);
export type ProductId = z.infer<typeof ProductIdSchema>;

const ProductSchema = z.object({
  productId: ProductIdSchema,
  name: z.string(),
  manufacturer: z.string(),
  category: productCategorySchema,
  ingredients: z.array(z.string()),
  createdAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;

export type UnsavedProduct = Omit<Product, 'productId'>;

export const ProductId = {
  of: (id: number): ProductId => ProductIdSchema.parse(id),
};

export const Product = {
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
    return ok(
      ProductSchema.parse({
        productId: ProductId.of(input.id),
        name: input.name,
        manufacturer: input.manufacturer,
        category: input.category,
        ingredients: input.ingredients,
        createdAt: new Date(input.createdAt),
      })
    );
  },
  create: (input: {
    name: string;
    manufacturer: string;
    category: string;
    ingredients: string[];
  }): Result<UnsavedProduct, UndefinedProductCategoryError> => {
    if (!isValidProductCategory(input.category)) {
      return err(
        new UndefinedProductCategoryError('Undefined product category')
      );
    }
    return ok({
      name: input.name,
      manufacturer: input.manufacturer,
      category: input.category,
      ingredients: input.ingredients,
      createdAt: new Date(),
    });
  },
};

export const ProductCategory = {
  isValid: isValidProductCategory,
};

export interface ProductRepositoryInterface {
  findAll: () => ResultAsync<Product[], DatabaseConnectionError>;
  findById: (
    productId: ProductId
  ) => ResultAsync<Product | undefined, DatabaseConnectionError>;
  save: (
    product: UnsavedProduct
  ) => ResultAsync<Product, DatabaseConnectionError>;
}
