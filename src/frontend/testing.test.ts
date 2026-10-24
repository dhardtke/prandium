import { describe, expect, test } from 'bun:test';
import { choose, collect, find, mount, shadow, submit, testId, text, type, useDom, useFetch, useToasts } from './testing.ts';

const bun = { fetch, Response, URL, setTimeout, EventTarget };

describe('useDom', () => {
  useDom();

  test('installs a document, custom elements and a location', () => {
    expect(typeof document).toBe('object');
    expect(typeof HTMLElement).toBe('function');
    expect(typeof customElements).toBe('object');
    expect(location.href).toBe('http://localhost/');
  });

  test('answers a stylesheet with an empty 200', async () => {
    const response = await fetch('/ui/shared.css');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  test('rejects any other request, naming it', async () => {
    const error = await fetch('/api/tags').then(
      () => null,
      (cause: unknown) => cause,
    );
    expect(String(error)).toContain('GET /api/tags');
  });

  test('leaves something in the body for the next test', () => {
    document.body.append(document.createElement('p'));
    expect(document.body.childElementCount).toBe(1);
  });

  test('finds the body empty again', () => {
    expect(document.body.childElementCount).toBe(0);
  });
});

describe('DOM helpers', () => {
  useDom();

  function host(): HTMLElement {
    const element = document.createElement('div');
    element.attachShadow({ mode: 'open' }).innerHTML = '<p data-testid="greeting">Hello</p>';
    return element;
  }

  function heard(type: string): { bubbles: boolean; cancelable: boolean }[] {
    const events: { bubbles: boolean; cancelable: boolean }[] = [];
    document.body.addEventListener(type, (event) => {
      events.push({ bubbles: event.bubbles, cancelable: event.cancelable });
    });
    return events;
  }

  test('shadow() returns the open shadow root', () => {
    const element = host();
    expect(shadow(element) === element.shadowRoot).toBe(true);
  });

  test('shadow() throws naming the tag of a host without one', () => {
    expect(() => shadow(document.createElement('section'))).toThrow('section has no shadow root');
  });

  test('testId() selects by data-testid', () => {
    expect(testId('greeting')).toBe("[data-testid='greeting']");
  });

  test('find() returns the match', () => {
    const element = host();
    expect(find(shadow(element), testId('greeting')).textContent).toBe('Hello');
  });

  test('find() throws naming the selector that matches nothing', () => {
    expect(() => find(shadow(host()), testId('farewell'))).toThrow("nothing matches [data-testid='farewell']");
  });

  test('text() reads from the shadow root', () => {
    const element = host();
    expect(text(element, testId('greeting'))).toBe('Hello');
    expect(text(element, testId('farewell'))).toBeUndefined();
  });

  test('mount() sets the attributes before connectedCallback sees them, and appends to the body', () => {
    if (!customElements.get('ce-test-mount')) {
      class CeTestMount extends HTMLElement {
        labelOnConnect: string | null = null;

        connectedCallback(): void {
          this.labelOnConnect = this.getAttribute('label');
        }
      }
      customElements.define('ce-test-mount', CeTestMount);
    }
    const element = mount<HTMLElement & { labelOnConnect: string | null }>('ce-test-mount', { label: 'Squat' });
    expect(element.labelOnConnect).toBe('Squat');
    expect(element.parentElement).toBe(document.body);
  });

  test('type() sets the value and fires a bubbling input', () => {
    const events = heard('input');
    const input = document.createElement('input');
    document.body.append(input);
    type(input, '60');
    expect(input.value).toBe('60');
    expect(events).toEqual([{ bubbles: true, cancelable: false }]);
  });

  test('choose() sets the value and fires a bubbling change', () => {
    const events = heard('change');
    const select = document.createElement('select');
    select.innerHTML = '<option value="1">One</option><option value="2">Two</option>';
    document.body.append(select);
    choose(select, '2');
    expect(select.value).toBe('2');
    expect(events).toEqual([{ bubbles: true, cancelable: false }]);
  });

  test('submit() fires a bubbling, cancelable submit', () => {
    const events = heard('submit');
    const form = document.createElement('form');
    document.body.append(form);
    submit(form);
    expect(events).toEqual([{ bubbles: true, cancelable: true }]);
  });

  test('collect() records the details of CustomEvents dispatched on a child', () => {
    const details = collect('picked');
    const child = document.createElement('span');
    document.body.append(child);
    child.dispatchEvent(new CustomEvent('picked', { detail: 3, bubbles: true }));
    child.dispatchEvent(new CustomEvent('ignored', { detail: 4, bubbles: true }));
    expect(details).toEqual([3]);
  });
});

describe('useFetch', () => {
  const fake = useFetch();

  test('answers a request named by respondTo with its own answer', async () => {
    fake.respondWith(200, '"fallback"');
    fake.respondTo('GET /api/recipes', 200, '"recipes"');
    expect(await (await fetch('/api/recipes')).json()).toBe('recipes');
    expect(await (await fetch('/api/recipes', { method: 'POST' })).json()).toBe('fallback');
    expect(await (await fetch('/api/tags')).json()).toBe('fallback');
  });

  test('sent() returns the bodies of only the requests it names', async () => {
    await fetch('/api/x', { method: 'POST', body: JSON.stringify({ a: 1 }) });
    await fetch('/api/x');
    await fetch('/api/y', { method: 'POST', body: JSON.stringify({ b: 2 }) });
    await fetch('/api/x', { method: 'POST', body: JSON.stringify({ a: 3 }) });
    expect(fake.sent('POST /api/x')).toEqual([{ a: 1 }, { a: 3 }]);
  });

  test('forgets respondTo answers between tests', async () => {
    expect(await (await fetch('/api/recipes')).json()).toEqual({});
  });
});

describe('useToasts', () => {
  useDom();
  const toasts = useToasts();

  test('records the messages toast() and toastError() show', async () => {
    const { toast, toastError } = await import('./ui/toast.ts');
    toast('Saved', 'success');
    toastError(new Error('Broke'));
    expect(toasts).toEqual(['Saved', 'Broke']);
  });

  test('starts every test with an empty record', () => {
    expect(toasts).toEqual([]);
  });
});

describe('after useDom', () => {
  test('puts back Bun’s own globals', () => {
    expect(fetch).toBe(bun.fetch);
    expect(Response).toBe(bun.Response);
    expect(URL).toBe(bun.URL);
    expect(setTimeout).toBe(bun.setTimeout);
    expect(EventTarget).toBe(bun.EventTarget);
    expect(typeof document).toBe('undefined');
  });
});
