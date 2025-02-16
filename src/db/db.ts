import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

const databaseFilePath = './database/database.sqlite';

const sqlite = new Database(databaseFilePath);
export const db = drizzle(sqlite);
