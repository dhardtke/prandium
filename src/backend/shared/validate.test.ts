import { describe, expect, test } from 'bun:test';
import { optionalOneOf, optionalString, requiredIds, requiredInt, requiredNumber, requiredOneOf, requiredString, validatePresent } from './validate.ts';

describe('requiredString', () => {
  test('trims the value', () => {
    expect(requiredString({ name: '  Squat ' }, 'name')).toBe('Squat');
  });

  test('rejects a blank or non-string value', () => {
    expect(() => requiredString({ name: '   ' }, 'name')).toThrow('"name" is required and must be a non-empty string');
    expect(() => requiredString({ name: 5 }, 'name')).toThrow('"name" is required and must be a non-empty string');
  });

  test('measures the length after trimming', () => {
    expect(requiredString({ name: '  abc  ' }, 'name', 3)).toBe('abc');
    expect(() => requiredString({ name: 'abcd' }, 'name', 3)).toThrow('"name" must be at most 3 characters');
  });
});

describe('optionalString', () => {
  test('normalizes undefined, null and blank to null', () => {
    expect(optionalString({ notes: undefined }, 'notes')).toBeNull();
    expect(optionalString({ notes: null }, 'notes')).toBeNull();
    expect(optionalString({ notes: '  ' }, 'notes')).toBeNull();
  });

  test('rejects a number', () => {
    expect(() => optionalString({ notes: 5 }, 'notes')).toThrow('"notes" must be a string');
  });
});

describe('requiredInt', () => {
  test('coerces a numeric string', () => {
    expect(requiredInt({ reps: '5' }, 'reps')).toBe(5);
  });

  test('rejects a fraction and a non-numeric string', () => {
    expect(() => requiredInt({ reps: 1.5 }, 'reps')).toThrow('"reps" must be a whole number');
    expect(() => requiredInt({ reps: 'nope' }, 'reps')).toThrow('"reps" must be a whole number');
  });

  test('enforces the range', () => {
    expect(() => requiredInt({ reps: 0 }, 'reps', { min: 1, max: 1000 })).toThrow('"reps" must be between 1 and 1000');
  });
});

describe('requiredNumber', () => {
  test('rounds to two decimals', () => {
    expect(requiredNumber({ weight: 62.555 }, 'weight')).toBe(62.56);
  });

  test('rejects NaN and Infinity', () => {
    expect(() => requiredNumber({ weight: Number.NaN }, 'weight')).toThrow('"weight" must be a number');
    expect(() => requiredNumber({ weight: Number.POSITIVE_INFINITY }, 'weight')).toThrow('"weight" must be a number');
  });
});

describe('requiredOneOf', () => {
  const directions = ['up', 'down'] as const;

  test('returns a listed value', () => {
    expect(requiredOneOf({ direction: 'down' }, 'direction', directions)).toBe('down');
  });

  test('rejects an unlisted string, another case, a number and a missing field', () => {
    const dtos: { direction?: unknown }[] = [{ direction: 'sideways' }, { direction: 'UP' }, { direction: 1 }, {}];
    for (const dto of dtos) {
      expect(() => requiredOneOf(dto, 'direction', directions)).toThrow('"direction" must be one of: up, down');
    }
  });
});

describe('optionalOneOf', () => {
  const directions = ['up', 'down'] as const;

  test('normalizes undefined, null and blank to null', () => {
    expect(optionalOneOf({ direction: undefined }, 'direction', directions)).toBeNull();
    expect(optionalOneOf({ direction: null }, 'direction', directions)).toBeNull();
    expect(optionalOneOf({ direction: '' }, 'direction', directions)).toBeNull();
  });

  test('returns a listed value', () => {
    expect(optionalOneOf({ direction: 'up' }, 'direction', directions)).toBe('up');
  });

  test('rejects another case and a number', () => {
    expect(() => optionalOneOf({ direction: 'UP' }, 'direction', directions)).toThrow('"direction" must be one of: up, down');
    expect(() => optionalOneOf({ direction: 1 }, 'direction', directions)).toThrow('"direction" must be one of: up, down');
  });
});

describe('requiredIds', () => {
  test('returns distinct positive whole numbers in order', () => {
    expect(requiredIds({ ids: [3, 1, 2] }, 'ids')).toEqual([3, 1, 2]);
  });

  test('rejects a missing, non-array, empty or too long list', () => {
    for (const ids of [undefined, 5, '1', {}, [], [1, 2, 3]]) {
      expect(() => requiredIds({ ids }, 'ids', { max: 2 })).toThrow('"ids" must be a list of 1 to 2 ids');
    }
  });

  test('rejects 0, a fraction, an unsafe integer and a numeric string', () => {
    for (const id of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '1', null]) {
      expect(() => requiredIds({ ids: [1, id] }, 'ids')).toThrow('"ids" must hold only whole numbers of at least 1');
    }
  });

  test('rejects a repeated id', () => {
    expect(() => requiredIds({ ids: [1, 2, 1] }, 'ids')).toThrow('"ids" must not repeat an id');
  });

  test('takes up to 200 ids by default', () => {
    const ids = Array.from({ length: 200 }, (_, index) => index + 1);
    expect(requiredIds({ ids }, 'ids')).toHaveLength(200);
    expect(() => requiredIds({ ids: [...ids, 201] }, 'ids')).toThrow('"ids" must be a list of 1 to 200 ids');
  });
});

describe('validatePresent', () => {
  test('runs only the rules of the fields present and keeps null, which clears a field', () => {
    const dto: { name?: string; notes?: string | null; reps?: number } = { name: ' Squat ', notes: null };
    expect(
      validatePresent(dto, { name: () => requiredString(dto, 'name'), notes: () => optionalString(dto, 'notes'), reps: () => requiredInt(dto, 'reps') }),
    ).toEqual({
      name: 'Squat',
      notes: null,
    });
  });
});
