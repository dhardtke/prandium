import {Database} from "../db.ts";
import {Recipe} from "../model/recipe.ts";
import {PaginationRequest} from "../pagination.ts";

export class RecipeService {
    private readonly db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    list(paginationRequest?: PaginationRequest): Recipe[] {
        const rows = this.db.query("SELECT id, created_at, updated_at, name, description FROM recipe LIMIT ? OFFSET ?", [
            paginationRequest?.limit || -1,
            paginationRequest?.offset || 0
        ]);
        const recipes: Recipe[] = [];
        // TODO reduce mapping boilerplate code
        for (const [id, createdAt, updatedAt, name, description] of rows) {
            recipes.push(new Recipe({id, createdAt, updatedAt, name, description}));
        }
        return recipes;
    }

    save(recipe: Recipe) {
        this.db.exec("INSERT INTO recipe (created_at, updated_at, name, description) VALUES (?, ?, ?, ?)", [recipe.createdAt, recipe.updatedAt, recipe.name,
            recipe.description]);
        recipe.id = this.db.lastInsertRowId;
    }

    update(recipe: Recipe) {
        this.db.exec("UPDATE recipe SET updated_at = ?, name = ?, description = ? WHERE id = ?", [recipe.updatedAt, recipe.name, recipe.description, recipe.id]);
    }
}
