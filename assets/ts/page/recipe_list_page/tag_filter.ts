import { BaseComponent, Component } from "../../components/component.ts";

const Hash = "#tag-filter-visible";

@Component("TagToggle")
class TagToggle extends BaseComponent {
  constructor(ctx: HTMLElement) {
    super(ctx);

    this.ctx.addEventListener("click", () => {
      const active = location.href.includes(Hash);
      window.history.replaceState({}, "", location.href.replace(location.hash, "") + (active ? "" : Hash));
    });
  }
}

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
      $anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const scrollRestore: ScrollRestore = {html: document.documentElement.scrollTop, "#tag-filter": ctx.scrollTop};
        localStorage.setItem(LocalStorageName, JSON.stringify(scrollRestore));
        // use Hash to show the collapsed div after reload
        window.history.pushState({}, "", $anchor.href + Hash);
        window.location.reload();
      });
    });
    if (window.location.hash === Hash) {
      this.ctx.classList.add("show");
    }
    const scroll = localStorage.getItem(LocalStorageName);
    if (scroll) {
      const parsed = JSON.parse(scroll) as ScrollRestore;
      for (const [selector, offset] of Object.entries(parsed)) {
        document.querySelector<HTMLElement>(selector)?.scrollTo(0, offset);
      }

      localStorage.removeItem(LocalStorageName);
    }

    window.addEventListener("popstate", this.onPopState);
  }

  destructor() {
    super.destructor();
    window.removeEventListener("popstate", this.onPopState);
  }

  private onPopState = () => {
    window.location.reload();
  };
}
