import { Hono } from 'hono';

export const reviews = new Hono().basePath('/reviews');
// 商品ID指定してクチコミ一覧取得
reviews.get('/', async (c) => {
  // TODO: 実装する(?productId=:id)
  return c.json({ message: 'Not implemented' });
});
// クチコミ登録
reviews.post('/', async (c) => {
  // TODO: 実装する
  return c.json({ message: 'Not implemented' });
});
// クチコミ削除
reviews.delete('/:id', async (c) => {
  // TODO: 実装する
  return c.json({ message: 'Not implemented' });
});
