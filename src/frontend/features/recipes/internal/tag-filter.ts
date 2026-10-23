import { jaroWinklerDistance } from './jaro-winkler.ts';

export const SIMILARITY_THRESHOLD = 0.75;

export function matchesFilter(title: string, filter: string): boolean {
  const query = filter.trim().toLowerCase();
  return query === '' || jaroWinklerDistance(query, title.trim().toLowerCase()) >= SIMILARITY_THRESHOLD;
}
