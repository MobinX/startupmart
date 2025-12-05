import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/db';
import { createServices } from '@/services';
import { getAuthUser } from '@/lib/auth-middleware';
import { z } from 'zod';
import { ValidationError, NotFoundError, AuthorizationError, ConflictError, DatabaseError } from '@/lib/errors';
import { env } from 'cloudflare:workers';

const favoriteSchema = z.object({
  startupId: z.number().int().positive(),
});

export const Route = createFileRoute('/api/favorites/')({
  server: {
    handlers: {
      // GET /api/favorites - Get user's favorite startups
      GET: async ({ request }) => {
        try {
          const user = await getAuthUser(request);
          if (!user) {
            return json({ error: 'Authentication required' }, { status: 401 });
          }

          const db = createDb(env?.DB as D1Database);
          const services = createServices(db);

          const favorites = await services.favorites.getFavorites(user.id);

          return json(favorites);
        } catch (error) {
          console.error('Error fetching favorites:', error);
          if (error instanceof NotFoundError) {
            return json({ error: error.message }, { status: 404 });
          }
          return json({ error: 'Failed to fetch favorites' }, { status: 500 });
        }
      },

      // POST /api/favorites - Add a startup to favorites
      POST: async ({ request }) => {
        try {
          const user = await getAuthUser(request);
          if (!user) {
            return json({ error: 'Authentication required' }, { status: 401 });
          }

          const db = createDb(env?.DB as D1Database);
          const services = createServices(db);

          const body = await request.json();
          const validatedData = favoriteSchema.parse(body);

          await services.favorites.addFavorite(user.id, validatedData.startupId);

          return json({ message: 'Startup added to favorites' });
        } catch (error) {
          console.error('Error adding favorite:', error);
          if (error instanceof z.ZodError) {
            return json({ error: 'Invalid data', details: error.errors }, { status: 400 });
          }
          if (error instanceof NotFoundError) {
            return json({ error: error.message }, { status: 404 });
          }
          if (error instanceof ConflictError) {
            return json({ error: error.message }, { status: 409 });
          }
          return json({ error: 'Failed to add favorite' }, { status: 500 });
        }
      },

      // DELETE /api/favorites - Remove a startup from favorites
      DELETE: async ({ request }) => {
        try {
          const user = await getAuthUser(request);
          if (!user) {
            return json({ error: 'Authentication required' }, { status: 401 });
          }

          const db = createDb(env?.DB as D1Database);
          const services = createServices(db);

          const body = await request.json();
          const validatedData = favoriteSchema.parse(body);

          await services.favorites.removeFavorite(user.id, validatedData.startupId);

          return json({ message: 'Startup removed from favorites' });
        } catch (error) {
          console.error('Error removing favorite:', error);
          if (error instanceof z.ZodError) {
            return json({ error: 'Invalid data', details: error.errors }, { status: 400 });
          }
          if (error instanceof NotFoundError) {
            return json({ error: error.message }, { status: 404 });
          }
          return json({ error: 'Failed to remove favorite' }, { status: 500 });
        }
      },
    },
  },
});
