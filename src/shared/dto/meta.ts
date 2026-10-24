export interface HealthDto {
  status: 'ok';
  app: 'cena';
  /** Whether the API asks for a login, which is whether `CENA_PASSWORD_HASH` is set. */
  auth: boolean;
}
