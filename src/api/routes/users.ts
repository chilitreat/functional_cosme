import { Effect } from 'effect';
import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { db } from '../../db/db';
import * as schema from '../../db/schema';
import { createUser, NotResisterdUser, User } from '../../domain/user';
import { jwt, sign } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { badRequestError, errorResponses, HttpErrorCodes, internalServerError, unauthorizedError } from '../common-error';

const jwtSecret = process.env.JWT_SECRET || 'secret';
const jwtAuth = () => (c: Context, next: Next) =>
  jwt({ secret: jwtSecret })(c, next);

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
  const users = await db.select().from(schema.users).execute();
  return c.json({ users });
});
// --- 型定義 ---
const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

type UserInput = z.infer<typeof UserSchema>;

const saveUserToDB = async (user: NotResisterdUser) =>
  db
    .insert(schema.users)
    .values({
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
    })
    .returning();

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
  const user = createUser({ name, email, password });
  return Effect.runPromise(
    Effect.match(user, {
      onFailure: (err) => {
        return internalServerError(c, err);
      },
      onSuccess: async (user) => {
        const registeredUser = await saveUserToDB(user);
        return c.json({ message: 'User registered', user: registeredUser });
      },
    })
  );
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
  const found = await db
    .select({ passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (found.length === 0) {
    return unauthorizedError(c, new Error('Invalid email or password'));
  }

  if (!(await Bun.password.verify(password, found[0].passwordHash))) {
    return unauthorizedError(c, new Error('Invalid email or password'));
  }

  const payload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 5, // Token expires in 5 minutes
  };
  const token = await sign(payload, jwtSecret);
  return c.json({ message: 'Login successful', token });
});
