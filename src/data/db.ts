import { Colors, log, sqlite } from "../../deps.ts";
import { classNames } from "../shared/util.ts";
import { Migration } from "./migrations/migration.ts";
import { MIGRATIONS } from "./migrations/mod.ts";

export type RowObject = Record<string, unknown>;

export class Database {
  private readonly db: sqlite.DB;
  private readonly migrations: Migration[];

  public constructor(dbPath: string, migrations: Migration[] = MIGRATIONS) {
    log.debug(() => `[DB] Using database ${Colors.cyan(dbPath)}`);
    this.db = new sqlite.DB(dbPath);
    this.migrations = migrations;
    // enable FOREIGN KEY support
    this.exec("PRAGMA foreign_keys = ON;");

    globalThis.addEventListener("unload", () => {
      this.close();
    });
  }

  /**
   * Query the database for a single result row.
   * @param sql the SQL to execute
   * @param values the values to bind
   */
  public single<T>(
    sql: string,
    values?: sqlite.QueryParameterSet,
  ): T | undefined {
    const result = this.query<T>(sql, values);
    return result[0];
  }

  /**
   * Execute the given SQL without returning results. This is useful e.g. for INSERT statements.
   * @param sql the SQL to execute
   * @param values the values to bind
   */
  public exec(sql: string, values?: sqlite.QueryParameterSet): void {
    for (const _ignored of this.query(sql, values)) {
      // nothing to do
    }
  }

  public prepare<O extends RowObject = RowObject>(
    sql: string,
    processor: (execute: (params?: sqlite.QueryParameterSet) => O[]) => void,
  ): void {
    const query = this.db.prepareQuery<unknown[], O>(sql);

    try {
      log.debug(() => `[DB] Preparing ${Colors.cyan(sql)}`);

      const allEntries = (params?: sqlite.QueryParameterSet): O[] => {
        const duration = performance.now();
        const result = query.allEntries(params);
        log.debug(() =>
          `Executing prepared query${
            params
              ? ` with values ${Colors.brightCyan(JSON.stringify(params))}`
              : ""
          } took ${(performance.now() - duration).toFixed(2)}ms`
        );
        return result;
      };
      processor(allEntries);
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
    return this.db.transaction(fn);
  }

  public migrate() {
    const [[currentVersionDb]] = this.db.query(
      "PRAGMA user_version",
    ) as number[][];
    let currentVersion: number = currentVersionDb;
    const migrations = this.migrations.filter((m) => currentVersion < m.version)
      .sort((a, b) => a.version - b.version);
    if (migrations.length) {
      log.debug(
        `[DB] Current database version is ${Colors.cyan("" + currentVersion)}`,
      );
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
  }

  /**
   * Query the database using the given SQL query.
   * @param sql the SQL query to execute
   * @param values the values to bind
   */
  public query<O>(sql: string, values?: sqlite.QueryParameterSet): Array<O> {
    try {
      const duration = performance.now();
      // returning Record<string, unknown> does not really make sense as interfaces do not satisfy this constraint
      const result = this.db.queryEntries(sql, values) as O[];
      log.debug(() =>
        `[DB] Executing ${Colors.cyan(sql)}${
          values
            ? ` with values ${Colors.brightCyan(JSON.stringify(values))}`
            : ""
        } took ${(performance.now() - duration).toFixed(2)}ms`
      );
      return result;
    } catch (e) {
      log.error(() => `Error executing ${Colors.cyan(sql)}`);
      throw e;
    }
  }

  close() {
    this.db.close();
  }
}
