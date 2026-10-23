import type { RouteDef } from '../../app/router.ts';

export const authRoutes: RouteDef[] = [
  {
    pattern: /^\/login\/?$/,
    keys: [],
    view: async () => {
      const { PrLoginComponent } = await import('./pr-login.component.ts');
      return new PrLoginComponent();
    },
    title: (l) => l.login.title,
  },
];
