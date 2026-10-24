import { describe, expect, test } from 'bun:test';
import { changeFor } from './changes.ts';

describe('changeFor', () => {
  test('a stylesheet swaps at its URL', () => {
    expect(changeFor('features/recipes/internal/ce-rating.component.css')).toEqual({
      swap: '/features/recipes/internal/ce-rating.component.css',
    });
  });

  test('a Windows path is turned into a URL', () => {
    expect(changeFor('ui\\pagination\\ce-pagination.component.css')).toEqual({ swap: '/ui/pagination/ce-pagination.component.css' });
  });

  test('a module and the index page reload', () => {
    expect(changeFor('app\\router.ts')).toEqual({ reload: '/app/router.ts' });
    expect(changeFor('index.html')).toEqual({ reload: '/index.html' });
  });

  test('the manifest and an icon reload', () => {
    expect(changeFor('manifest.webmanifest')).toEqual({ reload: '/manifest.webmanifest' });
    expect(changeFor('icons\\icon.svg')).toEqual({ reload: '/icons/icon.svg' });
    expect(changeFor('icons/icon-192.png')).toEqual({ reload: '/icons/icon-192.png' });
  });

  test('a bare directory name is ignored', () => {
    expect(changeFor('ui')).toBeNull();
  });

  test('an unknown extension is ignored', () => {
    expect(changeFor('ui\\pagination\\ce-pagination.component.css~')).toBeNull();
    expect(changeFor('ui/pagination/.ce-pagination.component.css.swp')).toBeNull();
  });
});
