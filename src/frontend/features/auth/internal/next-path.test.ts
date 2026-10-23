import { expect, test } from 'bun:test';
import { nextPath } from './next-path.ts';

const ORIGIN = 'http://localhost';

test.each([
  ['?next=/workouts/12', '/workouts/12'],
  ['?next=%2Fworkouts%3Fpage%3D2', '/workouts?page=2'],
  ['', '/'],
  ['?next=//evil.example', '/'],
  ['?next=https://evil.example', '/'],
  ['?next=/\\evil.example', '/'],
  ['?next=/%09/evil.example', '/'],
  ['?next=/login', '/'],
  ['?next=/login?next=/x', '/'],
])('%s goes to %s', (search, expected) => {
  expect(nextPath(search, ORIGIN)).toBe(expected);
});
