import { Database } from "../db.ts";
import { RecipeService } from "./recipe_service.ts";
import { TagService } from "./tag_service.ts";

export interface Services {
  RecipeService: RecipeService;
  TagService: TagService;
}

export function servicesFactory(db: Database): Services {
  const tagService = new TagService(db);
  return {
    TagService: tagService,
    RecipeService: new RecipeService(db, tagService),
  };
}
