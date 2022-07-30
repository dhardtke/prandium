import { Database } from "../db.ts";

export interface Migration {
    version: number;
    name: string;

    migrate(db: Database): void;
}
