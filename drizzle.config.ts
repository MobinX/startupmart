import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  // The following dbCredentials are for local development only.
  // For production D1 usage, configure the URL according to your wrangler.jsonc settings.
  dbCredentials: {
    url: 'file:./sqlite.db',
  },
});