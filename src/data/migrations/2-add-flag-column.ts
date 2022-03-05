import { Database } from "../db.ts";
import { Migration } from "./migration.ts";

export const AddFlagColumn = new class AddFlagColumn extends Migration {
  constructor() {
    super(2);
  }

  migrate(db: Database) {
    db.exec(`ALTER TABLE recipe
      ADD COLUMN flagged BOOLEAN DEFAULT FALSE`);
  }
}();
