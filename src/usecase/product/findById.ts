import { pipe, Effect } from 'effect';
import { id } from 'effect/Fiber';
import { NotFound } from '../../api/common-error';
import { ProductRepository } from '../../domain/product';

export const findById = (id: string) => pipe(
  ProductRepository,
  Effect.flatMap((repository) => repository.findById(Number(id)))
)
  .pipe(
    Effect.matchEffect({
      onFailure: (err) => Effect.fail(err),
      onSuccess: (product) => {
        if (!product) {
          return Effect.fail(new NotFound('Product not found'));
        }
        return Effect.succeed({
          id: product.productId,
          name: product.name,
          manufacturer: product.manufacturer,
          category: product.category,
          ingredients: product.ingredients,
          createdAt: product.createdAt.toISOString(),
        });
      },
    })
  )
  .pipe(
    Effect.catchAll((err) => {
      return Effect.fail(err);
    })
  );