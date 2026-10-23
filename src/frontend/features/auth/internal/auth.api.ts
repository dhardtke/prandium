import type { AuthStatusDto, LoginRequestDto } from '../../../../shared/dto/auth.ts';
import { post } from '../../../http/http.ts';

export class AuthApi {
  /** Embedded by the server's `embedAuthStatus()`; without it, asking for a login is the safe guess. */
  status(): AuthStatusDto {
    const json = document.getElementById('auth-status')?.textContent ?? '';
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the server contract boundary
    return json === '' ? { enabled: true } : (JSON.parse(json) as AuthStatusDto);
  }

  async login(password: string): Promise<void> {
    const body: LoginRequestDto = { password };
    await post('/auth/login', body);
  }

  async logout(): Promise<void> {
    await post('/auth/logout');
  }
}
