import { log, path, sqlite } from "../deps.ts";
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

export class Database {
  private readonly db: sqlite.DB;
  private inTransaction = false;

  public constructor(configDir: string) {
    const dbPath = path.resolve(configDir, "data.db");
    log.debug(() => `[DB] Using database ${dbPath}`);
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
  public *query<T>(sql: string, values?: Values): Generator<T> {
    const result = this.safeQuery(sql, values);
    const rows = result.asObjects<T>();
    for (const row of rows) {
      yield row;
    }
  }

  /**
   * Query the database for a single result row.
   * @param sql the SQL to execute
   * @param values the values to bind
   */
  public single<T>(sql: string, values?: Values): T | undefined {
    const result = this.safeQuery(sql, values);
    const rows = result.asObjects<T>();
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

  public transaction<ReturnValue = void>(
    fn: () => [boolean, ReturnValue],
  ): ReturnValue | undefined {
    if (this.inTransaction) {
      const [success, rVal] = fn();
      if (success) {
        return rVal;
      }
    } else {
      this.inTransaction = true;
      this.db.query("begin");
      const [success, rVal] = fn();
      if (success) {
        this.inTransaction = false;
        this.db.query("commit");
        return rVal;
      }

      this.db.query("rollback");
      this.inTransaction = false;
    }
    return undefined;
  }

  public migrate() {
    const [[currentVersionDb]] = this.db.query("PRAGMA user_version");
    let currentVersion: number = currentVersionDb;
    log.debug(`[DB] Current database version is ${currentVersion}`);
    const migrations = MIGRATIONS.filter((m) => currentVersion < m.version)
      .sort((a, b) => a.version - b.version);
    log.debug(() => `[DB] Migrations to run: ${classNames(migrations)}`);
    for (const migration of migrations) {
      this.transaction(() => {
        migration.migrate(this);
        currentVersion++;
        this.db.query(`PRAGMA user_version = ${currentVersion}`);
        return [true, undefined];
      });
    }
    log.debug(() =>
      `[DB] Migrations executed. New database version is ${currentVersion}`
    );
  }

  private safeQuery(sql: string, values?: Values) {
    try {
      log.debug(() =>
        `[DB] Executing ${sql}${
          values ? ` with values ${JSON.stringify(values)}` : ""
        }`
      );
      return this.db.query(sql, values);
    } catch (e) {
      log.error(() => `Error executing ${sql}`);
      throw e;
    }
  }

  private close() {
    this.db.close();
  }
}
