import { AssetsRouter } from "./assets.router.ts";
import { IndexRouter } from "./index.router.ts";
import { RecipeRouter } from "./recipe.router.ts";
import { ThumbnailsRouter } from "./thumbnails.router.ts";

export const Routers = [
  IndexRouter,
  AssetsRouter,
  ThumbnailsRouter,
  RecipeRouter,
];
