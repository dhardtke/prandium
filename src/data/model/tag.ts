import { Model, ModelArgs } from "./model.ts";
import { Recipe } from "./recipe.ts";

export class Tag extends Model {
    static override readonly columns = [...Model.columns, "title"];

    public readonly title: string;
    public readonly recipes: Iterable<Recipe>;

    // synthetic columns
    public readonly recipeCount?: number;

    constructor(
        args: ModelArgs & {
            title: string;
            description?: string;
            recipes?: Iterable<Recipe>;
            recipeCount?: number;
        },
    ) {
        super(args);
        this.title = args.title;
        this.recipes = args.recipes || [];
        this.recipeCount = args.recipeCount;
    }

    public static createMany(...titles: string[]): Tag[] {
        return titles.map((title) => new Tag({ title }));
    }
}
