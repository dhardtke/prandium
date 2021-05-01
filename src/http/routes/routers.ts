import { AssetsRouter } from "./assets.routes.ts";
import { IndexRouter } from "./index.routes.ts";
import { RecipeRouter } from "./recipe.routes.ts";
import { ThumbnailsRouter } from "./thumbnails.routes.ts";

export const Routers = [
  IndexRouter,
  AssetsRouter,
  ThumbnailsRouter,
  RecipeRouter,
];
