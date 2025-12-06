import { eq } from 'drizzle-orm';
import { Database } from '@/db';
import { users } from '@/db/schema';
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  firebaseUid: z.string(),
  authProvider: z.enum(['google', 'facebook', 'github', 'apple']),
  role: z.enum(['startup_owner', 'investor']),
  currentPricingPlan: z.enum(['free', 'premium']).optional(),
});

export const updateUserProfileSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['startup_owner', 'investor']).optional(),
});

export const updatePricingPlanSchema = z.object({
  plan: z.enum(['free', 'premium']),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

export interface UserStats {
  startupCount: number;
  favoriteCount: number;
  totalViews: number;
}

export class UserService {
  constructor(private db: Database) {}

  async getUserById(userId: number) {
    try {
      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .get();

      if (!user) {
        return { error: 'User not found', status: 404 };
      }

      return { user, status: 200 };
    } catch (error) {
      console.log('Failed to fetch user:', error);
      return { error: 'Failed to fetch user', status: 500 };
    }
  }

  async getUserByFirebaseUid(firebaseUid: string) {
    try {
      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, firebaseUid))
        .get();
      
      if (!user) {
         return { error: 'User not found', status: 404 };
      }
      return { user, status: 200 };
    } catch (error) {
      console.log('Failed to fetch user by firebase uid:', error);
      return { error: 'Failed to fetch user', status: 500 };
    }
  }

  async createUser(rawData: unknown) {
    try {
      const validation = createUserSchema.safeParse(rawData);
      if (!validation.success) {
        return { error: 'Invalid user data', details: validation.error.errors, status: 400 };
      }
      const userData = validation.data;

      // Try to create user directly, relying on unique constraint for firebaseUid
      const [user] = await this.db
        .insert(users)
        .values({
          ...userData,
          currentPricingPlan: userData.currentPricingPlan || 'free',
          createdAt: new Date(),
        })
        .returning();

      return { user, message: 'User created successfully', status: 201 };
    } catch (error: any) {
      if (error.message?.includes('UNIQUE') || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { error: 'User already exists', status: 409 };
      }
      console.log('Failed to create user:', error);
      return { error: 'Failed to create user', status: 500 };
    }
  }

  async updateUserProfile(userId: number, rawData: unknown) {
    try {
      const validation = updateUserProfileSchema.safeParse(rawData);
      if (!validation.success) {
        return { error: 'Invalid profile data', details: validation.error.errors, status: 400 };
      }
      const profileData = validation.data;

      const [user] = await this.db
        .update(users)
        .set(profileData)
        .where(eq(users.id, userId))
        .returning();

      if (!user) {
        return { error: 'User not found', status: 404 };
      }

      return { user, message: 'Profile updated successfully', status: 200 };
    } catch (error) {
      console.log('Failed to update user profile:', error);
      return { error: 'Failed to update user profile', status: 500 };
    }
  }

  async updatePricingPlan(userId: number, rawData: unknown) {
    try {
      const validation = updatePricingPlanSchema.safeParse(rawData);
      if (!validation.success) {
        return { error: 'Invalid pricing plan data', details: validation.error.errors, status: 400 };
      }
      const { plan } = validation.data;

      const [user] = await this.db
        .update(users)
        .set({ currentPricingPlan: plan })
        .where(eq(users.id, userId))
        .returning();

      if (!user) {
        return { error: 'User not found', status: 404 };
      }

      return { user, message: 'Pricing plan updated successfully', status: 200 };
    } catch (error) {
      console.log('Failed to update pricing plan:', error);
      return { error: 'Failed to update pricing plan', status: 500 };
    }
  }

  async getUserStats(_userId: number) {
    try {
      // This will be implemented when we have the related tables
      // For now, return placeholder stats
      const stats: UserStats = {
        startupCount: 0,
        favoriteCount: 0,
        totalViews: 0,
      };
      return { stats, status: 200 };
    } catch (error) {
      console.log('Failed to get user stats:', error);
      return { error: 'Failed to get user stats', status: 500 };
    }
  }
}