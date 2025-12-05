import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { createDb } from '@/db';
import { createServices } from '@/services';
import { getAuthUser } from '@/lib/auth-middleware';
import { z } from 'zod';
import { ValidationError, NotFoundError, AuthorizationError, ConflictError, DatabaseError } from '@/lib/errors';
import { env } from 'cloudflare:workers';

const updateStartupSchema = z.object({
  startup: z.object({
    name: z.string().min(1).optional(),
    industry: z.string().min(1).optional(),
    yearFounded: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
    description: z.string().min(1).optional(),
    websiteLink: z.string().url().optional().or(z.literal('')),
    founderBackground: z.string().min(1).optional(),
    teamSize: z.number().int().min(1).optional(),
    sellEquity: z.boolean().optional(),
    sellBusiness: z.boolean().optional(),
    reasonForSelling: z.string().min(1).optional(),
    desiredBuyerProfile: z.string().min(1).optional(),
    askingPrice: z.number().positive().optional(),
  }).optional(),
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

export const Route = createFileRoute('/api/startups/$id')({
  server: {
    handlers: {
      // GET /api/startups/:id - Get a specific startup with all details
      GET: async ({ request, params }) => {
        try {
          const user = await getAuthUser(request);
          const db = createDb(env?.DB as D1Database);
          const services = createServices(db);

          const startupId = parseInt((params as any).id);
          if (isNaN(startupId)) {
            return json({ error: 'Invalid startup ID' }, { status: 400 });
          }

          const startup = await services.startup.getStartupById(startupId, user || undefined);
          return json(startup);
        } catch (error) {
          console.error('Error fetching startup:', error);
          if (error instanceof ValidationError) {
            return json({ error: error.message, details: error.details }, { status: 400 });
          }
          if (error instanceof AuthorizationError) {
            return json({ error: error.message }, { status: 403 });
          }
          if (error instanceof NotFoundError) {
            return json({ error: error.message }, { status: 404 });
          }
          if (error instanceof ConflictError) {
            return json({ error: error.message }, { status: 409 });
          }
          return json({ error: error instanceof Error ? error.message : 'Failed to fetch startup' }, { status: 500 });
        }
      },

      // PUT /api/startups/:id - Update a startup profile
      PUT: async ({ request, params }) => {
        try {
          const user = await getAuthUser(request);
          if (!user) {
            return json({ error: 'Authentication required' }, { status: 401 });
          }

          const db = createDb(env?.DB as D1Database);
          const services = createServices(db);

          const startupId = parseInt((params as any).id);
          if (isNaN(startupId)) {
            return json({ error: 'Invalid startup ID' }, { status: 400 });
          }

          const body = await request.json();
          const validatedData = updateStartupSchema.parse(body);

          const updatedStartup = await services.startup.updateStartup(startupId, user.id, validatedData);

          return json({ startup: updatedStartup, message: 'Startup profile updated successfully' });
        } catch (error) {
          console.error('Error updating startup:', error);
          if (error instanceof z.ZodError) {
            return json({ error: 'Invalid data', details: error.errors }, { status: 400 });
          }
          if (error instanceof ValidationError) {
            return json({ error: error.message, details: error.details }, { status: 400 });
          }
          if (error instanceof AuthorizationError) {
            return json({ error: error.message }, { status: 403 });
          }
          if (error instanceof NotFoundError) {
            return json({ error: error.message }, { status: 404 });
          }
          if (error instanceof ConflictError) {
            return json({ error: error.message }, { status: 409 });
          }
          return json({ error: error instanceof Error ? error.message : 'Failed to update startup profile' }, { status: 500 });
        }
      },

      // DELETE /api/startups/:id - Delete a startup profile
      DELETE: async ({ request, params }) => {
        try {
          const user = await getAuthUser(request);
          if (!user) {
            return json({ error: 'Authentication required' }, { status: 401 });
          }

          const db = createDb(env?.DB as D1Database);
          const services = createServices(db);

          const startupId = parseInt((params as any).id);
          if (isNaN(startupId)) {
            return json({ error: 'Invalid startup ID' }, { status: 400 });
          }

          await services.startup.deleteStartup(startupId, user.id);

          return json({ message: 'Startup profile deleted successfully' });
        } catch (error) {
          console.error('Error deleting startup:', error);
          if (error instanceof ValidationError) {
            return json({ error: error.message, details: error.details }, { status: 400 });
          }
          if (error instanceof AuthorizationError) {
            return json({ error: error.message }, { status: 403 });
          }
          if (error instanceof NotFoundError) {
            return json({ error: error.message }, { status: 404 });
          }
          if (error instanceof ConflictError) {
            return json({ error: error.message }, { status: 409 });
          }
          return json({ error: error instanceof Error ? error.message : 'Failed to delete startup profile' }, { status: 500 });
        }
      },
    },
  },
});