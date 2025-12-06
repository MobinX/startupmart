import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/db';
import { createServices } from '@/services';
import { getAuthUser } from '@/lib/auth-middleware';
import { env } from 'cloudflare:workers';

export const Route = createFileRoute('/api/plans/subscribe')({
  server: {
    handlers: {
      // GET /api/plans/subscribe - Get user's active subscriptions
      GET: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const result = await services.plan.getUserPlans(user.id);

        return json(result, { status: result.status });
      },

      // POST /api/plans/subscribe - Subscribe to a plan
      POST: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const body = await request.json();
        const result = await services.plan.subscribeToPlan(user.id, body);

        return json(result, { status: result.status });
      },

      // DELETE /api/plans/subscribe - Unsubscribe from a plan
      DELETE: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json() as { planId?: number };
        const planId = body?.planId;

        if (!planId || typeof planId !== 'number') {
          return json({ error: 'Plan ID is required' }, { status: 400 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const result = await services.plan.unsubscribeFromPlan(user.id, planId);

        return json(result, { status: result.status });
      },
    },
  },
});
