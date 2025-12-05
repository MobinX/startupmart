import { eq } from 'drizzle-orm';
import { Database } from '@/db';
import { users } from '@/db/schema';
import { NotFoundError, ConflictError, DatabaseError, ValidationError, AuthorizationError } from '@/lib/errors';

export interface CreateUserInput {
  email: string;
  firebaseUid: string;
  authProvider: 'google' | 'facebook' | 'github' | 'apple';
  role: 'startup_owner' | 'investor';
  currentPricingPlan?: 'free' | 'premium';
}

export interface UpdateUserProfileInput {
  email?: string;
  role?: 'startup_owner' | 'investor';
}

export interface UserStats {
  startupCount: number;
  favoriteCount: number;
  totalViews: number;
}

export class UserService {
  constructor(private db: Database) {}

  async getUserById(userId: number) {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string) {
    return await this.db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .get();
  }

  async createUser(userData: CreateUserInput) {
    try {
      // Try to create user directly, relying on unique constraint for firebaseUid
      const [user] = await this.db
        .insert(users)
        .values({
          ...userData,
          currentPricingPlan: userData.currentPricingPlan || 'free',
          createdAt: new Date(),
        })
        .returning();

      return user;
    } catch (error: any) {
      if (error.message?.includes('UNIQUE') || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictError('User already exists');
      }
      throw new DatabaseError('Failed to create user', error);
    }
  }

  async updateUserProfile(userId: number, profileData: UpdateUserProfileInput) {
    try {
      const [user] = await this.db
        .update(users)
        .set(profileData)
        .where(eq(users.id, userId))
        .returning();

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to update user profile', error);
    }
  }

  async updatePricingPlan(userId: number, plan: 'free' | 'premium') {
    try {
      const [user] = await this.db
        .update(users)
        .set({ currentPricingPlan: plan })
        .where(eq(users.id, userId))
        .returning();

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to update pricing plan', error);
    }
  }

  async getUserStats(userId: number): Promise<UserStats> {
    // This will be implemented when we have the related tables
    // For now, return placeholder stats
    return {
      startupCount: 0,
      favoriteCount: 0,
      totalViews: 0,
    };
  }
}