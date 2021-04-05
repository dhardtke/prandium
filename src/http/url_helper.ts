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

  public recipeEdit = (recipe: Recipe): string => {
    return `/recipe/${recipe.id}/${this.slug(recipe.title)}/edit`;
  };

  public recipeDelete = (recipe: Recipe): string => {
    return `/recipe/${recipe.id}/${this.slug(recipe.title)}/delete`;
  };

  public thumbnail = (filename: string): string => {
    return `/thumbnails/${filename}`;
  };

  public removeParameterValue(
    url: URL,
    parameterName: string,
    parameterValue: string | number,
  ): string {
    const result = new URL(url.toString());
    const all = result.searchParams.getAll(parameterName);
    result.searchParams.delete(parameterName);
    all.filter((v) => v !== parameterValue + "").forEach((val) =>
      result.searchParams.append(parameterName, val)
    );
    return result.toString();
  }

  public removeParameter(url: URL, parameterName: string): string {
    const result = new URL(url.toString());
    result.searchParams.delete(parameterName);
    return result.toString();
  }

  public parameter(url: URL, parameterName: string, _default = ""): string {
    return url.searchParams.get(parameterName) || _default;
  }
}
