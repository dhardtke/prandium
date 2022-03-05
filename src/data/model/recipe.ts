import { toDate, toFloat, toInt, tupleToDate } from "../util/convert.ts";
import { Model, ModelArgs } from "./model.ts";
import { Tag } from "./tag.ts";

export class Recipe extends Model {
  static readonly columns = [
    ...Model.columns,
    "title",
    "flagged",
    "description",
    "source",
    "thumbnail",
    "yield",
    "nutrition_calories",
    "nutrition_carbohydrate",
    "nutrition_cholesterol",
    "nutrition_fat",
    "nutrition_fiber",
    "nutrition_protein",
    "nutrition_saturated_fat",
    "nutrition_sodium",
    "nutrition_sugar",
    "nutrition_trans_fat",
    "nutrition_unsaturated_fat",
    "prep_time",
    "cook_time",
    "aggregate_rating_value",
    "aggregate_rating_count",
    "prep_time",
    "cook_time",
    "rating",
    "ingredients",
    "instructions",
  ];

  public title!: string;
  public flagged: boolean;
  public description?: string;
  public thumbnail?: string;
  public source?: string;
  public yield: number;
  public nutritionCalories?: string;
  public nutritionCarbohydrate?: string;
  public nutritionCholesterol?: string;
  public nutritionFat?: string;
  public nutritionFiber?: string;
  public nutritionProtein?: string;
  public nutritionSaturatedFat?: string;
  public nutritionSodium?: string;
  public nutritionSugar?: string;
  public nutritionTransFat?: string;
  public nutritionUnsaturatedFat?: string;
  public prepTime: number;
  public cookTime: number;
  public aggregateRatingValue?: number;
  public aggregateRatingCount?: number;
  public rating: number;
  public history: Date[];
  public reviews: Review[];
  public ingredients: string[];
  public instructions: string[];

  // synthetic columns
  public tags: Tag[];
  public totalTime?: number;
  public lastCookedAt?: Date;
  public cookedCount?: number;

  constructor(
    args: ModelArgs & {
      title?: string;
      flagged?: boolean;
      description?: string;
      source?: string;
      thumbnail?: string;
      yield?: number;
      nutritionCalories?: string;
      nutritionCarbohydrate?: string;
      nutritionCholesterol?: string;
      nutritionFat?: string;
      nutritionFiber?: string;
      nutritionProtein?: string;
      nutritionSaturatedFat?: string;
      nutritionSodium?: string;
      nutritionSugar?: string;
      nutritionTransFat?: string;
      nutritionUnsaturatedFat?: string;
      prepTime?: number;
      cookTime?: number;
      aggregateRatingValue?: number;
      aggregateRatingCount?: number;
      rating?: number;
      history?: (Date | string)[];
      reviews?: Review[];
      ingredients?: string[];
      instructions?: string[];

      tags?: Tag[];
      totalTime?: number;
      lastCookedAt?: Date | string;
      cookedCount?: number;
    },
  ) {
    super(args);
    this.title = args.title || "";
    this.flagged = Boolean(args.flagged);
    this.description = args.description;
    this.source = args.source;
    this.thumbnail = args.thumbnail;
    this.yield = args.yield || 1;
    this.nutritionCalories = args.nutritionCalories;
    this.nutritionCarbohydrate = args.nutritionCarbohydrate;
    this.nutritionCholesterol = args.nutritionCholesterol;
    this.nutritionFat = args.nutritionFat;
    this.nutritionFiber = args.nutritionFiber;
    this.nutritionProtein = args.nutritionProtein;
    this.nutritionSaturatedFat = args.nutritionSaturatedFat;
    this.nutritionSodium = args.nutritionSodium;
    this.nutritionSugar = args.nutritionSugar;
    this.nutritionTransFat = args.nutritionTransFat;
    this.nutritionUnsaturatedFat = args.nutritionUnsaturatedFat;
    this.prepTime = args.prepTime || 0;
    this.cookTime = args.cookTime || 0;
    this.aggregateRatingValue = args.aggregateRatingValue;
    this.aggregateRatingCount = args.aggregateRatingCount;
    this.rating = args.rating || 0;
    this.history = args.history ? args.history.map((d) => toDate(d)) : [];
    this.reviews = args.reviews || [];
    this.ingredients = args.ingredients || [];
    this.instructions = args.instructions || [];

    this.tags = args.tags || [];
    this.totalTime = args.totalTime;
    this.lastCookedAt = args.lastCookedAt ? toDate(args.lastCookedAt) : undefined;
    this.cookedCount = args.cookedCount;
  }

  updateFromRawData(data: Record<keyof this, string[]>): this {
    const get = (key: keyof this) => {
      return (data[key] as string[])[0];
    };
    const stringFields: (keyof this)[] = [
      "title",
      "description",
      "source",
      "nutritionCalories",
      "nutritionCarbohydrate",
      "nutritionCholesterol",
      "nutritionFat",
      "nutritionFiber",
      "nutritionProtein",
      "nutritionSaturatedFat",
      "nutritionSodium",
      "nutritionSugar",
      "nutritionTransFat",
      "nutritionUnsaturatedFat",
      "source",
    ];
    for (const field of stringFields) {
      this[field] = get(field) as never;
    }
    this.yield = toInt(get("yield"));
    this.prepTime = toInt(get("prepTime"));
    this.cookTime = toInt(get("cookTime"));
    this.aggregateRatingValue = toFloat(get("aggregateRatingValue"));
    this.aggregateRatingCount = toInt(get("aggregateRatingCount"));
    this.rating = toFloat(get("rating"));
    this.ingredients = data.ingredients as string[];
    this.instructions = data.instructions as string[];
    if (data.history?.length % 2 !== 0) {
      throw new Error(`Can't proceed: History entries not passed as tuples.`);
    }
    this.history = [];
    for (let i = 0; i < data.history.length; i += 2) {
      const date = tupleToDate(data.history[i], data.history[i + 1]);
      this.history.push(date);
    }

    this.updatedAt = new Date();

    return this;
  }
}

export class Review {
  static columns = [
    "id",
    "date",
    "text",
  ];

  public id?: number;
  public date: Date;
  public text: string;

  constructor(
    args: { id?: number; date: Date | string; text: string },
  ) {
    this.id = args.id;
    this.date = toDate(args.date);
    this.text = args.text;
  }
}
