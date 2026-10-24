import type { HealthDto } from '../../../../shared/dto/meta.ts';
import { errorResponse, notFound } from '../../../http/errors.ts';
import { json } from '../../../http/http.ts';
import type { AuthFacade } from '../../auth/auth.facade.ts';

export class MetaController {
  readonly #auth: AuthFacade;

  constructor(auth: AuthFacade) {
    this.#auth = auth;
  }

  health(): Response {
    const body: HealthDto = { status: 'ok', app: 'cena', auth: this.#auth.enabled() };
    return json(body);
  }

  endpointNotFound(): Response {
    return errorResponse(notFound('Endpoint'));
  }
}
