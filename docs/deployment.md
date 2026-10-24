# Deployment

## Running a build

```sh
bun run build                 # dist/cena.js + dist/cena.js.map + dist/bun-version
scp dist/cena.js* server:/opt/cena/
bun run hash-password         # prompts twice, prints an argon2id hash
PORT=8000 CENA_DB=/var/lib/cena/cena.sqlite CENA_THUMBNAIL_DIR=/var/lib/cena/thumbnails \
  CENA_PASSWORD_HASH='<hash>' bun /opt/cena/cena.js
```

The target needs only Bun 1.4 or newer. The build carries the frontend and the migrations; migrations apply on start, and `CENA_DEV`
is ignored. The database file (`CENA_DB`) and the thumbnail directory (`CENA_THUMBNAIL_DIR`), and their parents, are created on
the first start; left unset, they land in `data/` under the working directory. An existing `data.db` of the old Prandium opens as it is:
its `PRAGMA user_version` is adopted into the migration ledger (see "Migrations" in `docs/backend.md`). A leftover `settings.json` beside
the database is ignored with a warning; its keys became `CENA_IMPORT_CONCURRENCY`, `CENA_USER_AGENT`, a fixed page size of 24, and
an always-on history entry for the first rating.

| Variable                  | Default                 | Meaning                                            |
| ------------------------- | ----------------------- | -------------------------------------------------- |
| `PORT`                    | `8000`                  | Port to listen on                                  |
| `HOST`                    | `127.0.0.1`             | Address to listen on                               |
| `CENA_DB`                 | `data/cena.db`          | The SQLite database file                           |
| `CENA_THUMBNAIL_DIR`      | `data/thumbnails`       | Holds the thumbnail images                         |
| `CENA_PASSWORD_HASH`      | unset (no login)        | Hash from `bun run hash-password`                  |
| `CENA_DEV`                | unset                   | `1` turns on hot reload (source checkout only)     |
| `CENA_IMPORT_CONCURRENCY` | the number of CPU cores | Recipes imported at once, 1 to the number of cores |
| `CENA_USER_AGENT`         | a Firefox 86 user agent | Sent when importing pages and images               |

An invalid value stops the start with a message naming the variable.

## Authentication

Cena is open to anyone who reaches it until a password is set. To turn the login on:

1. Run `bun run hash-password` on any machine with the checkout. It prompts for the password (input hidden) and prints an argon2id hash.
2. Set that hash as `CENA_PASSWORD_HASH` in the server's environment and restart it. A value that is not an argon2 or bcrypt hash is
   refused at startup.
3. Serve Cena over HTTPS through a reverse proxy: the session cookie `cena_session` is `Secure`, so a browser sends it only over
   HTTPS (and to `localhost`).

The cookie is signed with the hash itself, so changing the password logs out every browser. `/api/health` reports `"auth": true` once the
login is on. Thumbnails are behind the login like the API; they load with the same cookie.

### Reverse proxy

The HTTPS reverse proxy must connect over loopback and append the client's address to `X-Forwarded-For` (nginx:
`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`; Caddy does it on its own). The login throttle keys on the last entry, and
trusts the header only from `127.0.0.1` or `::1`; without it, every client shares one throttle. Cena sends its own
`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` and `Referrer-Policy`; the proxy adds `Strict-Transport-Security`.
A thumbnail upload is up to 10 MiB, so allow that body size (nginx: `client_max_body_size 11m;`).

Cena serves everything itself now, `/thumbnails/*` included. The old nginx `location` blocks for `/assets`, `/sw.js`, `/thumbnails` and
`/favicon.ico`, and its `auth_basic`, can go; a single `location / { proxy_pass http://127.0.0.1:8000/; }` remains.

The rest of this document covers this repository's own server.

## How a deploy works

Every push to `main` runs `.github/workflows/ci.yml`. The `check` job runs format, lint, typecheck, tests and the build on GitHub and
uploads `dist/` as the artifact `cena`. The `deploy` job runs on a self-hosted runner on the server (labels `self-hosted`,
`cena-prod`), which accepts no inbound connections, and pipes the build into `sudo -u cena cena-deploy <sha>`. The `deploy` job
is skipped unless the push changed something the build reads: `src/` other than `*.test.ts`, `package.json`, `bun.lock`, `bunfig.toml`,
`tsconfig.json` or `.bun-version`. A push whose previous head is unknown, such as a force push, always deploys. Pull requests get the
`check` job only. Actions are pinned to commit SHAs, and CI's Bun comes from `.bun-version`.

The runner's user, `cena-gh-runner`, may run only `/usr/local/bin/cena-deploy` as `cena` (`deploy/cena-gh-runner.sudoers`),
and nothing as root. Cena runs as a systemd user service of `cena` (`deploy/cena.service`), kept running by lingering.

`deploy/cena-deploy`:

1. unpacks the build into `/home/cena/app/releases/<sha>`
2. installs the Bun named in `bun-version` into `/home/cena/app/bun/<version>`, verified against the release's `SHASUMS256.txt`, and
   links it as the release's `bun`
