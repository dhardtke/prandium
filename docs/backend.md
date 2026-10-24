# Backend (`src/backend/`)

The rules every change follows, then the domain rules and gotchas the code does not make obvious.

## Layout

Organized by feature, not by layer: `features/` holds `recipes/`, `tags/`, `thumbnails/`, `auth/`, `meta/`, `static/` and `dev/`.
Outside `features/` sits only what belongs to no feature:

- `config.ts` — `readConfig(env, { cpuCores, home })` reads `PORT`, `HOST` and the `CENA_*` variables into a `Config` or a list of
  errors; `loadConfig()` logs them and exits; `databasePath` (`CENA_DB`) and `thumbnailsDir` (`CENA_THUMBNAIL_DIR`) default to
  `data/cena.db` and `data/thumbnails` under the working directory
- `db/` — `db.ts` (connection, PRAGMAs, `clearDatabase`), `migrations.ts` and `migrations/`, and `sql.ts` with the table-agnostic helpers
  `buildUpdate`, `buildFilters`, `buildOrderBySql`, `placeholders`, `likePattern`, `isUniqueViolation`, `isForeignKeyViolation`
- `http/` — `routing.ts` (`RouteTable`, `ParamRequest`, `wrapHandlers`), `routes.ts` (the registry, no handler code), `http.ts` (request
  readers: `pathId`, `queryInt`, `optionalQueryInt`, `optionalQueryOneOf`, `optionalQueryString`, `queryIds`, `readJsonObject`,
  `readBytes`, `json()`, `noContent()`, `MAX_BODY_BYTES`), `errors.ts`, `access-log.ts`, `security-headers.ts`, `same-origin.ts`,
  `server.ts`
- `shared/` — `validate.ts` (field rules and length bounds, `stringList`, `dateTimeList`, `isIsoDateTime`, `validatePresent`), `log.ts`,
  `embedded.ts`
- `main.ts` — entry point; `testing.ts` — test hooks

There is no `fetch` fallback: every URL the server answers is a declared route. Operator scripts live in `src/scripts/`, not here.

### Inside a feature

- `<feature>.facade.ts` at the root — the only way another feature reaches it.
- `*.routes.ts` at the root, one per URL prefix: `/api/recipes/:id/thumbnail` is in `recipe.routes.ts`.
- `<feature>.fixtures.ts` at the root (test-only) when other tests need its data.
- `ports/` — public row types and constants other features may read (`RecipeRow`, `RECIPE_SORT_KEYS`). Never anything that builds DTOs.
- `internal/` — private: the repository with its `Create<Entity>`/`Edit<Entity>` inputs, `<entity>.translator.ts`, one
  `<x>.controller.ts` per route file, and anything else only this feature uses (the importer and the ingredient grammar under
  `recipes/internal/`, the file store under `thumbnails/internal/`).

No module may import another feature's `internal/`.

## A request's path

A route handler is one line passing the request to its controller. The controller reads the request, then runs
`body → translateTo<X>Dto → facade → row → translateTo<X>Dto → json()`. A facade write runs
`#validateCreate/#validateEdit → translateDtoTo<Create|Edit><Entity> → repository`. The body-to-DTO translation only casts; validation and
normalization happen in the facade before anything touches the database.

```
PATCH /api/recipes/12  {"rating":4.5}
  securityHeaders → accessLog → sameOriginWrites → auth.guard → recipe.routes.ts
  → RecipeController.update: pathId → readJsonObject → translateToEditRecipeDto
  → RecipesFacade.update: validatePresent(#rules) → translateDtoToEditRecipe → RecipeRepository.update (one transaction: row, history, tags)
  → RecipeDetails → translateToRecipeDto → json()
```

There is no composition root: each route factory takes `db` (and `config` where it needs it) and calls the facade factories it needs.
`allRoutes(db, config)` builds the one `AuthFacade` (it holds the login throttle) and wraps the data tables in `auth.guard()`.
`src/scripts/seed.ts` uses the same facades, so seeded data passes API validation.

### Translators

