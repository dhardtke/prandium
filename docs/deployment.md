# Deployment

## Running a build

```sh
bun run build                 # dist/prandium.js + dist/prandium.js.map + dist/bun-version
scp dist/prandium.js* server:/opt/prandium/
bun run hash-password         # prompts twice, prints an argon2id hash
PORT=8000 PRANDIUM_CONFIG_DIR=/var/lib/prandium PRANDIUM_PASSWORD_HASH='<hash>' bun /opt/prandium/prandium.js
```

The target needs only Bun 1.4 or newer. The build carries the frontend and the migrations; migrations apply on start, and `PRANDIUM_DEV`
is ignored. `PRANDIUM_CONFIG_DIR` holds `data.db` and `thumbnails/`, and both are created on the first start. An existing config dir of the
old Prandium opens as it is: its `PRAGMA user_version` is adopted into the migration ledger (see "Migrations" in `docs/backend.md`). A
leftover `settings.json` is ignored with a warning; its keys became `PRANDIUM_IMPORT_CONCURRENCY`, `PRANDIUM_USER_AGENT`, a fixed page size
of 24, and an always-on history entry for the first rating.

| Variable                      | Default                 | Meaning                                            |
| ----------------------------- | ----------------------- | -------------------------------------------------- |
| `PORT`                        | `8000`                  | Port to listen on                                  |
| `HOST`                        | `127.0.0.1`             | Address to listen on                               |
| `PRANDIUM_CONFIG_DIR`         | `~/.config/prandium`    | Holds `data.db` and `thumbnails/`                  |
| `PRANDIUM_PASSWORD_HASH`      | unset (no login)        | Hash from `bun run hash-password`                  |
| `PRANDIUM_DEV`                | unset                   | `1` turns on hot reload (source checkout only)     |
| `PRANDIUM_IMPORT_CONCURRENCY` | the number of CPU cores | Recipes imported at once, 1 to the number of cores |
| `PRANDIUM_USER_AGENT`         | a Firefox 86 user agent | Sent when importing pages and images               |

An invalid value stops the start with a message naming the variable.

## Authentication

Prandium is open to anyone who reaches it until a password is set. To turn the login on:

1. Run `bun run hash-password` on any machine with the checkout. It prompts for the password (input hidden) and prints an argon2id hash.
2. Set that hash as `PRANDIUM_PASSWORD_HASH` in the server's environment and restart it. A value that is not an argon2 or bcrypt hash is
   refused at startup.
3. Serve Prandium over HTTPS through a reverse proxy: the session cookie `prandium_session` is `Secure`, so a browser sends it only over
   HTTPS (and to `localhost`).

The cookie is signed with the hash itself, so changing the password logs out every browser. `/api/health` reports `"auth": true` once the
login is on. Thumbnails are behind the login like the API; they load with the same cookie.

### Reverse proxy

The HTTPS reverse proxy must connect over loopback and append the client's address to `X-Forwarded-For` (nginx:
`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`; Caddy does it on its own). The login throttle keys on the last entry, and
trusts the header only from `127.0.0.1` or `::1`; without it, every client shares one throttle. Prandium sends its own
`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` and `Referrer-Policy`; the proxy adds `Strict-Transport-Security`.
A thumbnail upload is up to 10 MiB, so allow that body size (nginx: `client_max_body_size 11m;`).

Prandium serves everything itself now, `/thumbnails/*` included. The old nginx `location` blocks for `/assets`, `/sw.js`, `/thumbnails` and
`/favicon.ico`, and its `auth_basic`, can go; a single `location / { proxy_pass http://127.0.0.1:8000/; }` remains.

The rest of this document covers this repository's own server.

## How a deploy works

Every push to `main` runs `.github/workflows/ci.yml`. The `check` job runs format, lint, typecheck, tests and the build on GitHub and
uploads `dist/` as the artifact `prandium`. The `deploy` job runs on a self-hosted runner on the server (labels `self-hosted`,
`prandium-prod`), which accepts no inbound connections, and pipes the build into `sudo -u prandium prandium-deploy <sha>`. The `deploy` job
is skipped unless the push changed something the build reads: `src/` other than `*.test.ts`, `package.json`, `bun.lock`, `bunfig.toml`,
`tsconfig.json` or `.bun-version`. A push whose previous head is unknown, such as a force push, always deploys. Pull requests get the
`check` job only. Actions are pinned to commit SHAs, and CI's Bun comes from `.bun-version`.

The runner's user, `gh-runner`, may run only `/usr/local/bin/prandium-deploy` as `prandium` (`deploy/gh-runner.sudoers`), and nothing as
root. Prandium runs as a systemd user service of `prandium` (`deploy/prandium.service`), kept running by lingering.

`deploy/prandium-deploy`:

1. unpacks the build into `/home/prandium/app/releases/<sha>`
2. installs the Bun named in `bun-version` into `/home/prandium/app/bun/<version>`, verified against the release's `SHASUMS256.txt`, and
   links it as the release's `bun`
3. stops the service and snapshots `data.db` with `VACUUM INTO` into `/home/prandium/app/backups`; the thumbnails stay in the config dir
   and are not snapshotted
