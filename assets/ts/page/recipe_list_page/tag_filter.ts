import { replaceMain } from "../../_util/ajax_util.ts";
import { jaroWinklerDistance } from "../../_util/jaro_winkler.ts";
import { BaseComponent, Component } from "../../components/component.ts";

const JaroWinklerSimilarityThreshold = .75;
const Selectors = {
  Title: ".title",
  Tag: ".tag",
  InputFilter: ".input-filter",
  RecipeList: "#recipe-list",
} as const;

const Classes = {
  Active: "active",
  Disabled: "disabled",
  Hidden: "hidden"
} as const;

@Component("TagFilter")
export class TagFilter extends BaseComponent {
  private readonly $inputFilter: HTMLInputElement;

  private readonly hiddenTagIds: Set<number> = new Set();

  constructor(ctx: HTMLElement) {
    super(ctx);

    this.$inputFilter = ctx.querySelector(Selectors.InputFilter)!;
    this.$inputFilter.addEventListener("input", this.inputFilter);

    this.registerClickListener();
  }

  private registerClickListener() {
    this.ctx.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(async ($anchor) => {
      $anchor.addEventListener("click", async (e: Event) => {
        e.preventDefault();

        const top = this.ctx.querySelector(".card-body")!.scrollTop;
        const inputValue = this.$inputFilter.value;
        await replaceMain($anchor.href);
        // TODO avoid reaching out of tag-filter's scope - is it better to use a const to memoize the scrollTop value?
        document.querySelector("#tag-filter .card-body")!.scrollTo(0, top);
        const $newInputFilter = document.querySelector<HTMLInputElement>("#tag-filter .input-filter")!;
        $newInputFilter.value = inputValue;
        $newInputFilter.dispatchEvent(new Event('input', {
          bubbles: true,
          cancelable: true,
        }));
      });
    });
  }

  private inputFilter = () => {
    const query = this.$inputFilter.value.trim().toLowerCase();
    const $tags = this.ctx.querySelectorAll<HTMLAnchorElement>(Selectors.Tag);
    for (let i = 0; i < $tags.length; i++) {
      const $item = $tags[i];
      const title = $item.querySelector(Selectors.Title)!.textContent!.trim().toLowerCase();
      const id = parseInt($item.dataset.tagId!, 10);
      const shouldBeHidden = Boolean(query) && !$item.classList.contains(Classes.Active) && jaroWinklerDistance(query, title) < JaroWinklerSimilarityThreshold;
      $item.classList.toggle(Classes.Hidden, shouldBeHidden);
      if (shouldBeHidden) {
        this.hiddenTagIds.add(id);
      } else {
        this.hiddenTagIds.delete(id);
      }
    }
  };
}
