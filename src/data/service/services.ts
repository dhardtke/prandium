import { RecipeService } from "./RecipeService.ts";
import { BookService } from "./BookService.ts";

export interface Services {
  RecipeService: RecipeService;
  BookService: BookService;
}
