import { Layer, Effect } from 'effect';
import { DatabaseConnection } from '../db/db';
import { Product, ProductRepository } from '../domain/product';
import * as schema from '../db/schema';

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
