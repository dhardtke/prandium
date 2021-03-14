import { RecipeService } from "./recipe_service.ts";
import { BookService } from "./book_service.ts";

export interface Services {
  RecipeService: RecipeService;
  BookService: BookService;
}
