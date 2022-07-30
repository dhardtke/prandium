import { toDate } from "../util/convert.ts";

export interface ModelArgs {
    id?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export abstract class Model {
    static readonly columns = ["id", "created_at", "updated_at"];

    public id?: number;
    public createdAt!: Date;
    public updatedAt!: Date;

    protected constructor(args: ModelArgs) {
        this.id = args.id;
        this.createdAt = toDate(args.createdAt);
        this.updatedAt = toDate(args.updatedAt);
    }
}
