# Deployment

## Authentication

Prandium is open to anyone who reaches it until a password is set. To turn the login on:

1. Run `bun run hash-password` on any machine with the checkout. It prompts for the password (input hidden) and prints an argon2id
   hash.
2. Set that hash as `PRANDIUM_PASSWORD_HASH` in the server's environment and restart it. A value that is not an argon2 or bcrypt hash is
   refused at startup.
3. Serve Prandium over HTTPS through a reverse proxy: the session cookie `prandium_session` is `Secure`, so a browser sends it only over
   HTTPS (and to `localhost`).

The cookie is signed with the hash itself, so changing the password logs out every browser. `/api/health` reports `"auth": true` once the
login is on.
