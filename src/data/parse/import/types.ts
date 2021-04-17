import { Recipe } from "../../model/recipe.ts";

export interface ImportRecipeRequest {
  url: string;
  configDir: string;
  userAgent: string;
}

export interface ImportRecipeResponse {
  url: string;
  success: boolean;
  recipe?: Recipe;
  error?: string;
}
