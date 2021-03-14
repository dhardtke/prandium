import { log, path, sqlite } from "../deps.ts";
import { classNames } from "../util.ts";
import { MIGRATIONS } from "./migrations/mod.ts";

// see https://deno.land/x/sqlite/src/db.ts
type QueryParam =
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

  public constructor(configDir: string) {
    const dbPath = path.resolve(configDir, "data.db");
    log.debug(() => `Using database ${dbPath}`);
    this.db = new sqlite.DB(dbPath);

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
    const migrations = MIGRATIONS.filter((m) => currentVersion < m.version)
      .sort((a, b) => a.version - b.version);
    log.debug(() => `Migrations to run: ${classNames(migrations)}`);
    for (const migration of migrations) {
      await this.transaction(async () => {
        await migration.migrate(this);
        currentVersion++;
        this.db.query(`PRAGMA user_version = ${currentVersion}`);
        return true;
      });
    }
    log.debug(() =>
      `Migrations executed. New database version is ${currentVersion}`
    );
  }

  private safeQuery(sql: string, values?: Values) {
    try {
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
