import { Database } from "../db.ts";

export abstract class Migration {
  protected constructor(public readonly version: number) {
  }

  abstract migrate(db: Database): void;
}
