import { Language } from "./mod.ts";

export const en: Language = {
  appName: "Prandium",
  cancel: "Cancel",
  confirmation: "Confirmation",
  create: "Create",
  createdAt: "Created",
  delete: "Delete",
  description: "Description",
  down: "Down",
  edit: "Edit",
  error: {
    404: {
      description: "The page you are looking for can not be found.",
      title: "Not Found",
    },
    500: {
      description: "A server error occurred.",
      title: "Server Error",
    },
    title: "Error",
  },
  id: "ID",
  info: "Info",
  navigation: {
    filterPlaceholder: "Start typing to filter...",
    filterTitle: "Filter",
    tags: "Tags",
  },
  no: "No",
  orderBy: {
    asc: "Switch to ascending order",
    desc: "Switch to descending order",
    title: "Order by",
  },
  pagination: {
    next: "Next page",
    previous: "Previous page",
  },
  recipe: {
    count: (n) => `${n} Recipe${n === 1 ? "" : "s"}`,
    aggregateRating: "Foreign rating",
    aggregateRatingCount: "Number of foreign ratings",
    aggregateRatingValue: "Foreign rating",
    clearAllTags: "Clear all",
    cookTime: "Cook time",
    cookedCount: "Cooked count",
    createSuccessful: "The Recipe has been created successfully.",
    deleteConfirmation: "Are you sure you want to delete this Recipe?",
    deleteSuccessful: "The Recipe has been deleted successfully.",
    editSuccessful: "The Recipe has been edited successfully.",
    form: {
      addHistoryEntry: "Create History entry",
      createIngredient: "Create Ingredient",
      createInstruction: "Create Instruction",
      deleteThumbnail: "Delete thumbnail",
      group: {
        basic: "Basic",
        nutrition: "Nutrition",
        ratings: "Ratings",
        times: "Times",
      },
      imageError: "Please make sure you select an image.",
      thumbnailHint: "You may click or drag and drop an image here.",
      timeHint: "Time in seconds.",
    },
    import: {
      alert: "The URLs have been processed. Please find the results below.",
      result: "Result",
      sourceUrl: "Source URL",
      title: "Import",
      urlInfo: "One URL per line.",
      urls: "URLs",
    },
    ingredients: {
      step: (step) => `Step ${step}`,
      title: "Ingredients",
    },
    instructions: "Instructions",
    lastCooked: (distance) => `Last cooked ${distance}.`,
    lastCookedAt: "Last cooked at",
    flagged: "Flagged",
    flag: "Flag",
    unflag: "Remove flag",
    noRecipesFound: "No recipes have been found for the current filter. Please change the filter options or add some more recipes.",
    notCookedYet: "Not cooked yet.",
    nutrition: {
      calories: "Calories",
      carbohydrate: "Carbohydrate",
      cholesterol: "Cholesterol",
      fat: "Fat",
      fiber: "Fiber",
      protein: "Protein",
      saturatedFat: "Saturated Fat",
      sodium: "Sodium",
      sugar: "Sugar",
      transFat: "Trans Fat",
      unsaturatedFat: "Unsaturated Fat",
    },
    open: "Open",
    orderBy: "Order by",
    portions: "Portions",
    prepTime: "Prep time",
    rating: "Your Rating",
    reviews: "Reviews",
    source: "Source",
    time: {
      cook: "Cook time",
      prep: "Prep time",
      total: "Total time",
    },
    yield: "Yield",
    history: "History",
  },
  recipes: "Recipes",
  save: "Save",
  search: "Search",
  title: "Title",
  up: "Up",
  updatedAt: "Updated",
  yes: "Yes",
  darkMode: "Dark Mode",
  lightMode: "Light Mode",
  language: "Language",
  nutritionalValue: "Nutritional Value",
  meta: {
    id: "en",
    flag:
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 7410 3900"><path fill="#b22234" d="M0 0h7410v3900H0z"/><path d="M0 450h7410m0 600H0m0 600h7410m0 600H0m0 600h7410m0 600H0" stroke="#fff" stroke-width="300"/><path fill="#3c3b6e" d="M0 0h2964v2100H0z"/><g fill="#fff"><g id="d"><g id="c"><g id="e"><g id="b"><path id="a" d="M247 90l70.534 217.082-184.66-134.164h228.253L176.466 307.082z"/><use xlink:href="#a" y="420"/><use xlink:href="#a" y="840"/><use xlink:href="#a" y="1260"/></g><use xlink:href="#a" y="1680"/></g><use xlink:href="#b" x="247" y="210"/></g><use xlink:href="#c" x="494"/></g><use xlink:href="#d" x="988"/><use xlink:href="#c" x="1976"/><use xlink:href="#e" x="2470"/></g></svg>`,
    labels: {
      de: "German",
      en: "English",
    },
    bcp47: "en-US",
  },
} as const;
