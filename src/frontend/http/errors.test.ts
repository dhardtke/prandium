import { describe, expect, test } from 'bun:test';
import { ApiError, errorMessage } from './errors.ts';

describe('errorMessage', () => {
  test("is an Error's message", () => {
    expect(errorMessage(new ApiError('Not found', 404, undefined))).toBe('Not found');
    expect(errorMessage(new RangeError('bad'))).toBe('bad');
  });

  test('is the thrown value itself when it is not an Error, never "undefined"', () => {
    expect(errorMessage('boom')).toBe('boom');
    expect(errorMessage(42)).toBe('42');
  });
});
