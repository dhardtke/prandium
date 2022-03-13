import { Database } from "../db.ts";
import { Migration } from "./migration.ts";

export const TimesSecondsToMinutes = new class TimesSecondsToMinutes extends Migration {
  constructor() {
    super(4);
  }

  migrate(db: Database) {
    const queries = [
      `UPDATE recipe
       SET prep_time = prep_time / 60`,
      `UPDATE recipe
       SET cook_time = cook_time / 60`,
    ];
    for (const sql of queries) {
      db.exec(sql);
    }
  }
}();
