import { Database } from '../db';
import { UserService } from './user.service';
import { StartupService } from './startup.service';
import { FavoritesService } from './favorites.service';
import { PlanService } from './plan.service';

// Service factory function
export function createServices(db: Database) {
  return {
    user: new UserService(db),
    startup: new StartupService(db),
    favorites: new FavoritesService(db),
    plan: new PlanService(db),
  };
}

export type Services = ReturnType<typeof createServices>;

export { UserService } from './user.service';
export { StartupService } from './startup.service';
export { FavoritesService } from './favorites.service';
export { PlanService } from './plan.service';

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

export type {
  CreatePlanInput,
  UpdatePlanInput,
  PlanWithSubscription,
} from './plan.service';