A controller answers with a DTO, never a row. DTOs live in `src/shared/dto/` (camelCase, type-only, shared with the frontend). Each
translator function names every field it maps — never spread a row. Ids and dates are flavored (`src/shared/flavors.ts`: `RecipeId`,
`TagId`, `Iso8601DateTime`).

Rows may come from the old app, so translators read them defensively: a NULL description or source becomes `''`, a NULL rating or time
`0`, unparseable `ingredients`/`instructions` JSON an empty list, and dates written by SQLite's `CURRENT_TIMESTAMP`
(`2024-03-12 10:00:00`, UTC) are answered as ISO 8601 (`translateToIsoDateTime`).

### Facades

Every data feature publishes a facade (`RecipesFacade`, `TagFacade`, `ThumbnailsFacade`); `static`, `dev` and `auth` publish one too. A
repository is named and constructed only by its own feature's facade. `RecipeRepository` receives the `TagFacade` in its constructor and
writes a recipe's tags through it, inside its own transaction (bun:sqlite turns the nested `db.transaction()` into a savepoint).

### What the linter holds

`.oxlintrc.json` `overrides`: a `*.controller.ts` may not import a `*.repository.ts` or anything under `ports/`; `ports/` may not import
`shared/dto`; `*.translator.ts` is exempt from `typescript/no-unsafe-type-assertion`; `recipes/internal/import/` may not import `http/`.

## Errors

Throw, don't answer: controllers, facades and repositories throw `HttpError` via `http/errors.ts` (`badRequest` 400, `unauthorized` 401,
`notFound` 404, `unsupportedMediaType` 415, …). The access log, the outermost wrapper but `securityHeaders()`, catches every throw,
answers `{ error }` and logs it. Bodies over `MAX_BODY_BYTES` (10 MiB, for a thumbnail) get 413 from Bun.

## Transactions

A write of more than one statement is one repository method inside `db.transaction()`: `RecipeRepository.create` (row, history,
reviews, tags), `update` (row, history, tags), `delete` (row, orphaned tags), `TagRepository.replaceForRecipe`. Controllers and route files
never open a transaction.

## Migrations

One numbered `.sql` file per change in `src/backend/db/migrations/`, applied by `openDatabase()` on every start, each in its own
transaction, recorded in `schema_migrations`. Foreign keys are off during the run and each migration must pass `PRAGMA foreign_key_check`.
To change the schema, add a file numbered above the current one; never edit an applied one. The runner refuses to start when files and
database disagree. A built file reads migrations from `EMBEDDED.migrations` instead of disk.

`001`–`005` hold the SQL of the old TypeScript migrations, which counted themselves in `PRAGMA user_version`. When `schema_migrations` is
missing and `user_version` is N > 0, versions 1..N are recorded as applied without running and `user_version` is reset to 0, in one
transaction (`onAdopt`, logged as `adopted schema version N`). Running them again would, among other things, divide every time by 60 a
second time.

## Tests

- End-to-end over HTTP. `useServer({ auth? })` from `src/backend/testing.ts` starts a server on port 0 with an in-memory database and a
  temp thumbnail directory per test, and returns `api`, `post`, `patch`, `put`, `del`, `logs`, `thumbnailsDir` and `db` (for rows
  the API cannot write, such as an old app's). Auth is off unless the file passes a password hash (and optionally a clock).
- Route tests live beside the routes file that declares the route. Fixtures (`createRecipe`) live in `<feature>.fixtures.ts` and take
  `post` first.
- Unit tests only where HTTP can't reach or would hide a failure (migration runner, config, importer, ingredient parser, SQL helpers,
  thumbnail store, validation). No repository unit tests.
- The import route test serves `recipes/internal/import/complex.html` and `thumbnails/1x1.png` from a local `Bun.serve`.
- The suite prints nothing: `useLogs()` captures log lines as `{ level, text }`.
- Child-process tests: `src/scripts/build.test.ts`, `src/backend/main.test.ts`, `src/scripts/hash-password.test.ts`,
  `src/scripts/build-bundle.test.ts`.

## Data model

`recipe ──< recipe_tag >── tag`, `recipe ──< recipe_history`, `recipe ──< recipe_review`, all `ON DELETE CASCADE`.

