import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/db';
import { createServices } from '@/services';
import { getAuthUser } from '@/lib/auth-middleware';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { env } from 'cloudflare:workers';
const updatePricingPlanSchema = z.object({
  plan: z.enum(['free', 'premium']),
});

export const Route = createFileRoute('/api/users/plan')({
  server: {
    handlers: {
      // PUT /api/users/plan - Update user pricing plan
      PUT: async ({ request }) => {
        try {
          const user = await getAuthUser(request);
          if (!user) {
            return json({ error: 'Authentication required' }, { status: 401 });
          }

          const db = createDb(env?.DB as D1Database);
          const services = createServices(db);

          const body = await request.json();
          const validatedData = updatePricingPlanSchema.parse(body);

          const updatedUser = await services.user.updatePricingPlan(user.id, validatedData.plan);

          return json({ user: updatedUser, message: 'Pricing plan updated successfully' });
        } catch (error) {
          console.log('Error updating pricing plan:', error);
          if (error instanceof z.ZodError) {
            return json({ error: 'Invalid data', details: error.errors }, { status: 400 });
          }
          if (error instanceof ValidationError) {
            return json({ error: error.message, details: error.details }, { status: 400 });
          }
          if (error instanceof NotFoundError) {
            return json({ error: error.message }, { status: 404 });
          }
          return json({ error: 'Failed to update pricing plan' }, { status: 500 });
        }
      },
    },
  },
});
