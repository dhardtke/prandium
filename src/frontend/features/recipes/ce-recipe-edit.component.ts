import type { CreateRecipeDto, NutritionDto, RecipeDto } from '../../../shared/dto/recipe.ts';
import type { RecipeId } from '../../../shared/flavors.ts';
import type { Language } from '../../i18n/language.ts';
import type { RawHtml } from '../../ui/html.ts';
import { navigate } from '../../app/router.ts';
import { define } from '../../ui/base.ts';
import { html } from '../../ui/html.ts';
import { t } from '../../ui/i18n.ts';
import { guardLeave } from '../../ui/leave-guard.ts';
import { toast, toastError } from '../../ui/toast.ts';
import { CeView } from '../../ui/view.ts';
import { tagFacade } from '../tags/tags.facade.ts';
import type { CeHistoryFieldComponent } from './internal/ce-history-field.component.ts';
import './internal/ce-history-field.component.ts';
import type { CeListFieldComponent } from './internal/ce-list-field.component.ts';
import './internal/ce-list-field.component.ts';
import { PLACEHOLDER_THUMBNAIL } from './internal/ce-recipe-card.component.ts';
import { recipeFacade } from './recipes.facade.ts';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const NUTRIENTS: readonly (keyof NutritionDto)[] = [
  'calories',
  'carbohydrate',
  'cholesterol',
  'fat',
  'fiber',
  'protein',
  'saturatedFat',
  'sodium',
  'sugar',
  'transFat',
  'unsaturatedFat',
];

interface EditData {
  recipe: RecipeDto | null;
  /** Every tag's title, offered while typing. */
  tagTitles: string[];
}

/** A tag Oat's taginput keeps whole: its `value` setter splits strings on commas, but not objects. */
interface TagValue {
  title: string;
  toString: () => string;
}

function tagValue(title: string): TagValue {
  return { title, toString: () => title };
}

function tagTitle(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  return typeof value === 'object' && value !== null && 'title' in value && typeof value.title === 'string' ? value.title.trim() : '';
}

function numberOrNull(value: string | undefined): number | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' || Number.isNaN(Number(trimmed)) ? null : Number(trimmed);
}