- `recipe`: `title`, `flagged` (0/1), `description`, `source`, `thumbnail` (a file name in `thumbnails/`), `yield`, eleven
  `nutrition_*` text columns, `prep_time` and `cook_time` in minutes, `aggregate_rating_value`/`_count` (the source site's), `rating` (own,
  0–5 in halves, 0 = unrated), `ingredients` and `instructions` (JSON arrays of strings, in the user's order), `created_at`, `updated_at`.
- `tag (title UNIQUE)`; `recipe_history (recipe_id, timestamp)` is the cooked history, its primary key keeps one entry per moment;
  `recipe_review (recipe_id, date, text)` comes from imports and is read-only.

### Rules

- Validation is lenient on purpose (`RecipesFacade` `LIMITS`): imports and old rows hold values a strict form would reject, and every
  recipe must save back unchanged. Minutes, yield and the foreign rating are numbers, not integers; a source is any string up to 2000
  characters (the detail page links it only when it parses as http(s)). A NULL yield is stored as 1, the scale it always had.
- A PATCH validates only the fields present (`validatePresent` over the same `#rules` a create runs); `history` and `tags` replace the
  stored lists, `nutrition` and `aggregateRating` are replaced whole.
- The first rating of an unrated recipe (0 → > 0) also adds "now" to the history.
- Tags: trimmed, blank ones dropped, merged ignoring case; an existing tag is reused whatever its case. A tag left without recipes, by an
  edit or a deletion, is deleted.
- `GET /api/tags?selected=…` counts, for every tag, the recipes that carry it and all selected tags; tags are never hidden, a count of 0
  disables them in the UI.
- Lists: `limit` 1–200 (default 24), `offset` 0–100000, `sort` one of `RECIPE_SORT_KEYS` (default `title`), `order` `asc`/`desc`, then by
  id so pages never overlap. `total_time` is `COALESCE(prep_time, 0) + COALESCE(cook_time, 0)`; `last_cooked_at` and `cooked_count` come
  from the history. SQLite sorts NULL first ascending.
- Ingredients are parsed on the server (`internal/ingredient/`, a Peggy grammar regenerated by `bun run build:ingredient-parser` into the
  committed `parser.js` and `parser.d.ts`) into `{ raw, quantity, unit, description }`, unscaled, in the stored order. Scaling and sorting
  for display are the frontend's.

### API

| Method + path                                                      | Answer                                                   |
| ------------------------------------------------------------------ | -------------------------------------------------------- |
| `GET /api/health`                                                  | `{ status, app: 'cena', auth }` (public)                 |
| `POST /api/auth/login`, `POST /api/auth/logout`                    | 204 with or clearing the cookie (public)                 |
| `GET /api/recipes?search&tag…&sort&order&limit&offset`             | `RecipePageDto`                                          |
| `POST /api/recipes`                                                | 201 `RecipeDto`                                          |
| `GET`, `PATCH`, `DELETE /api/recipes/:id`                          | `RecipeDto`, `RecipeDto`, 204                            |
| `PUT /api/recipes/:id/thumbnail` (raw `image/*` body)              | `RecipeDto`; 415 for another type, 400 for an empty body |
| `DELETE /api/recipes/:id/thumbnail`                                | `RecipeDto`                                              |
| `POST /api/recipes/import` `{ urls }` (1–50 http(s) URLs)          | `ImportResultDto`, one result per URL in order           |
| `GET /api/tags?selected…`                                          | `TagDto[]`                                               |
| `GET /thumbnails/*`                                                | the image, ETag/304, path-escape guard                   |
| `GET /recipe/:id/:slug[/edit]`, `/recipe/create`, `/recipe/import` | 301 to the new paths (public)                            |

## Thumbnails (`features/thumbnails/`)

Plain files in `CENA_THUMBNAIL_DIR`; the row stores the name. `ThumbnailStore` picks a free, path-safe name (`a.jpg`, `a-1.jpg`),
writes, downloads (with the configured user agent) and removes; `resolve()` refuses a name that leaves the directory. An upload is named
after the recipe's title and replaces the previous file. `/thumbnails/*` is behind the auth guard and answers with the API's locked-down
CSP, so an uploaded SVG cannot run scripts.

## Import (`recipes/internal/import/`)

`importRecipes(urls, { importConcurrency, userAgent })` fetches each page with at most `CENA_IMPORT_CONCURRENCY` at once, finds the
first schema.org `Recipe` in its JSON-LD (`SchemaParser`, skipping broken scripts, reading `@graph`s and multi-type objects) and maps it
(`mapSchemaRecipe`) into an `ImportedRecipe`, reading the untyped JSON through the helpers in `util.ts`. `RecipesFacade.import` then
downloads the image (a failure is a warning, the recipe is created without one) and creates each recipe through `create`, so tags are
synced and values validated like typed ones. The controller logs failures and warnings on topic `import`.

## Static files (`features/static/`)

- Serves `src/frontend/` with a path-escape guard, plus `VENDOR_FILES` in `internal/paths.ts`, an allowlist of single files from
  `node_modules` (`/vendor/oat.css`, `/vendor/oat.js`).
- `.ts` modules are transpiled per request (`internal/transpile.ts`). `StaticController` reads through the `WebFiles` interface:
  `DiskWebFiles` from source, `EmbeddedWebFiles` in a built file.
- Extension-less paths fall back to `index.html`; a directory without trailing slash is a 404.
- Every URL a page names is versioned `?v=<contentTag>` via an import map that `internal/page.ts` inserts; ETags and 304s are hand-rolled.
- HTML pages get a CSP from `internal/csp.ts` that hashes the page's inline scripts; `img-src` allows `blob:` for the upload preview.
- The page gets the auth status (`#auth-status` JSON) and, in dev, the hot-reload script injected at serve time, before hashing.

## Logging (`shared/log.ts`)

`log.info(topic, message, payload?)`, `log.warn(topic, message)`, `log.error(topic, message, err?, payload?)`. Topics: `http`, `auth`,
`server`, `db`, `static`, `dev`, `import`. Log only at the edges (`main.ts`, `http/`, auth, controllers, transpile/bundle, the dev hub) —
never in a repository or data facade. The access log logs every `/api` request and other routes from 500 up, with write bodies redacted
(`password` keys) and truncated, and an upload as `<n bytes image/png>`. Never log cookies, headers or passwords.

## Authentication (`features/auth/`)

- `CENA_PASSWORD_HASH` (from `bun run hash-password`) enables auth; unset means auth off. `readConfig()` refuses a value that isn't an
  argon2/bcrypt hash.
- The session cookie `cena_session=<expiresAt>.<hmac>` is signed with the password hash itself (no sessions table); changing the
  password logs out everywhere. It lives 90 days and slides at most once a day.
- `AuthFacade.guard(table)` wraps the recipe, tag and thumbnail routes in `allRoutes()`. Public: `/api/health`, `/api` 404s,
  login/logout, the legacy redirects, `/dev/ws`, the frontend.
- CSRF: `SameSite=Lax`, `sameOriginWrites()` (403 on cross-site `Sec-Fetch-Site`), `readJsonObject`'s 415 for non-JSON bodies, and
  `readBytes`'s 415 for a thumbnail that is no image.
- `internal/login-throttle.ts` backs off per client (`internal/client-address.ts`, trusting `X-Forwarded-For` only from loopback) and
  globally.

## Hot reload (`features/dev/`)

Only with `CENA_DEV=1` (`bun run start:dev`), never in a built file. `internal/hub.ts` watches the web root while a browser is
connected; `internal/changes.ts` maps a saved `.css` to a swap and `.ts`/`.html`/manifest/icons to a reload.

## Single-file build (`src/scripts/build.ts`)

`bun run build` writes `dist/cena.js` (+ map, + `bun-version`). `src/backend/shared/embedded.ts` is a committed stub (`EMBEDDED = null`
= read from disk); the build replaces it with the embedded web root and migrations. All frontend modules are bundled into `/main.ts` and all
stylesheets into `/main.css` plus `ui/inline-styles.ts`. The built server answers any other `.ts` with 404, and `index.html` is stamped with
the commit and build time.
