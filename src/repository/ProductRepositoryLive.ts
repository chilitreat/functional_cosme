import { Layer, Effect } from 'effect';
import { DatabaseConnection } from '../db/db';
import {
  DomainError,
  Product,
  ProductRepository,
} from '../domain/product';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';

export const ProductRepositoryLive = Layer.effect(
  ProductRepository,
  Effect.flatMap(DatabaseConnection, ({ db }) =>
    Effect.succeed({
      findAll: () =>
        Effect.promise(async () => {
          const products = await db.select().from(schema.products).execute();
          const productEffects = products.map((product) =>
            Product.of({
              ...product,
              ingredients: product.ingredients.split(','),
              id: product.productId,
            })
          );

          const validatedProducts = await Promise.all(
            productEffects.map((productEffect) =>
              Effect.runPromise(productEffect)
            )
          );

          return validatedProducts;
        }),
      findById: (
        productId: number
      ): Effect.Effect<Product | undefined, DomainError> =>
        Effect.promise(async () => {
          const [product] = await db
            .select()
            .from(schema.products)
            .where(sql`${schema.products.productId} = ${productId}`)
            .execute();

          if (!product) {
            return;
          }

          return Effect.runPromise(
            Product.of({
              ...product,
              ingredients: product.ingredients.split(','),
              id: product.productId,
            })
          );
        }),
      save: (product) =>
        Effect.promise(async () => {
          const productDto = {
            ...product,
            ingredients: product.ingredients.join(','),
            createdAt: product.createdAt.toISOString(),
          };
          const [{ id }] = await db
            .insert(schema.products)
            .values(productDto)
            .returning({ id: schema.products.productId })
            .execute();
          return { ...product, productId: id };
        }),
    })
  )
);
