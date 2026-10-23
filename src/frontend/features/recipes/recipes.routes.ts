import type { RouteDef } from '../../app/router.ts';

export const recipesRoutes: RouteDef[] = [
  {
    pattern: /^\/$/,
    keys: [],
    view: async () => {
      const { PrRecipeListComponent } = await import('./pr-recipe-list.component.ts');
      return new PrRecipeListComponent();
    },
    title: (l) => l.recipes,
    nav: { path: '/', label: (l) => l.recipes },
  },
  {
    pattern: /^\/recipes\/new\/?$/,
    keys: [],
    view: async () => {
      const { PrRecipeEditComponent } = await import('./pr-recipe-edit.component.ts');
      return new PrRecipeEditComponent();
    },
    title: (l) => l.recipe.newRecipe,
    parents: [{ path: '/', label: (l) => l.recipes }],
  },
  {
    pattern: /^\/recipes\/import\/?$/,
    keys: [],
    view: async () => {
      const { PrRecipeImportComponent } = await import('./pr-recipe-import.component.ts');
      return new PrRecipeImportComponent();
    },
    title: (l) => l.recipe.import.title,
    parents: [{ path: '/', label: (l) => l.recipes }],
  },
  {
    pattern: /^\/recipes\/(\d+)\/edit\/?$/,
    keys: ['id'],
    view: async ({ id }) => {
      const { PrRecipeEditComponent } = await import('./pr-recipe-edit.component.ts');
      const view = new PrRecipeEditComponent();
      view.setAttribute('recipe-id', id ?? '');
      return view;
    },
    title: (l) => l.edit,
    // The recipe's own crumb comes from the view, which knows its title.
    parents: [{ path: '/', label: (l) => l.recipes }],
  },
  {
    pattern: /^\/recipes\/(\d+)\/?$/,
    keys: ['id'],
    view: async ({ id }) => {
      const { PrRecipeDetailComponent } = await import('./pr-recipe-detail.component.ts');
      const view = new PrRecipeDetailComponent();
      view.setAttribute('recipe-id', id ?? '');
      return view;
    },
    title: (l) => l.recipe.recipe,
    parents: [{ path: '/', label: (l) => l.recipes }],
  },
];
