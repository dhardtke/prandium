import { Database } from "../db.ts";
import { Migration } from "./migration.ts";

export const InitialMigration = new class InitialMigration extends Migration {
  constructor() {
    super(1);
  }

  async migrate(db: Database) {
    const queries = [
      `CREATE TABLE book
       (
         id          INTEGER PRIMARY KEY,
         created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp,
         updated_at  TIMESTAMP NOT NULL DEFAULT current_timestamp,
         title       TEXT,
         description TEXT
       )`,
      `CREATE TABLE recipe
       (
         id          INTEGER PRIMARY KEY,
         created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp,
         updated_at  TIMESTAMP NOT NULL DEFAULT current_timestamp,
         title       TEXT,
         description TEXT,
         book_id     INTEGER   NOT NULL REFERENCES book (id) ON DELETE CASCADE
       )`,
    ];
    for (const sql of queries) {
      await db.exec(sql);
    }
  }
}();
