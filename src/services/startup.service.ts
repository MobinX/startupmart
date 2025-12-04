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
} from '../db/schema';
import { AuthUser } from '../lib/auth-middleware';

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
      throw new Error('Startup data is required');
    }

    return await this.db.transaction(async (tx) => {
      // Insert main startup record
      const [startup] = await tx
        .insert(startups)
        .values({
          userId,
          ...data.startup,
          createdAt: new Date(),
        })
        .returning();

      const startupId = startup.id;

      // Insert related records if provided
      if (data.financials) {
        await tx.insert(startupFinancials).values({
          startupId,
          ...data.financials,
        });
      }

      if (data.traction) {
        await tx.insert(startupTraction).values({
          startupId,
          ...data.traction,
        });
      }

      if (data.salesMarketing) {
        await tx.insert(startupSalesMarketing).values({
          startupId,
          ...data.salesMarketing,
        });
      }

      if (data.operational) {
        await tx.insert(startupOperational).values({
          startupId,
          ...data.operational,
        });
      }

      if (data.legal) {
        await tx.insert(startupLegal).values({
          startupId,
          ...data.legal,
        });
      }

      if (data.assets) {
        await tx.insert(startupAssets).values({
          startupId,
          ...data.assets,
        });
      }

      if (data.contacts) {
        await tx.insert(startupContacts).values({
          startupId,
          ...data.contacts,
        });
      }

      return startup;
    });
  }

  async getStartupById(startupId: number, user?: AuthUser): Promise<StartupDetails> {
    // Get main startup data
    const startup = await this.db
      .select()
      .from(startups)
      .where(eq(startups.id, startupId))
      .get();

    if (!startup) {
      throw new Error('Startup not found');
    }

    // Check authorization
    const isOwner = user?.id === startup.userId;
    const isPremium = user?.currentPricingPlan === 'premium';

    if (!isOwner && !isPremium) {
      throw new Error('Premium subscription required to view startup details');
    }

    // Record view for analytics (only for non-owners)
    if (user && !isOwner) {
      await this.db.insert(startupViews).values({
        userId: user.id,
        startupId,
        createdAt: new Date(),
      });
    }

    // Get all related data
    const [financials] = await this.db
      .select()
      .from(startupFinancials)
      .where(eq(startupFinancials.startupId, startupId))
      .limit(1);

    const [traction] = await this.db
      .select()
      .from(startupTraction)
      .where(eq(startupTraction.startupId, startupId))
      .limit(1);

    const [salesMarketing] = await this.db
      .select()
      .from(startupSalesMarketing)
      .where(eq(startupSalesMarketing.startupId, startupId))
      .limit(1);

    const [operational] = await this.db
      .select()
      .from(startupOperational)
      .where(eq(startupOperational.startupId, startupId))
      .limit(1);

    const [legal] = await this.db
      .select()
      .from(startupLegal)
      .where(eq(startupLegal.startupId, startupId))
      .limit(1);

    const [assets] = await this.db
      .select()
      .from(startupAssets)
      .where(eq(startupAssets.startupId, startupId))
      .limit(1);

    const [contacts] = await this.db
      .select()
      .from(startupContacts)
      .where(eq(startupContacts.startupId, startupId))
      .limit(1);

    // Get view count for owners
    let viewCount: number | undefined;
    if (isOwner) {
      const views = await this.db
        .select()
        .from(startupViews)
        .where(eq(startupViews.startupId, startupId));

      viewCount = views.length;
    }

    return {
      ...startup,
      financials: financials || null,
      traction: traction || null,
      salesMarketing: salesMarketing || null,
      operational: operational || null,
      legal: legal || null,
      assets: assets || null,
      contacts: contacts || null,
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
    // Verify ownership
    const existingStartup = await this.db
      .select()
      .from(startups)
      .where(and(eq(startups.id, startupId), eq(startups.userId, userId)))
      .get();

    if (!existingStartup) {
      throw new Error('Startup not found or access denied');
    }

    return await this.db.transaction(async (tx) => {
      // Update main startup record if provided
      if (data.startup) {
        await tx
          .update(startups)
          .set(data.startup)
          .where(eq(startups.id, startupId));
      }

      // Update related records using upsert pattern
      if (data.financials) {
        await tx
          .insert(startupFinancials)
          .values({ startupId, ...data.financials })
          .onConflictDoUpdate({
            target: startupFinancials.startupId,
            set: data.financials,
          });
      }

      if (data.traction) {
        await tx
          .insert(startupTraction)
          .values({ startupId, ...data.traction })
          .onConflictDoUpdate({
            target: startupTraction.startupId,
            set: data.traction,
          });
      }

      if (data.salesMarketing) {
        await tx
          .insert(startupSalesMarketing)
          .values({ startupId, ...data.salesMarketing })
          .onConflictDoUpdate({
            target: startupSalesMarketing.startupId,
            set: data.salesMarketing,
          });
      }

      if (data.operational) {
        await tx
          .insert(startupOperational)
          .values({ startupId, ...data.operational })
          .onConflictDoUpdate({
            target: startupOperational.startupId,
            set: data.operational,
          });
      }

      if (data.legal) {
        await tx
          .insert(startupLegal)
          .values({ startupId, ...data.legal })
          .onConflictDoUpdate({
            target: startupLegal.startupId,
            set: data.legal,
          });
      }

      if (data.assets) {
        await tx
          .insert(startupAssets)
          .values({ startupId, ...data.assets })
          .onConflictDoUpdate({
            target: startupAssets.startupId,
            set: data.assets,
          });
      }

      if (data.contacts) {
        await tx
          .insert(startupContacts)
          .values({ startupId, ...data.contacts })
          .onConflictDoUpdate({
            target: startupContacts.startupId,
            set: data.contacts,
          });
      }

      // Return updated startup
      return await tx
        .select()
        .from(startups)
        .where(eq(startups.id, startupId))
        .get();
    });
  }

  async deleteStartup(startupId: number, userId: number) {
    // Verify ownership
    const startup = await this.db
      .select()
      .from(startups)
      .where(and(eq(startups.id, startupId), eq(startups.userId, userId)))
      .get();

    if (!startup) {
      throw new Error('Startup not found or access denied');
    }

    // Delete startup (cascade will handle related records)
    await this.db
      .delete(startups)
      .where(eq(startups.id, startupId));
  }
}