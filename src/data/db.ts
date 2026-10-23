import { Database as SqliteDatabase, type SQLQueryBindings } from "bun:sqlite";
import { log } from "../logging.ts";
import { brightCyan, cyan } from "../shared/colors.ts";
import { Migration } from "./migrations/migration.ts";
import { MIGRATIONS } from "./migrations/mod.ts";

export type RowObject = Record<string, unknown>;

/**
 * A value that can be bound to a query parameter. Dates are stored as ISO strings and `undefined` as `NULL`.
 */
export type QueryParameter = string | number | bigint | boolean | null | undefined | Date | Uint8Array;
export type QueryParameterSet = QueryParameter[] | Record<string, QueryParameter>;

function normalizeBinding(value: QueryParameter): SQLQueryBindings {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (value === undefined) {
        return null;
    }
    return value;
}

/**
 * Converts the given values into bindings supported by bun:sqlite.
 * @return the arguments to spread into the statement call (empty if no values are given)
 */
function normalizeBindings(values?: QueryParameterSet): SQLQueryBindings[] {
    if (values === undefined) {
        return [];
    }
    if (Array.isArray(values)) {
        return values.map(normalizeBinding);
    }
    const named: Record<string, SQLQueryBindings> = {};
    for (const [key, value] of Object.entries(values)) {
        named[key] = normalizeBinding(value);
    }
    return [named as SQLQueryBindings];
}

const openDatabases = new Set<SqliteDatabase>();
process.on("exit", () => {
    for (const db of openDatabases) {
        db.close();
    }
});

export class Database {
    private readonly db: SqliteDatabase;
    private readonly migrations: Migration[];

    public constructor(dbPath: string, migrations: Migration[] = MIGRATIONS) {
        log.debug(() => `[DB] Using database ${cyan(dbPath)}`);
        // strict: allow binding named parameters without their prefix, e.g. { title } for :title
        this.db = new SqliteDatabase(dbPath, { create: true, strict: true });
        this.migrations = migrations;
        // enable FOREIGN KEY support
        this.exec("PRAGMA foreign_keys = ON;");
        openDatabases.add(this.db);
    }

    /**
     * Query the database for a single result row.
     * @param sql the SQL to execute
     * @param values the values to bind
     */
    public single<T>(sql: string, values?: QueryParameterSet): T | undefined {
        const result = this.query<T>(sql, values);
        return result[0];
    }

    /**
     * Execute the given SQL without returning results. This is useful e.g. for INSERT statements.
     * @param sql the SQL to execute
     * @param values the values to bind
     */
    public exec(sql: string, values?: QueryParameterSet): void {
        this.query(sql, values);
    }

    public prepare<O extends RowObject = RowObject>(sql: string, processor: (execute: (params?: QueryParameterSet) => O[]) => void): void {
        const query = this.db.prepare<O, SQLQueryBindings[]>(sql);

        try {
            log.debug(() => `[DB] Preparing ${cyan(sql)}`);

            const allEntries = (params?: QueryParameterSet): O[] => {
                const duration = performance.now();
                const result = query.all(...normalizeBindings(params));
                log.debug(
                    () =>
                        `Executing prepared query${params ? ` with values ${brightCyan(JSON.stringify(params))}` : ""} took ${(
                            performance.now() - duration
                        ).toFixed(2)}ms`,
                );
                return result;
            };
            processor(allEntries);
        } catch (e) {
            log.error(() => `Error executing ${cyan(sql)}`);
            throw e;
        } finally {
            query.finalize();
        }
    }

    public transaction<ReturnValue = void>(fn: () => ReturnValue): ReturnValue | undefined {
        return this.db.transaction(fn)();
    }

    public migrate() {
        const { user_version: currentVersionDb } = this.db.query<{ user_version: number }, []>("PRAGMA user_version").get()!;
        let currentVersion: number = currentVersionDb;
        const migrations = this.migrations.filter((m) => currentVersion < m.version).sort((a, b) => a.version - b.version);
        if (migrations.length) {
            log.debug(`[DB] Current database version is ${cyan("" + currentVersion)}`);
            log.debug(() => `[DB] Migrations to run: ${cyan(migrations.map((m) => m.name).join(", "))}`);
            for (const migration of migrations) {
                this.transaction(() => {
                    migration.migrate(this);
                    currentVersion++;
                    this.db.run(`PRAGMA user_version = ${currentVersion}`);
                });
            }
            log.debug(() => `[DB] Migrations executed. New database version is ${cyan("" + currentVersion)}`);
        }
    }

    /**
     * Query the database using the given SQL query.
     * @param sql the SQL query to execute
     * @param values the values to bind
     */
    public query<O>(sql: string, values?: QueryParameterSet): Array<O> {
        try {
            const duration = performance.now();
            // not using db.query() here as it caches every statement, and the SQL is often built dynamically
            const statement = this.db.prepare<O, SQLQueryBindings[]>(sql);
            let result: O[];
            try {
                result = statement.all(...normalizeBindings(values));
            } finally {
                statement.finalize();
            }
            log.debug(
                () =>
                    `[DB] Executing ${cyan(sql)}${values ? ` with values ${brightCyan(JSON.stringify(values))}` : ""} took ${(
                        performance.now() - duration
                    ).toFixed(2)}ms`,
            );
            return result;
        } catch (e) {
            log.error(() => `Error executing ${cyan(sql)}`);
            throw e;
        }
    }

    close() {
        openDatabases.delete(this.db);
        this.db.close();
    }

    dispose(): Promise<void> | void {
        this.close();
    }
}
