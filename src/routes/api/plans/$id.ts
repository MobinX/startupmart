import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/src/db';
import { createServices } from '@/src/services';
import { getAuthUser } from '@/src/lib/auth-middleware';
import { env } from 'cloudflare:workers';

export const Route = createFileRoute('/api/plans/$id')({
  server: {
    handlers: {
      // GET /api/plans/:id - Get a specific plan
      GET: async ({ params }) => {
        const planId = parseInt(params.id, 10);
        if (isNaN(planId)) {
          return json({ error: 'Invalid plan ID' }, { status: 400 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const result = await services.plan.getPlanById(planId);

        return json(result, { status: result.status });
      },

      // PUT /api/plans/:id - Update a plan (admin only in production)
      PUT: async ({ request, params }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        // TODO: Add admin role check in production
        // if (user.role !== 'admin') {
        //   return json({ error: 'Admin access required' }, { status: 403 });
        // }

        const planId = parseInt(params.id, 10);
        if (isNaN(planId)) {
          return json({ error: 'Invalid plan ID' }, { status: 400 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const body = await request.json();
        const result = await services.plan.updatePlan(planId, body);

        return json(result, { status: result.status });
      },

      // DELETE /api/plans/:id - Delete a plan (admin only in production)
      DELETE: async ({ request, params }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        // TODO: Add admin role check in production
        // if (user.role !== 'admin') {
        //   return json({ error: 'Admin access required' }, { status: 403 });
        // }

        const planId = parseInt(params.id, 10);
        if (isNaN(planId)) {
          return json({ error: 'Invalid plan ID' }, { status: 400 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const result = await services.plan.deletePlan(planId);

        return json(result, { status: result.status });
      },
    },
  },
});
