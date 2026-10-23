import type { TagId } from '../flavors.ts';

export interface TagDto {
  id: TagId;
  title: string;
  /** Among the recipes carrying every selected tag. */
  recipeCount: number;
}
