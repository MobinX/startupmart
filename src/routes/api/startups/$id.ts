import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/db';
import { createServices } from '@/services';
import { getAuthUser } from '@/lib/auth-middleware';
import { env } from 'cloudflare:workers';

export const Route = createFileRoute('/api/startups/$id')({
  server: {
    handlers: {
      // GET /api/startups/:id - Get a specific startup with all details
      GET: async ({ request, params }) => {
        const user = await getAuthUser(request);
        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const startupId = parseInt((params as any).id);
        if (isNaN(startupId)) {
          return json({ error: 'Invalid startup ID' }, { status: 400 });
        }

        const result = await services.startup.getStartupById(startupId, user || undefined);
        return json(result, { status: result.status });
      },

      // PUT /api/startups/:id - Update a startup profile
      PUT: async ({ request, params }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const startupId = parseInt((params as any).id);
        if (isNaN(startupId)) {
          return json({ error: 'Invalid startup ID' }, { status: 400 });
        }

        const body = await request.json();
        
        const result = await services.startup.updateStartup(startupId, user.id, body);

        return json(result, { status: result.status });
      },

      // DELETE /api/startups/:id - Delete a startup profile
      DELETE: async ({ request, params }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const startupId = parseInt((params as any).id);
        if (isNaN(startupId)) {
          return json({ error: 'Invalid startup ID' }, { status: 400 });
        }

        const result = await services.startup.deleteStartup(startupId, user.id);

        return json(result, { status: result.status });
      },
    },
  },
});