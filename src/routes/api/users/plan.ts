import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/db';
import { createServices } from '@/services';
import { getAuthUser } from '@/lib/auth-middleware';
import { env } from 'cloudflare:workers';

export const Route = createFileRoute('/api/users/plan')({
  server: {
    handlers: {
      // PUT /api/users/plan - Update user pricing plan
      PUT: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) {
          return json({ error: 'Authentication required' }, { status: 401 });
        }

        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        const body = await request.json();
        
        const result = await services.user.updatePricingPlan(user.id, body);

        return json(result, { status: result.status });
      },
    },
  },
});
