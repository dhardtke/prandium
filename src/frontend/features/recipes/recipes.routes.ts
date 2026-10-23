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
