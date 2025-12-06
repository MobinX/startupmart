import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/db';
import { createServices } from '@/services';
import { getAuthUser } from '@/lib/auth-middleware';
import { env } from 'cloudflare:workers';

export const Route = createFileRoute('/api/favorites/')({
  server: {
    handlers: {
      // GET /api/favorites - Get user's favorite startups
      GET: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const result = await services.favorites.getFavorites(user.id);

        return json(result, { status: result.status });
      },

      // POST /api/favorites - Add a startup to favorites
      POST: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const body = await request.json();
        
        const result = await services.favorites.addFavorite(user.id, body);

        return json(result, { status: result.status });
      },

      // DELETE /api/favorites - Remove a startup from favorites
      DELETE: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const body = await request.json();
        
        const result = await services.favorites.removeFavorite(user.id, body);

        return json(result, { status: result.status });
      },
    },
  },
});
