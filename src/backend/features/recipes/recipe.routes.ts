import type { Config } from '../../config.ts';
import type { DB } from '../../db/db.ts';
import type { RouteTable } from '../../http/routing.ts';
import { RecipeController } from './internal/recipe.controller.ts';
import { createRecipesFacade } from './recipes.facade.ts';

export function recipeRoutes(db: DB, config: Config): RouteTable {
  const controller = new RecipeController(createRecipesFacade(db, config));

  return {
    '/api/recipes': {
      GET: (req) => controller.list(req),
      POST: (req) => controller.create(req),
    },
  };
}
