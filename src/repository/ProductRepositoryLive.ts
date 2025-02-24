import { Layer, Effect } from 'effect';
import { DatabaseConnection } from '../db/db';
import { ProductRepository } from '../domain/product';
import * as schema from '../db/schema';

export const ProductRepositoryLive = Layer.effect(
  ProductRepository,
  Effect.flatMap(DatabaseConnection, ({ db }) =>
    Effect.succeed({
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
