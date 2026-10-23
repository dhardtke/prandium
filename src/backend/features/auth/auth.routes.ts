// Deliberately public: not wrapped by the auth guard.
import type { RouteTable } from '../../http/routing.ts';
import type { AuthFacade } from './auth.facade.ts';
import { AuthController } from './internal/auth.controller.ts';

export function authRoutes(auth: AuthFacade): RouteTable {
  const controller = new AuthController(auth);
  return {
    '/api/auth/login': {
      POST: (req, server) => controller.login(req, server),
    },

    '/api/auth/logout': {
      POST: () => controller.logout(),
    },
  };
}
