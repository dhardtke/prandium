import type { TagDto } from '../../../../shared/dto/tag.ts';
import type { TagWithCount } from '../ports/tag.ts';

export function translateToTagDto(row: TagWithCount): TagDto {
  return { id: row.id, title: row.title, recipeCount: row.recipe_count };
}
