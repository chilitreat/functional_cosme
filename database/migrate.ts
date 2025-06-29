import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { databaseConnection } from '../src/db/db';

await migrate(databaseConnection, { migrationsFolder: './migrations' });
