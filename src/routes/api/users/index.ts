import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/db';
import { createServices } from '@/services';
import { getAuthUser } from '@/lib/auth-middleware';
import { z } from 'zod';
import { ValidationError, NotFoundError, AuthorizationError, ConflictError, DatabaseError } from '@/lib/errors';
import { env } from 'cloudflare:workers';

const updateUserProfileSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['startup_owner', 'investor']).optional(),
});

const updatePricingPlanSchema = z.object({
  plan: z.enum(['free', 'premium']),
});

export const Route = createFileRoute('/api/users/')({
  server: {
    handlers: {
      // GET /api/users/me - Get current user profile
      GET: async ({ request }) => {
        try {
          const user = await getAuthUser(request);
          if (!user) {
            return json({ error: 'Authentication required' }, { status: 401 });
          }

          const db = createDb(env?.DB as D1Database);
          const services = createServices(db);

          const userProfile = await services.user.getUserById(user.id);
          const stats = await services.user.getUserStats(user.id);

          return json({ ...userProfile, stats });
        } catch (error) {
          console.log('Error fetching user profile:', error);
          if (error instanceof NotFoundError) {
            return json({ error: error.message }, { status: 404 });
          }
          return json({ error: 'Failed to fetch user profile' }, { status: 500 });
        }
      },

      // PUT /api/users/me - Update current user profile
      PUT: async ({ request }) => {
        try {
          const user = await getAuthUser(request);
          if (!user) {
            return json({ error: 'Authentication required' }, { status: 401 });
          }

          const db = createDb(env?.DB as D1Database);
          const services = createServices(db);

          const body = await request.json();
          const validatedData = updateUserProfileSchema.parse(body);

          const updatedUser = await services.user.updateUserProfile(user.id, validatedData);

          return json({ user: updatedUser, message: 'Profile updated successfully' });
        } catch (error) {
          console.log('Error updating user profile:', error);
          if (error instanceof z.ZodError) {
            return json({ error: 'Invalid data', details: error.errors }, { status: 400 });
          }
          if (error instanceof ValidationError) {
            return json({ error: error.message, details: error.details }, { status: 400 });
          }
          if (error instanceof NotFoundError) {
            return json({ error: error.message }, { status: 404 });
          }
          if (error instanceof AuthorizationError) {
            return json({ error: error.message }, { status: 403 });
          }
          return json({ error: 'Failed to update user profile' }, { status: 500 });
        }
      },
    },
  },
});
