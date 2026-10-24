# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
bun install              # deps (Oat + dev types/tooling)
bun start                # serve API + frontend on PORT (default 8000)
bun run start:dev        # same, with --watch and hot reload (CENA_DEV=1)
bun run seed             # empty the database and thumbnails/ and refill them with sample recipes
bun run migrate          # apply pending schema migrations, then exit
bun run hash-password    # prompt for a password, print its hash for CENA_PASSWORD_HASH
bun run screenshots      # retake the README's screenshots (needs Chrome or Edge, or CENA_BROWSER)
bun run build            # one-file deployment build: dist/cena.js (+ .map, + bun-version)
bun run build:ingredient-parser # regenerate the ingredient parser from its Peggy grammar
bun test --parallel      # the test suite against in-memory SQLite
bun test --parallel src/backend/features/recipes/recipe.routes.test.ts # one file
bun test --parallel -t "health" # one test / describe block by name
bun run typecheck        # typechecking (backend + frontend)
bun run lint             # linting
bun run fmt              # format (fmt:check for CI)
```

Configuration is environment variables only:

| Variable                  | Default                 | Meaning                           |
| ------------------------- | ----------------------- | --------------------------------- |
| `PORT`                    | `8000`                  | Port to listen on                 |
| `HOST`                    | `127.0.0.1`             | Address to listen on              |
| `CENA_DB`                 | `data/cena.db`          | The SQLite database file          |
| `CENA_THUMBNAIL_DIR`      | `data/thumbnails`       | Holds the thumbnail images        |
| `CENA_PASSWORD_HASH`      | unset (no login)        | Hash from `bun run hash-password` |
| `CENA_DEV`                | unset                   | `1` turns on hot reload           |
| `CENA_IMPORT_CONCURRENCY` | the number of CPU cores | Recipes imported at once          |
| `CENA_USER_AGENT`         | a Firefox 86 user agent | Sent when importing               |

Relative paths resolve against the working directory, so a checkout keeps its database and thumbnails in the git-ignored `data/`; both are
created on first run. `seed` empties what `CENA_DB` and `CENA_THUMBNAIL_DIR` name, so point them at scratch paths to keep `data/`.
`screenshots` uses a temp dir of its own. The tests use `:memory:` and temp dirs.

Always put plans inside the project directory.

Never edit existing plans or research docs in `docs/agents/` — only add new ones. Each describes the repository as it stood on the date
it carries, so an old path in one is a record, not a bug.

## Architecture

- `src/backend/` — Bun + SQLite REST backend, organized by feature (`features/<feature>/`), each behind a `<feature>.facade.ts`
- `src/frontend/` — no-build-step frontend of TypeScript ES modules and custom elements, organized by feature like the backend, in
  English and German
- `src/shared/` — types-only wire contract (DTOs, flavored ids and dates) both halves import
- `src/scripts/` — the `migrate`, `seed`, `build`, `build-ingredient-parser`, `hash-password` and `screenshots` entry points
- `deploy/` — the deploy script, the systemd user unit and the runner's sudoers rule

Tests sit beside the module they exercise. `bun run lint` enforces the import boundaries.

Details live in `docs/`:

- `docs/backend.md` — features, ports/internal, routes, the API, migrations, the data model, import, thumbnails, tests
- `docs/frontend.md` — features and facades, components, routing and the leave guard, i18n, import boundaries, theming, tests
- `docs/checklists.md` — what adding an endpoint, a migration, a component or a page touches
- `docs/coding-guidelines.md` — pinning, quote style, comments, American English, commits on `main`
- `docs/deployment.md` — running a build, the environment, authentication, the CI workflow, the self-hosted runner, server setup
- `docs/styling-guidelines.md` — Oat, no CSS in JavaScript, no font sizes

That list is the only index in the repository: a document added to `docs/` is added here in the same commit.
