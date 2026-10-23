export interface HealthDto {
  status: 'ok';
  app: 'prandium';
  /** Whether the API asks for a login, which is whether `PRANDIUM_PASSWORD_HASH` is set. */
  auth: boolean;
}
