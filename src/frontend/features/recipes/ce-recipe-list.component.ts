import type { RecipePageDto, RecipeSortKey, RecipeSummaryDto } from '../../../shared/dto/recipe.ts';
import type { TagDto } from '../../../shared/dto/tag.ts';
import type { Language } from '../../i18n/language.ts';
import type { RawHtml } from '../../ui/html.ts';
import { define } from '../../ui/base.ts';
import { confirmAction } from '../../ui/confirm/confirm.ts';
import { html } from '../../ui/html.ts';
import { t } from '../../ui/i18n.ts';
import { pageCount, pageOffset } from '../../ui/pagination/pagination.ts';
import '../../ui/pagination/ce-pagination.component.ts';
import { toast, toastError } from '../../ui/toast.ts';
import { CeView } from '../../ui/view.ts';
import { tagFacade } from '../tags/tags.facade.ts';
import { type ListQuery, listPath, PAGE_SIZE, parseListQuery, RECIPE_SORT_KEYS } from './internal/list-query.ts';
import type { CeRecipeCardComponent } from './internal/ce-recipe-card.component.ts';
import './internal/ce-recipe-card.component.ts';
import type { CeTagPanelComponent } from './internal/ce-tag-panel.component.ts';
import './internal/ce-tag-panel.component.ts';
import { recipeFacade } from './recipes.facade.ts';

const SEARCH_DEBOUNCE_MS = 300;

interface RecipeListData {
  query: ListQuery;
  recipes: RecipePageDto;
  tags: TagDto[];
}

function sortGroups(l: Language): { label: string; options: [RecipeSortKey, string][] }[] {
  const n = l.recipe.nutrition;
  return [
    {
      label: l.recipe.form.group.basic,
      options: [
        ['id', l.id],
        ['title', l.title],
        ['cooked_count', l.recipe.cookedCount],
        ['flagged', l.recipe.flagged],
      ],
    },
    {
      label: l.recipe.form.group.ratings,
      options: [
        ['aggregate_rating_value', l.recipe.aggregateRatingValue],
        ['rating', l.recipe.rating],
      ],
    },
    {
      label: l.recipe.form.group.times,
      options: [
        ['created_at', l.createdAt],
        ['updated_at', l.updatedAt],
        ['last_cooked_at', l.recipe.lastCookedAt],
        ['prep_time', l.recipe.prepTime],
        ['cook_time', l.recipe.cookTime],
        ['total_time', l.recipe.time.total],
      ],
    },
    {
      label: l.recipe.form.group.nutrition,
      options: [
        ['nutrition_calories', n.calories],
        ['nutrition_carbohydrate', n.carbohydrate],
        ['nutrition_cholesterol', n.cholesterol],
        ['nutrition_fat', n.fat],
        ['nutrition_fiber', n.fiber],
        ['nutrition_protein', n.protein],
        ['nutrition_saturated_fat', n.saturatedFat],
        ['nutrition_sodium', n.sodium],
        ['nutrition_sugar', n.sugar],
        ['nutrition_trans_fat', n.transFat],
        ['nutrition_unsaturated_fat', n.unsaturatedFat],
      ],
    },
  ];
}

