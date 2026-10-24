import { beforeAll, expect, test } from 'bun:test';
import { find, openDialog, testId, useDom } from '../../testing.ts';
import type { ConfirmOptions } from './confirm.ts';

useDom();

let confirmAction: (options: ConfirmOptions) => Promise<boolean>;

beforeAll(async () => {
  ({ confirmAction } = await import('./confirm.ts'));
});

const DELETE: ConfirmOptions = { title: 'Delete workout?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true };

function button(root: ShadowRoot, id: 'confirm' | 'cancel'): HTMLButtonElement {
  return find<HTMLButtonElement>(root, testId(id));
}

test('renders the title, message and items', () => {
  void confirmAction({
    title: 'Finish?',
    message: 'Some are left.',
    items: ['Bench Press — 0/2 sets', 'Back Squat — 0/1 sets'],
    confirmLabel: 'Mark workout done',
  });
  const root = openDialog();
  expect(find(root, testId('title')).textContent).toBe('Finish?');
  expect(find(root, testId('message')).textContent).toBe('Some are left.');
  expect(Array.from(find(root, testId('items')).querySelectorAll('li')).map((item) => item.textContent)).toEqual([
    'Bench Press — 0/2 sets',
    'Back Squat — 0/1 sets',
  ]);
  expect(button(root, 'confirm').textContent).toBe('Mark workout done');
  expect(find(root, 'dialog').getAttribute('aria-describedby')).toBe('message');
});

test('leaves out the message and the list when not given', () => {
  void confirmAction({ title: 'Delete set?', confirmLabel: 'Delete' });
  const root = openDialog();
  expect(root.querySelector(testId('message'))).toBeNull();
  expect(root.querySelector(testId('items'))).toBeNull();
  expect(find(root, 'dialog').hasAttribute('aria-describedby')).toBe(false);
});

test('opens the dialog', () => {
  void confirmAction(DELETE);
  expect(find<HTMLDialogElement>(openDialog(), 'dialog').open).toBe(true);
});

test('colors a danger action and focuses Cancel first', () => {
  void confirmAction(DELETE);
  const root = openDialog();
  expect(button(root, 'confirm').dataset.variant).toBe('danger');
  expect(button(root, 'cancel').hasAttribute('autofocus')).toBe(true);
  expect(button(root, 'confirm').hasAttribute('autofocus')).toBe(false);
  expect(button(root, 'cancel').classList.contains('outline')).toBe(true);
});

test('leaves any other action primary and focuses it first', () => {
  void confirmAction({ ...DELETE, danger: false });
  const root = openDialog();
  expect(button(root, 'confirm').dataset.variant).toBeUndefined();
  expect(button(root, 'confirm').hasAttribute('autofocus')).toBe(true);
  expect(button(root, 'cancel').hasAttribute('autofocus')).toBe(false);
});

test('resolves true on the action button and removes itself', async () => {
  const answer = confirmAction(DELETE);
  button(openDialog(), 'confirm').click();
  expect(await answer).toBe(true);
  expect(document.body.querySelector('ce-confirm-dialog')).toBeNull();
});

test('resolves false on Cancel and removes itself', async () => {
  const answer = confirmAction(DELETE);
  button(openDialog(), 'cancel').click();
  expect(await answer).toBe(false);
  expect(document.body.querySelector('ce-confirm-dialog')).toBeNull();
});

test('resolves false on a click on the backdrop, but stays open for a click inside', async () => {
  const answer = confirmAction(DELETE);
  const root = openDialog();
  find<HTMLElement>(root, 'header').click();
  expect(find<HTMLDialogElement>(root, 'dialog').open).toBe(true);
  find<HTMLElement>(root, 'dialog').click();
  expect(await answer).toBe(false);
  expect(document.body.querySelector('ce-confirm-dialog')).toBeNull();
});

test('resolves false when closed without a value, as Escape does', async () => {
  const answer = confirmAction(DELETE);
  find<HTMLDialogElement>(openDialog(), 'dialog').close();
  expect(await answer).toBe(false);
  expect(document.body.querySelector('ce-confirm-dialog')).toBeNull();
});

test('escapes HTML in the title, message and items', () => {
  void confirmAction({ title: '<b>t</b>', message: '<i>m</i>', items: ['<u>x</u>'], confirmLabel: 'OK' });
  const root = openDialog();
  expect(root.querySelector('b, i, u')).toBeNull();
  expect(find(root, testId('title')).textContent).toBe('<b>t</b>');
  expect(find(root, testId('message')).textContent).toBe('<i>m</i>');
  expect(find(find(root, testId('items')), 'li').textContent).toBe('<u>x</u>');
});