3. stops the service and snapshots `/home/cena/data/cena.sqlite` with `VACUUM INTO` into `/home/cena/app/backups`; the
   thumbnails are not snapshotted
4. points `/home/cena/app/current` at the release and starts the service
5. rolls back release, Bun and database if `/api/health` does not answer `"auth":true` within 30 seconds
6. keeps five releases and ten snapshots

Each release runs on the Bun that built it, so upgrading Bun is just the pull request that bumps `.bun-version`. The paths, the database
and port 8000 are constants at the top of the script and must match `cena.env`.

## Server setup

Once, on the Fedora server, with the repository's `deploy/` directory copied over. The user exists from the old setup, where it is
still called `prandium`: with the old service stopped, first rename it with the `usermod` and `groupmod` line for `prandium` from
"Renaming from Prandium" below, which also moves its home to `/home/cena`. Its `data.db` and `thumbnails/` then move from
`/home/cena/.config/prandium` to `/home/cena/data`:

```sh
sudo dnf install -y curl unzip tar util-linux
# Only on a new server:
# sudo useradd --system --create-home --home-dir /home/cena --shell /sbin/nologin cena
sudo loginctl enable-linger cena
sudo -u cena mkdir -p /home/cena/app /home/cena/data /home/cena/.config/systemd/user
# Only when moving from the config dir:
# sudo -u cena mv /home/cena/.config/prandium/data.db /home/cena/data/cena.sqlite
# sudo -u cena mv /home/cena/.config/prandium/thumbnails /home/cena/data/thumbnails
sudo -u cena sh -c 'umask 077 && cat > /home/cena/app/cena.env' <<'EOF'
CENA_DB=/home/cena/data/cena.sqlite
CENA_THUMBNAIL_DIR=/home/cena/data/thumbnails
HOST=127.0.0.1
PORT=8000
CENA_PASSWORD_HASH='<hash>'
EOF
sudo install -o cena -g cena -m 0644 deploy/cena.service /home/cena/.config/systemd/user/cena.service
sudo systemctl --user -M cena@ daemon-reload
sudo systemctl --user -M cena@ enable cena
sudo install -m 0755 deploy/cena-deploy /usr/local/bin/cena-deploy
sudo install -m 0440 deploy/cena-gh-runner.sudoers /etc/sudoers.d/cena-gh-runner
```

Stop and disable the old system unit (`/lib/systemd/system/prandium.service`, which ran `out/server.js` from a checkout) before the first
deploy, so the two do not compete for port 8000. The first deploy creates the release and Bun and starts the service; on its first start,
Cena adopts the existing database's schema version and logs `adopted schema version 5 from PRAGMA user_version`. CI never updates
`deploy/cena.service` or `deploy/cena-deploy`: after changing one, rerun its `install` line, and for the unit also `daemon-reload`
and `restart cena`.

Then the runner, with a token from _Settings → Actions → Runners → New self-hosted runner_:

```sh
sudo useradd --system --create-home --home-dir /var/lib/cena-gh-runner --shell /sbin/nologin cena-gh-runner
sudo -u cena-gh-runner mkdir /var/lib/cena-gh-runner/actions-runner
cd /var/lib/cena-gh-runner/actions-runner
sudo -u cena-gh-runner sh -c 'curl -fsSL <runner tarball URL> | tar -xz'
sudo ./bin/installdependencies.sh
sudo -u cena-gh-runner ./config.sh --unattended --url https://github.com/dhardtke/cena --token <token> \
  --labels cena-prod --name "$(hostname)"
sudo ./svc.sh install cena-gh-runner && sudo ./svc.sh start
```

Finally, create the `production` environment (_Settings → Environments_) and restrict it to `main`.

### SELinux

If the runner service fails with `203/EXEC`, SELinux is blocking `runsvc.sh`:

```sh
sudo semanage fcontext -a -t bin_t '/var/lib/cena-gh-runner/actions-runner/runsvc\.sh'
sudo restorecon -v /var/lib/cena-gh-runner/actions-runner/runsvc.sh
```

The old setup labeled `/home/prandium/.config/prandium/thumbnails` `httpd_sys_content_t` for nginx and needed a policy module that let
the system unit execute Bun from the home directory and write those thumbnails. Cena now serves the thumbnails itself from a user
service, so neither label is needed; if the user service is denied executing `/home/cena/app/bun/*/bun` or writing `thumbnails/`, check
`/var/log/audit/audit.log` and label the Bun directory `bin_t` and the data dir `user_home_t`; `mv` keeps the old label, so relabel after
moving:

```sh
sudo semanage fcontext -a -t bin_t '/home/cena/app/bun(/.*)?'
sudo restorecon -Rv /home/cena/app/bun
sudo semanage fcontext -d '/home/prandium/.config/prandium/thumbnails(/.*)?' 2>/dev/null || true
sudo restorecon -Rv /home/cena/data
```

## Retiring the poller

