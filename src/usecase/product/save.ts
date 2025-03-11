import { Effect } from 'effect';
import { createProduct, ProductRepository } from '../../domain/product';

export const save = ({
  name,
  manufacturer,
  category,
  ingredients,
}: {
  name: string;
  manufacturer: string;
  category: string;
  ingredients: string[];
}) => createProduct({
  name,
  manufacturer,
  category: category,
  ingredients,
})
  .pipe(
    Effect.matchEffect({
      onFailure: (err) => Effect.fail(err),
      onSuccess: (product) =>
        Effect.succeed(
          Effect.flatMap(ProductRepository, (repository) =>
            repository.save(product)
          )
        ),
    })
  )
  .pipe(
    Effect.matchEffect({
      onFailure: (err) => Effect.fail(err),
      onSuccess: (productEffect) =>
        Effect.flatMap(productEffect, (p) =>
          Effect.succeed({
            message: 'Product registered',
            product: {
              id: p.productId,
              name: p.name,
              manufacturer: p.manufacturer,
              category: p.category,
              ingredients: p.ingredients,
              createdAt: p.createdAt.toISOString(),
            },
          })
        ),
    })
  )
  .pipe(
    Effect.catchAll((err) => {
      return Effect.fail(err);
    })
  );