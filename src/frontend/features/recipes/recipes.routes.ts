import type { RouteDef } from '../../app/router.ts';

export const recipesRoutes: RouteDef[] = [
  {
    pattern: /^\/$/,
    keys: [],
    view: async () => {
      const { CeRecipeListComponent } = await import('./ce-recipe-list.component.ts');
      return new CeRecipeListComponent();
    },
    title: (l) => l.recipes,
    nav: { path: '/', label: (l) => l.recipes },
  },
  {
    pattern: /^\/recipes\/new\/?$/,
    keys: [],
    view: async () => {
      const { CeRecipeEditComponent } = await import('./ce-recipe-edit.component.ts');
      return new CeRecipeEditComponent();
    },
    title: (l) => l.recipe.newRecipe,
    parents: [{ path: '/', label: (l) => l.recipes }],
  },
  {
    pattern: /^\/recipes\/import\/?$/,
    keys: [],
    view: async () => {
      const { CeRecipeImportComponent } = await import('./ce-recipe-import.component.ts');
      return new CeRecipeImportComponent();
    },
    title: (l) => l.recipe.import.title,
    parents: [{ path: '/', label: (l) => l.recipes }],
  },
  {
    pattern: /^\/recipes\/(\d+)\/edit\/?$/,
    keys: ['id'],
    view: async ({ id }) => {
      const { CeRecipeEditComponent } = await import('./ce-recipe-edit.component.ts');
      const view = new CeRecipeEditComponent();
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
      const { CeRecipeDetailComponent } = await import('./ce-recipe-detail.component.ts');
      const view = new CeRecipeDetailComponent();
      view.setAttribute('recipe-id', id ?? '');
      return view;
    },
    title: (l) => l.recipe.recipe,
    parents: [{ path: '/', label: (l) => l.recipes }],
  },
];