The old deployment polled GitHub Actions (`dev/poll-gh-actions-for-deployment.py`, run by cron) for the latest run's `prandium` artifact,
on any branch. The new workflow uploaded an artifact of the same name, so **disable the poller's cron entry and remove its checkout before
pushing the workflow that adds the build and `deploy` steps**, or it would install the new build over the old layout. The poller was
removed from the repository together with `dev/`.

## Renaming from Prandium

Cena was called Prandium, and a server set up before the rename runs everything under the old names: the `prandium` and
`prandium-gh-runner` users, `prandium.env` with `PRANDIUM_*` variables, `prandium.sqlite`, `prandium-deploy` and the runner label
`prandium-prod`. **Move it over before pushing the rename**, or the `deploy` job waits for a `cena-prod` runner that does not exist. With
the new `deploy/` directory copied over:

```sh
# Stop everything running under the old names; usermod refuses a user with processes.
(cd /var/lib/prandium-gh-runner/actions-runner && sudo ./svc.sh stop && sudo ./svc.sh uninstall)
sudo systemctl --user -M prandium@ disable --now prandium
sudo loginctl disable-linger prandium
sudo loginctl terminate-user prandium

# Rename the users, their groups and their homes.
sudo usermod -l cena -d /home/cena -m prandium && sudo groupmod -n cena prandium
sudo usermod -l cena-gh-runner -d /var/lib/cena-gh-runner -m prandium-gh-runner && sudo groupmod -n cena-gh-runner prandium-gh-runner

# The release and Bun links are absolute, so point them into the new home.
sudo -u cena sh -c 'cd /home/cena/app && for l in current releases/*/bun; do
  ln -sfn "$(readlink "$l" | sed "s|^/home/prandium/|/home/cena/|")" "$l"; done'
# Releases built before the rename hold prandium.js and read PRANDIUM_*; keep them startable for a rollback.
sudo -u cena sh -c 'for r in /home/cena/app/releases/*/; do [ -e "$r/cena.js" ] || ln -s prandium.js "$r/cena.js"; done'

# Rename the database and the env file, and add a CENA_* copy of each PRANDIUM_* line, indented ones too. The grep skips the
# sed on a rerun, once the file has CENA_* lines; the last line warns if the login would come up off.
sudo -u cena mv /home/cena/data/prandium.sqlite /home/cena/data/cena.sqlite
sudo -u cena mv /home/cena/app/prandium.env /home/cena/app/cena.env
sudo -u cena grep -q '^[[:space:]]*CENA_' /home/cena/app/cena.env ||
  sudo -u cena sed -i -e 's|/home/prandium/|/home/cena/|g' -e 's/prandium\.sqlite/cena.sqlite/' \
    -e 's/^\([[:space:]]*\)PRANDIUM_\(.*\)$/\1CENA_\2\n&/' /home/cena/app/cena.env
sudo -u cena grep -q '^[[:space:]]*CENA_PASSWORD_HASH=' /home/cena/app/cena.env || echo 'cena.env lacks CENA_PASSWORD_HASH' >&2

# Swap the unit, the deploy script and the sudoers rule.
sudo rm /home/cena/.config/systemd/user/prandium.service /usr/local/bin/prandium-deploy /etc/sudoers.d/prandium-gh-runner
sudo install -o cena -g cena -m 0644 deploy/cena.service /home/cena/.config/systemd/user/cena.service
sudo install -m 0755 deploy/cena-deploy /usr/local/bin/cena-deploy
sudo install -m 0440 deploy/cena-gh-runner.sudoers /etc/sudoers.d/cena-gh-runner

# Start Cena (still the old release) and the runner again.
sudo loginctl enable-linger cena
sudo systemctl --user -M cena@ daemon-reload
sudo systemctl --user -M cena@ enable --now cena
curl -s http://127.0.0.1:8000/api/health
(cd /var/lib/cena-gh-runner/actions-runner && sudo ./svc.sh install cena-gh-runner && sudo ./svc.sh start)
```

If SELinux rules from "SELinux" above exist for the old paths, delete them with `semanage fcontext -d` and add them again for the new ones.
Then, on GitHub, give the runner the label `cena-prod` in place of `prandium-prod` (_Settings → Actions → Runners_), and rename the
repository to `cena`. The first deploy afterwards installs a `cena.js` release. Once five deploys have pruned every release built before
the rename, delete the `PRANDIUM_*` lines from `cena.env`.

The session cookie and the stored theme and language have new names too, so every browser is logged out once and falls back to the default
theme and language.

## Operating

```sh
sudo systemctl --user -M cena@ status cena
sudo journalctl _SYSTEMD_USER_UNIT=cena.service -f        # -p warning or -p err to filter
curl -s http://127.0.0.1:8000/api/health
```

The password hash lives in `/home/cena/app/cena.env` (mode `0600`). Keep it in single quotes, or systemd expands its `$` signs.
Without the file the service does not start. To change the password, replace the hash and restart the service; this logs every device out.
