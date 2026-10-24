import { toastError } from '../ui/toast.ts';
import { reloadSheet } from '../ui/styles.ts';

type Change = { swap: string } | { reload: string };

const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/dev/ws`;

// A backend edit restarts the server under `bun --watch`, so a dropped socket is expected.
const BACKOFF_MS = [250, 500, 1000, 2000];

function isChange(value: unknown): value is Change {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const swap: unknown = Reflect.get(value, 'swap');
  const reload: unknown = Reflect.get(value, 'reload');
  return typeof swap === 'string' || typeof reload === 'string';
}

// Modules reload the page: `customElements.define` refuses a tag it already knows.
async function apply(change: Change): Promise<void> {
  if ('swap' in change) {
    await swapCss(change.swap);
    return;
  }
  // The transpiler answers 500 for a file that will not parse; don't blank the page on a typo.
  const probe = await fetch(change.reload, { method: 'HEAD', cache: 'no-store' });
  if (!probe.ok) {
    toastError(new Error(`Could not transpile ${change.reload}`));
    return;
  }
  console.log(`cena: reloading for ${change.reload}`);
  location.reload();
}

async function swapCss(url: string): Promise<void> {
  const swapped = await reloadSheet(url);
  const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].filter((link) => new URL(link.href).pathname === url);
  links.forEach(swapLink);
  if (!swapped && links.length === 0) {
    console.log(`cena: reloading for ${url}`);
    location.reload();
    return;
  }
  console.log(`cena: swapped ${url}`);
}

// Reassigning a <link>'s href does not refetch it; the old one goes once the new one has loaded.
function swapLink(link: HTMLLinkElement): void {
  const fresh = document.createElement('link');
  fresh.rel = 'stylesheet';
  fresh.href = `${new URL(link.href).pathname}?hot=${Date.now()}`;
  fresh.addEventListener('load', () => {
    link.remove();
  });
  link.after(fresh);
}

function connect(attempt: number): void {
  const socket = new WebSocket(WS_URL);
  let opened = false;

  socket.addEventListener('open', () => {
    opened = true;
    console.log('cena: hot reload connected');
  });

  socket.addEventListener('message', (event) => {
    const data: unknown = typeof event.data === 'string' ? JSON.parse(event.data) : null;
    if (isChange(data)) {
      void apply(data);
    }
  });

  socket.addEventListener('close', () => {
    const failures = opened ? 0 : attempt;
    const delay = BACKOFF_MS[Math.min(failures, BACKOFF_MS.length - 1)];
    setTimeout(() => {
      connect(failures + 1);
    }, delay);
  });
}

connect(0);
