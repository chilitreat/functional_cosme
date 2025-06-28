import { Context, Next } from 'hono';
import { jwt, sign } from 'hono/jwt';
import { unauthorizedError } from './common-error';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

export const jwtAuth = () => async (c: Context, next: Next) => {
  // JWT認証を実行
  await jwt({ secret: jwtSecret })(c, async () => {
    // トークンからユーザーIDを復元
    const payload = c.get('jwtPayload');
    const userId = payload?.user?.id; // JWTペイロードに`id`が含まれていると仮定
    if (!userId) {
      unauthorizedError(c, new Error('User ID not found in JWT'));
      return;
    }

    // ユーザーIDをコンテキストに保存
    c.set('userId', userId);

    // 次のミドルウェアまたはルートハンドラを実行
    await next();
  });
};

export const jwtSign = (userId: number) => {
  const payload = {
    user: { id: userId },
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // Token expires in 24 hours
  };
  // JWTトークンを生成
  return sign(payload, jwtSecret);
};
