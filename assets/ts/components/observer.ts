import { Component } from "./component.ts";

export const Events = {
  Intersecting: "ObserverIntersecting"
} as const;

export class Observer extends Component {
  private observer?: IntersectionObserver;

  mount() {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting) {
        window.dispatchEvent(new CustomEvent(Events.Intersecting));
        this.unmount();
      }
    });

    this.observer.observe(this.ctx);
  }

  unmount() {
    this.observer?.disconnect();
    this.ctx.remove();
  }
}
