import { beforeAll, expect, test } from 'bun:test';
import { useDom, useToasts } from '../testing.ts';
import { ApiError } from '../http/errors.ts';

useDom();
const toasts = useToasts();

let toastError: (error: unknown) => void;

beforeAll(async () => {
  ({ toastError } = await import('./toast.ts'));
});

test('toastError stays silent for a 401, which sends the user to the login page instead', () => {
  toastError(new ApiError('Not logged in', 401, undefined));
  expect(toasts).toEqual([]);
});

test('toastError shows any other failure', () => {
  toastError(new ApiError('Internal server error', 500, undefined));
  expect(toasts).toEqual(['Internal server error']);
});
