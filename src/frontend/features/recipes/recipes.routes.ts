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
];
