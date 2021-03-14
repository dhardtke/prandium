import { Model, ModelArgs } from "./model.ts";
import { Recipe } from "./recipe.ts";

export class Book extends Model {
  static columns = [...Model.columns, "title", "description"];

  constructor(
    args: ModelArgs & {
      title: string;
      description?: string;
      recipes?: Iterable<Recipe>;
    },
  ) {
    super(args);
    this._title = args.title;
    this._description = args.description;
    this._recipes = args.recipes || [];
  }

  private _title!: string;

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
  }

  private _description?: string;

  get description(): string | undefined {
    return this._description;
  }

  set description(value: string | undefined) {
    this._description = value;
  }

  private _recipes: Iterable<Recipe>;

  get recipes(): Iterable<Recipe> {
    return this._recipes;
  }

  set recipes(value: Iterable<Recipe>) {
    this._recipes = value;
  }
}
