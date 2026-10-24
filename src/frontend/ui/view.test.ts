import { beforeAll, expect, test } from 'bun:test';
import { collect, mount, testId, text, useDom, useToasts } from '../testing.ts';
import { ApiError } from '../http/errors.ts';
import type { RawHtml } from './html.ts';
import type { CeView } from './view.ts';

useDom();
const toasts = useToasts();

let pending: PromiseWithResolvers<string>;

type TestView = CeView<string>;

beforeAll(async () => {
  const { CeView } = await import('./view.ts');
  const { html } = await import('./html.ts');
  if (!customElements.get('ce-test-view')) {
    class CeTestView extends CeView<string> {
      override get loadingText(): string {
        return 'Loading test…';
      }

      override load(): Promise<string> {
        return pending.promise;
      }

      override readyTemplate(data: string): RawHtml {
        return html`<p data-testid="data">${data}</p>`;
      }

      override titleFor(data: string): string {
        return data;
      }
    }
    customElements.define('ce-test-view', CeTestView);
  }
});

function mountView(attributes: Record<string, string> = {}): TestView {
  pending = Promise.withResolvers<string>();
  return mount<TestView>('ce-test-view', attributes);
}

test('renders its loading text while loading', () => {
  const view = mountView();
  expect(text(view, testId('loading'))).toBe('Loading test…');
  expect(view.data).toBeUndefined();
});

test('renders the ready template and exposes the data once loaded', async () => {
  const view = mountView();
  pending.resolve('Bench');
  await view.ready;
  expect(text(view, testId('data'))).toBe('Bench');
  expect(view.data).toBe('Bench');
});

test('renders the error template and toasts the message when the load fails', async () => {
  const view = mountView();
  pending.reject(new ApiError('Server down', 500, undefined));
  await view.ready;
  expect(text(view, testId('error'))).toBe('Server down');
  expect(view.data).toBeUndefined();
  expect(toasts).toEqual(['Server down']);
});

test('shows a 404 without toasting it', async () => {
  const view = mountView();
  pending.reject(new ApiError('Workout not found', 404, undefined));
  await view.ready;
  expect(text(view, testId('error'))).toBe('Workout not found');
  expect(toasts).toEqual([]);
});

test('settles ready after an error', async () => {
  const view = mountView();
  pending.reject(new Error('Broke'));
  // Awaiting it is the assertion: a rejection would fail the test.
  await view.ready;
  expect(text(view, testId('error'))).toBe('Broke');
});

test('reload() re-renders with new data', async () => {
  const view = mountView();
  pending.resolve('Bench');
  await view.ready;
  pending = Promise.withResolvers<string>();
  const reloaded = view.reload();
  expect(text(view, testId('data'))).toBe('Bench');
  pending.resolve('Squat');
  await reloaded;
  expect(text(view, testId('data'))).toBe('Squat');
});

test('pageTitle is null while loading, then names the loaded data', async () => {
  const view = mountView();
  expect(view.pageTitle).toBeNull();
  pending.resolve('Bench');
  await view.ready;
  expect(view.pageTitle).toBe('Bench');
});

test('pageTitle is null after a failed load', async () => {
  const view = mountView();
  pending.reject(new ApiError('Workout not found', 404, undefined));
  await view.ready;
  expect(view.pageTitle).toBeNull();
});

test('emits page-title after every load, failed or not', async () => {
  const heard = collect('page-title');
  const view = mountView();
  pending.resolve('Bench');
  await view.ready;
  expect(heard).toHaveLength(1);

  pending = Promise.withResolvers<string>();
  const reloaded = view.reload();
  pending.resolve('Squat');
  await reloaded;
  expect(heard).toHaveLength(2);

  pending = Promise.withResolvers<string>();
  const failed = view.reload();
  pending.reject(new ApiError('Workout not found', 404, undefined));
  await failed;
  expect(heard).toHaveLength(3);
});

test('numericAttribute() reads a numeric attribute', () => {
  expect(mountView({ 'workout-id': '42' }).numericAttribute('workout-id')).toBe(42);
});

test('numericAttribute() throws naming the tag and attribute when it is missing', () => {
  expect(() => mountView().numericAttribute('workout-id')).toThrow('ce-test-view needs a workout-id attribute');
});
