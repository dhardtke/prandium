import { afterAll, afterEach, beforeAll, beforeEach } from 'bun:test';
import type { GlobalWindow } from 'happy-dom';

// bun test runs every file in one process, so a stub left behind would leak into other tests.
export function useGlobals(): (name: string, value: unknown) => void {
  const saved = new Map<string, PropertyDescriptor | undefined>();

  afterEach(() => {
    for (const [name, descriptor] of saved) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, name);
      }
    }
    saved.clear();
  });

  return (name, value) => {
    if (!saved.has(name)) {
      saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    }
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  };
}

export interface RecordedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface FakeFetch {
  readonly requests: RecordedRequest[];
  respondWith: (status: number, body?: string) => void;
  // `request` is `'<METHOD> <url>'`, e.g. `'GET /api/recipes'`.
  respondTo: (request: string, status: number, body?: string) => void;
  sent: (request: string) => unknown[];
  failWith: (cause: Error) => void;
}

export function useFetch(): FakeFetch {
  const stub = useGlobals();
  const requests: RecordedRequest[] = [];
  const ok = (): Promise<Response> => Promise.resolve(new Response('{}'));
  const answers = new Map<string, () => Promise<Response>>();
  let answer = ok;

  beforeEach(() => {
    requests.length = 0;
    answer = ok;
    answers.clear();
    stub('fetch', (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = urlOf(input);
      const method = init?.method ?? 'GET';
      const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
      requests.push({ method, url, headers: Object.fromEntries(new Headers(init?.headers)), body });
      return (answers.get(`${method} ${url}`) ?? answer)();
    });
  });

  const respond = (status: number, body: string): (() => Promise<Response>) => {
    return (): Promise<Response> => Promise.resolve(new Response(body === '' ? null : body, { status }));
  };

  return {
    requests,
    respondWith: (status, body = ''): void => {
      answer = respond(status, body);
    },
    respondTo: (request, status, body = ''): void => {
      answers.set(request, respond(status, body));
    },
    sent: (request): unknown[] => requests.filter(({ method, url }) => `${method} ${url}` === request).map(({ body }) => body),
    failWith: (cause): void => {
      answer = (): Promise<Response> => Promise.reject(cause);
    },
  };
}

// Call after useDom(): `window` is happy-dom's, not `globalThis`, so useGlobals() would miss it.
export function useToasts(): string[] {
  const messages: string[] = [];
  let saved: Window['ot'] | undefined;

  beforeEach(() => {
    saved = window.ot;
    window.ot = {
      toast: (message): HTMLElement => {
        messages.push(message);
        return document.createElement('output');
      },
    };
  });

  afterEach(() => {
    if (saved) {
      window.ot = saved;
    } else {
      Reflect.deleteProperty(window, 'ot');
    }
    messages.length = 0;
  });

  return messages;
}

function urlOf(input: RequestInfo | URL): string {
  return typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
}

const NOT_INSTALLED = new Set<PropertyKey>(['constructor', 'global', 'globalThis', 'undefined', 'NaN']);

// Created once: component modules are cached across files and keep this window's classes.
let shared: GlobalWindow | undefined;

// Import components with `await import()` after this: a static import would extend HTMLElement too early.
export function useDom(): void {
  const saved = new Map<PropertyKey, PropertyDescriptor | undefined>();

  beforeAll(async () => {
    const { GlobalWindow } = await import('happy-dom');
    shared ??= new GlobalWindow({
      url: 'http://localhost/',
      settings: { navigation: { disableMainFrameNavigation: true, disableFallbackToSetURL: true } },
    });
    const window = shared;
    const install = (key: PropertyKey, descriptor: PropertyDescriptor): void => {
      if (!saved.has(key)) {
        saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
      }
      Object.defineProperty(globalThis, key, { ...descriptor, configurable: true });
    };

    // Not @happy-dom/global-registrator: it creates a new window every time.
    for (const key of Reflect.ownKeys(window)) {
      const descriptor = Object.getOwnPropertyDescriptor(window, key);
      const current = Object.getOwnPropertyDescriptor(globalThis, key);
      if (NOT_INSTALLED.has(key) || !descriptor || (current?.value !== undefined && current.value === descriptor.value)) {
        continue;
      }
      install(key, descriptor);
    }

    install('fetch', {
      writable: true,
      value: (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = urlOf(input);
        if (new URL(url, location.href).pathname.endsWith('.css')) {
          return Promise.resolve(new Response('', { status: 200 }));
        }
        const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
        return Promise.reject(new Error(`useDom: unexpected fetch ${method} ${url}; stub it with useFetch()`));
      },
    });
  });

  afterEach(async () => {
    document.body.replaceChildren();
    localStorage.clear();
    // After the DOM is gone, so no component re-renders; a static import would run i18n.ts before the window exists.
    const { setLanguage } = await import('./ui/i18n.ts');
    setLanguage('en');
  });

  afterAll(() => {
    for (const [key, descriptor] of saved) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, key);
      }
    }
    saved.clear();
  });
}

// In the body, which useDom() clears after each test; the server puts it in the head.
export function embedAuthStatus(enabled: boolean): void {
  const script = document.createElement('script');
  script.type = 'application/json';
  script.id = 'auth-status';
  script.textContent = JSON.stringify({ enabled });
  document.body.append(script);
}

export function shadow(host: Element): ShadowRoot {
  if (!host.shadowRoot) {
    throw new Error(`${host.localName} has no shadow root`);
  }
  return host.shadowRoot;
}

export function testId(id: string): string {
  return `[data-testid='${id}']`;
}

// oxlint-disable-next-line typescript/no-unnecessary-type-parameters
export function find<T extends Element = Element>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) {
    throw new Error(`nothing matches ${selector}`);
  }
  return found;
}

// happy-dom opens and closes a dialog synchronously, so call this right after the click that opens one.
export function openDialog(): ShadowRoot {
  const root = shadow(find(document.body, 'pr-confirm-dialog'));
  if (!find<HTMLDialogElement>(root, 'dialog').open) {
    throw new Error('the confirmation dialog is not open');
  }
  return root;
}

export function text(host: Element, selector: string): string | undefined {
  return host.shadowRoot?.querySelector(selector)?.textContent;
}

// happy-dom skips attributeChangedCallback for attributes present at upgrade.
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters
export function mount<T extends HTMLElement = HTMLElement>(tag: string, attributes: Record<string, string> = {}): T {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the caller names the class it registered for `tag`
  const element = document.createElement(tag) as T;
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  return element;
}

export function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export function choose(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

export function submit(form: Element): void {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

export async function settle(ms = 10): Promise<void> {
  await Bun.sleep(ms);
}

export function collect(event: string): unknown[] {
  const details: unknown[] = [];
  document.body.addEventListener(event, (heard) => {
    if (heard instanceof CustomEvent) {
      details.push(heard.detail);
    }
  });
  return details;
}
