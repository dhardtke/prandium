import { Database } from "../db.ts";
import { Migration } from "./migration.ts";

export const AddFlagColumn: Migration = {
  version: 2,
  name: "AddFlagColumn",

  migrate(db: Database) {
    db.exec(`ALTER TABLE recipe
      ADD COLUMN flagged BOOLEAN DEFAULT FALSE`);
  },
};
