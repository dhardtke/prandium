import { toDate } from "../convert.ts";

export abstract class Model {
  protected constructor(
    args: {
      id?: number;
      createdAt?: Date | string;
      updatedAt?: Date | string;
    },
  ) {
    this.id = args.id;
    this.createdAt = toDate(args.createdAt);
    this.updatedAt = toDate(args.updatedAt);
  }

  static get columns(): string[] {
    return ["id", "created_at", "updated_at"];
  }

  private _id?: number;

  get id(): number | undefined {
    return this._id;
  }

  set id(value: number | undefined) {
    this._id = value;
  }

  private _createdAt!: Date;

  get createdAt(): Date {
    return this._createdAt;
  }

  set createdAt(value: Date) {
    this._createdAt = value;
  }

  private _updatedAt!: Date;

  get updatedAt(): Date {
    return this._updatedAt;
  }

  set updatedAt(value: Date) {
    this._updatedAt = value;
  }
}
