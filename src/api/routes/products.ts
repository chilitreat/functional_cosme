import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { jwt } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { db } from '../../db/db';
import * as schema from '../../db/schema';
import { createProduct, Product } from '../../domain/product'; 
import { badRequestError, errorResponses, HttpErrorCodes, internalServerError, notFoundError, unauthorizedError } from '../common-error';

import { Context, Next } from 'hono';
import { Effect } from 'effect';

const jwtSecret = process.env.JWT_SECRET || 'secret';
const jwtAuth = () => (c: Context, next: Next) => jwt({ secret: jwtSecret })(c, next);

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
  const result = await db.select().from(schema.products).execute();
  const products: Product[] = result.map((p) => ({
    productId: p.productId,
    name: p.name,
    manufacturer: p.manufacturer,
    category: p.category,
    ingredients: p.ingredients.split(','),
    createdAt: new Date(p.createdAt),
  }));
  return c.json(products);
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
  const result = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.productId, Number(id)))
    .execute();
  if (result.length === 0) {
    return notFoundError(c, new Error('Product not found'));
  }
  const product: Product = result.map((p) => ({
    id: p.productId.toString(),
    name: p.name,
    manufacturer: p.manufacturer,
    category: p.category,
    ingredients: p.ingredients.split(','),
    createdAt: p.createdAt,
  }))[0];

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
    ...errorResponses([HttpErrorCodes.BAD_REQUEST, HttpErrorCodes.INTERNAL_SERVER_ERROR]),
  },
});

products.openapi(postProductRoute, async (c) => {
  const { success, error, data } = z.object({
    name: z.string(),
    manufacturer: z.string(),
    category: z.string(),
    ingredients: z.array(z.string()),
  }).safeParse(await c.req.json());
  if (!success || !data) {
    return badRequestError(c, error);
  }
  const { name, manufacturer, category, ingredients } = data;
  const product = createProduct({ name, manufacturer, category: category, ingredients });
  return Effect.runPromise(
    Effect.match(product, {
      onFailure: (err) => {
        return badRequestError(c, new Error(`Invalid product data: ${err.type}`));
      },
      onSuccess: async (product) => {
        const productDto = { ...product, ingredients: product.ingredients.join(','), createdAt: product.createdAt.toISOString() };
        const result = await db.insert(schema.products)
          .values(productDto)
          .returning({ id: schema.products.productId })
          .execute();
        const insertedProductId = result[0].id;
        return c.json({ message: 'Product registered', product: { id: insertedProductId, ...product } });
      },
    })
  );
});