/** `/recipes/new` without a `recipe-id`, `/recipes/:id/edit` with one. */
export class CeRecipeEditComponent extends CeView<EditData> {
  #image: File | null = null;
  #removeImage = false;
  #preview: string | null = null;
  #snapshot = '';
  #savedId: RecipeId | null = null;
  #saving = false;
  #releaseGuard: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#releaseGuard = guardLeave(() => this.isDirty());
    this.root.addEventListener('change', (event) => {
      if (event.target instanceof HTMLInputElement && event.target.type === 'file') {
        this.#pick(event.target);
      }
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#releaseGuard?.();
    this.#releaseGuard = null;
    this.#revokePreview();
  }

  // A language change would re-render the form and lose what was typed.
  override languageChanged(): void {
    if (!this.isDirty()) {
      super.languageChanged();
    }
  }

  override async load(): Promise<EditData> {
    const id = this.hasAttribute('recipe-id') ? this.numericAttribute('recipe-id') : null;
    const [recipe, tags] = await Promise.all([id === null ? Promise.resolve(null) : recipeFacade.get(id), tagFacade.list()]);
    return { recipe, tagTitles: tags.map((tag) => tag.title) };
  }

  override titleFor({ recipe }: EditData): string {
    return recipe === null ? t().recipe.newRecipe : t().edit;
  }

  override parentsFor({ recipe }: EditData): { path: string; label: string }[] | null {
    return recipe === null
      ? null
      : [
          { path: '/', label: t().recipes },
          { path: `/recipes/${recipe.id}`, label: recipe.title },
        ];
  }

  isDirty(): boolean {
    const form = this.$<HTMLFormElement>('form');
    if (!form || this.#saving) {
      return false;
    }
    return this.#image !== null || this.#removeImage || JSON.stringify(this.#collect(form)) !== this.#snapshot;
  }

  override afterRender(): void {
    const data = this.data;
    const form = this.$<HTMLFormElement>('form');
    if (!data || !form) {
      return;
    }
    const { recipe } = data;
    const l = t();
    const ingredients = this.$<CeListFieldComponent>('[data-testid="ingredients"]');
    if (ingredients) {
      ingredients.itemLabel = l.recipe.form.ingredient;
      ingredients.value = recipe?.ingredients.map((ingredient) => ingredient.raw) ?? [];
    }
    const instructions = this.$<CeListFieldComponent>('[data-testid="instructions"]');
    if (instructions) {
      instructions.itemLabel = l.recipe.form.instruction;
      instructions.value = recipe?.instructions ?? [];
    }
    const history = this.$<CeHistoryFieldComponent>('[data-testid="history"]');
    if (history) {
      history.value = recipe?.history ?? [];
    }
    this.#setTags(recipe?.tags.map((tag) => tag.title) ?? []);
    this.#snapshot = JSON.stringify(this.#collect(form));
  }

  // Set once Oat defined the element: a property set before the upgrade would shadow its accessor.
  #setTags(titles: string[]): void {
    const input = this.$('ot-taginput');
    if (!input) {
      return;
    }
    const apply = (): void => {
      Reflect.set(input, 'value', titles.map(tagValue));
      const form = this.$<HTMLFormElement>('form');
      if (form) {
        this.#snapshot = JSON.stringify(this.#collect(form));
      }
    };
    if (customElements.get('ot-taginput')) {
      apply();
    } else {
      void customElements.whenDefined('ot-taginput').then(apply);
    }
  }

