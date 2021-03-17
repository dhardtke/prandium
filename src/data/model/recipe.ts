import { toDate } from "../convert.ts";
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
      prepTime?: number;
      cookTime?: number;
      rating?: number;
      history?: (Date | string)[];
      ingredients?: string[];
      instructions?: string[];
    },
  ) {
    super(args);
    this._title = args.title;
    this._description = args.description;
    this._tags = args.tags || [];
    this._source = args.source;
    this._thumbnail = args.thumbnail;
    this._yield = args.yield || 1;
    this._prepTime = args.prepTime || 0;
    this._cookTime = args.cookTime || 0;
    this._rating = args.rating || 0;
    this._history = args.history ? args.history.map((d) => toDate(d)) : [];
    this._ingredients = args.ingredients || [];
    this._instructions = args.instructions || [];
  }

  private _title!: string;
  private _description?: string;
  private _tags: Tag[];
  private _thumbnail?: string;
  private _source: string;
  private _yield: number;
  private _prepTime: number;
  private _cookTime: number;
  private _rating: number;
  private _history: Date[];
  private _ingredients: string[];
  private _instructions: string[];

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
  }

  get description(): string | undefined {
    return this._description;
  }

  set description(value: string | undefined) {
    this._description = value;
  }

  get tags(): Tag[] {
    return this._tags;
  }

  set tags(value: Tag[]) {
    this._tags = value;
  }

  get thumbnail(): string | undefined {
    return this._thumbnail;
  }

  set thumbnail(value: string | undefined) {
    this._thumbnail = value;
  }

  get source(): string {
    return this._source;
  }

  set source(value: string) {
    this._source = value;
  }

  get yield(): number {
    return this._yield;
  }

  set yield(value: number) {
    this._yield = value;
  }

  get prepTime(): number {
    return this._prepTime;
  }

  set prepTime(value: number) {
    this._prepTime = value;
  }

  get cookTime(): number {
    return this._cookTime;
  }

  set cookTime(value: number) {
    this._cookTime = value;
  }

  get totalTime(): number {
    return this._prepTime + this._cookTime;
  }

  get rating(): number {
    return this._rating;
  }

  set rating(value: number) {
    this._rating = value;
  }

  get history(): Date[] {
    return this._history;
  }

  set history(value: Date[]) {
    this._history = value;
  }

  get ingredients(): string[] {
    return this._ingredients;
  }

  set ingredients(value: string[]) {
    this._ingredients = value;
  }

  get instructions(): string[] {
    return this._instructions;
  }

  set instructions(value: string[]) {
    this._instructions = value;
  }
}
