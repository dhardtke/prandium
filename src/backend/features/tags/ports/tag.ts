import type { TagId } from '../../../../shared/flavors.ts';

export interface TagWithCount {
  id: TagId;
  title: string;
  recipe_count: number;
}
