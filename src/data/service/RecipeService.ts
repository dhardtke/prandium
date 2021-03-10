import {Database} from "../db.ts";
import {Recipe} from "../model/recipe.ts";
import {PaginationRequest} from "../pagination.ts";
import {toArray, toCamelCase} from "../convert.ts";

export class RecipeService {
    private readonly db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    list(paginationRequest?: PaginationRequest): Recipe[] {
        return toArray(
            this.db.query("SELECT id, created_at, updated_at, name, description FROM recipe LIMIT ? OFFSET ?", [
                paginationRequest?.limit || -1,
                paginationRequest?.offset || 0
            ]),
            src => new Recipe(toCamelCase(src))
        );
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