/** List state lives in the query string; a change is a pushState and a refetch that patches the results, never a re-render of the toolbar. */
export class CeRecipeListComponent extends CeView<RecipeListData> {
  #searchTimer: ReturnType<typeof setTimeout> | undefined;
  #requestToken = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.root.addEventListener('input', (event) => {
      if (event.target instanceof HTMLInputElement && event.target.name === 'search') {
        const field = event.target;
        clearTimeout(this.#searchTimer);
        this.#searchTimer = setTimeout(() => {
          this.#applySearch(field.value);
        }, SEARCH_DEBOUNCE_MS);
      }
    });
    // Chrome and Safari fire only `search`, not `input`, when the ✕ clears the field.
    this.root.addEventListener('search', (event) => {
      if (event.target instanceof HTMLInputElement && event.target.name === 'search') {
        this.#applySearch(event.target.value);
      }
    });
    this.root.addEventListener('change', (event) => {
      const { target } = event;
      if (target instanceof HTMLSelectElement && target.name === 'sort') {
        const sort = RECIPE_SORT_KEYS.find((key) => key === target.value);
        if (sort !== undefined) {
          this.#change({ sort, page: 1 });
        }
      }
    });
    this.root.addEventListener('page-change', (event) => {
      if (event instanceof CustomEvent && typeof event.detail === 'number') {
        this.#change({ page: event.detail });
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    });
    this.root.addEventListener('tag-toggle', (event) => {
      if (event instanceof CustomEvent && typeof event.detail === 'number') {
        const tags = this.#query().tags;
        const id = event.detail;
        this.#change({ tags: tags.includes(id) ? tags.filter((tag) => tag !== id) : [...tags, id], page: 1 });
      }
    });
    this.root.addEventListener('recipe-delete', (event) => {
      const recipe = event instanceof CustomEvent ? this.data?.recipes.items.find((item) => item.id === event.detail) : undefined;
      if (recipe) {
        void this.#delete(recipe);
      }
    });
    this.root.addEventListener('tags-clear', () => {
      this.#change({ tags: [], page: 1 });
    });
    this.root.addEventListener('tags-open', (event) => {
      if (event instanceof CustomEvent && typeof event.detail === 'boolean') {
        this.#replace({ tagsOpen: event.detail });
      }
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this.#searchTimer);
  }

  override async load(): Promise<RecipeListData> {
    return this.#fetch(parseListQuery(location.search));
  }

  override handleSubmit(action: string, form: HTMLFormElement): void {
    if (action === 'search') {
      clearTimeout(this.#searchTimer);
      this.#applySearch(this.formData(form).search ?? '');
    }
  }

  override handleAction(action: string): void {
    if (action === 'order') {
      this.#change({ order: this.#query().order === 'asc' ? 'desc' : 'asc', page: 1 });
    }
  }

  override afterRender(): void {
    this.#patch();
  }

  override titleFor(): string {
    return t().recipes;
  }

  #query(): ListQuery {
    return this.data?.query ?? parseListQuery(location.search);
  }

  async #fetch(query: ListQuery): Promise<RecipeListData> {
    const [recipes, tags] = await Promise.all([
      recipeFacade.list({
        limit: PAGE_SIZE,
        offset: pageOffset(query.page, PAGE_SIZE),
        search: query.search,
        tags: query.tags,
        sort: query.sort,
        order: query.order,
      }),
      tagFacade.list(query.tags),
    ]);
    return { query, recipes, tags };
  }

  #applySearch(value: string): void {
    const search = value.trim();
    if (search !== this.#query().search) {
      this.#change({ search, page: 1 });
    }
  }

  // The panel's open state changes no results, so it only rewrites the URL.
  #replace(change: Partial<ListQuery>): void {
    const data = this.data;
    if (!data) {
      return;
    }
    const query = { ...data.query, ...change };
    history.replaceState(null, '', listPath(query));
    this.replaceData({ ...data, query });
  }

  #change(change: Partial<ListQuery>): void {
    const query = { ...this.#query(), ...change };
    const path = listPath(query);
    if (location.pathname + location.search !== path) {
      history.pushState(null, '', path);
    }
    void this.#refresh(query);
  }

  async #delete(recipe: RecipeSummaryDto): Promise<void> {
    const l = t();
    const confirmed = await confirmAction({
      title: l.recipe.deleteTitle(recipe.title),
      message: l.recipe.deleteConfirmation,
      confirmLabel: l.delete,
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    try {
      await recipeFacade.delete(recipe.id);
    } catch (error) {
      toastError(error);
      return;
    }
    toast(l.recipe.deleteSuccessful, 'success');
    await this.#refresh(this.#query());
  }

  async #refresh(query: ListQuery): Promise<void> {
    const token = ++this.#requestToken;
    this.$('[data-testid="results"]')?.setAttribute('aria-busy', 'true');
    let data: RecipeListData;
    try {
      data = await this.#fetch(query);
    } catch (error) {
      toastError(error);
      return;
    } finally {
      if (token === this.#requestToken) {
        this.$('[data-testid="results"]')?.removeAttribute('aria-busy');
      }
    }
    if (token !== this.#requestToken) {
      return;
    }
    this.replaceData(data);
    this.#patch();
  }

  // Fills what depends on the data: the count, the order button, the tag panel and the results.
  #patch(): void {
    const data = this.data;
    if (!data) {
      return;
    }
    const l = t();
    const { query, recipes, tags } = data;
    const count = this.$('[data-testid="count"]');
    if (count) {
      count.textContent = l.recipe.count(recipes.total);
    }
    const order = this.$<HTMLButtonElement>('[data-testid="order"]');
    if (order) {
      order.textContent = query.order === 'asc' ? '↓' : '↑';
      order.setAttribute('aria-label', query.order === 'asc' ? l.orderBy.desc : l.orderBy.asc);
      order.title = order.getAttribute('aria-label') ?? '';
    }
    const sort = this.$<HTMLSelectElement>('select[name="sort"]');
    if (sort) {
      sort.value = query.sort;
    }
    const panel = this.$<CeTagPanelComponent>('ce-tag-panel');
    if (panel) {
      panel.state = { tags, selected: query.tags, open: query.tagsOpen };
    }
    const results = this.$('[data-testid="results"]');
    if (results) {
      results.innerHTML = String(this.#results(data));
      const cards = this.$$<CeRecipeCardComponent>('ce-recipe-card');
      cards.forEach((card, index) => {
        card.recipe = recipes.items[index];
      });
    }
  }

  #results({ query, recipes }: RecipeListData): RawHtml {
    const pages = pageCount(recipes.total, PAGE_SIZE);
    const pager = html`<ce-pagination page="${query.page}" pages="${pages}" data-testid="pagination"></ce-pagination>`;
    if (query.page > pages) {
      return pager;
    }
    if (recipes.items.length === 0) {
      return html`<p class="empty" role="status" data-testid="empty">${t().recipe.noRecipesFound}</p>`;
    }
    return html`
      <div class="grid-cards" data-testid="cards">
        ${recipes.items.map((recipe) => html`<ce-recipe-card data-testid="card-${recipe.id}"></ce-recipe-card>`)}
      </div>
      ${pages > 1 ? pager : ''}
    `;
  }

  override readyTemplate({ query }: RecipeListData): RawHtml {
    const l = t();
    return html`
      <div class="vstack gap-4">
        <div class="hstack justify-between gap-2">
          <hgroup>
            <h1>${l.recipes}</h1>
            <p class="text-light" data-testid="count"></p>
          </hgroup>
          <div class="hstack gap-2">
            <a class="button outline" href="/recipes/import" data-testid="import">${l.recipe.import.title}</a>
            <a class="button" href="/recipes/new" data-testid="new">+ ${l.recipe.newRecipe}</a>
          </div>
        </div>
        <div class="filters">
          <form class="search" data-action="search" role="search">
            <input
              type="search"
              name="search"
              value="${query.search}"
              placeholder="${l.search}"
              aria-label="${l.search}"
              maxlength="500"
              data-testid="search"
            />
          </form>
          <div class="sort hstack gap-2">
            <select name="sort" aria-label="${l.orderBy.title}" data-testid="sort">
              ${sortGroups(l).map(
                (group) =>
                  html`<optgroup label="${group.label}">
                    ${group.options.map(([key, label]) => html`<option value="${key}" ${key === query.sort ? 'selected' : ''}>${label}</option>`)}
                  </optgroup>`,
              )}
            </select>
            <button type="button" class="outline" data-action="order" data-testid="order"></button>
          </div>
        </div>
        <ce-tag-panel data-testid="tag-panel"></ce-tag-panel>
        <div class="results vstack gap-4" data-testid="results"></div>
      </div>
    `;
  }
}

await define('ce-recipe-list', CeRecipeListComponent, import.meta.url);
