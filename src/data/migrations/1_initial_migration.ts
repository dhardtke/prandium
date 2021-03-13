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
                 id          INTEGER PRIMARY KEY,
                 created_at  timestamp NOT NULL DEFAULT current_timestamp,
                 updated_at  timestamp NOT NULL DEFAULT current_timestamp,
                 name        TEXT,
                 description TEXT
             )`
        ];
        for (const sql of queries) {
            await db.exec(sql);
        }

        // dummy data
        // TODO find a nice way for DEV mode with initial content?
        for (let i = 0; i < 50; i++) {
            await db.exec(`INSERT INTO recipe (name, description)
                     VALUES (?, 'Lorem Ipsum')`, [`Recipe ${i + 1}`]);
        }
    }
}
