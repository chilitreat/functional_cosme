import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { jwt } from 'hono/jwt';
import { DatabaseConnectionLive, db } from '../../db/db';
import { createProduct, ProductRepository } from '../../domain/product';
import {
  badRequestError,
  errorResponses,
  HttpErrorCodes,
  internalServerError,
  NotFound,
  notFoundError,
} from '../common-error';

import { Context, Next } from 'hono';
import { Effect, Either, Layer, pipe } from 'effect';
import { ProductRepositoryLive } from '../../repository/ProductRepositoryLive';
import { findAll, findById, save } from '../../usecase/product';

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
              id: z.number().int().positive(),
              name: z.string(),
              manufacturer: z.string(),
              category: z.string(),
              ingredients: z.array(z.string()),
              createdAt: z.string(),
            })
          ),
          example: [
            {
              id: 1,
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
  const response = await Effect.runPromise(
    Effect.provide(
      findAll,
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
            id: z.number().int().positive(),
            name: z.string(),
            manufacturer: z.string(),
            category: z.string(),
            ingredients: z.array(z.string()),
            createdAt: z.string(),
          }),
          example: {
            id: 1,
            name: 'スーパーすべすべクリーム',
            manufacturer: 'すべっすべ株式会社',
            category: 'skin_care',
            ingredients: ['Ingredient 1', 'Ingredient 2'],
            createdAt: '2023-01-01T00:00:00Z',
          },
        },
      },
    },
    ...errorResponses([
      HttpErrorCodes.NOT_FOUND,
      HttpErrorCodes.INTERNAL_SERVER_ERROR,
    ]),
  },
});

products.openapi(getProductByIdRoute, async (c) => {
  const { id } = c.req.param();
  const failureOrSuccess = await Effect.runPromise(
    Effect.provide(
      Effect.either(findById(id)),
      Layer.provide(ProductRepositoryLive, DatabaseConnectionLive)
    )
  );

  if (Either.isLeft(failureOrSuccess)) {
    const err = failureOrSuccess.left;
    if (err instanceof NotFound) {
      return notFoundError(c, err);
    }
    return internalServerError(c, err);
  }

  const product = failureOrSuccess.right;
  return c.json(product);
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
              id: 1,
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

  const failureOrSuccess = await Effect.runPromise(
    Effect.provide(
      Effect.either(save(data)),
      Layer.provide(ProductRepositoryLive, DatabaseConnectionLive)
    )
  );

  if (Either.isLeft(failureOrSuccess)) {
    const err = failureOrSuccess.left;
    return internalServerError(c, err);
  }

  const response = failureOrSuccess.right;
  return c.json(
    {
      message: response.message,
      product: {
        id: response.product.id,
        name: response.product.name,
        manufacturer: response.product.manufacturer,
        category: response.product.category,
        ingredients: response.product.ingredients,
        createdAt: response.product.createdAt,
      },
    },
    200
  );
});
