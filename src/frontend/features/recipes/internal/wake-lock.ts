interface Sentinel {
  release: () => Promise<void>;
}

interface WakeLockApi {
  request: (type: 'screen') => Promise<Sentinel>;
}

function isWakeLockApi(value: unknown): value is WakeLockApi {
  return typeof value === 'object' && value !== null && 'request' in value && typeof value.request === 'function';
}

// Not in every browser, and absent from happy-dom.
function wakeLockApi(): WakeLockApi | null {
  const api: unknown = Reflect.get(navigator, 'wakeLock');
  return isWakeLockApi(api) ? api : null;
}

/** Keeps the screen on while cooking: held while acquired, taken again when the page returns to view, as the browser drops it when hidden. */
export class ScreenWakeLock {
  #sentinel: Sentinel | null = null;
  #held = false;

  readonly #onVisibility = (): void => {
    if (this.#held && document.visibilityState === 'visible') {
      void this.#request();
    }
  };

  acquire(): void {
    if (this.#held) {
      return;
    }
    this.#held = true;
    document.addEventListener('visibilitychange', this.#onVisibility);
    void this.#request();
  }

  release(): void {
    this.#held = false;
    document.removeEventListener('visibilitychange', this.#onVisibility);
    const sentinel = this.#sentinel;
    this.#sentinel = null;
    void sentinel?.release().catch(() => {});
  }

  async #request(): Promise<void> {
    const api = wakeLockApi();
    if (!api) {
      return;
    }
    try {
      const sentinel = await api.request('screen');
      if (this.#held) {
        this.#sentinel = sentinel;
      } else {
        await sentinel.release();
      }
    } catch {
      // Refused, e.g. on battery saver or in a hidden tab; the page works without it.
    }
  }
}
