import { eq } from 'drizzle-orm';
import { Database } from '../db';
import { users } from '../db/schema';

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
      throw new Error('User not found');
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
    const [user] = await this.db
      .insert(users)
      .values({
        ...userData,
        currentPricingPlan: userData.currentPricingPlan || 'free',
        createdAt: new Date(),
      })
      .returning();

    return user;
  }

  async updateUserProfile(userId: number, profileData: UpdateUserProfileInput) {
    const [user] = await this.db
      .update(users)
      .set(profileData)
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updatePricingPlan(userId: number, plan: 'free' | 'premium') {
    const [user] = await this.db
      .update(users)
      .set({ currentPricingPlan: plan })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error('User not found');
    }

    return user;
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