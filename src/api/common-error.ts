import { z } from '@hono/zod-openapi';

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

const ErrorSchema = z.object({
  message: z.string(),
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
        },
      },
    },
  },
};
