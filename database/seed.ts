import { databaseConnection } from '../src/db/db';
import * as schema from '../src/db/schema';
import bcrypt from 'bcrypt';

const hash = await bcrypt.hash('password', 10);

console.log(`Seeding started...`);

console.log('Inserting users...');
await databaseConnection.insert(schema.users).values([
  {
    userId: 1,
    name: 'Alice',
    email: 'alice@example.com',
    passwordHash: hash,
  },
  {
    userId: 2,
    name: 'Bob',
    email: 'bob@example.com',
    passwordHash: hash,
  },
  {
    userId: 3,
    name: 'Charlie',
    email: 'charlie@example.com',
    passwordHash: hash,
  },
]);
console.log('Inserted users.');

console.log('Inserting products...');

await databaseConnection.insert(schema.products).values([
  {
    productId: 1,
    name: 'Product 1',
    manufacturer: 'Manufacturer 1',
    category: 'skin_care',
    ingredients: 'Ingredient 1,Ingredient 2',
  },
  {
    productId: 2,
    name: 'Product 2',
    manufacturer: 'Manufacturer 2',
    category: 'skin_care',
    ingredients: 'Ingredient 3,Ingredient 4',
  },
  {
    productId: 3,
    name: 'Product 3',
    manufacturer: 'Manufacturer 3',
    category: 'skin_care',
    ingredients: 'Ingredient 5,Ingredient 6',
  },
]);
console.log('Inserted products.');


console.log(`Seeding complete.`);
