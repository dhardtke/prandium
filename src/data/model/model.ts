import { toDate } from "../convert.ts";

export interface ModelArgs {
  id?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export abstract class Model {
  static readonly columns = ["id", "created_at", "updated_at"];

  protected constructor(
    args: ModelArgs,
  ) {
    this.id = args.id;
    this.createdAt = toDate(args.createdAt);
    this.updatedAt = toDate(args.updatedAt);
  }

  private _id?: number;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  get id(): number | undefined {
    return this._id;
  }

  set id(value: number | undefined) {
    this._id = value;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  set createdAt(value: Date) {
    this._createdAt = value;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  set updatedAt(value: Date) {
    this._updatedAt = value;
  }
}
