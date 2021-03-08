import {Model} from "./model.ts";

export class Recipe extends Model {
    private _name!: string;

    constructor(args: {id?: number, createdAt?: Date, updatedAt?: Date, name: string}) {
        super(args);
        this._name = args.name;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }
}
