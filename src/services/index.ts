import { Database } from '../db';
import { UserService } from './user.service';
import { StartupService } from './startup.service';
import { FavoritesService } from './favorites.service';

// Service factory function
export function createServices(db: Database) {
  return {
    user: new UserService(db),
    startup: new StartupService(db),
    favorites: new FavoritesService(db),
  };
}

export type Services = ReturnType<typeof createServices>;

export { UserService } from './user.service';
export { StartupService } from './startup.service';
export { FavoritesService } from './favorites.service';

// Re-export types
export type {
  CreateUserInput,
  UpdateUserProfileInput,
  UserStats,
} from './user.service';

export type {
  CreateStartupInput,
  UpdateStartupInput,
  StartupFilters,
  StartupSummary,
  StartupDetails,
} from './startup.service';