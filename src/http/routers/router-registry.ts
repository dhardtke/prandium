import { container } from "../../../deps.ts";
import { AssetsRouter } from "./assets.router.ts";
import { IndexRouter } from "./index.router.ts";
import { RecipeRouter } from "./recipe.router.ts";
import { ThumbnailsRouter } from "./thumbnails.router.ts";

export class RouterRegistry {
    static get() {
        return [
            container.get(AssetsRouter),
            container.get(IndexRouter),
            container.get(RecipeRouter),
            container.get(ThumbnailsRouter),
        ];
    }
}
