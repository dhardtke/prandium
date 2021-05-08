import { InitialMigration } from "./1_initial_migration.ts";
import { AddFlagColumn } from "./2_add_flag_column.ts";
import { Migration } from "./migration.ts";

export const MIGRATIONS: Migration[] = [
  InitialMigration,
  AddFlagColumn,
];
