export abstract class Model {
    private _id?: number;
    private _createdAt!: Date;
    private _updatedAt!: Date;

    protected constructor(args: {id?: number, createdAt?: Date, updatedAt?: Date}) {
        this.id = args.id;
        this.createdAt = args.createdAt || new Date();
        this.updatedAt = args.updatedAt || new Date();
    }


    get id(): number | undefined {
        return this._id;
    }

    set id(value: number | undefined) {
        this._id = value;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    set createdAt(value: Date) {
        this._createdAt = value;
    }

    get updatedAt(): Date {
        return this._updatedAt;
    }

    set updatedAt(value: Date) {
        this._updatedAt = value;
    }
}
