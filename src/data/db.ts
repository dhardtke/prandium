import {log, sqlite} from "../deps.ts";
import {classNames} from "../util.ts";
import {MIGRATIONS} from "./migrations/mod.ts";

export class Database {
    private readonly db: sqlite.DB;

    public constructor() {
        // TODO parameterized path and name
        this.db = new sqlite.DB("test.db");

        window.addEventListener("unload", () => {
            this.close();
        });
    }

    /**
     * Query the database using the given SQL query.
     * @param sql the SQL query to execute
     * @param values the values to bind
     */
    public* query(sql: string, values?: object): Generator<any[]> {
        for (const row of this.db.query(sql, values)) {
            yield row;
        }
    }

    /**
     * Execute the given SQL without returning results. This is useful e.g. for INSERT statements.
     * @param sql the SQL to execute
     * @param values the values to bind
     */
    public exec(sql: string, values?: object): void {
        for (const ignored of this.query(sql, values)) {
            // nothing to do
        }
    }

    /**
     * @return the ID of the last inserted row
     */
    public get lastInsertRowId(): number {
        return this.db.lastInsertRowId;
    }

    public async transaction(fn: () => Promise<boolean>) {
        this.db.query("begin");
        if (await fn()) {
            this.db.query("commit");
        } else {
            this.db.query("rollback");
        }
    }

    public async migrate() {
        const [[currentVersionDb]] = this.db.query("PRAGMA user_version");
        let currentVersion: number = currentVersionDb;
        log.debug(`Current database version is ${currentVersion}`);
        const migrations = MIGRATIONS.filter(m => currentVersion < m.version)
            .sort((a, b) => a.version - b.version);
        log.debug(() => `Migrations to run: ${classNames(migrations)}`);
        for (const migration of migrations) {
            await this.transaction(async () => {
                await migration.migrate(this);
                currentVersion++;
                //this.db.query(`PRAGMA user_version = ${currentVersion}`);
                return true;
            });
        }
        log.debug(() => `Migrations executed. New database version is ${currentVersion}`);
    }

    private close() {
        this.db.close();
    }
}
