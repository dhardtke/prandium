import { Database } from "../../src/data/db.ts";

export function flushAllTables(db: Database) {
    const tables = db.query<{ name: string }>("select name from sqlite_master where type = 'table'");
    for (const table of tables) {
        db.exec(`DELETE FROM ${table.name}`);
    }
}
