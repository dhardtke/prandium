import type { RouteDef } from '../../app/router.ts';

export const authRoutes: RouteDef[] = [
  {
    pattern: /^\/login\/?$/,
    keys: [],
    view: async () => {
      const { CeLoginComponent } = await import('./ce-login.component.ts');
      return new CeLoginComponent();
    },
    title: (l) => l.login.title,
  },
];
