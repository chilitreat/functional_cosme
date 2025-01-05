import { Hono } from 'hono';
import { users, reviews, products } from './routes';

const api = new Hono().basePath('/api');

api.route('/', users);
api.route('/', reviews);
api.route('/', products);

export { api };
