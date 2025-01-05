import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { showRoutes } from 'hono/dev';
import { api } from './api';

const app = new Hono();
app.use(logger());

app.route('/', api);

showRoutes(app, {
  verbose: true,
});

export default app;