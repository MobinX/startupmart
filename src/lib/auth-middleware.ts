import { verifyIdToken } from './firebase';
import { createDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { env } from "cloudflare:workers"

export interface AuthUser {
  id: number;
  firebaseUid: string;
  email: string;
  role: 'startup_owner' | 'investor';
  currentPricingPlan: 'free' | 'premium';
}

// Helper function to get authenticated user from request
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('Authorization');
  let user: AuthUser | null = null;
  console.log("IRUNNING")
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // TEST TOKEN BYPASS
    if (token === 'TEST_TOKEN_OWNER' || token === 'TEST_TOKEN_INVESTOR') {
      const isOwner = token === 'TEST_TOKEN_OWNER';
      const firebaseUid = isOwner ? 'test-owner-uid' : 'test-investor-uid';
      const email = isOwner ? 'owner@test.com' : 'investor@test.com';
      const role = isOwner ? 'startup_owner' : 'investor';
      
      const db = createDb(env?.DB as D1Database);
      let dbUser = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, firebaseUid))
        .get();

      if (!dbUser) {
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            firebaseUid,
            authProvider: 'google',
            role,
            currentPricingPlan: isOwner ? 'premium' : 'free',
            createdAt: new Date(),
          })
          .returning();
        dbUser = newUser;
      }
      
      return dbUser;
    }

    try {
      const firebaseUser = await verifyIdToken(token);

      // Get or create user in our database
      const db = createDb(env?.DB as D1Database);

      let dbUser = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, firebaseUser.uid))
        .get();

      if (!dbUser) {
        
        // First time user - create in database
        // Note: We'll need to determine role during onboarding
        const [newUser] = await db
          .insert(users)
          .values({
            email: firebaseUser.email,
            firebaseUid: firebaseUser.uid,
            authProvider: firebaseUser.provider || 'google', // Provider from Firebase token
            role: firebaseUser.customClaims?.role || 'investor', // Default to investor
            currentPricingPlan: 'free',
          })
          .returning();

        dbUser = newUser;
      }

      user = {
        id: dbUser.id,
        firebaseUid: dbUser.firebaseUid,
        email: dbUser.email,
        role: dbUser.role,
        currentPricingPlan: dbUser.currentPricingPlan,
      };
    } catch (error) {
      // Token verification failed - user remains null
      console.log('Auth error:', error);
    }
  }

  return user;
}

// Helper function to require authentication
export function requireAuth(user: AuthUser | null): AuthUser {
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Helper function to require specific role
export function requireRole(user: AuthUser, requiredRole: 'startup_owner' | 'investor'): AuthUser {
  if (user.role !== requiredRole) {
    throw new Error(`Access denied. Required role: ${requiredRole}`);
  }
  return user;
}