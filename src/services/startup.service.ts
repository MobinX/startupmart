import { eq, and, sql } from 'drizzle-orm';
import { Database } from '@/db';
import {
  startups,
  startupFinancials,
  startupTraction,
  startupSalesMarketing,
  startupOperational,
  startupLegal,
  startupAssets,
  startupContacts,
  startupViews,
  favorites,
  plans,
  userPlans,
  PlanAllowedField,
} from '@/db/schema';
import { AuthUser } from '@/lib/auth-middleware';
import { z } from 'zod';

export const createStartupSchema = z.object({
  startup: z.object({
    name: z.string().min(1),
    industry: z.string().min(1),
    yearFounded: z.number().int(),
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

export const updateStartupSchema = z.object({
  startup: createStartupSchema.shape.startup.partial().optional(),
  financials: createStartupSchema.shape.financials.optional(),
  traction: createStartupSchema.shape.traction.optional(),
  salesMarketing: createStartupSchema.shape.salesMarketing.optional(),
  operational: createStartupSchema.shape.operational.optional(),
  legal: createStartupSchema.shape.legal.optional(),
  assets: createStartupSchema.shape.assets.optional(),
  contacts: createStartupSchema.shape.contacts.optional(),
});

export type CreateStartupInput = z.infer<typeof createStartupSchema>;
export type UpdateStartupInput = z.infer<typeof updateStartupSchema>;

export interface StartupFilters {
  industry?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  sellEquity?: boolean;
  sellBusiness?: boolean;
}

export interface StartupSummary {
  id: number;
  name: string;
  industry: string;
  yearFounded: number;
  description: string;
  websiteLink: string | null;
  founderBackground: string;
  teamSize: number;
  sellEquity: boolean;
  sellBusiness: boolean;
  reasonForSelling: string;
  desiredBuyerProfile: string;
  askingPrice: number | null;
  createdAt: Date;
}

export interface StartupDetails extends StartupSummary {
  financials: typeof startupFinancials.$inferSelect | null;
  traction: typeof startupTraction.$inferSelect | null;
  salesMarketing: typeof startupSalesMarketing.$inferSelect | null;
  operational: typeof startupOperational.$inferSelect | null;
  legal: typeof startupLegal.$inferSelect | null;
  assets: typeof startupAssets.$inferSelect | null;
  contacts: typeof startupContacts.$inferSelect | null;
  viewCount?: number;
}

export class StartupService {
  constructor(private db: Database) {}

  /**
   * Get the allowed fields for a user based on their active plan subscriptions
   */
  async getUserAllowedFields(userId: number): Promise<PlanAllowedField[]> {
    const userPlanRecords = await this.db
      .select({
        allowedFields: plans.allowedFields,
      })
      .from(userPlans)
      .innerJoin(plans, eq(userPlans.planId, plans.id))
      .where(
        and(
          eq(userPlans.userId, userId),
          eq(userPlans.isActive, true)
        )
      );

    // Merge all allowed fields from all active plans
    const allAllowedFields = new Set<PlanAllowedField>();
    for (const record of userPlanRecords) {
      if (record.allowedFields) {
        for (const field of record.allowedFields) {
          allAllowedFields.add(field);
        }
      }
    }

    return Array.from(allAllowedFields);
  }

  /**
   * Filter startup details based on allowed fields
   */
  filterStartupDetailsByAllowedFields(
    startupDetails: StartupDetails,
    allowedFields: PlanAllowedField[]
  ): Partial<StartupDetails> {
    const filtered: Partial<StartupDetails> = {};

    // Basic startup info is always included if 'startup' is in allowed fields
    if (allowedFields.includes('startup')) {
      filtered.id = startupDetails.id;
      filtered.name = startupDetails.name;
      filtered.industry = startupDetails.industry;
      filtered.yearFounded = startupDetails.yearFounded;
      filtered.description = startupDetails.description;
      filtered.websiteLink = startupDetails.websiteLink;
      filtered.founderBackground = startupDetails.founderBackground;
      filtered.teamSize = startupDetails.teamSize;
      filtered.sellEquity = startupDetails.sellEquity;
      filtered.sellBusiness = startupDetails.sellBusiness;
      filtered.reasonForSelling = startupDetails.reasonForSelling;
      filtered.desiredBuyerProfile = startupDetails.desiredBuyerProfile;
      filtered.askingPrice = startupDetails.askingPrice;
      filtered.createdAt = startupDetails.createdAt;
    }

    // Check for section-level access
    if (allowedFields.includes('financials') && startupDetails.financials) {
      filtered.financials = startupDetails.financials;
    }

    if (allowedFields.includes('traction') && startupDetails.traction) {
      filtered.traction = startupDetails.traction;
    }

    if (allowedFields.includes('salesMarketing') && startupDetails.salesMarketing) {
      filtered.salesMarketing = startupDetails.salesMarketing;
    }

    if (allowedFields.includes('operational') && startupDetails.operational) {
      filtered.operational = startupDetails.operational;
    }

    if (allowedFields.includes('legal') && startupDetails.legal) {
      filtered.legal = startupDetails.legal;
    }

    if (allowedFields.includes('assets') && startupDetails.assets) {
      filtered.assets = startupDetails.assets;
    }

    if (allowedFields.includes('contacts') && startupDetails.contacts) {
      filtered.contacts = startupDetails.contacts;
    }

    // Handle specific field-level access (overrides section-level if more granular)
    if (allowedFields.includes('startupRevenue') && startupDetails.financials) {
      if (!filtered.financials) {
        filtered.financials = {} as any;
      }
      (filtered.financials as any).monthlyRevenue = startupDetails.financials.monthlyRevenue;
      (filtered.financials as any).annualRevenue = startupDetails.financials.annualRevenue;
    }

    if (allowedFields.includes('startupProfit') && startupDetails.financials) {
      if (!filtered.financials) {
        filtered.financials = {} as any;
      }
      (filtered.financials as any).monthlyProfitLoss = startupDetails.financials.monthlyProfitLoss;
      (filtered.financials as any).grossMargin = startupDetails.financials.grossMargin;
    }

    if (allowedFields.includes('startupValuation') && startupDetails.financials) {
      if (!filtered.financials) {
        filtered.financials = {} as any;
      }
      (filtered.financials as any).valuationExpectation = startupDetails.financials.valuationExpectation;
      (filtered.financials as any).fundingRaised = startupDetails.financials.fundingRaised;
    }

    if (allowedFields.includes('startupCustomers') && startupDetails.traction) {
      if (!filtered.traction) {
        filtered.traction = {} as any;
      }
      (filtered.traction as any).totalCustomers = startupDetails.traction.totalCustomers;
      (filtered.traction as any).monthlyActiveCustomers = startupDetails.traction.monthlyActiveCustomers;
      (filtered.traction as any).majorClients = startupDetails.traction.majorClients;
    }

    if (allowedFields.includes('startupGrowth') && startupDetails.traction) {
      if (!filtered.traction) {
        filtered.traction = {} as any;
      }
      (filtered.traction as any).customerGrowthYoy = startupDetails.traction.customerGrowthYoy;
      (filtered.traction as any).customerRetentionRate = startupDetails.traction.customerRetentionRate;
      (filtered.traction as any).churnRate = startupDetails.traction.churnRate;
    }

    if (allowedFields.includes('startupMarketing') && startupDetails.salesMarketing) {
      if (!filtered.salesMarketing) {
        filtered.salesMarketing = {} as any;
      }
      (filtered.salesMarketing as any).marketingPlatforms = startupDetails.salesMarketing.marketingPlatforms;
      (filtered.salesMarketing as any).cac = startupDetails.salesMarketing.cac;
      (filtered.salesMarketing as any).ltv = startupDetails.salesMarketing.ltv;
      (filtered.salesMarketing as any).conversionRate = startupDetails.salesMarketing.conversionRate;
    }

    // View count for owners
    if (startupDetails.viewCount !== undefined) {
      filtered.viewCount = startupDetails.viewCount;
    }

    return filtered;
  }

  async createStartup(userId: number, rawData: unknown) {
    try {
      const validation = createStartupSchema.safeParse(rawData);
      
      if (!validation.success) {
        console.log('Startup creation validation failed:', validation.error.errors);
        return { error: 'Invalid startup data', details: validation.error.errors, status: 400 };
      }
      
      const data = validation.data;

      // D1 does not support interactive transactions with return values in the middle.
      // We must insert the startup first to get the ID, then batch insert the rest.
      
      // 1. Insert main startup record
      const [startup] = await this.db
        .insert(startups)
        .values({
          userId,
          ...data.startup,
          createdAt: new Date(),
        })
        .returning();

      const startupId = startup.id;

      // 2. Prepare related records for batch insertion
      const batchOps = [];

      if (data.financials) {
        batchOps.push(this.db.insert(startupFinancials).values({
          startupId,
          ...data.financials,
        }));
      }

      if (data.traction) {
        batchOps.push(this.db.insert(startupTraction).values({
          startupId,
          ...data.traction,
        }));
      }

      if (data.salesMarketing) {
        batchOps.push(this.db.insert(startupSalesMarketing).values({
          startupId,
          ...data.salesMarketing,
        }));
      }

      if (data.operational) {
        batchOps.push(this.db.insert(startupOperational).values({
          startupId,
          ...data.operational,
        }));
      }

      if (data.legal) {
        batchOps.push(this.db.insert(startupLegal).values({
          startupId,
          ...data.legal,
        }));
      }

      if (data.assets) {
        batchOps.push(this.db.insert(startupAssets).values({
          startupId,
          ...data.assets,
        }));
      }

      if (data.contacts) {
        batchOps.push(this.db.insert(startupContacts).values({
          startupId,
          ...data.contacts,
        }));
      }

      // 3. Execute batch if there are related records
      if (batchOps.length > 0) {
        await this.db.batch(batchOps as any);
      }

      return { startup, message: 'Startup created successfully', status: 201 };
    } catch (error) {
      console.log('Failed to create startup:', error);
      return { error: 'Failed to create startup', status: 500 };
    }
  }

  async getStartupById(startupId: number, user?: AuthUser) {
    try {
      // Fetch all data in a single query using left joins
      const rows = await this.db
        .select()
        .from(startups)
        .leftJoin(startupFinancials, eq(startups.id, startupFinancials.startupId))
        .leftJoin(startupTraction, eq(startups.id, startupTraction.startupId))
        .leftJoin(startupSalesMarketing, eq(startups.id, startupSalesMarketing.startupId))
        .leftJoin(startupOperational, eq(startups.id, startupOperational.startupId))
        .leftJoin(startupLegal, eq(startups.id, startupLegal.startupId))
        .leftJoin(startupAssets, eq(startups.id, startupAssets.startupId))
        .leftJoin(startupContacts, eq(startups.id, startupContacts.startupId))
        .where(eq(startups.id, startupId));

      if (rows.length === 0) {
        console.log('Startup not found for ID:', startupId);
        return { error: 'Startup not found', status: 404 };
      }

      const row = rows[0];
      const startup = row.startups;

      // Check authorization
      const isOwner = user?.id === startup.userId;

      // Get user's allowed fields from their plan subscriptions
      let userAllowedFields: PlanAllowedField[] = [];
      if (user && !isOwner) {
        userAllowedFields = await this.getUserAllowedFields(user.id);
        
        // If user has no active plan with any allowed fields, deny access
        if (userAllowedFields.length === 0) {
          console.log('User has no active plan with allowed fields:', user.id);
          return { error: 'You need an active plan to view startup details', status: 403 };
        }
      }

      // Record view for analytics (only for non-owners)
      if (user && !isOwner) {
        // Fire and forget view recording to not block response
        this.db.insert(startupViews).values({
          userId: user.id,
          startupId,
          createdAt: new Date(),
        }).catch(err => console.log('Failed to record view', err));
      }

      // Get view count for owners
      let viewCount: number | undefined;
      if (isOwner) {
        const views = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(startupViews)
          .where(eq(startupViews.startupId, startupId));
        
        viewCount = views[0]?.count || 0;
      }

      const startupDetails: StartupDetails = {
        ...startup,
        financials: row.startup_financials || null,
        traction: row.startup_traction || null,
        salesMarketing: row.startup_sales_marketing || null,
        operational: row.startup_operational || null,
        legal: row.startup_legal || null,
        assets: row.startup_assets || null,
        contacts: row.startup_contacts || null,
        viewCount,
      };

      // If user is the owner, return full details
      if (isOwner) {
        return { startup: startupDetails, status: 200 };
      }

      // For non-owners, filter startup details based on their plan's allowed fields
      const filteredStartup = this.filterStartupDetailsByAllowedFields(startupDetails, userAllowedFields);

      return { startup: filteredStartup, allowedFields: userAllowedFields, status: 200 };
    } catch (error) {
      console.log('Failed to fetch startup:', error);
      return { error: 'Failed to fetch startup', status: 500 };
    }
  }

  async getPublicStartups(filters: StartupFilters = {}) {
    try {
      const conditions = [];

      // Build where conditions array
      if (filters.industry) {
        conditions.push(eq(startups.industry, filters.industry));
      }

      if (filters.minTeamSize !== undefined) {
        conditions.push(sql`${startups.teamSize} >= ${filters.minTeamSize}`);
      }

      if (filters.maxTeamSize !== undefined) {
        conditions.push(sql`${startups.teamSize} <= ${filters.maxTeamSize}`);
      }

      if (filters.sellEquity !== undefined) {
        conditions.push(eq(startups.sellEquity, filters.sellEquity));
      }

      if (filters.sellBusiness !== undefined) {
        conditions.push(eq(startups.sellBusiness, filters.sellBusiness));
      }

      const query = this.db
        .select({
          id: startups.id,
          name: startups.name,
          industry: startups.industry,
          yearFounded: startups.yearFounded,
          description: startups.description,
          websiteLink: startups.websiteLink,
          founderBackground: startups.founderBackground,
          teamSize: startups.teamSize,
          sellEquity: startups.sellEquity,
          sellBusiness: startups.sellBusiness,
          reasonForSelling: startups.reasonForSelling,
          desiredBuyerProfile: startups.desiredBuyerProfile,
          askingPrice: startups.askingPrice,
          createdAt: startups.createdAt,
        })
        .from(startups);

      // Apply all conditions at once if any exist
      let result;
      if (conditions.length > 0) {
        result = await query.where(and(...conditions));
      } else {
        result = await query;
      }

      return { startups: result, status: 200 };
    } catch (error) {
      console.log('Failed to fetch startups:', error);
      return { error: 'Failed to fetch startups', status: 500 };
    }
  }

  async updateStartup(startupId: number, userId: number, rawData: unknown) {
    try {
      const validation = updateStartupSchema.safeParse(rawData);
      
      if (!validation.success) {
        return { error: 'Invalid startup data', details: validation.error.errors, status: 400 };
      }
      
      const data = validation.data;

      // Verify ownership - optimize to select only userId
      const existingStartup = await this.db
        .select({ userId: startups.userId })
        .from(startups)
        .where(eq(startups.id, startupId))
        .get();

      if (!existingStartup) {
        console.log('Startup not found for ID:', startupId);
        return { error: 'Startup not found', status: 404 };
      }

      if (existingStartup.userId !== userId) {
        console.log('User is not authorized to update startup:', userId);
        return { error: 'You are not authorized to update this startup', status: 403 };
      }

      // Check existence of related records to decide between UPDATE and INSERT
      // We can't use onConflictDoUpdate because there are no unique constraints on startupId in the DB schema currently
      const existingRecords = await this.db
        .select({
          financialsId: startupFinancials.id,
          tractionId: startupTraction.id,
          salesMarketingId: startupSalesMarketing.id,
          operationalId: startupOperational.id,
          legalId: startupLegal.id,
          assetsId: startupAssets.id,
          contactsId: startupContacts.id,
        })
        .from(startups)
        .leftJoin(startupFinancials, eq(startups.id, startupFinancials.startupId))
        .leftJoin(startupTraction, eq(startups.id, startupTraction.startupId))
        .leftJoin(startupSalesMarketing, eq(startups.id, startupSalesMarketing.startupId))
        .leftJoin(startupOperational, eq(startups.id, startupOperational.startupId))
        .leftJoin(startupLegal, eq(startups.id, startupLegal.startupId))
        .leftJoin(startupAssets, eq(startups.id, startupAssets.startupId))
        .leftJoin(startupContacts, eq(startups.id, startupContacts.startupId))
        .where(eq(startups.id, startupId))
        .get();

      const batchOps = [];

      // Update main startup record if provided
      if (data.startup) {
        batchOps.push(
          this.db
            .update(startups)
            .set(data.startup)
            .where(eq(startups.id, startupId))
        );
      }

      // Helper to add upsert op
      const addUpsertOp = (
        table: any, 
        inputData: any, 
        existingId: number | null | undefined
      ) => {
        if (!inputData) return;
        
        if (existingId) {
          batchOps.push(
            this.db.update(table).set(inputData).where(eq(table.id, existingId))
          );
        } else {
          batchOps.push(
            this.db.insert(table).values({ startupId, ...inputData })
          );
        }
      };

      addUpsertOp(startupFinancials, data.financials, existingRecords?.financialsId);
      addUpsertOp(startupTraction, data.traction, existingRecords?.tractionId);
      addUpsertOp(startupSalesMarketing, data.salesMarketing, existingRecords?.salesMarketingId);
      addUpsertOp(startupOperational, data.operational, existingRecords?.operationalId);
      addUpsertOp(startupLegal, data.legal, existingRecords?.legalId);
      addUpsertOp(startupAssets, data.assets, existingRecords?.assetsId);
      addUpsertOp(startupContacts, data.contacts, existingRecords?.contactsId);

      if (batchOps.length > 0) {
        await this.db.batch(batchOps as any);
      }

      // Return updated startup
      const updatedStartup = await this.db
        .select()
        .from(startups)
        .where(eq(startups.id, startupId))
        .get();

      return { startup: updatedStartup, message: 'Startup updated successfully', status: 200 };
    } catch (error) {
      console.log('Failed to update startup:', error);
      return { error: 'Failed to update startup', status: 500 };
    }
  }

  async deleteStartup(startupId: number, userId: number) {
    try {
      // Verify ownership
      const startup = await this.db
        .select()
        .from(startups)
        .where(eq(startups.id, startupId))
        .get();

      if (!startup) {
        console.log('Startup not found for ID:', startupId);
        return { error: 'Startup not found', status: 404 };
      }

      if (startup.userId !== userId) {
        console.log('User is not authorized to delete startup:', userId);
        return { error: 'You are not authorized to delete this startup', status: 403 };
      }

      // Delete startup (cascade will handle related records)
      // Manually delete related records first (simulating cascade)
      await this.db.batch([
        this.db.delete(startupFinancials).where(eq(startupFinancials.startupId, startupId)),
        this.db.delete(startupTraction).where(eq(startupTraction.startupId, startupId)),
        this.db.delete(startupSalesMarketing).where(eq(startupSalesMarketing.startupId, startupId)),
        this.db.delete(startupOperational).where(eq(startupOperational.startupId, startupId)),
        this.db.delete(startupLegal).where(eq(startupLegal.startupId, startupId)),
        this.db.delete(startupAssets).where(eq(startupAssets.startupId, startupId)),
        this.db.delete(startupContacts).where(eq(startupContacts.startupId, startupId)),
        this.db.delete(startupViews).where(eq(startupViews.startupId, startupId)),
        this.db.delete(favorites).where(eq(favorites.startupId, startupId)),
        this.db.delete(startups).where(eq(startups.id, startupId))
      ] as any);

      return { message: 'Startup deleted successfully', status: 200 };
    } catch (error) {
      console.log('Failed to delete startup:', error);
      return { error: 'Failed to delete startup', status: 500 };
    }
  }
}