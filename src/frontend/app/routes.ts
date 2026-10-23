import { authRoutes } from '../features/auth/auth.routes.ts';
import { recipesRoutes } from '../features/recipes/recipes.routes.ts';
import type { RouteDef } from './router.ts';

// Spread order is the header order.
export const ROUTES: readonly RouteDef[] = [...recipesRoutes, ...authRoutes];
