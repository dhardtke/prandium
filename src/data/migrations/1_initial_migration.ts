import {Database} from "../db.ts";
import {Migration} from "./migration.ts";

export const InitialMigration = new class InitialMigration extends Migration {
    constructor() {
        super(1);
    }

    async migrate(db: Database) {
        const queries = [
            `DROP TABLE IF EXISTS book`,
            `DROP TABLE IF EXISTS recipe`,
            `CREATE TABLE book
             (
                 id         INTEGER PRIMARY KEY,
                 created_at timestamp NOT NULL DEFAULT current_timestamp,
                 updated_at timestamp NOT NULL DEFAULT current_timestamp,
                 name       TEXT
             )`,
            `CREATE TABLE recipe
             (
                 id         INTEGER PRIMARY KEY,
                 created_at timestamp NOT NULL DEFAULT current_timestamp,
                 updated_at timestamp NOT NULL DEFAULT current_timestamp,
                 name       TEXT
             )`,
            // some dummy data
            `INSERT INTO recipe (name)
             VALUES ('Recipe 1'),
                    ('Recipe 2'),
                    ('Recipe 3'),
                    ('Recipe 4')`
        ];
        for (const sql of queries) {
            db.exec(sql);
        }
    }
}
