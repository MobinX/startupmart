import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/db';
import { createServices } from '@/services';
import { getAuthUser } from '@/lib/auth-middleware';
import { env } from 'cloudflare:workers';

export const Route = createFileRoute('/api/startups/')({
  server: {
    handlers: {
      // GET /api/startups - List startups (public view for investors)
      GET: async ({ request }) => {
        const user = await getAuthUser(request);
        const db = createDb(env?.DB as D1Database);
        const services = createServices(db);

        // Get query parameters for filtering
        const url = new URL(request.url);
        const filters = {
          industry: url.searchParams.get('industry') || undefined,
          minTeamSize: url.searchParams.get('minTeamSize') ? parseInt(url.searchParams.get('minTeamSize')!) : undefined,
          maxTeamSize: url.searchParams.get('maxTeamSize') ? parseInt(url.searchParams.get('maxTeamSize')!) : undefined,
          sellEquity: url.searchParams.get('sellEquity') === 'true' ? true : url.searchParams.get('sellEquity') === 'false' ? false : undefined,
          sellBusiness: url.searchParams.get('sellBusiness') === 'true' ? true : url.searchParams.get('sellBusiness') === 'false' ? false : undefined,
        };

        const result = await services.startup.getPublicStartups(filters);
        
        if (result.error) {
           return json(result, { status: result.status });
        }

        const startups = result.startups;

        // For premium users, include contact info
        const isPremium = user?.currentPricingPlan === 'premium';
        if (isPremium && startups) {
          const startupsWithContacts = await Promise.all(
            startups.map(async (startup) => {
              const detailsResult = await services.startup.getStartupById(startup.id, user);
              if (detailsResult.startup) {
                 return {
                   ...startup,
                   contacts: detailsResult.startup.contacts,
                 };
              }
              return startup;
            })
          );
          return json(startupsWithContacts);
        }

        return json(startups);
      },

      // POST /api/startups - Create a new startup profile
      POST: async ({ request }) => {
        try {
          const user = await getAuthUser(request);
          if (!user) {
            return json({ error: 'Authentication required' }, { status: 401 });
          }

          if (user.role !== 'startup_owner') {
            return json({ error: 'Only startup owners can create startup profiles' }, { status: 403 });
          }

          const db = createDb(env?.DB as D1Database);
          const services = createServices(db);

          const body = await request.json();
          
          const result = await services.startup.createStartup(user.id, body);

          return json(result, { status: result.status });
        } catch (error) {
          console.log('Unhandled error in POST /startups:', error);
          return json({ error: 'Internal server error' }, { status: 500 });
        }
      },
    },
  },
});