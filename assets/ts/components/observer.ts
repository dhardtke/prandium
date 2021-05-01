import { BaseComponent, Component } from "./component.ts";

export const Events = {
  Intersecting: "ObserverIntersecting"
} as const;

@Component("Observer")
export class Observer extends BaseComponent {
  private observer?: IntersectionObserver;

  constructor(ctx: HTMLElement) {
    super(ctx);
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting) {
        window.dispatchEvent(new CustomEvent(Events.Intersecting));
        this.destructor();
      }
    });

    this.observer.observe(this.ctx);
  }

  destructor() {
    this.observer?.disconnect();
    this.ctx.remove();
  }
}
