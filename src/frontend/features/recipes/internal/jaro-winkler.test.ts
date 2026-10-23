import { expect, test } from 'bun:test';
import { jaroWinklerDistance } from './jaro-winkler.ts';

test('is 1 for equal strings and 0 when either is empty or nothing matches', () => {
  expect(jaroWinklerDistance('pasta', 'pasta')).toBe(1);
  expect(jaroWinklerDistance('', 'pasta')).toBe(0);
  expect(jaroWinklerDistance('pasta', '')).toBe(0);
  expect(jaroWinklerDistance('abc', 'xyz')).toBe(0);
});

test.each<[string, string, number]>([
  ['martha', 'marhta', 0.961],
  ['dwayne', 'duane', 0.84],
  ['dixon', 'dicksonx', 0.813],
])('scores %p against %p about %p', (a, b, score) => {
  expect(jaroWinklerDistance(a, b)).toBeCloseTo(score, 3);
});

test('rewards a shared prefix', () => {
  expect(jaroWinklerDistance('past', 'pasta')).toBeGreaterThan(0.75);
  expect(jaroWinklerDistance('soup', 'pasta')).toBeLessThan(0.75);
});
