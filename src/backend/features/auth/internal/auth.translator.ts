import type { LoginRequestDto } from '../../../../shared/dto/auth.ts';

export function translateToLoginRequestDto(body: Record<string, unknown>): LoginRequestDto {
  return {
    password: body.password as string,
  };
}
