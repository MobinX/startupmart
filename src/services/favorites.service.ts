import { eq, and } from 'drizzle-orm';
import { Database } from '@/db';
import { favorites, startups } from '@/db/schema';
import { z } from 'zod';

export const favoriteSchema = z.object({
  startupId: z.number().int().positive(),
});

export class FavoritesService {
  constructor(private db: Database) {}

  async addFavorite(userId: number, rawData: unknown) {
    try {
      const validation = favoriteSchema.safeParse(rawData);
      if (!validation.success) {
        console.log('Favorite creation validation failed:', validation.error.errors);
        return { error: 'Invalid favorite data', details: validation.error.errors, status: 400 };
      }
      const { startupId } = validation.data;

      // Add to favorites directly, relying on DB constraints
      await this.db.insert(favorites).values({
        userId,
        startupId,
        createdAt: new Date(),
      });

      return { message: 'Added to favorites', status: 201 };
    } catch (error: any) {
      const errorMessage = error.message || '';
      const causeMessage = error.cause?.message || '';
      
      // Handle unique constraint violation (already favorited)
      if (
        errorMessage.includes('UNIQUE') || 
        causeMessage.includes('UNIQUE') ||
        error.code === 'SQLITE_CONSTRAINT_UNIQUE'
      ) {
        console.log('User', userId, 'already favorited startup:');
        return { error: 'Startup already in favorites', status: 409 };
      }
      // Handle foreign key violation (startup doesn't exist)
      if (
        errorMessage.includes('FOREIGN KEY') || 
        causeMessage.includes('FOREIGN KEY') ||
        error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY'
      ) {
        console.log('Startup not found for favoriting by user:', userId, 'startup:');
        return { error: 'Startup not found', status: 404 };
      }
      console.log('Failed to add favorite:', error);
      return { error: 'Failed to add favorite', status: 500 };
    }
  }

  async removeFavorite(userId: number, rawData: unknown) {
    try {
      const validation = favoriteSchema.safeParse(rawData);
      if (!validation.success) {
        console.log('Favorite removal validation failed:', validation.error.errors);
        return { error: 'Invalid favorite data', details: validation.error.errors, status: 400 };
      }
      const { startupId } = validation.data;

      // Remove from favorites and check if anything was deleted
      const result = await this.db
        .delete(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.startupId, startupId)))
        .returning({ id: favorites.startupId });

      if (result.length === 0) {
        console.log('Favorite not found for user:', userId, 'startup:', startupId);
        return { error: 'Favorite not found', status: 404 };
      }

      return { message: 'Removed from favorites', status: 200 };
    } catch (error) {
      console.log('Failed to remove favorite:', error);
      return { error: 'Failed to remove favorite', status: 500 };
    }
  }

  async getFavorites(userId: number) {
    try {
      const result = await this.db
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
          favoritedAt: favorites.createdAt,
        })
        .from(favorites)
        .innerJoin(startups, eq(favorites.startupId, startups.id))
        .where(eq(favorites.userId, userId));
      
      return { favorites: result, status: 200 };
    } catch (error) {
      console.log('Failed to get favorites:', error);
      return { error: 'Failed to get favorites', status: 500 };
    }
  }

  async isFavorited(userId: number, startupId: number) {
    try {
      const favorite = await this.db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.startupId, startupId)))
        .get();

      return { isFavorited: !!favorite, status: 200 };
    } catch (error) {
      console.log('Failed to check if favorited:', error);
      return { error: 'Failed to check if favorited', status: 500 };
    }
  }
}