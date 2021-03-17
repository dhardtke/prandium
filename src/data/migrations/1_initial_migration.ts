import { Database } from "../db.ts";
import { Migration } from "./migration.ts";

export const InitialMigration = new class InitialMigration extends Migration {
  constructor() {
    super(1);
  }

  async migrate(db: Database) {
    const queries = [
      `CREATE TABLE tag
       (
         id          INTEGER PRIMARY KEY,
         created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
         updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
         title       TEXT UNIQUE,
         description TEXT
       )`,
      `CREATE TABLE recipe
       (
         id           INTEGER PRIMARY KEY,
         created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
         updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
         title        TEXT,
         description  TEXT,
         source       TEXT,
         thumbnail    TEXT,
         yield        NUMERIC,
         prep_time    NUMERIC,
         cook_time    NUMERIC,
         rating       REAL,
         ingredients  TEXT,
         instructions TEXT
       )`,
      `CREATE TABLE recipe_tag
       (
         tag_id    INTEGER NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
         recipe_id INTEGER NOT NULL REFERENCES recipe (id) ON DELETE CASCADE
       )`,
      `CREATE TABLE recipe_keyword
       (
         recipe_id INTEGER NOT NULL REFERENCES recipe (id) ON DELETE CASCADE,
         keyword   TEXT    NOT NULL,
         PRIMARY KEY (recipe_id, keyword)
       )`,
      `CREATE TABLE recipe_history
       (
         recipe_id INTEGER   NOT NULL REFERENCES recipe (id) ON DELETE CASCADE,
         timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
         PRIMARY KEY (recipe_id, timestamp)
       )`,
    ];
    for (const sql of queries) {
      await db.exec(sql);
    }
  }
}();
