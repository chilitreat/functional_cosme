import { Hono } from 'hono';

export const products = new Hono().basePath('/products');
// 商品一覧取得
products.get('/', async (c) => {
  // TODO: 実装する
  return c.json({ message: 'Not implemented' });
});
// 商品詳細取得
products.get('/:id', async (c) => {
  // TODO: 実装する
  return c.json({ message: 'Not implemented' });
});
// 商品登録(管理者専用)
products.post('/', async (c) => {
  // TODO: 実装する
  return c.json({ message: 'Not implemented' });
});
