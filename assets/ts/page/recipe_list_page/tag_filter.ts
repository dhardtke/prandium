import { BaseComponent, Component } from "../../components/component.ts";

const LocalStorageName = "scrollRestore";

interface ScrollRestore {
  html: number;
  "#tag-filter": number;
}

@Component("TagFilter")
export class TagFilter extends BaseComponent {
  constructor(ctx: HTMLElement) {
    super(ctx);

    this.ctx.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(($anchor) => {
      const listener = (e: Event) => {
        e.preventDefault();
        const scrollRestore: ScrollRestore = { html: document.documentElement.scrollTop, "#tag-filter": ctx.scrollTop };
        localStorage.setItem(LocalStorageName, JSON.stringify(scrollRestore));
        $anchor.removeEventListener("click", listener);
        $anchor.click();
      };
      $anchor.addEventListener("click", listener);
    });
    const scroll = localStorage.getItem(LocalStorageName);
    if (scroll) {
      const parsed = JSON.parse(scroll) as ScrollRestore;
      for (const [selector, offset] of Object.entries(parsed)) {
        document.querySelector<HTMLElement>(selector)?.scrollTo(0, offset);
      }

      localStorage.removeItem(LocalStorageName);
    }
  }
}
