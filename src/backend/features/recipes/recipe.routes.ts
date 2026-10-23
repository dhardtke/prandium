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

    '/api/recipes/:id': {
      GET: (req) => controller.show(req),
      PATCH: (req) => controller.update(req),
      DELETE: (req) => controller.delete(req),
    },
  };
}

/** Public: a redirect reveals nothing, and the page it lands on asks for the login. */
export function legacyRecipeRoutes(db: DB, config: Config): RouteTable {
  const controller = new RecipeController(createRecipesFacade(db, config));
  const to =
    (path: string) =>
    (req: Request): Response =>
      Response.redirect(new URL(path, req.url), 301);

  return {
    '/recipe/create': { GET: to('/recipes/new') },
    '/recipe/import': { GET: to('/recipes/import') },
    '/recipe/:id/:slug': { GET: (req) => controller.legacy(req, '') },
    '/recipe/:id/:slug/edit': { GET: (req) => controller.legacy(req, '/edit') },
  };
}
