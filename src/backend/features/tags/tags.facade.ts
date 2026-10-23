import type { RecipeId, TagId } from '../../../shared/flavors.ts';
import type { DB } from '../../db/db.ts';
import { TagRepository } from './internal/tag.repository.ts';
import type { TagWithCount } from './ports/tag.ts';

export class TagFacade {
  readonly #tags: TagRepository;

  constructor(tags: TagRepository) {
    this.#tags = tags;
  }

  list(selected: readonly TagId[] = []): TagWithCount[] {
    return this.#tags.list(selected);
  }

  /** Called inside the recipe's transaction; deletes the tags it leaves without recipes. */
  replaceForRecipe(recipeId: RecipeId, titles: readonly string[]): void {
    this.#tags.replaceForRecipe(recipeId, titles);
  }

  deleteOrphans(): void {
    this.#tags.deleteOrphans();
  }
}

export function createTagFacade(db: DB): TagFacade {
  return new TagFacade(new TagRepository(db));
}
