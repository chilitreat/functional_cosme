import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { logger } from 'hono/logger';
import { showRoutes } from 'hono/dev';
import { api } from './api';

const app = new OpenAPIHono();

app.use(logger());

app.route('/', api);

app
  .doc('/specification', (c) => ({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Functional cosme API',
      description: 'API for functional cosme',
    },
    servers: [
      {
        url: `${new URL(c.req.url).origin}/api/v1`,
        description: 'development server',
      },
      {
        url: `http://hogheoge-production.com/api/v1`,
        description: 'WIP: production server',
      },
    ],
    schemes: ['http'],
  }))
  .get(
    '/doc',
    swaggerUI({
      url: '/specification',
    })
  );

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});

showRoutes(app, {
  verbose: true,
});

export default app;
