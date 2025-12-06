import { eq, and } from 'drizzle-orm';
import { Database } from '@/db';
import { plans, userPlans, PlanAllowedField } from '@/db/schema';
import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(1),
  planFor: z.enum(['investor', 'startup_owner']),
  allowedFields: z.array(z.string()).min(1),
  price: z.number().min(0),
  description: z.string().optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export const subscribeToPlanSchema = z.object({
  planId: z.number().int().positive(),
  expiresAt: z.string().datetime().optional(), // ISO date string
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

export interface PlanWithSubscription {
  id: number;
  name: string;
  planFor: 'investor' | 'startup_owner';
  allowedFields: PlanAllowedField[];
  price: number;
  description: string | null;
  createdAt: Date;
  isSubscribed?: boolean;
  subscriptionActive?: boolean;
}

export class PlanService {
  constructor(private db: Database) {}

  /**
   * Get all available plans, optionally filtered by target user type
   */
  async getAllPlans(planFor?: 'investor' | 'startup_owner', userId?: number) {
    try {
      let query = this.db.select().from(plans);
      
      let result;
      if (planFor) {
        result = await query.where(eq(plans.planFor, planFor));
      } else {
        result = await query;
      }

      // If userId is provided, check subscription status for each plan
      if (userId) {
        const userSubscriptions = await this.db
          .select()
          .from(userPlans)
          .where(eq(userPlans.userId, userId));

        const subscriptionMap = new Map(
          userSubscriptions.map(sub => [sub.planId, sub])
        );

        const plansWithSubscription: PlanWithSubscription[] = result.map(plan => ({
          ...plan,
          isSubscribed: subscriptionMap.has(plan.id),
          subscriptionActive: subscriptionMap.get(plan.id)?.isActive ?? false,
        }));

        return { plans: plansWithSubscription, status: 200 };
      }

      return { plans: result, status: 200 };
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      return { error: 'Failed to fetch plans', status: 500 };
    }
  }

  /**
   * Get a specific plan by ID
   */
  async getPlanById(planId: number) {
    try {
      const plan = await this.db
        .select()
        .from(plans)
        .where(eq(plans.id, planId))
        .get();

      if (!plan) {
        return { error: 'Plan not found', status: 404 };
      }

      return { plan, status: 200 };
    } catch (error) {
      console.error('Failed to fetch plan:', error);
      return { error: 'Failed to fetch plan', status: 500 };
    }
  }

  /**
   * Create a new subscription plan (admin only in production)
   */
  async createPlan(rawData: unknown) {
    try {
      const validation = createPlanSchema.safeParse(rawData);
      if (!validation.success) {
        return { error: 'Invalid plan data', details: validation.error.errors, status: 400 };
      }

      const data = validation.data;

      const [plan] = await this.db
        .insert(plans)
        .values({
          name: data.name,
          planFor: data.planFor,
          allowedFields: data.allowedFields as PlanAllowedField[],
          price: data.price,
          description: data.description || null,
          createdAt: new Date(),
        })
        .returning();

      return { plan, message: 'Plan created successfully', status: 201 };
    } catch (error) {
      console.error('Failed to create plan:', error);
      return { error: 'Failed to create plan', status: 500 };
    }
  }

  /**
   * Update an existing plan (admin only in production)
   */
  async updatePlan(planId: number, rawData: unknown) {
    try {
      const validation = updatePlanSchema.safeParse(rawData);
      if (!validation.success) {
        return { error: 'Invalid plan data', details: validation.error.errors, status: 400 };
      }

      const data = validation.data;

      // Check if plan exists
      const existing = await this.db
        .select({ id: plans.id })
        .from(plans)
        .where(eq(plans.id, planId))
        .get();

      if (!existing) {
        return { error: 'Plan not found', status: 404 };
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.planFor !== undefined) updateData.planFor = data.planFor;
      if (data.allowedFields !== undefined) updateData.allowedFields = data.allowedFields;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.description !== undefined) updateData.description = data.description;

      const [plan] = await this.db
        .update(plans)
        .set(updateData)
        .where(eq(plans.id, planId))
        .returning();

      return { plan, message: 'Plan updated successfully', status: 200 };
    } catch (error) {
      console.error('Failed to update plan:', error);
      return { error: 'Failed to update plan', status: 500 };
    }
  }

  /**
   * Delete a plan (admin only in production)
   */
  async deletePlan(planId: number) {
    try {
      const existing = await this.db
        .select({ id: plans.id })
        .from(plans)
        .where(eq(plans.id, planId))
        .get();

      if (!existing) {
        return { error: 'Plan not found', status: 404 };
      }

      await this.db.delete(plans).where(eq(plans.id, planId));

      return { message: 'Plan deleted successfully', status: 200 };
    } catch (error) {
      console.error('Failed to delete plan:', error);
      return { error: 'Failed to delete plan', status: 500 };
    }
  }

  /**
   * Subscribe a user to a plan
   */
  async subscribeToPlan(userId: number, rawData: unknown) {
    try {
      const validation = subscribeToPlanSchema.safeParse(rawData);
      if (!validation.success) {
        return { error: 'Invalid subscription data', details: validation.error.errors, status: 400 };
      }

      const { planId, expiresAt } = validation.data;

      // Check if plan exists
      const plan = await this.db
        .select()
        .from(plans)
        .where(eq(plans.id, planId))
        .get();

      if (!plan) {
        return { error: 'Plan not found', status: 404 };
      }

      // Check if already subscribed
      const existingSubscription = await this.db
        .select()
        .from(userPlans)
        .where(
          and(
            eq(userPlans.userId, userId),
            eq(userPlans.planId, planId)
          )
        )
        .get();

      if (existingSubscription) {
        // Reactivate if inactive
        if (!existingSubscription.isActive) {
          const [updated] = await this.db
            .update(userPlans)
            .set({
              isActive: true,
              startedAt: new Date(),
              expiresAt: expiresAt ? new Date(expiresAt) : null,
            })
            .where(eq(userPlans.id, existingSubscription.id))
            .returning();

          return { subscription: updated, message: 'Subscription reactivated', status: 200 };
        }
        return { error: 'Already subscribed to this plan', status: 409 };
      }

      // Create new subscription
      const [subscription] = await this.db
        .insert(userPlans)
        .values({
          userId,
          planId,
          isActive: true,
          startedAt: new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        })
        .returning();

      return { subscription, plan, message: 'Successfully subscribed to plan', status: 201 };
    } catch (error: any) {
      if (error.message?.includes('UNIQUE') || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { error: 'Already subscribed to this plan', status: 409 };
      }
      console.error('Failed to subscribe to plan:', error);
      return { error: 'Failed to subscribe to plan', status: 500 };
    }
  }

  /**
   * Unsubscribe a user from a plan (sets is_active to false)
   */
  async unsubscribeFromPlan(userId: number, planId: number) {
    try {
      const subscription = await this.db
        .select()
        .from(userPlans)
        .where(
          and(
            eq(userPlans.userId, userId),
            eq(userPlans.planId, planId)
          )
        )
        .get();

      if (!subscription) {
        return { error: 'Subscription not found', status: 404 };
      }

      const [updated] = await this.db
        .update(userPlans)
        .set({ isActive: false })
        .where(eq(userPlans.id, subscription.id))
        .returning();

      return { subscription: updated, message: 'Successfully unsubscribed from plan', status: 200 };
    } catch (error) {
      console.error('Failed to unsubscribe from plan:', error);
      return { error: 'Failed to unsubscribe from plan', status: 500 };
    }
  }

  /**
   * Get all active plans for a user
   */
  async getUserPlans(userId: number) {
    try {
      const subscriptions = await this.db
        .select({
          subscription: userPlans,
          plan: plans,
        })
        .from(userPlans)
        .innerJoin(plans, eq(userPlans.planId, plans.id))
        .where(
          and(
            eq(userPlans.userId, userId),
            eq(userPlans.isActive, true)
          )
        );

      const userPlansResult = subscriptions.map(row => ({
        ...row.plan,
        subscription: row.subscription,
      }));

      return { plans: userPlansResult, status: 200 };
    } catch (error) {
      console.error('Failed to fetch user plans:', error);
      return { error: 'Failed to fetch user plans', status: 500 };
    }
  }

  /**
   * Get combined allowed fields for a user from all their active plans
   */
  async getUserAllowedFields(userId: number): Promise<PlanAllowedField[]> {
    const result = await this.getUserPlans(userId);
    if ('error' in result) {
      return [];
    }

    const allAllowedFields = new Set<PlanAllowedField>();
    for (const plan of result.plans) {
      if (plan.allowedFields) {
        for (const field of plan.allowedFields) {
          allAllowedFields.add(field);
        }
      }
    }

    return Array.from(allAllowedFields);
  }
}
