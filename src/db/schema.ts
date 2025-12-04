import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  authProvider: text('auth_provider', { enum: ['google', 'facebook', 'github', 'apple'] }).notNull(),
  role: text('role', { enum: ['startup_owner', 'investor'] }).notNull(),
  currentPricingPlan: text('current_pricing_plan', { enum: ['free', 'premium'] }).notNull().default('free'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const startups = sqliteTable('startups', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
  name: text('name').notNull(),
  industry: text('industry').notNull(),
  yearFounded: integer('year_founded').notNull(),
  description: text('description').notNull(),
  websiteLink: text('website_link'),
  founderBackground: text('founder_background').notNull(),
  teamSize: integer('team_size').notNull(),
  sellEquity: integer('sell_equity', { mode: 'boolean' }).notNull(),
  sellBusiness: integer('sell_business', { mode: 'boolean' }).notNull(),
  reasonForSelling: text('reason_for_selling').notNull(),
  desiredBuyerProfile: text('desired_buyer_profile').notNull(),
  askingPrice: real('asking_price'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Type definition for the expected JSON structure in monthlyRevenue and annualRevenue fields
export type RevenueHistory = {
  [month: string]: number; // e.g., { "2023-01": 10000, "2023-02": 12000 }
};

export const startupFinancials = sqliteTable('startup_financials', {
  id: integer('id').primaryKey(),
  startupId: integer('startup_id').references(() => startups.id).notNull(),
  // JSON stringified object: { [month: string]: number }
  monthlyRevenue: text('monthly_revenue', { mode: 'json' }),
  // JSON stringified object: { [year: string]: number }
  annualRevenue: text('annual_revenue', { mode: 'json' }),
  monthlyProfitLoss: real('monthly_profit_loss'),
  grossMargin: real('gross_margin'),
  operationalExpense: real('operational_expense'),
  cashRunway: real('cash_runway'),
  fundingRaised: real('funding_raised'),
  valuationExpectation: real('valuation_expectation'),
});

export const startupTraction = sqliteTable('startup_traction', {
  id: integer('id').primaryKey(),
  startupId: integer('startup_id').references(() => startups.id).notNull(),
  totalCustomers: integer('total_customers'),
  monthlyActiveCustomers: integer('monthly_active_customers'),
  customerGrowthYoy: real('customer_growth_yoy'),
  customerRetentionRate: real('customer_retention_rate'),
  churnRate: real('churn_rate'),
  majorClients: text('major_clients'),
  completedOrders: integer('completed_orders'),
});

export const startupSalesMarketing = sqliteTable('startup_sales_marketing', {
  id: integer('id').primaryKey(),
  startupId: integer('startup_id').references(() => startups.id).notNull(),
  salesChannels: text('sales_channels'),
  cac: real('cac'),
  ltv: real('ltv'),
  marketingPlatforms: text('marketing_platforms'),
  conversionRate: real('conversion_rate'),
});

export const startupOperational = sqliteTable('startup_operational', {
  id: integer('id').primaryKey(),
  startupId: integer('startup_id').references(() => startups.id).notNull(),
  supplyChainModel: text('supply_chain_model'),
  cogs: real('cogs'),
  averageDeliveryTime: text('average_delivery_time'),
  inventoryData: text('inventory_data'),
});

export const startupLegal = sqliteTable('startup_legal', {
  id: integer('id').primaryKey(),
  startupId: integer('startup_id').references(() => startups.id).notNull(),
  tradeLicenseNumber: text('trade_license_number'),
  taxId: text('tax_id'),
  verifiedPhone: text('verified_phone'),
  verifiedEmail: text('verified_email'),
  ownershipDocumentsLink: text('ownership_documents_link'),
  ndaFinancialsLink: text('nda_financials_link'),
});

export const startupAssets = sqliteTable('startup_assets', {
  id: integer('id').primaryKey(),
  startupId: integer('startup_id').references(() => startups.id).notNull(),
  domainOwnership: text('domain_ownership'),
  patentsOrCopyrights: text('patents_or_copyrights'),
  sourceCodeLink: text('source_code_link'),
  softwareInfrastructure: text('software_infrastructure'),
  socialMediaHandles: text('social_media_handles'),
});

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  startupId: integer('startup_id').references(() => startups.id),
  planType: text('plan_type', { enum: ['investor_premium', 'startup_listing'] }).notNull(),
  amount: real('amount').notNull(),
  status: text('status', { enum: ['succeeded', 'failed'] }).notNull(),
  transactionId: text('transaction_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const favorites = sqliteTable('favorites', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  startupId: integer('startup_id').references(() => startups.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const startupViews = sqliteTable('startup_views', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  startupId: integer('startup_id').references(() => startups.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const startupContacts = sqliteTable('startup_contacts', {
  id: integer('id').primaryKey(),
  startupId: integer('startup_id').references(() => startups.id).notNull(),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
});