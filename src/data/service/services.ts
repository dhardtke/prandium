import { Database } from "../db.ts";
import { BookService } from "./book_service.ts";
import { RecipeService } from "./recipe_service.ts";

export interface Services {
  RecipeService: RecipeService;
  BookService: BookService;
}

export function servicesFactory(db: Database): Services {
  return {
    RecipeService: new RecipeService(db),
    BookService: new BookService(db),
  };
}
