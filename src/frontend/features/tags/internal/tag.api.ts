import type { TagDto } from '../../../../shared/dto/tag.ts';
import type { TagId } from '../../../../shared/flavors.ts';
import { get } from '../../../http/http.ts';

export class TagApi {
  list(selected: readonly TagId[] = []): Promise<TagDto[]> {
    const query = new URLSearchParams(selected.map((id) => ['selected', String(id)]));
    const search = query.toString();
    return get(search === '' ? '/tags' : `/tags?${search}`);
  }
}
