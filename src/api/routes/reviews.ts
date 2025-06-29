import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  badRequestError,
  errorResponses,
  HttpErrorCodes,
  internalServerError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
} from '../common-error';
import { jwtAuth } from '../jwt-auth';
import { erase, findByProductId, findById, save } from '../../usecase/review';

export const reviews = new OpenAPIHono();

// 商品ID指定してクチコミ一覧取得
const getReviewByProductIdRoute = createRoute({
  method: 'get',
  path: '/reviews',
  tags: ['reviews'],
  parameters: [
    {
      name: 'productId',
      in: 'query',
      required: true,
      schema: { type: 'number', format: 'int32', minimum: 1 },
    },
  ],
  responses: {
    200: {
      description: 'List of reviews',
      content: {
        'application/json': {
          schema: z.object({
            reviews: z.array(
              z.object({
                reviewId: z.string(),
                productId: z.number(),
                userId: z.number(),
                rating: z.number(),
                comment: z.string(),
                createdAt: z.string(),
              })
            ),
            message: z.string(),
          }),
          example: {
            reviews: [
              {
                reviewId: '123e4567-e89b-12d3-a456-426614174000',
                productId: 1,
                userId: 1,
                rating: 5,
                comment: 'Great product!',
                createdAt: new Date().toISOString(),
              },
              {
                reviewId: '123e4567-e89b-12d3-a456-426614174001',
                productId: 1,
                userId: 2,
                rating: 4,
                comment: 'Good value for money.',
                createdAt: new Date().toISOString(),
              },
            ],
            message: 'Reviews retrieved successfully',
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

reviews.openapi(getReviewByProductIdRoute, async (c) => {
  const { productId } = c.req.query();
  
  // productIdの検証
  const numericProductId = Number(productId);
  if (!productId || isNaN(numericProductId) || numericProductId <= 0) {
    return badRequestError(c, new Error('Invalid or missing productId parameter'));
  }
  
  const reviews = await findByProductId(numericProductId);
  if (reviews.isErr()) {
    return internalServerError(c, reviews.error);
  }
  return c.json({
    reviews: reviews.value.map((review) => ({
      reviewId: review.reviewId,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    })),
    message: 'Reviews retrieved successfully',
  });
});

const postReviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().min(1).max(7),
  comment: z.string().optional(),
});

const postReviewRoute = createRoute({
  method: 'post',
  path: '/reviews',
  tags: ['reviews'],
  middleware: [jwtAuth()] as const,
  request: {
    body: {
      content: {
        'application/json': {
          schema: postReviewSchema,
          example: {
            productId: 1,
            rating: 5,
            comment: 'Great product!',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Review registered',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            review: z.object({
              reviewId: z.string(),
              productId: z.number(),
              userId: z.number(),
              rating: z.number(),
              comment: z.string().optional(),
              createdAt: z.string(),
            }),
          }),
          example: {
            message: 'Review registered',
            review: {
              reviewId: '123e4567-e89b-12d3-a456-426614174000',
              productId: 1,
              userId: 1,
              rating: 5,
              comment: 'Great product!',
              createdAt: new Date().toISOString(),
            },
          },
        },
      },
    },
    ...errorResponses([
      HttpErrorCodes.BAD_REQUEST,
      HttpErrorCodes.UNAUTHORIZED,
      HttpErrorCodes.FORBIDDEN,
      HttpErrorCodes.INTERNAL_SERVER_ERROR,
    ]),
  },
});

// クチコミ登録
reviews.openapi(postReviewRoute, async (c) => {
  const { success, error, data } = postReviewSchema.safeParse(
    await c.req.json()
  );
  if (!success) {
    return badRequestError(c, error);
  }
  const { productId, rating, comment } = data;
  const userId = c.get('userId') as number | undefined;
  if (!userId) {
    // ユーザーIDがJWTに含まれていない場合、401エラーを返す
    return unauthorizedError(c, new Error('User ID not found in JWT'));
  }
  const result = await save({
    productId,
    userId,
    rating,
    comment: comment ?? '',
  });
  if (result.isErr()) {
    // 外部キー制約エラー（存在しない商品/ユーザー）は404として処理
    if (result.error.message.includes('Product or User not found')) {
      return notFoundError(c, result.error);
    }
    return internalServerError(c, result.error);
  }
  return c.json({
    message: 'Review registered',
    review: {
      reviewId: result.value.reviewId,
      productId: result.value.productId,
      userId: result.value.userId,
      rating: result.value.rating,
      comment: result.value.comment,
      createdAt: result.value.createdAt.toISOString(),
    },
  });
});

const deleteReviewRoute = createRoute({
  method: 'delete',
  path: '/reviews/:id',
  tags: ['reviews'],
  middleware: [jwtAuth()] as const,
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
    },
  ],
  responses: {
    200: {
      description: 'Review deleted',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
          example: {
            message: 'Review deleted successfully',
          },
        },
      },
    },
    ...errorResponses([
      HttpErrorCodes.UNAUTHORIZED,
      HttpErrorCodes.FORBIDDEN,
      HttpErrorCodes.NOT_FOUND,
      HttpErrorCodes.INTERNAL_SERVER_ERROR,
    ]),
  },
});

reviews.openapi(deleteReviewRoute, async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId') as number | undefined;
  if (!userId) {
    return unauthorizedError(c, new Error('User ID not found in JWT'));
  }

  // レビューの存在確認と所有者チェック
  try {
    const reviewResult = await findById(id);
    if (reviewResult.isErr()) {
      return internalServerError(c, reviewResult.error);
    }
    
    const review = reviewResult.value;
    if (!review) {
      return notFoundError(c, new Error('Review not found'));
    }
    
    if (review.userId !== userId) {
      return forbiddenError(c, new Error('You are not authorized to delete this review'));
    }

    const result = await erase(id);
    if (result.isErr()) {
      return internalServerError(c, result.error);
    }
    return c.json({ message: 'Review deleted successfully' });
  } catch (error) {
    // UUIDバリデーションエラーなどはBad Requestとして処理
    if (error instanceof Error && error.message.includes('Invalid review ID format')) {
      return badRequestError(c, error);
    }
    return internalServerError(c, error as Error);
  }
});