4. points `/home/prandium/app/current` at the release and starts the service
5. rolls back release, Bun and database if `/api/health` does not answer `"auth":true` within 30 seconds
6. keeps five releases and ten snapshots

Each release runs on the Bun that built it, so upgrading Bun is just the pull request that bumps `.bun-version`. The paths, the config dir
and port 8000 are constants at the top of the script and must match `prandium.env`.

## Server setup

Once, on the Fedora server, with the repository's `deploy/` directory copied over. The `prandium` user and its
`/home/prandium/.config/prandium` with `data.db` and `thumbnails/` exist from the old setup and are kept:

```sh
sudo dnf install -y curl unzip tar util-linux
# Only on a new server:
# sudo useradd --system --create-home --home-dir /home/prandium --shell /sbin/nologin prandium
sudo loginctl enable-linger prandium
sudo -u prandium mkdir -p /home/prandium/app /home/prandium/.config/systemd/user
sudo -u prandium sh -c 'umask 077 && cat > /home/prandium/app/prandium.env' <<'EOF'
PRANDIUM_CONFIG_DIR=/home/prandium/.config/prandium
HOST=127.0.0.1
PORT=8000
PRANDIUM_PASSWORD_HASH='<hash>'
EOF
sudo install -o prandium -g prandium -m 0644 deploy/prandium.service /home/prandium/.config/systemd/user/prandium.service
sudo systemctl --user -M prandium@ daemon-reload
sudo systemctl --user -M prandium@ enable prandium
sudo install -m 0755 deploy/prandium-deploy /usr/local/bin/prandium-deploy
sudo install -m 0440 deploy/gh-runner.sudoers /etc/sudoers.d/gh-runner
```

Stop and disable the old system unit (`/lib/systemd/system/prandium.service`, which ran `out/server.js` from a checkout) before the first
deploy, so the two do not compete for port 8000. The first deploy creates the release and Bun and starts the service; on its first start,
Prandium adopts the existing database's schema version and logs `adopted schema version 5 from PRAGMA user_version`. CI never updates
`deploy/prandium.service` or `deploy/prandium-deploy`: after changing one, rerun its `install` line, and for the unit also `daemon-reload`
and `restart prandium`.

Then the runner, with a token from _Settings → Actions → Runners → New self-hosted runner_:

```sh
sudo useradd --system --create-home --home-dir /var/lib/gh-runner --shell /sbin/nologin gh-runner
sudo -u gh-runner mkdir /var/lib/gh-runner/actions-runner
cd /var/lib/gh-runner/actions-runner
sudo -u gh-runner sh -c 'curl -fsSL <runner tarball URL> | tar -xz'
sudo ./bin/installdependencies.sh
sudo -u gh-runner ./config.sh --unattended --url https://github.com/dhardtke/prandium --token <token> \
  --labels prandium-prod --name "$(hostname)"
sudo ./svc.sh install gh-runner && sudo ./svc.sh start
```

Finally, create the `production` environment (_Settings → Environments_) and restrict it to `main`.
Then turn deploys on: set the repository variable `DEPLOY_ENABLED` to `true` (_Settings → Secrets and variables → Actions →
Variables_). Until it is set, the `deploy` job is skipped, so a push without a runner does not leave a job queued.

### SELinux

If the runner service fails with `203/EXEC`, SELinux is blocking `runsvc.sh`:

```sh
sudo semanage fcontext -a -t bin_t '/var/lib/gh-runner/actions-runner/runsvc\.sh'
sudo restorecon -v /var/lib/gh-runner/actions-runner/runsvc.sh
```

The old setup labeled `PRANDIUM_CONFIG_DIR/thumbnails` `httpd_sys_content_t` for nginx and needed a policy module that let the system
unit execute Bun from the home directory and write those thumbnails. Prandium now serves the thumbnails itself from a user service, so
neither label is needed; if the user service is denied executing `/home/prandium/app/bun/*/bun` or writing `thumbnails/`, check
`/var/log/audit/audit.log` and label the Bun directory `bin_t` and the config dir `user_home_t`:

```sh
sudo semanage fcontext -a -t bin_t '/home/prandium/app/bun(/.*)?'
sudo restorecon -Rv /home/prandium/app/bun
sudo semanage fcontext -d '/home/prandium/.config/prandium/thumbnails(/.*)?' 2>/dev/null || true
sudo restorecon -Rv /home/prandium/.config/prandium
```

## Retiring the poller

The old deployment polled GitHub Actions (`dev/poll-gh-actions-for-deployment.py`, run by cron) for the latest run's `prandium` artifact,
on any branch. The new workflow uploads an artifact of the same name, so **disable the poller's cron entry and remove its checkout before
pushing the workflow that adds the build and `deploy` steps**, or it would install the new build over the old layout. The poller was
removed from the repository together with `dev/`.

## Operating

```sh
sudo systemctl --user -M prandium@ status prandium
sudo journalctl _SYSTEMD_USER_UNIT=prandium.service -f        # -p warning or -p err to filter
curl -s http://127.0.0.1:8000/api/health
```

The password hash lives in `/home/prandium/app/prandium.env` (mode `0600`). Keep it in single quotes, or systemd expands its `$` signs.
Without the file the service does not start. To change the password, replace the hash and restart the service; this logs every device out.
