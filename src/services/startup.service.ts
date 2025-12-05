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
} from '@/db/schema';
import { AuthUser } from '@/lib/auth-middleware';
import { ValidationError, NotFoundError, AuthorizationError, DatabaseError } from '@/lib/errors';

export interface CreateStartupInput {
  startup: {
    name: string;
    industry: string;
    yearFounded: number;
    description: string;
    websiteLink?: string;
    founderBackground: string;
    teamSize: number;
    sellEquity: boolean;
    sellBusiness: boolean;
    reasonForSelling: string;
    desiredBuyerProfile: string;
    askingPrice?: number;
  };
  financials?: {
    monthlyRevenue?: Record<string, number>;
    annualRevenue?: Record<string, number>;
    monthlyProfitLoss?: number;
    grossMargin?: number;
    operationalExpense?: number;
    cashRunway?: number;
    fundingRaised?: number;
    valuationExpectation?: number;
  };
  traction?: {
    totalCustomers?: number;
    monthlyActiveCustomers?: number;
    customerGrowthYoy?: number;
    customerRetentionRate?: number;
    churnRate?: number;
    majorClients?: string;
    completedOrders?: number;
  };
  salesMarketing?: {
    salesChannels?: string;
    cac?: number;
    ltv?: number;
    marketingPlatforms?: string;
    conversionRate?: number;
  };
  operational?: {
    supplyChainModel?: string;
    cogs?: number;
    averageDeliveryTime?: string;
    inventoryData?: string;
  };
  legal?: {
    tradeLicenseNumber?: string;
    taxId?: string;
    verifiedPhone?: string;
    verifiedEmail?: string;
    ownershipDocumentsLink?: string;
    ndaFinancialsLink?: string;
  };
  assets?: {
    domainOwnership?: string;
    patentsOrCopyrights?: string;
    sourceCodeLink?: string;
    softwareInfrastructure?: string;
    socialMediaHandles?: string;
  };
  contacts?: {
    contactEmail?: string;
    contactPhone?: string;
  };
}

export interface UpdateStartupInput {
  startup?: Partial<CreateStartupInput['startup']>;
  financials?: CreateStartupInput['financials'];
  traction?: CreateStartupInput['traction'];
  salesMarketing?: CreateStartupInput['salesMarketing'];
  operational?: CreateStartupInput['operational'];
  legal?: CreateStartupInput['legal'];
  assets?: CreateStartupInput['assets'];
  contacts?: CreateStartupInput['contacts'];
}

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

  async createStartup(userId: number, data: CreateStartupInput) {
    // Verify user role
    if (!data.startup) {
      throw new ValidationError('Startup data is required');
    }

    try {
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

      return startup;
    } catch (error) {
      throw new DatabaseError('Failed to create startup', error);
    }
  }

  async getStartupById(startupId: number, user?: AuthUser): Promise<StartupDetails> {
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
      throw new NotFoundError('Startup not found');
    }

    const row = rows[0];
    const startup = row.startups;

    // Check authorization
    const isOwner = user?.id === startup.userId;
    const isPremium = user?.currentPricingPlan === 'premium';

    if (!isOwner && !isPremium) {
      throw new AuthorizationError('Premium subscription required to view startup details');
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

    return {
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
  }

  async getPublicStartups(filters: StartupFilters = {}): Promise<StartupSummary[]> {
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
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  }

  async updateStartup(startupId: number, userId: number, data: UpdateStartupInput) {
    // Verify ownership - optimize to select only userId
    const existingStartup = await this.db
      .select({ userId: startups.userId })
      .from(startups)
      .where(eq(startups.id, startupId))
      .get();

    if (!existingStartup) {
      throw new NotFoundError('Startup not found');
    }

    if (existingStartup.userId !== userId) {
      throw new AuthorizationError('You are not authorized to update this startup');
    }

    try {
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
      return await this.db
        .select()
        .from(startups)
        .where(eq(startups.id, startupId))
        .get();
    } catch (error) {
      throw new DatabaseError('Failed to update startup', error);
    }
  }

  async deleteStartup(startupId: number, userId: number) {
    // Verify ownership
    const startup = await this.db
      .select()
      .from(startups)
      .where(eq(startups.id, startupId))
      .get();

    if (!startup) {
      throw new NotFoundError('Startup not found');
    }

    if (startup.userId !== userId) {
      throw new AuthorizationError('You are not authorized to delete this startup');
    }

    try {
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
    } catch (error) {
      throw new DatabaseError('Failed to delete startup', error);
    }
  }
}