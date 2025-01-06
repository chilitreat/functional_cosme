import { zValidator } from '@hono/zod-validator';
import { Either } from 'effect';
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../../db/db';
import * as schema from '../../db/schema';
import { createUser, NotResisterdUser, User } from '../../domain/user';
import { jwt, sign } from 'hono/jwt';
import { eq } from 'drizzle-orm';

const jwtSecret = process.env.JWT_SECRET || 'secret';

export const users = new Hono().basePath('/users');
users.get('/', jwt({
    secret: jwtSecret,
  }), async (c) => {
  const users = await db.select().from(schema.users).execute();
  return c.json({users});
});
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

// ユーザー登録
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

// --- 型定義 ---
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ログイン
users.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const found = await db
    .select({ passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  if (found.length === 0) {
    c.status(401);
    return c.json({ message: 'Invalid email or password' });
  }
  
  if (!(await Bun.password.verify(password, found[0].passwordHash))) {
    c.status(401);
    return c.json({ message: 'Invalid email or password' });
  }
  
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 5, // Token expires in 5 minutes
  };
  const token = await sign(payload, jwtSecret)
  return c.json({ message: 'Login successful', token });
});
