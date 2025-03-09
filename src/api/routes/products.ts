import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { jwt } from 'hono/jwt';
import { DatabaseConnectionLive, db } from '../../db/db';
import {
  createProduct,
  ProductRepository,
} from '../../domain/product';
import {
  badRequestError,
  errorResponses,
  HttpErrorCodes,
  internalServerError,
  NotFound,
  notFoundError,
} from '../common-error';

import { Context, Next } from 'hono';
import { Effect, Layer } from 'effect';
import { ProductRepositoryLive } from '../../repository/ProductRepositoryLive';

const jwtSecret = process.env.JWT_SECRET || 'secret';
const jwtAuth = () => (c: Context, next: Next) =>
  jwt({ secret: jwtSecret })(c, next);

export const products = new OpenAPIHono();

// 商品一覧取得
const getProductsRoute = createRoute({
  method: 'get',
  path: '/products',
  tags: ['products'],
  responses: {
    200: {
      description: 'List of products',
      content: {
        'application/json': {
          schema: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              manufacturer: z.string(),
              category: z.string(),
              ingredients: z.array(z.string()),
              createdAt: z.string(),
            })
          ),
          example: [
            {
              id: '1',
              name: 'スーパーすべすべクリーム',
              manufacturer: 'すべっすべ株式会社',
              category: 'skin_care',
              ingredients: ['Ingredient 1', 'Ingredient 2'],
              createdAt: '2023-01-01T00:00:00Z',
            },
          ],
        },
      },
    },
    ...errorResponses([HttpErrorCodes.INTERNAL_SERVER_ERROR]),
  },
});

products.openapi(getProductsRoute, async (c) => {
  const program = Effect.flatMap(ProductRepository, (repository) =>
    Effect.map(repository.findAll(), (products) => products)
  )
    .pipe(
      Effect.matchEffect({
        onFailure: (err) => Effect.fail(err),
        onSuccess: (products) => Effect.succeed(products),
      })
    )
    .pipe(
      Effect.catchAll((err) => {
        return Effect.fail(err);
      })
    );

  const response = await Effect.runPromise(
    Effect.provide(
      program,
      // 依存関係が深くなったら、provideがどんどんネストする？
      Layer.provide(ProductRepositoryLive, DatabaseConnectionLive)
    )
  );

  return c.json(response);
});

// 商品詳細取得
const getProductByIdRoute = createRoute({
  method: 'get',
  path: '/products/:id',
  tags: ['products'],
  responses: {
    200: {
      description: 'Product details',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            name: z.string(),
            manufacturer: z.string(),
            category: z.string(),
            ingredients: z.array(z.string()),
            createdAt: z.string(),
          }),
          example: {
            id: '1',
            name: 'スーパーすべすべクリーム',
            manufacturer: 'すべっすべ株式会社',
            category: 'skin_care',
            ingredients: ['Ingredient 1', 'Ingredient 2'],
            createdAt: '2023-01-01T00:00:00Z',
          },
        },
      },
    },
    ...errorResponses([HttpErrorCodes.INTERNAL_SERVER_ERROR]),
  },
});

products.openapi(getProductByIdRoute, async (c) => {
  const { id } = c.req.param();
  const program = Effect.flatMap(ProductRepository, (repository) =>
    Effect.map(repository.findById(Number(id)), (product) => product)
  )
    .pipe(
      Effect.matchEffect({
        onFailure: (err) => Effect.fail(err),
        onSuccess: (product) => {
          if (!product) {
            return Effect.fail(new NotFound());
          }
          return Effect.succeed(product);
        },
      })
    )
    .pipe(
      Effect.catchTags({
        NotFound: (err) => Effect.succeed(notFoundError(c, err)),
      })
    )
    .pipe(
      Effect.catchAll((err) => {
        return Effect.succeed(internalServerError(c, err))
      })
    );

  const response = await Effect.runPromise(
    Effect.provide(
      program,
      Layer.provide(ProductRepositoryLive, DatabaseConnectionLive)
    )
  );
  return c.json(response);
});

// 商品登録(管理者専用)
const postProductRoute = createRoute({
  method: 'post',
  path: '/products',
  tags: ['products'],
  middleware: [jwtAuth()] as const,
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string(),
            manufacturer: z.string(),
            category: z.string(),
            ingredients: z.array(z.string()),
          }),
          example: {
            name: 'スーパーすべすべクリーム',
            manufacturer: 'すべっすべ株式会社',
            category: 'skin_care',
            ingredients: ['Ingredient 1', 'Ingredient 2'],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Product registered',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            product: z.object({
              id: z.number().int().positive(),
              name: z.string(),
              manufacturer: z.string(),
              category: z.string(),
              ingredients: z.array(z.string()),
              createdAt: z.string(),
            }),
          }),
          example: {
            message: 'Product registered',
            product: {
              id: '1',
              name: 'スーパーすべすべクリーム',
              manufacturer: 'すべっすべ株式会社',
              category: 'skin_care',
              ingredients: ['Ingredient 1', 'Ingredient 2'],
              createdAt: '2023-01-01T00:00:00Z',
            },
          },
        },
      },
    },
    ...errorResponses([
      HttpErrorCodes.BAD_REQUEST,
      HttpErrorCodes.INTERNAL_SERVER_ERROR,
    ]),
  },
});

products.openapi(postProductRoute, async (c) => {
  const { success, error, data } = z
    .object({
      name: z.string(),
      manufacturer: z.string(),
      category: z.string(),
      ingredients: z.array(z.string()),
    })
    .safeParse(await c.req.json());
  if (!success || !data) {
    return badRequestError(c, error);
  }
  const { name, manufacturer, category, ingredients } = data;

  const program = createProduct({
    name,
    manufacturer,
    category: category,
    ingredients,
  })
    .pipe(
      Effect.matchEffect({
        onFailure: (err) =>
          Effect.fail(new Error(`Invalid product data: ${err.type}`)),
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
        onFailure: (err) => {
          const errorMessage =
            err instanceof Error ? err.message : 'Unknown error';
          return Effect.fail(
            new Error(`Failed to save product: ${errorMessage}`)
          );
        },
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

  const response = await Effect.runPromise(
    Effect.provide(
      program,
      // 依存関係が深くなったら、provideがどんどんネストする？
      Layer.provide(ProductRepositoryLive, DatabaseConnectionLive)
    )
  );
  return c.json(response);
});
