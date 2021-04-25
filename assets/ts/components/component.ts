// deno-lint-ignore no-explicit-any
type Class<S> = new (...args: any[]) => S;

const registry: { [name: string]: Class<Component> } = {};
const registeredElements: HTMLElement[] = [];

export abstract class Component {
  protected readonly ctx!: HTMLElement;

  constructor(ctx: HTMLElement) {
    this.ctx = ctx;
  }

  static register(cmp: Class<Component>) {
    registry[cmp.name] = cmp;
  }

  abstract mount(): void;

  unmount(): void {
  }
}

export function bootComponents() {
  function initializeComponents() {
    document.querySelectorAll<HTMLElement>(`[data-cmp]`).forEach((ctx) => {
      // do not initialize more than once
      if (!registeredElements.includes(ctx)) {
        const cmp = registry[ctx.dataset.cmp || ""];
        if (!cmp) {
          throw new Error(`No component with the name ${ctx.dataset.cmp} found.`);
        }
        registeredElements.push(ctx);
        new cmp(ctx).mount();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeComponents);
  } else {
    initializeComponents();
  }
}
