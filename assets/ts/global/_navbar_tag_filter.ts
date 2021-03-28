import { bootstrap } from "../../index.ts";
import { jaroWinklerDistance } from "../_util/jaro_winkler.ts";
import { removeUrlParameterValue } from "../_util/remove_url_parameter_value.ts";

declare type Tag = {
  id: number;
  title: string;
  description: string;
  recipeCount: number;
};

const TAG_LIST_ENDPOINT = "/tag/filter";
const ID = "tag-filter";
const URL_PARAMETER = "tagId";
const JARO_WINKLER_SIMILARITY_THRESHOLD = .75;
const SELECTORS = {
  TITLE: ".tag-title",
  RECIPE_COUNT: ".tag-recipe-count",
  RESULTS: ".list-group",
  ITEM: ".list-group-item",
  CLEAR_BTN: ".btn-tag-clear",
  INPUT_FILTER: ".input-filter"
};
const CLASSES = {
  ACTIVE: "active",
  DISABLED: "disabled",
  HIDDEN: "d-none"
};
const IS_MOBILE = () => window.matchMedia(`(max-width: 767.98px)`).matches;

export class NavbarTagFilter {
  private readonly $tagFilter: HTMLDivElement;
  private readonly $inputFilter: HTMLInputElement;
  private readonly $results: HTMLDivElement;
  private readonly $template: HTMLTemplateElement;

  private readonly requestUrl: URL;
  private readonly activeTagIds: Set<number>;
  private readonly hiddenTagIds: Set<number> = new Set();

  constructor() {
    this.$tagFilter = document.getElementById(ID)! as HTMLDivElement;
    this.$results = this.$tagFilter.querySelector(SELECTORS.RESULTS)!;
    this.$template = this.$tagFilter.querySelector("template")!;
    this.$tagFilter.querySelector(SELECTORS.CLEAR_BTN)!.addEventListener("click", this.clear);
    this.$inputFilter = this.$tagFilter.querySelector(SELECTORS.INPUT_FILTER)!;
    this.$inputFilter.addEventListener("input", this.inputFilter);
    this.requestUrl = new URL(window.location.href);
    this.activeTagIds = new Set(this.requestUrl.searchParams.getAll("tagId").map((id) => parseInt(id, 10)));

    this.load();
  }

  private clear = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    this.activeTagIds.clear();
    this.hiddenTagIds.clear();
    this.$inputFilter.value = "";
    this.load();
  };

  private inputFilter = () => {
    const query = this.$inputFilter.value.trim().toLowerCase();
    const $items = this.$results.querySelectorAll<HTMLAnchorElement>(SELECTORS.ITEM);
    for (let i = 0; i < $items.length; i++) {
      const $item = $items[i];
      const title = $item.querySelector(SELECTORS.TITLE)!.textContent!.trim().toLowerCase();
      const id = parseInt($item.dataset.tagId!, 10);
      const shouldBeHidden = Boolean(query) && !$item.classList.contains(CLASSES.ACTIVE) && jaroWinklerDistance(query, title) < JARO_WINKLER_SIMILARITY_THRESHOLD;
      $item.classList.toggle(CLASSES.HIDDEN, shouldBeHidden);
      if (shouldBeHidden) {
        this.hiddenTagIds.add(id);
      } else {
        this.hiddenTagIds.delete(id);
      }
    }
  };

  private addItemClickListener($item: HTMLAnchorElement) {
    $item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (parseInt($item.querySelector(SELECTORS.RECIPE_COUNT)!.textContent!, 10) === 0) {
        return;
      }
      const id = parseInt($item.dataset.tagId!, 10);
      const isActive = $item.classList.toggle(CLASSES.ACTIVE);
      const $input = $item.querySelector("input") as HTMLInputElement;
      $input.disabled = !isActive;
      if (isActive) {
        this.activeTagIds.add(id);
      } else {
        this.activeTagIds.delete(id);
      }
      this.load();
    });
  };

  private buildTagUrl(tagId: number): string {
    const url = new URL(this.requestUrl.toString());
    if (this.activeTagIds.has(tagId)) {
      removeUrlParameterValue(url, URL_PARAMETER, tagId + "");
    } else {
      url.searchParams.append(URL_PARAMETER, tagId + "");
    }
    return url.toString();
  }

  private buildEndpointUrl(): URL {
    const url = new URL(TAG_LIST_ENDPOINT, window.location.href);
    this.activeTagIds.forEach((id) => url.searchParams.append(URL_PARAMETER, id + ""));
    return url;
  }

  private updateItem(tag: Tag, $item: HTMLAnchorElement) {
    const $input = $item.querySelector("input") as HTMLInputElement;
    $input.value = tag.id + "";
    $item.dataset.tagId = tag.id + "";
    $item.querySelector(SELECTORS.TITLE)!.textContent = tag.title;
    const $countBadge = $item.querySelector(SELECTORS.RECIPE_COUNT)!;
    $countBadge.textContent = tag.recipeCount + "";
    $countBadge.classList.toggle(CLASSES.HIDDEN, tag.recipeCount === 0);
    $item.href = this.buildTagUrl(tag.id);
    const isActive = this.activeTagIds.has(tag.id);
    $input.disabled = !isActive;
    const isDisabled = $input.disabled && tag.recipeCount === 0;
    $item.classList.toggle(CLASSES.ACTIVE, isActive);
    $item.classList.toggle(CLASSES.DISABLED, isDisabled);
    $item.classList.toggle(CLASSES.HIDDEN, this.hiddenTagIds.has(tag.id));
    $item.dataset.description = tag.description || "";
    const tooltip = bootstrap.Tooltip.getInstance($item);
    if (isDisabled) {
      tooltip.disable();
    } else {
      tooltip.enable();
    }
  }

  private load() {
    // @ts-ignore
    fetch(this.buildEndpointUrl()).then(async (response) => {
      const tags: Tag[] = await response.json();
      for (const tag of tags) {
        let $item = this.$results.querySelector(`[data-tag-id="${tag.id}"]`) as HTMLAnchorElement;
        if (!$item) {
          const $fragment = this.$template.content.cloneNode(true) as DocumentFragment;
          $item = $fragment.querySelector("a") as HTMLAnchorElement;
          new bootstrap.Tooltip($item, {
            title: () => $item.dataset.description,
            placement: () => IS_MOBILE() ? "bottom" : "left",
            fallbackPlacements: ["left"],
            trigger: "hover",
            container: "body",
            boundary: document.body
          });
          this.addItemClickListener($item);
          this.$results.appendChild($fragment);
        }
        this.updateItem(tag, $item);
      }
    });
  }
}
