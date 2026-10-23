import type { Server } from 'bun';
import type { ErrorDto } from '../../../../shared/dto/error.ts';
import { json, readJsonObject } from '../../../http/http.ts';
import type { AuthFacade } from '../auth.facade.ts';
import { translateToLoginRequestDto } from './auth.translator.ts';
import { clientAddress } from './client-address.ts';

export class AuthController {
  readonly #auth: AuthFacade;

  constructor(auth: AuthFacade) {
    this.#auth = auth;
  }

  async login(req: Request, server: Server<undefined>): Promise<Response> {
    const client = clientAddress(server.requestIP(req)?.address, req.headers.get('X-Forwarded-For'));
    const result = await this.#auth.login(translateToLoginRequestDto(await readJsonObject(req)), client);
    if (result.kind === 'locked') {
      const body: ErrorDto = { error: `Too many failed logins; try again in ${result.retryAfter} s` };
      return json(body, 429, { 'Retry-After': String(result.retryAfter) });
    }
    const headers = new Headers();
    if (result.cookie !== null) {
      headers.set('Set-Cookie', result.cookie);
    }
    return new Response(null, { status: 204, headers });
  }

  logout(): Response {
    return new Response(null, { status: 204, headers: { 'Set-Cookie': this.#auth.logoutCookie() } });
  }
}
