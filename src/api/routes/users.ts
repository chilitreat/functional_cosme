import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  badRequestError,
  errorResponses,
  HttpErrorCodes,
  internalServerError,
  unauthorizedError,
} from '../common-error';
import { jwtAuth, jwtSign } from '../jwt-auth';
import {
  registerUser,
  getAllUsers,
  getUserByEmail,
} from '../../usecase/user';
import { verifyPassword } from '../../lib/utils';

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
  const usersResult = await getAllUsers();
  
  if (usersResult.isErr()) {
    return internalServerError(c, usersResult.error);
  }
  
  return c.json({
    users: usersResult.value.map((user) => ({
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
    const errorMessage = error?.issues?.map(issue => issue.message).join(', ') || 'Invalid input';
    return badRequestError(c, new Error(errorMessage));
  }
  
  const { name, email, password } = data;
  
  const userResult = await registerUser({ name, email, password });

  if (userResult.isErr()) {
    // Email already exists error handling
    if (userResult.error.message === 'Email already exists') {
      return badRequestError(c, userResult.error);
    }
    return internalServerError(c, userResult.error);
  }

  const user = userResult.value;
  return c.json({
    message: 'User registered',
    user: { id: user.userId, name: user.name, email: user.email },
  });
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
  
  const userResult = await getUserByEmail(email);
  
  if (userResult.isErr()) {
    return internalServerError(c, userResult.error);
  }
  
  if (!userResult.value) {
    return unauthorizedError(c, new Error('Invalid email or password'));
  }

  const user = userResult.value;
  const passwordVerification = await verifyPassword(password, user.passwordHash);

  if (passwordVerification.isErr() || !passwordVerification.value) {
    return unauthorizedError(c, new Error('Invalid email or password'));
  }

  const token = await jwtSign(user.userId);
  return c.json({ message: 'Login successful', token });
});
