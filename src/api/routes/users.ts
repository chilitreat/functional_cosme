import { zValidator } from '@hono/zod-validator';
import { Either } from 'effect';
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../../db/db';
import * as schema from '../../db/schema';
import { createUser, NotResisterdUser, User } from '../../domain/user';

export const users = new Hono().basePath('/users');
users.get('/', async (c) => {
  const users = await db.select().from(schema.users).execute();
  return c.json(users);
});
// ユーザー登録
// --- 型定義 ---
const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

type UserInput = z.infer<typeof UserSchema>;

const saveUserToDB = async (user: NotResisterdUser) =>
  db
    .insert(schema.users)
    .values({
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
    })
    .returning();

users.post('/register', zValidator('json', UserSchema), async (c) => {
  const { success, error, data } = UserSchema.safeParse(await c.req.json());
  if (!success || !data) {
    c.status(400);
    return c.json({ message: 'Invalid input', cause: error.errors });
  }
  const { name, email, password } = data;
  const either = await createUser({ name, email, password })
  if (Either.isLeft(either)) {
    c.status(500);
    return c.json({ message: 'Failed to create user', cause: either.left.message });
  }
  const registeredUser = await saveUserToDB(either.right);
  return c.json({ message: 'User registered', user: registeredUser });
});

// ログイン
users.post('/login', async (c) => {
  // TODO: 実装する
  return c.json({ message: 'Not implemented' });
});
