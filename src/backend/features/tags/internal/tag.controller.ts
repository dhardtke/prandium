import { json, queryIds } from '../../../http/http.ts';
import type { TagFacade } from '../tags.facade.ts';
import { translateToTagDto } from './tag.translator.ts';

export class TagController {
  readonly #tags: TagFacade;

  constructor(tags: TagFacade) {
    this.#tags = tags;
  }

  list(req: Request): Response {
    const selected = queryIds(new URL(req.url).searchParams, 'selected');
    return json(this.#tags.list(selected).map(translateToTagDto));
  }
}
