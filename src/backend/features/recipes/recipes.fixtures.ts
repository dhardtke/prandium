import { expect } from 'bun:test';
import type { CreateRecipeDto, RecipeDto } from '../../../shared/dto/recipe.ts';
import { body, type TestServer } from '../../testing.ts';

export async function createRecipe(post: TestServer['post'], overrides: Partial<CreateRecipeDto> = {}): Promise<RecipeDto> {
  const res = await post('/api/recipes', { title: 'Spaghetti Carbonara', ...overrides });
  expect(res.status).toBe(201);
  return body<RecipeDto>(res);
}
