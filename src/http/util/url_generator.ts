import { Recipe } from "../../data/model/recipe.ts";

function join<T>(parameters?: T[]): string {
  return parameters ? parameters.join("&") : "";
}

const PlaceholderImage = "/assets/placeholder.svg";

const AccentsPattern = /[\u0300-\u036f]/g;
const SuperfluousCharacterPattern = /[^a-z0-9 ]/g;
const SpacePattern = /\s+/g;
const SlugMaxLength = 80;

const slug = (str: string): string => {
  return str
    .normalize("NFD") // split an accented letter in the base letter and the accent
    .replace(AccentsPattern, "") // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(SuperfluousCharacterPattern, "") // remove all chars not letters, numbers and spaces (to be replaced)
    .replace(SpacePattern, "-")
    .substr(0, SlugMaxLength);
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
  recipeFlag: (recipe: Recipe): string => {
    return `/recipe/${recipe.id}/${slug(recipe.title)}/flag`;
  },
  thumbnail: (filename?: string): string => {
    return filename ? `/thumbnails/${filename}` : PlaceholderImage;
  },
};
