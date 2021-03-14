import { Book } from "./book.ts";
import { Model, ModelArgs } from "./model.ts";

export class Recipe extends Model {
  constructor(
    args: ModelArgs & {
      name: string;
      description?: string;
      bookId: number;
      book?: Book;
    },
  ) {
    super(args);
    this._name = args.name;
    this._description = args.description;
    this._bookId = args.bookId;
    this._book = args.book;
  }

  public static get columns(): string[] {
    return [...super.columns, "name", "description"];
  }

  private _name!: string;

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  private _description?: string;

  get description(): string | undefined {
    return this._description;
  }

  set description(value: string | undefined) {
    this._description = value;
  }

  private _bookId!: number;

  get bookId(): number {
    return this._bookId;
  }

  set bookId(value: number) {
    this._bookId = value;
  }

  private _book?: Book;

  get book(): Book | undefined {
    return this._book;
  }

  set book(value: Book | undefined) {
    this._book = value;
    if (value) {
      this._bookId = value.id!;
    }
  }
}
