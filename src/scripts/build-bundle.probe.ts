// A child process: test files share useDom()'s one window, where earlier define() calls would leak in.
import { pathToFileURL } from 'node:url';
import { GlobalWindow } from 'happy-dom';

export interface ProbeState {
  defined: string[];
  requested: string[];
  appRules: number;
}

export interface ProbeReport {
  beforeMount: ProbeState;
  afterMount: ProbeState;
}

const TAGS = [
  'pr-app',
  'pr-header',
  'pr-theme-toggle',
  'pr-language-switch',
  'pr-breadcrumbs',
  'pr-recipe-list',
  'pr-recipe-detail',
  'pr-recipe-edit',
  'pr-recipe-import',
  'pr-login',
];

const NOT_INSTALLED = new Set<PropertyKey>(['constructor', 'global', 'globalThis', 'undefined', 'NaN']);

const bundle = process.argv[2];
if (bundle === undefined) {
  throw new Error('usage: bun build-bundle.probe.ts <bundle path>');
}

const window = new GlobalWindow({
  url: 'http://localhost/',
  settings: { navigation: { disableMainFrameNavigation: true, disableFallbackToSetURL: true } },
});
for (const key of Reflect.ownKeys(window)) {
  const descriptor = Object.getOwnPropertyDescriptor(window, key);
  const current = Object.getOwnPropertyDescriptor(globalThis, key);
  if (NOT_INSTALLED.has(key) || !descriptor || (current?.value !== undefined && current.value === descriptor.value)) {
    continue;
  }
  Object.defineProperty(globalThis, key, { ...descriptor, configurable: true });
}

const requested: string[] = [];
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: (input: RequestInfo | URL): Promise<Response> => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(raw, location.href).pathname;
    requested.push(path);
    if (path.endsWith('.css')) {
      return Promise.resolve(new Response('', { status: 200 }));
    }
    if (path.startsWith('/api/')) {
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return Promise.reject(new Error(`build-bundle.probe: unexpected fetch ${raw}`));
  },
});

function state(): ProbeState {
  const sheets = document.createElement('pr-app').shadowRoot?.adoptedStyleSheets ?? [];
  return {
    defined: TAGS.filter((tag) => customElements.get(tag) !== undefined),
    requested: [...requested],
    appRules: sheets.at(-1)?.cssRules.length ?? 0,
  };
}

await import(pathToFileURL(bundle).href);
const beforeMount = state();

document.body.append(document.createElement('pr-app'));
await Promise.race([customElements.whenDefined('pr-recipe-list'), Bun.sleep(5_000)]);
const afterMount = state();

const report: ProbeReport = { beforeMount, afterMount };
// Not console.log: happy-dom's console, installed above, writes to its virtual console.
process.stdout.write(`${JSON.stringify(report)}\n`);
// happy-dom keeps timers alive.
process.exit(0);
