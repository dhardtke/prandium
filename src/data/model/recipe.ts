import { toDate } from "../util/convert.ts";
import { Model, ModelArgs } from "./model.ts";
import { Tag } from "./tag.ts";

export class Recipe extends Model {
  static readonly columns = [
    ...Model.columns,
    "title",
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

  constructor(
    args: ModelArgs & {
      title: string;
      description?: string;
      tags?: Tag[];
      source: string;
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
    },
  ) {
    super(args);
    this.title = args.title;
    this.description = args.description;
    this.tags = args.tags || [];
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
  }

  public readonly title!: string;
  public readonly description?: string;
  public readonly tags: Tag[];
  public readonly thumbnail?: string;
  public readonly source: string;
  public readonly yield: number;
  public readonly nutritionCalories?: string;
  public readonly nutritionCarbohydrate?: string;
  public readonly nutritionCholesterol?: string;
  public readonly nutritionFat?: string;
  public readonly nutritionFiber?: string;
  public readonly nutritionProtein?: string;
  public readonly nutritionSaturatedFat?: string;
  public readonly nutritionSodium?: string;
  public readonly nutritionSugar?: string;
  public readonly nutritionTransFat?: string;
  public readonly nutritionUnsaturatedFat?: string;
  public readonly prepTime: number;
  public readonly cookTime: number;
  public readonly aggregateRatingValue?: number;
  public readonly aggregateRatingCount?: number;
  public readonly rating: number;
  public readonly history: Date[];
  public readonly reviews: Review[];
  public readonly ingredients: string[];
  public readonly instructions: string[];
}

export class Review {
  static readonly columns = [
    "id",
    "date",
    "text",
  ];

  constructor(
    args: { id?: number; date: Date | string; text: string },
  ) {
    this._id = args.id;
    this._date = toDate(args.date);
    this._text = args.text;
  }

  private _id?: number;
  private _date: Date;
  private _text: string;

  get id(): number | undefined {
    return this._id;
  }

  set id(value: number | undefined) {
    this._id = value;
  }

  get date(): Date {
    return this._date;
  }

  set date(value: Date) {
    this._date = value;
  }

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    this._text = value;
  }
}
