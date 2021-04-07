import { Database } from "../db.ts";
import { Migration } from "./migration.ts";

export const InitialMigration = new class InitialMigration extends Migration {
  constructor() {
    super(1);
  }

  migrate(db: Database) {
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
         id                        INTEGER PRIMARY KEY,
         created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
         updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
         title                     TEXT      NOT NULL,
         description               TEXT,
         source                    TEXT,
         thumbnail                 TEXT,
         yield                     NUMERIC,
         nutrition_calories        TEXT,
         nutrition_carbohydrate    TEXT,
         nutrition_cholesterol     TEXT,
         nutrition_fat             TEXT,
         nutrition_fiber           TEXT,
         nutrition_protein         TEXT,
         nutrition_saturated_fat   TEXT,
         nutrition_sodium          TEXT,
         nutrition_sugar           TEXT,
         nutrition_trans_fat       TEXT,
         nutrition_unsaturated_fat TEXT,
         prep_time                 NUMERIC,
         cook_time                 NUMERIC,
         aggregate_rating_value    REAL,
         aggregate_rating_count    NUMERIC,
         rating                    REAL,
         ingredients               TEXT,
         instructions              TEXT
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
      `CREATE TABLE recipe_review
       (
         id        INTEGER PRIMARY KEY,
         recipe_id INTEGER   NOT NULL REFERENCES recipe (id) ON DELETE CASCADE,
         date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
         text      TEXT      NOT NULL
       )`,
    ];
    for (const sql of queries) {
      db.exec(sql);
    }
  }
}();
