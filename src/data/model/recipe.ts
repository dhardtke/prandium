import {Model} from "./model.ts";

export class Recipe extends Model {
    private _name!: string;
    private _description?: string;

    constructor(args: { id?: number, createdAt?: Date | string, updatedAt?: Date | string, name: string, description?: string }) {
        super(args);
        this._name = args.name;
        this._description = args.description;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get description(): string | undefined {
        return this._description;
    }

    set description(value: string | undefined) {
        this._description = value;
    }

    public static get columns(): string[] {
        return [...super.columns, "name", "description"];
    }
}
