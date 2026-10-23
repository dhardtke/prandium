export interface LoginRequestDto {
  password: string;
}

export interface AuthStatusDto {
  /** Whether the API asks for a login, which is whether `PRANDIUM_PASSWORD_HASH` is set. */
  enabled: boolean;
}
