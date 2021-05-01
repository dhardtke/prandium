// deno-lint-ignore no-explicit-any
type Class<S> = new (...args: any[]) => S;

const registry: { [name: string]: Class<BaseComponent> } = {};
const registeredElements: HTMLElement[] = [];

export function Component(name: string) {
  return (ctor: Class<BaseComponent>) => {
    registry[name] = ctor;
  }
}

export abstract class BaseComponent {
  static readonly _name: string;
  protected readonly ctx: HTMLElement;

  protected constructor(ctx: HTMLElement) {
    this.ctx = ctx;
  }

  destructor(): void {
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
        new cmp(ctx);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeComponents, false);
  } else {
    initializeComponents();
  }
}
