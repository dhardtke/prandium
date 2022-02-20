/// <reference lib="dom" />
import { DarkModeCookie } from "../../../src/shared/constants.ts";
import { getCookie, setCookie } from "../_util/cookie_util.ts";
import { BaseComponent, Component } from "../components/component.ts";

const DocumentClassName = "dark";
const Classes = {
  HIDDEN: "hidden",
  DARK_TOGGLING: "dark-toggling"
}

type State = "true" | "false" | null;

@Component("DarkModeSwitcher")
export class DarkModeSwitcher extends BaseComponent {
  private $active: HTMLElement | null;
  private $inactive: HTMLElement | null;

  private state: State;

  constructor(ctx: HTMLElement) {
    super(ctx);

    this.$active = ctx.querySelector(".active");
    this.$inactive = ctx.querySelector(".inactive");

    this.state = getCookie(DarkModeCookie) as State;
    if (this.state === null) {
      const wantsDark = "" + globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
      setCookie(DarkModeCookie, wantsDark);
      this.toggle();
    }

    ctx.addEventListener("click", this.onClick);
  }

  private onClick = (e: Event) => {
    e.preventDefault();

    this.state = this.state === "true" ? "false" : "true";
    setCookie(DarkModeCookie, this.state);
    this.toggle();
  };

  private toggle = () => {
    document.documentElement.classList.add(Classes.DARK_TOGGLING);
    this.$active?.classList.remove(Classes.HIDDEN);
    this.$inactive?.classList.remove(Classes.HIDDEN);

    if (document.documentElement.classList.toggle(DocumentClassName)) {
      this.$inactive?.classList.add(Classes.HIDDEN);
    } else {
      this.$active?.classList.add(Classes.HIDDEN);
    }
    setTimeout(() => {
      document.documentElement.classList.remove(Classes.DARK_TOGGLING);
    }, 500);
  };
}

