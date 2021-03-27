import { Colors, log, path, sqlite } from "../deps.ts";
import { classNames } from "../util.ts";
import { MIGRATIONS } from "./migrations/mod.ts";

// see https://deno.land/x/sqlite/src/db.ts
export type QueryParam =
  | boolean
  | number
  | bigint
  | string
  | null
  | undefined
  | Date
  | Uint8Array;
export type Values = Record<string, QueryParam> | QueryParam[];

export interface PreparedQuery {
  // deno-lint-ignore no-explicit-any
  (values?: Values): any;

  finalize: () => void;
}

export class Database {
  private readonly db: sqlite.DB;
  private inTransaction = false;

  public constructor(configDir: string) {
    const dbPath = path.resolve(configDir, "data.db");
    log.debug(() => `[DB] Using database ${Colors.cyan(dbPath)}`);
    this.db = new sqlite.DB(dbPath);
    // enable FOREIGN KEY support
    this.exec("PRAGMA foreign_keys = ON;");

    window.addEventListener("unload", () => {
      this.close();
    });
  }

  /**
   * @return the ID of the last inserted row
   */
  public get lastInsertRowId(): number {
    return this.db.lastInsertRowId;
  }

  /**
   * Query the database using the given SQL query.
   * @param sql the SQL query to execute
   * @param values the values to bind
   */
  // deno-lint-ignore no-explicit-any
  public *query<T extends Record<string, any>>(
    sql: string,
    values?: Values,
  ): Generator<T> {
    const result = this.safeQuery(sql, values);
    const rows = result.asObjects();
    for (const row of rows) {
      yield row as T;
    }
  }

  /**
   * Query the database for a single result row.
   * @param sql the SQL to execute
   * @param values the values to bind
   */
  public single<T>(sql: string, values?: Values): T | undefined {
    const result = this.safeQuery(sql, values);
    const rows = result.asObjects();
    const value = rows.next().value;
    result.return();
    return value;
  }

  /**
   * Execute the given SQL without returning results. This is useful e.g. for INSERT statements.
   * @param sql the SQL to execute
   * @param values the values to bind
   */
  public exec(sql: string, values?: Values): void {
    for (const ignored of this.safeQuery(sql, values)) {
      // nothing to do
    }
  }

  public prepare(
    sql: string,
    processor: (preparedQuery: PreparedQuery) => void,
  ): void {
    const query = this.db.prepareQuery(sql);

    try {
      log.debug(() => `[DB] Preparing ${Colors.cyan(sql)}`);
      const wrappedQuery: PreparedQuery = (values) => {
        log.debug(() =>
          `Executing prepared query${
            values
              ? ` with values ${Colors.brightCyan(JSON.stringify(values))}`
              : ""
          }`
        );
        return query(values);
      };
      wrappedQuery.finalize = query.finalize;
      processor(wrappedQuery);
    } catch (e) {
      log.error(() => `Error executing ${Colors.cyan(sql)}`);
      throw e;
    } finally {
      query.finalize();
    }
  }

  public transaction<ReturnValue = void>(
    fn: () => ReturnValue,
  ): ReturnValue | undefined {
    let rVal: ReturnValue | undefined = undefined;
    if (this.inTransaction) {
      rVal = fn();
    } else {
      this.inTransaction = true;
      this.db.query("begin");
      let success = true;
      try {
        rVal = fn();
      } catch (e) {
        success = false;
        log.error(() => `Error executing transaction`);
        throw e;
      } finally {
        if (success) {
          this.db.query("commit");
          this.inTransaction = false;
        } else {
          this.db.query("rollback");
          this.inTransaction = false;
        }
      }
    }
    return rVal;
  }

  public migrate() {
    const [[currentVersionDb]] = this.db.query("PRAGMA user_version");
    let currentVersion: number = currentVersionDb;
    log.debug(
      `[DB] Current database version is ${Colors.cyan("" + currentVersion)}`,
    );
    const migrations = MIGRATIONS.filter((m) => currentVersion < m.version)
      .sort((a, b) => a.version - b.version);
    log.debug(() =>
      `[DB] Migrations to run: ${Colors.cyan(classNames(migrations))}`
    );
    for (const migration of migrations) {
      this.transaction(() => {
        migration.migrate(this);
        currentVersion++;
        this.db.query(`PRAGMA user_version = ${currentVersion}`);
        return [true, undefined];
      });
    }
    log.debug(() =>
      `[DB] Migrations executed. New database version is ${
        Colors.cyan("" + currentVersion)
      }`
    );
  }

  private safeQuery(sql: string, values?: Values) {
    try {
      log.debug(() =>
        `[DB] Executing ${Colors.cyan(sql)}${
          values
            ? ` with values ${Colors.brightCyan(JSON.stringify(values))}`
            : ""
        }`
      );
      return this.db.query(sql, values);
    } catch (e) {
      log.error(() => `Error executing ${Colors.cyan(sql)}`);
      throw e;
    }
  }

  private close() {
    this.db.close();
  }
}
