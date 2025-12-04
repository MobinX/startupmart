import { eq, and } from 'drizzle-orm';
import { Database } from '@/db';
import { favorites, startups } from '@/db/schema';

export class FavoritesService {
  constructor(private db: Database) {}

  async addFavorite(userId: number, startupId: number) {
    // Check if startup exists
    const startup = await this.db
      .select()
      .from(startups)
      .where(eq(startups.id, startupId))
      .get();

    if (!startup) {
      throw new Error('Startup not found');
    }

    // Check if already favorited
    const existingFavorite = await this.db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.startupId, startupId)))
      .get();

    if (existingFavorite) {
      throw new Error('Startup already in favorites');
    }

    // Add to favorites
    await this.db.insert(favorites).values({
      userId,
      startupId,
      createdAt: new Date(),
    });
  }

  async removeFavorite(userId: number, startupId: number) {
    // Check if favorite exists first
    const existingFavorite = await this.db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.startupId, startupId)))
      .get();

    if (!existingFavorite) {
      throw new Error('Favorite not found');
    }

    // Remove from favorites
    await this.db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.startupId, startupId)));
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