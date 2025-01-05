import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './migrations',
  schema: './src/db/schema.ts', // スキーマファイルのパス
  driver: 'sqlite',
  dbCredentials: {
    url: './database.sqlite', // SQLiteファイルのパス
  },
});
