import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { databaseConnection } from '../../db/db';
import * as schema from '../../db/schema';
import { User } from '../../domain';
import { eq } from 'drizzle-orm';
import {
  badRequestError,
  errorResponses,
  HttpErrorCodes,
  internalServerError,
  unauthorizedError,
} from '../common-error';
import { jwtAuth, jwtSign } from '../jwt-auth';

export const users = new OpenAPIHono();

const getUsersRoute = createRoute({
  method: 'get',
  path: '/users',
  tags: ['users'],
  middleware: [jwtAuth()] as const,
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'List of users',
      content: {
        'application/json': {
          schema: z.object({
            users: z.array(
              z.object({
                id: z.number(),
                name: z.string(),
                email: z.string(),
              })
            ),
          }),
          example: {
            users: [
              { id: 1, name: 'Alice', email: 'alice@example.com' },
              { id: 2, name: 'Bob', email: 'bob@example.com' },
            ],
          },
        },
      },
    },
    ...errorResponses([HttpErrorCodes.INTERNAL_SERVER_ERROR]),
  },
});

users.openapi(getUsersRoute, async (c) => {
  const users = await databaseConnection.select().from(schema.users).execute();
  return c.json({
    users: users.map((user) => ({
      id: user.userId,
      name: user.name,
      email: user.email,
    })),
  });
});
// --- 型定義 ---
const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

// ユーザー登録
const postRegisterRoute = createRoute({
  method: 'post',
  path: '/users/register',
  tags: ['users'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UserSchema,
          example: {
            name: 'Alice',
            email: 'alice@example.com',
            password: 'password123',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User registered',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            user: z.object({
              id: z.number(),
              name: z.string(),
              email: z.string(),
            }),
          }),
          example: {
            message: 'User registered',
            user: { id: 1, name: 'Alice', email: 'alice@example.com' },
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

users.openapi(postRegisterRoute, async (c) => {
  const { success, error, data } = UserSchema.safeParse(await c.req.json());
  if (!success || !data) {
    return badRequestError(c, error);
  }
  const { name, email, password } = data;
  const user = await User.create({ name, email, password });

  if (user.isErr()) {
    return internalServerError(c, user.error);
  }

  try {
    const registeredUser = await databaseConnection
      .insert(schema.users)
      .values({
        name: user.value.name,
        email: user.value.email,
        passwordHash: user.value.passwordHash,
      })
      .returning();

    const { userId, name, email } = registeredUser[0];
    return c.json({
      message: 'User registered',
      user: { id: userId, name, email },
    });
  } catch (error) {
    return internalServerError(c, error as Error);
  }
});

// --- 型定義 ---
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ログイン
const postLoginRoute = createRoute({
  method: 'post',
  path: '/users/login',
  tags: ['users'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginSchema,
          example: {
            email: 'alice@example.com',
            password: 'password123',
          },
        },
      },
    },
  },
  responses: {
    [200]: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            token: z.string(),
          }),
          example: {
            message: 'Login successful',
            token:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Mzg0ODIwNDR9.nQpDARztvx6asDBYl3DeR5UvJ_LrsQ-TPOKgwBTcd9Q',
          },
        },
      },
    },
    ...errorResponses([
      HttpErrorCodes.BAD_REQUEST,
      HttpErrorCodes.UNAUTHORIZED,
      HttpErrorCodes.INTERNAL_SERVER_ERROR,
    ]),
  },
});

users.openapi(postLoginRoute, async (c) => {
  const { email, password } = c.req.valid('json');
  const found = await databaseConnection
    .select({
      passwordHash: schema.users.passwordHash,
      userId: schema.users.userId,
    })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (found.length === 0) {
    return unauthorizedError(c, new Error('Invalid email or password'));
  }

  const { verifyPassword } = await import('../../lib/utils');
  const passwordVerification = await verifyPassword(password, found[0].passwordHash);
  
  if (passwordVerification.isErr() || !passwordVerification.value) {
    return unauthorizedError(c, new Error('Invalid email or password'));
  }

  const { userId } = found[0];
  const token = await jwtSign(userId);
  return c.json({ message: 'Login successful', token });
});
