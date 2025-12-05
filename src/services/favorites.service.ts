import { eq, and } from 'drizzle-orm';
import { Database } from '@/db';
import { favorites, startups } from '@/db/schema';
import { NotFoundError, ConflictError, DatabaseError } from '@/lib/errors';

export class FavoritesService {
  constructor(private db: Database) {}

  async addFavorite(userId: number, startupId: number) {
    try {
      // Add to favorites directly, relying on DB constraints
      await this.db.insert(favorites).values({
        userId,
        startupId,
        createdAt: new Date(),
      });
    } catch (error: any) {
      const errorMessage = error.message || '';
      const causeMessage = error.cause?.message || '';
      
      // Handle unique constraint violation (already favorited)
      if (
        errorMessage.includes('UNIQUE') || 
        causeMessage.includes('UNIQUE') ||
        error.code === 'SQLITE_CONSTRAINT_UNIQUE'
      ) {
        throw new ConflictError('Startup already in favorites');
      }
      // Handle foreign key violation (startup doesn't exist)
      if (
        errorMessage.includes('FOREIGN KEY') || 
        causeMessage.includes('FOREIGN KEY') ||
        error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY'
      ) {
        throw new NotFoundError('Startup not found');
      }
      throw new DatabaseError('Failed to add favorite', error);
    }
  }

  async removeFavorite(userId: number, startupId: number) {
    try {
      // Remove from favorites and check if anything was deleted
      const result = await this.db
        .delete(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.startupId, startupId)))
        .returning({ id: favorites.startupId });

      if (result.length === 0) {
        throw new NotFoundError('Favorite not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to remove favorite', error);
    }
  }

  async getFavorites(userId: number) {
    return await this.db
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
  }

  async isFavorited(userId: number, startupId: number): Promise<boolean> {
    const favorite = await this.db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.startupId, startupId)))
      .get();

    return !!favorite;
  }
}