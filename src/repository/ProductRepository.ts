import { databaseConnection, DatabaseConnectionError } from '../db/db';
import {
  Product,
  ProductRepository as ProductRepositoryInterface,
  UnsavedProduct,
  ProductId,
} from '../domain/';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import { ResultAsync, ok, Ok } from 'neverthrow';
import { depend } from 'velona';

const findAll = depend(
  { db: databaseConnection },
  ({ db }): ResultAsync<Product[], DatabaseConnectionError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(schema.products)
        .execute()
        .then((rows) => {
          const results = rows.map((row) =>
            Product.of({
              id: row.productId,
              name: row.name,
              manufacturer: row.manufacturer,
              category: row.category,
              ingredients: row.ingredients.split(','),
              createdAt: row.createdAt,
            }).mapErr((error) => {
              // UndefinedProductCategoryErrorはログに出力して処理を続行
              console.error(error.message);
              return ok();
            })
          );
          return results
            .filter((result): result is Ok<Product, never> => result.isOk())
            .map((result) => result.value);
        }),
      (e) => e as DatabaseConnectionError
    )
);

const findById = depend(
  { db: databaseConnection },
  (
    { db },
    productId: ProductId
  ): ResultAsync<Product | undefined, DatabaseConnectionError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(schema.products)
        .where(sql`${schema.products.productId} = ${productId}`)
        .execute()
        .then((rows) => {
          if (rows.length === 0) {
            return undefined;
          }
          const [row] = rows;
          const productResult = Product.of({
            id: row.productId,
            name: row.name,
            manufacturer: row.manufacturer,
            category: row.category,
            ingredients: row.ingredients.split(','),
            createdAt: row.createdAt,
          });

          if (productResult.isErr()) {
            console.error(productResult.error.message);
            return undefined;
          }

          return productResult.value;
        }),
      (e) => e as DatabaseConnectionError
    )
);

const save = depend(
  { db: databaseConnection },
  (
    { db },
    product: UnsavedProduct
  ): ResultAsync<Product, DatabaseConnectionError> =>
    ResultAsync.fromPromise(
      db
        .insert(schema.products)
        .values({
          name: product.name,
          manufacturer: product.manufacturer,
          category: product.category,
          ingredients: product.ingredients.join(','),
          createdAt: product.createdAt.toISOString(),
        })
        .returning({ id: schema.products.productId })
        .execute()
        .then(([{ id }]) => ({ ...product, productId: id as ProductId })),
      (e) => e as DatabaseConnectionError
    )
);

export const productRepository: ProductRepositoryInterface = {
  findAll,
  findById,
  save,
};
