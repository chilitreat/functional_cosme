import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './migrations',
  schema: './src/db/schema.ts', // スキーマファイルのパス
  dialect: 'sqlite',
  dbCredentials: {
    url: './database/database.sqlite', // SQLiteファイルのパス
  },
});
