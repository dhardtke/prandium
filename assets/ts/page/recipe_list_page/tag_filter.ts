import { jaroWinklerDistance } from "../../_util/jaro_winkler.ts";
import { removeUrlParameterValue } from "../../_util/remove_url_parameter_value.ts";

declare type Tag = {
  id: number;
  title: string;
  description: string;
  recipeCount: number;
};

const TagListEndpoint = "/tag/filter";
const Id = "tag-filter";
const UrlParameter = "tagId";
const JaroWinklerSimilarityThreshold = .75;
const Selectors = {
  Title: ".tag-title",
  RecipeCount: ".tag-recipe-count",
  Results: ".list-group",
  Item: ".list-group-item",
  ClearBtn: ".btn-tag-clear",
  InputFilter: ".input-filter"
} as const;
const Classes = {
  Active: "active",
  Disabled: "disabled",
  Hidden: "d-none"
} as const;

export class TagFilter {
  private readonly $tagFilter: HTMLDivElement;
  private readonly $inputFilter: HTMLInputElement;
  private readonly $results: HTMLDivElement;
  private readonly $template: HTMLTemplateElement;

  private readonly requestUrl: URL;
  private readonly activeTagIds: Set<number>;
  private readonly hiddenTagIds: Set<number> = new Set();

  constructor() {
    this.$tagFilter = document.getElementById(Id)! as HTMLDivElement;
    this.$results = this.$tagFilter.querySelector(Selectors.Results)!;
    this.$template = this.$tagFilter.querySelector("template")!;
    this.$tagFilter.querySelector(Selectors.ClearBtn)!.addEventListener("click", this.clear);
    this.$inputFilter = this.$tagFilter.querySelector(Selectors.InputFilter)!;
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
    const $items = this.$results.querySelectorAll<HTMLAnchorElement>(Selectors.Item);
    for (let i = 0; i < $items.length; i++) {
      const $item = $items[i];
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

  private addItemClickListener($item: HTMLAnchorElement) {
    $item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (parseInt($item.querySelector(Selectors.RecipeCount)!.textContent!, 10) === 0) {
        return;
      }
      const id = parseInt($item.dataset.tagId!, 10);
      const isActive = $item.classList.toggle(Classes.Active);
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
      removeUrlParameterValue(url, UrlParameter, tagId + "");
    } else {
      url.searchParams.append(UrlParameter, tagId + "");
    }
    return url.toString();
  }

  private buildEndpointUrl(): URL {
    const url = new URL(TagListEndpoint, window.location.href);
    this.activeTagIds.forEach((id) => url.searchParams.append(UrlParameter, id + ""));
    return url;
  }

  private updateItem(tag: Tag, $item: HTMLAnchorElement) {
    const $input = $item.querySelector("input") as HTMLInputElement;
    $input.value = tag.id + "";
    $item.dataset.tagId = tag.id + "";
    $item.querySelector(Selectors.Title)!.textContent = tag.title;
    const $countBadge = $item.querySelector(Selectors.RecipeCount)!;
    $countBadge.textContent = tag.recipeCount + "";
    $countBadge.classList.toggle(Classes.Hidden, tag.recipeCount === 0);
    $item.href = this.buildTagUrl(tag.id);
    const isActive = this.activeTagIds.has(tag.id);
    $input.disabled = !isActive;
    const isDisabled = $input.disabled && tag.recipeCount === 0;
    $item.classList.toggle(Classes.Active, isActive);
    $item.classList.toggle(Classes.Disabled, isDisabled);
    $item.classList.toggle(Classes.Hidden, this.hiddenTagIds.has(tag.id));
    $item.title = !isDisabled && tag.description || "";
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
          this.addItemClickListener($item);
          this.$results.appendChild($fragment);
        }
        this.updateItem(tag, $item);
      }
    });
  }
}
