import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/src/db';
import { createServices } from '@/src/services';
import { getAuthUser } from '@/src/lib/auth-middleware';
import { env } from 'cloudflare:workers';

export const Route = createFileRoute('/api/users/')({
  server: {
    handlers: {
      // GET /api/users/me - Get current user profile
      GET: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const userResult = await services.user.getUserById(user.id);
        if (userResult.error) {
          return json(userResult, { status: userResult.status });
        }

        const statsResult = await services.user.getUserStats(user.id);

        return json({ ...userResult.user, stats: statsResult.stats });
      },

      // PUT /api/users/me - Update current user profile
      PUT: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const body = await request.json();
        
        const result = await services.user.updateUserProfile(user.id, body);

        return json(result, { status: result.status });
      },
    },
  },
});
