import { AuthApi } from './internal/auth.api.ts';

export class AuthFacade {
  readonly #api: AuthApi;

  constructor(api: AuthApi) {
    this.#api = api;
  }

  enabled(): boolean {
    return this.#api.status().enabled;
  }

  login(password: string): Promise<void> {
    return this.#api.login(password);
  }

  logout(): Promise<void> {
    return this.#api.logout();
  }
}

export const authFacade = new AuthFacade(new AuthApi());
