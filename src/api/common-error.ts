import { z } from '@hono/zod-openapi';
import { cause } from 'effect/Effect';
import { Context } from 'hono';

export const HttpErrorCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

type HttpErrorCodes = (typeof HttpErrorCodes)[keyof typeof HttpErrorCodes];

export const errorResponses = (status?: HttpErrorCodes[]) => ({
  ...status?.reduce(
    (acc, s) => ({ ...acc, [s]: defaultErrorResponses[s] }),
    {}
  ),
});

export const badRequestError = (c: Context, e: Error) => {
  c.status(HttpErrorCodes.BAD_REQUEST);
  return c.json({ message: e.message, cause: e.cause });
}

export const unauthorizedError = (c: Context, e: Error) => {
  c.status(HttpErrorCodes.UNAUTHORIZED);
  return c.json({ message: e.message, cause: e.cause });
}

export const forbiddenError = (c: Context, e: Error) => {
  c.status(HttpErrorCodes.FORBIDDEN);
  return c.json({ message: e.message, cause: e.cause });
}

export const notFoundError = (c: Context, e: Error) => {
  c.status(HttpErrorCodes.NOT_FOUND);
  return c.json({ message: e.message, cause: e.cause });
}

export const internalServerError = (c: Context, e: Error) => {
  c.status(HttpErrorCodes.INTERNAL_SERVER_ERROR);
  return c.json({ message: e.message, cause: e.cause });
}

const ErrorSchema = z.object({
  message: z.string(),
  cause: z.string().optional(),
});

const defaultErrorResponses: Record<
  HttpErrorCodes,
  { description: string; content: any }
> = {
  [HttpErrorCodes.BAD_REQUEST]: {
    description: 'Invalid input',
    content: {
      'application/json': {
        schema: z.object({
          success: z.boolean(),
          error: z.object({
            name: z.string(),
            issues: z.array(
              z.object({
                code: z.string(),
                expected: z.string(),
                received: z.string(),
                path: z.array(z.string()),
                message: z.string(),
              })
            ),
          }),
        }),
        example: {
          success: false,
          error: {
            name: 'ZodError',
            issues: [
              {
                code: 'invalid_type',
                expected: 'string',
                received: 'number',
                path: ['name'],
                message: 'Required',
              },
            ],
          },
        },
      },
    },
  },
  [HttpErrorCodes.UNAUTHORIZED]: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: ErrorSchema,
        example: {
          message: 'Unauthorized',
        },
      },
    },
  },
  [HttpErrorCodes.FORBIDDEN]: {
    description: 'Forbidden',
    content: {
      'application/json': {
        schema: ErrorSchema,
        example: {
          message: 'Forbidden',
        },
      },
    },
  },
  [HttpErrorCodes.NOT_FOUND]: {
    description: 'Not found',
    content: {
      'application/json': {
        schema: ErrorSchema,
        example: {
          message: 'Not found',
        },
      },
    },
  },
  [HttpErrorCodes.INTERNAL_SERVER_ERROR]: {
    description: 'Internal server error',
    content: {
      'application/json': {
        schema: ErrorSchema,
        example: {
          message: 'Internal server error',
          cause: 'Error: Something went wrong',
        },
      },
    },
  },
};
