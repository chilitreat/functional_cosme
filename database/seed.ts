import { db } from '../src/db/db';
import * as schema from '../src/db/schema';

const hash = await Bun.password.hash('password');

await db.insert(schema.users).values([
  {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    passwordHash: hash,
  },
  {
    id: 2,
    name: 'Bob',
    email: 'bob@example.com',
    passwordHash: hash,
  },
  {
    id: 3,
    name: 'Charlie',
    email: 'charlie@example.com',
    passwordHash: hash,
  },
]);

console.log(`Seeding complete.`);
