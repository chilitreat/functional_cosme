import { z } from '@hono/zod-openapi';
import { Data } from 'effect';
import { Context } from 'hono';

export const HttpErrorCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

type HttpErrorCodes = (typeof HttpErrorCodes)[keyof typeof HttpErrorCodes];

export class Unauthorized extends Data.TaggedError('Unauthorized') {
  constructor(public readonly message: string) {
    super();
  }
}
export class Forbidden extends Data.TaggedError('Forbidden') {
  constructor(public readonly message: string) {
    super();
  }
}
export class NotFound extends Data.TaggedError('NotFound') {
  constructor(public readonly message: string) {
    super();
  }
}
export class BadRequest extends Data.TaggedError('BadRequest') {
  constructor(public readonly message: string) {
    super();
  }
}
export class InternalServerError extends Data.TaggedError(
  'InternalServerError'
) {
  constructor(public readonly message: string = 'Internal Server Error') {
    super();
  }
}

type ErrorResponse = {
  description: string;
  content: any;
};

type ErrorResponses<T extends HttpErrorCodes[]> = {
  [K in T[number]]: ErrorResponse;
};

export const errorResponses = <T extends HttpErrorCodes[]>(status: T = [] as unknown as T): ErrorResponses<T> => ({
  ...status.reduce(
    (acc, s) => ({ ...acc, [s]: defaultErrorResponses[s] }),
    {} as ErrorResponses<T>
  ),
});

export const badRequestError = (c: Context, e: Error) => {
  return c.json(
    { message: e.message, cause: e.cause },
    HttpErrorCodes.BAD_REQUEST
  );
};

export const unauthorizedError = (c: Context, e: Error) => {
  return c.json(
    { message: e.message, cause: e.cause },
    HttpErrorCodes.UNAUTHORIZED
  );
};

export const forbiddenError = (c: Context, e: Error) => {
  return c.json(
    { message: e.message, cause: e.cause },
    HttpErrorCodes.FORBIDDEN
  );
};

export const notFoundError = (c: Context, e: Error) => {
  return c.json(
    { message: e.message, cause: e.cause },
    HttpErrorCodes.NOT_FOUND
  );
};

export const internalServerError = (c: Context, e: Error) => {
  return c.json(
    { message: e.message, cause: e.cause },
    HttpErrorCodes.INTERNAL_SERVER_ERROR
  );
};

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
