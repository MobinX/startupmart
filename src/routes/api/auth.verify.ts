import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { getAuthUser } from '../../lib/auth-middleware';

export const Route = createFileRoute('/api/auth/verify')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await getAuthUser(request);

          if (!user) {
            return json({ error: 'Invalid token' }, { status: 401 });
          }

          return json({
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              currentPricingPlan: user.currentPricingPlan,
            }
          });
        } catch (error) {
          console.error('Auth verification error:', error);
          return json({ error: 'Authentication failed' }, { status: 500 });
        }
      },
    },
  },
});