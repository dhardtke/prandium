export type LanguageId = 'en' | 'de';

interface OrderBy {
  asc: string;
  desc: string;
  title: string;
}

interface Pagination {
  next: string;
  previous: string;
  page: (page: number) => string;
  emptyPage: string;
  firstPage: string;
}

interface Group {
  basic: string;
  nutrition: string;
  ratings: string;
  times: string;
}

interface Form {
  addHistoryEntry: string;
  createIngredient: string;
  createInstruction: string;
  deleteThumbnail: string;
  group: Group;
  imageError: string;
  thumbnailHint: string;
  timeHint: string;
}

interface Import {
  alert: string;
  result: string;
  sourceUrl: string;
  title: string;
  urlInfo: string;
  urls: string;
}

interface Nutrition {
  calories: string;
  carbohydrate: string;
  cholesterol: string;
  fat: string;
  fiber: string;
  protein: string;
  saturatedFat: string;
  sodium: string;
  sugar: string;
  transFat: string;
  unsaturatedFat: string;
}

interface Time {
  cook: string;
  prep: string;
  total: string;
}

interface Ingredients {
  step: (step: number) => string;
  title: string;
}

interface Recipe {
  count: (n: number) => string;
  newRecipe: string;
  actions: string;
  cookedTimes: (n: number) => string;
  tagsSelected: (n: number) => string;
  noTags: string;
  aggregateRating: string;
  aggregateRatingCount: string;
  aggregateRatingValue: string;
  clearAllTags: string;
  cookTime: string;
  cookedCount: string;
  createSuccessful: string;
  deleteConfirmation: string;
  deleteSuccessful: string;
  editSuccessful: string;
  form: Form;
  import: Import;
  ingredients: Ingredients;
  instructions: string;
  lastCooked: (distance: string) => string;
  lastCookedAt: string;
  flagged: string;
  flag: string;
  unflag: string;
  noRecipesFound: string;
  notCookedYet: string;
  noTimes: string;
  nutrition: Nutrition;
  open: string;
  orderBy: string;
  portions: string;
  prepTime: string;
  rating: string;
  reviews: string;
  source: string;
  time: Time;
  yield: string;
  history: string;
}

interface Navigation {
  filterPlaceholder: string;
  filterTitle: string;
  tags: string;
}

interface Error {
  404: ErrorDetail;
  500: ErrorDetail;
  title: string;
}

interface ErrorDetail {
  description: string;
  title: string;
}

export interface Language {
  appName: string;
  cancel: string;
  confirmation: string;
  create: string;
  createdAt: string;
  delete: string;
  description: string;
  down: string;
  edit: string;
  error: Error;
  id: string;
  info: string;
  navigation: Navigation;
  no: string;
  orderBy: OrderBy;
  pagination: Pagination;
  recipe: Recipe;
  recipes: string;
  save: string;
  search: string;
  title: string;
  up: string;
  updatedAt: string;
  yes: string;
  darkMode: string;
  lightMode: string;
  language: string;
  nutritionalValue: string;
  languageNames: Record<LanguageId, string>;
  notFound: (path: string) => string;
  loading: string;
  logOut: string;
  menu: string;
  theme: {
    turnOnDark: string;
    turnOffDark: string;
  };
  login: {
    title: string;
    password: string;
    placeholder: string;
    submit: string;
    wrongPassword: string;
  };
  meta: {
    id: LanguageId;
    name: string;
    bcp47: string;
  };
}