  #tags(): string[] {
    const input = this.$('ot-taginput');
    const value: unknown = input ? Reflect.get(input, 'value') : [];
    return Array.isArray(value) ? value.map(tagTitle).filter((title) => title !== '') : [];
  }

  #pick(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const l = t();
    if (!file.type.startsWith('image/')) {
      toast(l.recipe.form.imageError, 'error');
      input.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast(l.recipe.form.imageTooLarge, 'error');
      input.value = '';
      return;
    }
    this.#image = file;
    this.#removeImage = false;
    this.#revokePreview();
    this.#preview = URL.createObjectURL(file);
    this.#showPreview(this.#preview);
  }

  #revokePreview(): void {
    if (this.#preview !== null) {
      URL.revokeObjectURL(this.#preview);
      this.#preview = null;
    }
  }

  #showPreview(src: string | null): void {
    const image = this.$<HTMLImageElement>('[data-testid="preview"]');
    if (image) {
      image.src = src ?? PLACEHOLDER_THUMBNAIL;
    }
    this.$<HTMLButtonElement>('[data-testid="remove-thumbnail"]')?.toggleAttribute('disabled', src === null);
  }

  override handleAction(action: string): void {
    if (action === 'remove-thumbnail') {
      this.#image = null;
      this.#removeImage = (this.data?.recipe?.thumbnail ?? null) !== null;
      this.#revokePreview();
      const input = this.$<HTMLInputElement>('input[type="file"]');
      if (input) {
        input.value = '';
      }
      this.#showPreview(null);
    }
  }

  #collect(form: HTMLFormElement): CreateRecipeDto {
    const values = this.formData(form);
    const nutrition: Partial<NutritionDto> = {};
    for (const key of NUTRIENTS) {
      const value = values[`nutrition.${key}`] ?? '';
      nutrition[key] = value === '' ? null : value;
    }
    return {
      title: values.title ?? '',
      flagged: this.data?.recipe?.flagged ?? false,
      description: values.description ?? '',
      source: values.source ?? '',
      yield: numberOrNull(values.yield),
      nutrition,
      prepTime: numberOrNull(values.prepTime) ?? 0,
      cookTime: numberOrNull(values.cookTime) ?? 0,
      aggregateRating: { value: numberOrNull(values.aggregateRatingValue), count: numberOrNull(values.aggregateRatingCount) },
      rating: numberOrNull(values.rating) ?? 0,
      ingredients:
        this.$<CeListFieldComponent>('[data-testid="ingredients"]')
          ?.value.map((line) => line.trim())
          .filter((line) => line !== '') ?? [],
      instructions:
        this.$<CeListFieldComponent>('[data-testid="instructions"]')
          ?.value.map((line) => line.trim())
          .filter((line) => line !== '') ?? [],
      history: this.$<CeHistoryFieldComponent>('[data-testid="history"]')?.value ?? [],
      tags: this.#tags(),
    };
  }

  override async handleSubmit(action: string, form: HTMLFormElement): Promise<void> {
    if (action !== 'save' || this.#saving) {
      return;
    }
    const dto = this.#collect(form);
    const button = this.$('[data-testid="save"]');
    button?.setAttribute('aria-busy', 'true');
    this.#saving = true;
    let saved: RecipeDto;
    try {
      const id = this.data?.recipe?.id ?? this.#savedId;
      saved = id === null ? await recipeFacade.create(dto) : await recipeFacade.update(id, dto);
      // A retry after a failed upload must not create the recipe twice.
      this.#savedId = saved.id;
      if (this.#image !== null) {
        saved = await recipeFacade.putThumbnail(saved.id, this.#image);
      } else if (this.#removeImage && saved.thumbnail !== null) {
        saved = await recipeFacade.deleteThumbnail(saved.id);
      }
    } catch (error) {
      this.#saving = false;
      button?.removeAttribute('aria-busy');
      toastError(error);
      return;
    }
    this.#releaseGuard?.();
    this.#releaseGuard = null;
    toast(t().recipe.form.saved, 'success');
    navigate(`/recipes/${saved.id}`);
  }

  #nutritionFields(l: Language, nutrition: NutritionDto | undefined): RawHtml {
    return html`${NUTRIENTS.map(
      (key) =>
        html`<div class="field">
          <label for="nutrition-${key}">${l.recipe.nutrition[key]}</label>
          <input id="nutrition-${key}" name="nutrition.${key}" type="text" maxlength="200" value="${nutrition?.[key] ?? ''}" />
        </div>`,
    )}`;
  }

  override readyTemplate({ recipe, tagTitles }: EditData): RawHtml {
    const l = t();
    const f = l.recipe.form;
    const thumbnail = recipe?.thumbnail ?? null;
    return html`
      <form class="vstack gap-4" data-action="save" data-testid="form">
        <h1>${recipe === null ? l.recipe.newRecipe : recipe.title}</h1>
        <div class="columns">
          <section class="card vstack gap-3">
            <h2>${f.group.basic}</h2>
            <div class="field">
              <label for="title">${l.title} *</label>
              <input id="title" name="title" type="text" required maxlength="500" value="${recipe?.title ?? ''}" data-testid="title" />
            </div>
            <div class="field">
              <label for="description">${l.description}</label>
              <textarea id="description" name="description" rows="3" maxlength="50000" data-testid="description">${recipe?.description ?? ''}</textarea>
            </div>
            <div class="field">
              <label for="source">${f.sourceUrl}</label>
              <input id="source" name="source" type="text" inputmode="url" maxlength="2000" value="${recipe?.source ?? ''}" data-testid="source" />
            </div>
            <div class="field">
              <label for="yield">${l.recipe.yield}</label>
              <input id="yield" name="yield" type="number" min="1" max="99" step="any" value="${recipe?.yield ?? ''}" data-testid="yield" />
            </div>
            <div class="field">
              <label for="tags">${l.navigation.tags}</label>
              <ot-taginput data-testid="tags">
                <input id="tags" list="tag-options" placeholder="${f.tagsPlaceholder}" maxlength="200" autocomplete="off" />
              </ot-taginput>
              <datalist id="tag-options">${tagTitles.map((title) => html`<option value="${title}"></option>`)}</datalist>
            </div>
          </section>
          <section class="card vstack gap-3">
            <h2>${f.thumbnail}</h2>
            <img class="preview" src="${thumbnail ?? PLACEHOLDER_THUMBNAIL}" alt="" data-testid="preview" />
            <ot-upload>
              <input type="file" accept="image/*" hidden data-testid="file" />
              <small data-hint>${f.thumbnailHint}</small>
            </ot-upload>
            <div>
              <button type="button" class="outline" data-action="remove-thumbnail" data-testid="remove-thumbnail" ${thumbnail === null ? 'disabled' : ''}>
                ${f.removeThumbnail}
              </button>
            </div>
          </section>
        </div>
        <section class="card vstack gap-3">
          <h2>${f.group.nutrition}</h2>
          <div class="nutrition">${this.#nutritionFields(l, recipe?.nutrition)}</div>
        </section>
        <div class="columns">
          <section class="card vstack gap-3">
            <h2>${f.group.times}</h2>
            <div class="fields">
              <div class="field">
                <label for="prepTime">${l.recipe.prepTime}</label>
                <input id="prepTime" name="prepTime" type="number" min="0" max="1440" step="any" value="${recipe?.prepTime ?? ''}" data-testid="prepTime" />
              </div>
              <div class="field">
                <label for="cookTime">${l.recipe.cookTime}</label>
                <input id="cookTime" name="cookTime" type="number" min="0" max="1440" step="any" value="${recipe?.cookTime ?? ''}" data-testid="cookTime" />
              </div>
            </div>
            <small class="text-light">${f.timeHint}</small>
          </section>
          <section class="card vstack gap-3">
            <h2>${f.group.ratings}</h2>
            <div class="fields">
              <div class="field">
                <label for="aggregateRatingValue">${l.recipe.aggregateRatingValue}</label>
                <input
                  id="aggregateRatingValue"
                  name="aggregateRatingValue"
                  type="number"
                  min="0"
                  step="any"
                  value="${recipe?.aggregateRating.value ?? ''}"
                  data-testid="aggregateRatingValue"
                />
              </div>
              <div class="field">
                <label for="aggregateRatingCount">${l.recipe.aggregateRatingCount}</label>
                <input
                  id="aggregateRatingCount"
                  name="aggregateRatingCount"
                  type="number"
                  min="0"
                  step="any"
                  value="${recipe?.aggregateRating.count ?? ''}"
                  data-testid="aggregateRatingCount"
                />
              </div>
              <div class="field">
                <label for="rating">${l.recipe.rating}</label>
                <input id="rating" name="rating" type="number" min="0" max="5" step="0.5" value="${recipe?.rating ?? ''}" data-testid="rating" />
              </div>
            </div>
          </section>
        </div>
        <section class="card">
          <ce-history-field label="${l.recipe.history}" data-testid="history"></ce-history-field>
        </section>
        <section class="card">
          <ce-list-field label="${l.recipe.ingredients.title}" add-label="${f.createIngredient}" maxlength="5000" data-testid="ingredients"></ce-list-field>
        </section>
        <section class="card">
          <ce-list-field
            label="${l.recipe.instructions}"
            add-label="${f.createInstruction}"
            maxlength="50000"
            multiline
            data-testid="instructions"
          ></ce-list-field>
        </section>
        <div class="actions hstack gap-2">
          <a class="button outline" href="${recipe === null ? '/' : `/recipes/${recipe.id}`}" data-testid="cancel">${l.cancel}</a>
          <button type="submit" data-testid="save">${l.save}</button>
        </div>
      </form>
    `;
  }
}

await define('ce-recipe-edit', CeRecipeEditComponent, import.meta.url);
