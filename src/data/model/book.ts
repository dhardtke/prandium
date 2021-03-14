import { Model, ModelArgs } from "./model.ts";
import { Recipe } from "./recipe.ts";

export class Book extends Model {
  constructor(
    args: ModelArgs & {
      name: string;
      description?: string;
      recipes?: Iterable<Recipe>;
    },
  ) {
    super(args);
    this._name = args.name;
    this._description = args.description;
    this._recipes = args.recipes || [];
  }

  private _name!: string;
  private _description?: string;
  private _recipes: Iterable<Recipe>;

  public static get columns(): string[] {
    return [...super.columns, "name", "description"];
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get description(): string | undefined {
    return this._description;
  }

  set description(value: string | undefined) {
    this._description = value;
  }

  get recipes(): Iterable<Recipe> {
    return this._recipes;
  }

  set recipes(value: Iterable<Recipe>) {
    this._recipes = value;
  }
}
