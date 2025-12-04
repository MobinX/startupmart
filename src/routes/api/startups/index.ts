import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '../../../db';
import { createServices } from '../../../services';
import { getAuthUser } from '../../../lib/auth-middleware';
import { z } from 'zod';

const createStartupSchema = z.object({
  startup: z.object({
    name: z.string().min(1),
    industry: z.string().min(1),
    yearFounded: z.number().int().min(1900).max(new Date().getFullYear()),
    description: z.string().min(1),
    websiteLink: z.string().url().optional().or(z.literal('')),
    founderBackground: z.string().min(1),
    teamSize: z.number().int().min(1),
    sellEquity: z.boolean(),
    sellBusiness: z.boolean(),
    reasonForSelling: z.string().min(1),
    desiredBuyerProfile: z.string().min(1),
    askingPrice: z.number().positive().optional(),
  }),
  financials: z.object({
    monthlyRevenue: z.record(z.string(), z.number()).optional(),
    annualRevenue: z.record(z.string(), z.number()).optional(),
    monthlyProfitLoss: z.number().optional(),
    grossMargin: z.number().min(0).max(100).optional(),
    operationalExpense: z.number().optional(),
    cashRunway: z.number().optional(),
    fundingRaised: z.number().optional(),
    valuationExpectation: z.number().optional(),
  }).optional(),
  traction: z.object({
    totalCustomers: z.number().int().optional(),
    monthlyActiveCustomers: z.number().int().optional(),
    customerGrowthYoy: z.number().optional(),
    customerRetentionRate: z.number().min(0).max(100).optional(),
    churnRate: z.number().min(0).max(100).optional(),
    majorClients: z.string().optional(),
    completedOrders: z.number().int().optional(),
  }).optional(),
  salesMarketing: z.object({
    salesChannels: z.string().optional(),
    cac: z.number().optional(),
    ltv: z.number().optional(),
    marketingPlatforms: z.string().optional(),
    conversionRate: z.number().min(0).max(100).optional(),
  }).optional(),
  operational: z.object({
    supplyChainModel: z.string().optional(),
    cogs: z.number().optional(),
    averageDeliveryTime: z.string().optional(),
    inventoryData: z.string().optional(),
  }).optional(),
  legal: z.object({
    tradeLicenseNumber: z.string().optional(),
    taxId: z.string().optional(),
    verifiedPhone: z.string().optional(),
    verifiedEmail: z.string().email().optional(),
    ownershipDocumentsLink: z.string().optional(),
    ndaFinancialsLink: z.string().optional(),
  }).optional(),
  assets: z.object({
    domainOwnership: z.string().optional(),
    patentsOrCopyrights: z.string().optional(),
    sourceCodeLink: z.string().optional(),
    softwareInfrastructure: z.string().optional(),
    socialMediaHandles: z.string().optional(),
  }).optional(),
  contacts: z.object({
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
  }).optional(),
});

export const Route = createFileRoute('/api/startups/')({
  server: {
    handlers: {
      // GET /api/startups - List startups (public view for investors)
      GET: async ({ request }) => {
        try {
          const user = await getAuthUser(request);
          const db = createDb((request as any).env?.DB as D1Database);
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

          const startups = await services.startup.getPublicStartups(filters);

          // For premium users, include contact info
          const isPremium = user?.currentPricingPlan === 'premium';
          if (isPremium) {
            const startupsWithContacts = await Promise.all(
              startups.map(async (startup) => {
                const details = await services.startup.getStartupById(startup.id, user);
                return {
                  ...startup,
                  contacts: details.contacts,
                };
              })
            );
            return json(startupsWithContacts);
          }

          return json(startups);
        } catch (error) {
          console.error('Error fetching startups:', error);
          return json({ error: 'Failed to fetch startups' }, { status: 500 });
        }
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

          const db = createDb((request as any).env?.DB as D1Database);
          const services = createServices(db);

          const body = await request.json();
          const validatedData = createStartupSchema.parse(body);

          const startup = await services.startup.createStartup(user.id, validatedData);

          return json({ startup, message: 'Startup profile created successfully' });
        } catch (error) {
          console.error('Error creating startup:', error);
          if (error instanceof z.ZodError) {
            return json({ error: 'Invalid data', details: error.errors }, { status: 400 });
          }
          return json({ error: 'Failed to create startup profile' }, { status: 500 });
        }
      },
    },
  },
});