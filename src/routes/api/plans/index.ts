import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/db';
import { createServices } from '@/services';
import { getAuthUser } from '@/lib/auth-middleware';
import { env } from 'cloudflare:workers';

export const Route = createFileRoute('/api/plans/')({
  server: {
    handlers: {
      // GET /api/plans - Get all plans
      GET: async ({ request }) => {
        const user = await getAuthUser(request);
        
        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const url = new URL(request.url);
        const planFor = url.searchParams.get('planFor') as 'investor' | 'startup_owner' | null;

        const result = await services.plan.getAllPlans(
          planFor || undefined,
          user?.id // Include user ID to check subscription status
        );

        return json(result, { status: result.status });
      },

      // POST /api/plans - Create a new plan (admin only in production)
      POST: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        // TODO: Add admin role check in production
        // if (user.role !== 'admin') {
        //   return json({ error: 'Admin access required' }, { status: 403 });
        // }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const body = await request.json();
        const result = await services.plan.createPlan(body);

        return json(result, { status: result.status });
      },
    },
  },
});
