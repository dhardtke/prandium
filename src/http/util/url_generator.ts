import { Recipe } from "../../data/model/recipe.ts";

function join<T>(parameters?: T[]): string {
  return parameters ? parameters.join("&") : "";
}

const PLACEHOLDER_IMAGE = "/assets/placeholder.svg";

const ACCENTS_PATTERN = /[\u0300-\u036f]/g;
const SUPERFLUOUS_CHARACTERS_PATTERN = /[^a-z0-9 ]/g;
const SPACE_PATTERN = /\s+/g;
const SLUG_MAX_LENGTH = 80;

const slug = (str: string): string => {
  return str
    .normalize("NFD") // split an accented letter in the base letter and the accent
    .replace(ACCENTS_PATTERN, "") // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(SUPERFLUOUS_CHARACTERS_PATTERN, "") // remove all chars not letters, numbers and spaces (to be replaced)
    .replace(SPACE_PATTERN, "-")
    .substr(0, SLUG_MAX_LENGTH);
};

export const UrlGenerator = {
  home: (): string => {
    return "/";
  },
  recipeList: (filters?: { tagIds?: number[] }): string => {
    return `/recipe${filters ? "?" : ""}${
      join(filters?.tagIds?.map((id) => "tagId=" + id))
    }`;
  },
  recipeImport: (): string => {
    return `/recipe/import`;
  },
  recipe: (recipe: Recipe): string => {
    return `/recipe/${recipe.id}/${slug(recipe.title)}`;
  },
  recipeCreate: (): string => {
    return `/recipe/create`;
  },
  recipeEdit: (recipe: Recipe): string => {
    return `/recipe/${recipe.id}/${slug(recipe.title)}/edit`;
  },
  recipeDelete: (recipe: Recipe): string => {
    return `/recipe/${recipe.id}/${slug(recipe.title)}/delete`;
  },
  thumbnail: (filename?: string): string => {
    return filename ? `/thumbnails/${filename}` : PLACEHOLDER_IMAGE;
  },
};
