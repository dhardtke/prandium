import type { TagDto } from '../../../shared/dto/tag.ts';
import type { TagId } from '../../../shared/flavors.ts';
import { TagApi } from './internal/tag.api.ts';

export class TagFacade {
  readonly #api: TagApi;

  constructor(api: TagApi) {
    this.#api = api;
  }

  /** Counts are among the recipes carrying every tag in `selected`. */
  list(selected: readonly TagId[] = []): Promise<TagDto[]> {
    return this.#api.list(selected);
  }
}

export const tagFacade = new TagFacade(new TagApi());
