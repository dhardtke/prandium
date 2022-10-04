import { Database } from "../db.ts";
import { Migration } from "./migration.ts";

export const RemoveTagDescription: Migration = {
    version: 5,
    name: "RemoveTagDescription",

    migrate(db: Database) {
        db.exec("ALTER TABLE tag DROP COLUMN description");
    },
};
