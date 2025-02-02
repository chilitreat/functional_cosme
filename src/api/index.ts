import { OpenAPIHono } from '@hono/zod-openapi';
import { users, reviews, products } from './routes';

const api = new OpenAPIHono({});

api.route('/api', users);
api.route('/api', reviews);
api.route('/api', products);

export { api };
