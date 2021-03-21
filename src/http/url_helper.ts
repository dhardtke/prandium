import { Recipe } from "../data/model/recipe.ts";

function join<T>(parameters?: T[]): string {
  return parameters ? parameters.join("&") : "";
}

export class UrlHelper {
  private static ACCENTS_PATTERN = /[\u0300-\u036f]/g;
  private static SUPERFLUOUS_CHARACTERS_PATTERN = /[^a-z0-9 ]/g;
  private static SPACE_PATTERN = /\s+/g;

  public static INSTANCE: UrlHelper = new UrlHelper();

  private constructor() {
  }

  public slug = (str: string): string => {
    return str
      .normalize("NFD") // split an accented letter in the base letter and the acent
      .replace(UrlHelper.ACCENTS_PATTERN, "") // remove all previously split accents
      .toLowerCase()
      .trim()
      .replace(UrlHelper.SUPERFLUOUS_CHARACTERS_PATTERN, "") // remove all chars not letters, numbers and spaces (to be replaced)
      .replace(UrlHelper.SPACE_PATTERN, "-");
  };

  public home = (): string => {
    return "/";
  };

  public recipeList = (filters?: { tagIds?: number[] }): string => {
    return `/recipe${filters ? "?" : ""}${
      join(filters?.tagIds?.map((id) => "tagId=" + id))
    }`;
  };

  public recipeImport = (): string => {
    return `/recipe/import`;
  };

  public recipe = (recipe: Recipe): string => {
    return `/recipe/${recipe.id}/${this.slug(recipe.title)}`;
  };

  public thumbnail = (filename: string): string => {
    return `/thumbnails/${filename}`;
  };
}
