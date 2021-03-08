import {Database} from "../db.ts";
import {Recipe} from "../model/recipe.ts";

export class RecipeService {
    private readonly db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    list(): Recipe[] {
        const recipes: Recipe[] = [];
        for (const [id, createdAt, updatedAt, name] of this.db.query("SELECT id, created_at, updated_at, name FROM recipe")) {
            recipes.push(new Recipe({id, createdAt, updatedAt, name}));
        }
        return recipes;
    }

    save(recipe: Recipe) {
        this.db.exec("INSERT INTO recipe (created_at, updated_at, name) VALUES (?, ?, ?)", [recipe.createdAt, recipe.updatedAt, recipe.name]);
        recipe.id = this.db.lastInsertRowId;
    }
}
