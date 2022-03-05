import { InitialMigration } from "./1-initial-migration.ts";
import { AddFlagColumn } from "./2-add-flag-column.ts";
import { ForeignKeyIndexes } from "./3-foreign-key-indexes.ts";
import { Migration } from "./migration.ts";

export const MIGRATIONS: Migration[] = [
  InitialMigration,
  AddFlagColumn,
  ForeignKeyIndexes,
];
