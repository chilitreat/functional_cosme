import { pipe, Effect } from 'effect';
import { ProductRepository } from '../../domain/product';

export const findAll = pipe(
  ProductRepository,
  Effect.flatMap((repository) => repository.findAll())
)
  .pipe(
    Effect.matchEffect({
      onFailure: (err) => Effect.fail(err),
      onSuccess: (products) =>
        Effect.succeed(
          products.map((p) => ({
            id: p.productId,
            name: p.name,
            manufacturer: p.manufacturer,
            category: p.category,
            ingredients: p.ingredients,
            createdAt: p.createdAt.toISOString(),
          }))
        ),
    })
  )
  .pipe(
    Effect.catchAll((err) => {
      return Effect.fail(err);
    })
  );