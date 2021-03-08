import {Database} from "../db.ts";

export abstract class Migration {
    readonly version: number;

    protected constructor(version: number) {
        this.version = version;
    }

    abstract migrate(db: Database): Promise<void>;
}
