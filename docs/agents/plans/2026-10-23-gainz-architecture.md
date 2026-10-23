---
date: 2026-10-23T21:28:32.916936+00:00
git_commit: ef3f5ec2bff4aa10b641bf2de74723ae4949db92
branch: chore/migrate-to-bun
topic: 'Restructure Prandium to the gainz architecture'
tags: [plan, architecture, backend, frontend, rest-api, custom-elements, oat, auth, build, ci, deploy, migrations, i18n]
status: ready
---

# PLAN: Restructure Prandium to the gainz architecture

Rebuild Prandium on the architecture of [dhardtke/gainz](https://github.com/dhardtke/gainz) (reference checkout: `/tmp/ref/gainz`, commit
`fd74e11`; read its `docs/backend.md`, `docs/frontend.md`, `docs/checklists.md`, `docs/coding-guidelines.md`, `docs/styling-guidelines.md` before
each phase): a Bun + SQLite backend that answers JSON REST endpoints, organized by feature, without dependency injection; a frontend of TypeScript
custom elements served from source (no asset build), styled with [Oat](https://oat.ink); a types-only wire contract in `src/shared/`. Prandium
adopts gainz in full — tooling and conventions, authentication, hot reload, security headers and CSP, same-origin write protection, access log,
PWA manifest, single-file build, seed and screenshot scripts, CI and self-hosted deployment — while keeping every user-facing Prandium feature and
adding tag editing.

Wherever this plan says "port from gainz `<path>`", copy that file, rename `gainz`/`Gainz`/`GAINZ`/`gz-`/`Gz` to
`prandium`/`Prandium`/`PRANDIUM`/`pr-`/`Pr`, and adapt only what Prandium's domain requires. Workout-, exercise-, weight- and stats-specific code
is never ported. The gainz docs are the specification for the infrastructure; this plan names the deviations.

## Acceptance Criteria

- No `@needle-di/core`, `preact`, `preact-render-to-string`, `classnames`, `sass`, `terser`, `bootstrap-icons`; no decorators, no JSX, no
  `assets/`, `src/tpl/`, `dev/`, `tests/`, `out/`.
- Source layout is `src/{backend,frontend,shared,scripts}` as in gainz; every test sits beside the module it exercises.
- The backend answers JSON under `/api/**`, images under `/thumbnails/*`, the frontend from `src/frontend/` (`.ts` transpiled per request), and
  301s from the legacy `/recipe/…` paths. Every URL is a declared route.
- The frontend is TypeScript custom elements (`PrElement`/`PrView`, open shadow roots, one `.css` per component) styled with Oat 1.0.0.
- Feature parity with the current UI:
  - list: title search, sort by every current key in both directions, tag filter (AND semantics, counts relative to the selection, fuzzy tag
    search, clear), pagination (24 per page), card menu (edit, delete), flagged highlight, recipe count, empty state;
  - detail: source link, foreign rating, flag/unflag, edit, delete, tags linking to the filtered list, nutrition, times, cooked history (relative
    dates), own half-star rating (the first rating adds a history entry), description, thumbnail, ingredients scaled by portions, instructions,
    reviews, screen wake lock;
  - create/edit: every current field, history entries, ingredients and instructions with reorder, thumbnail upload and removal;
  - import: a list of URLs, a results table linking to imported recipes;
  - English and German (including page titles, navigation and breadcrumbs), light and dark theme.
- New behavior: editable tags (orphaned tags are deleted), a leave guard on dirty forms, a confirmation dialog instead of the delete page, toasts
  instead of `?flash=`.
- Every recipe already in a database can be opened, edited and saved back unchanged (validation accepts legacy values).
- An existing database (`PRAGMA user_version = 5`) opens without re-running any migration; a fresh one is migrated by `001`–`005` `.sql` files
  recorded in `schema_migrations`.
- Configuration is env-only: `PORT` (8000), `HOST` (127.0.0.1), `PRANDIUM_CONFIG_DIR` (`~/.config/prandium`, holding `data.db` and
  `thumbnails/`), `PRANDIUM_PASSWORD_HASH`, `PRANDIUM_DEV`, `PRANDIUM_IMPORT_CONCURRENCY` (CPU cores), `PRANDIUM_USER_AGENT` (today's Firefox 86
  string from `src/data/settings.ts:5`). A leftover `settings.json` logs a warning naming what replaced each of its four keys.
- gainz parity: password auth (hash-password script, signed cookie, login throttle, login page, log out), security headers and hashed CSP,
  same-origin writes, access log, hot reload with `PRANDIUM_DEV=1`, manifest + icons, `bun run build` → `dist/prandium.js` (+ `.map`,
  `bun-version`) embedding the frontend and migrations, `bun run seed`, `bun run screenshots`, `bun run migrate`.
- `bun run fmt:check`, `bun run lint`, `bun run typecheck` and `bun test --parallel` pass, and the CI workflow is green, at the end of every phase.
- CI is gainz's `check` job plus the self-hosted `deploy` job; `README.md`, `AGENTS.md` (with `CLAUDE.md` linking to it) and
  `docs/{backend,frontend,checklists,coding-guidelines,styling-guidelines,deployment}.md` describe the new system.

## Technical Key Decisions and Tradeoffs

1. **Full gainz parity, not only the core architecture.**
   - Why: user choice.
   - Impact: gainz's infrastructure is entangled with auth and dev (`http/server.ts:3-4`, `features/meta`, `features/static`, `testing.ts`,
     `app/gz-header`, frontend `testing.ts` import them), so phase 1 ports the auth and dev features whole, with auth off unless
     `PRANDIUM_PASSWORD_HASH` is set and hot reload on only with `PRANDIUM_DEV=1`. Phase 6 then wraps the data routes in `auth.guard()`; phase 7
     ships the build, scripts, CI/deploy and docs.
2. **gainz layout with colocated tests.**
   - Why: gainz's lint boundaries, static-file rules and docs assume it.
   - Impact: the 30 test files under `tests/` are rewritten beside their modules; backend behavior is tested over HTTP (`useServer()`), components
     under happy-dom (`useDom()`). `useServer()` additionally creates a temp config dir (`useTempDir()`), passes a `Config` to `startServer`, and
     exposes `configDir` so thumbnail tests can place files; fixtures take `post`, as gainz's do.
3. **gainz conventions and tooling wholesale.**
   - Why: nearly every file is rewritten anyway.
   - Impact: 2-space indent, single quotes in TS and double in CSS (gainz `bunfig.toml`), `#` privates, no parameter properties, `override`,
     `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, type-aware oxlint with import boundaries, exact pins, Renovate, `.bun-version`,
     `bun check`; comments only for non-obvious "why". `.editorconfig` is deleted (gainz has none; it says 4 spaces).
4. **Client-side i18n (en, de).**
   - Why: no server rendering is left to carry the language.
   - Impact: `src/frontend/i18n/{en,de}.ts` keep today's `Language` shape; `ui/i18n.ts` holds the current language in `localStorage`
     (`prandium:language`), defaulting from `navigator.language`, falling back to `en`; switching emits `LANGUAGE_CHANGE_EVENT`, every `PrElement`
     re-renders, `pr-app` re-derives the tab title and breadcrumbs, `<html lang>` follows. `RouteDef.title`, `Crumb.label` and `nav.label` become
     `() => string` (e.g. `() => t().recipes`), the one deviation from gainz's `app/router.ts`. API error messages stay English and are shown as is.
5. **URLs.**
   - Why: clean paths without slugs; bookmarks keep working.
   - Impact: frontend routes `/`, `/recipes/new`, `/recipes/import`, `/recipes/:id`, `/recipes/:id/edit`, `/login`. Backend 301s:
     `/recipe/:id/:slug` → `/recipes/:id`, `/recipe/:id/:slug/edit` → `/recipes/:id/edit`, `/recipe/create` → `/recipes/new`, `/recipe/import` →
     `/recipes/import`. List state is in the query string (`search`, `tag` repeated, `sort`, `order`, `page`, `tags` = panel open) and changed
     with `history.pushState` without remounting; `parseListQuery` also reads the legacy names `title`, `tagId`, `orderBy`, `tagFilter`
     (`src/http/routers/index.router.ts:25-33`) and the next `pushState` rewrites them.
6. **JSON-only API; thumbnail is a raw-body sub-resource.**
   - Why: keeps `readJsonObject`'s 415 (part of the CSRF defense) universal.
   - Impact: `PUT /api/recipes/:id/thumbnail` takes `image/*` bytes (415 otherwise), `DELETE` removes it; `MAX_BODY_BYTES` is 10 MiB. The CSP's
     `img-src` gains `blob:` for the upload preview (gainz `features/static/internal/csp.ts:24` has `'self' data:`).
7. **Ingredients parsed on the server, scaled on the client.**
   - Why: the Peggy grammar stays backend-only and `src/shared/` stays type-only; portions change without a request.
   - Impact: the server parses unscaled and unrounded (`parseIngredients(raw[])`, today's `ingredient.parseMany` minus the yield/portions math
     at `src/data/parse/ingredient/mod.ts:24-38`) into `IngredientDto { raw, quantity, unit, description }`, sorted as today. All scaling and
     `roundUpToThreeDigits` live in the frontend's `features/recipes/internal/portions.ts`: `quantity × portions / yield`.
8. **Env-only configuration; `settings.json` retired.**
   - Why: user choice; one configuration mechanism.
   - Impact: `src/options.ts`, `src/data/settings.ts`, `--debug`, `--secure`, `--cert`, `--key`, `--help` disappear; the
     history-entry-on-first-rating rule is always on; page size is the frontend's `PAGE_SIZE = 24`; TLS is the reverse proxy's job. gainz's
     `DEFAULT_DB_PATH`/`GAINZ_DB` (`db/db.ts:42`) is not ported: every entry point (`main.ts`, `migrate.ts`, `seed.ts`, `screenshots.ts`, build
     tests) opens `<configDir>/data.db` from `readConfig()`.
9. **gainz migration runner with a one-time `user_version` adoption.**
   - Why: `.sql` files, a ledger, mismatch refusal and embedding; existing databases must open unchanged.
   - Impact: when `schema_migrations` is missing and `PRAGMA user_version` is N > 0 (read at `src/data/db.ts:114`, written at `:124`), versions
     1..N are recorded as applied without running and `user_version` is reset to 0; a test pins it.
10. **Tag editing; reviews stay read-only.**
    - Why: tags drive the list filter and mis-imported tags could not be fixed.
    - Impact: create/edit DTOs carry `tags: string[]`; the repository replaces `recipe_tag` rows, creates missing tags, and deletes tags left
      without recipes, all in one transaction (the import path uses the same code). Oat's `<ot-taginput>` splits string values on commas
      (`js/taginput.js`, `set value`), so the edit view hands it tag objects (`{ title, toString() }`), which it keeps whole; typing a comma
      still ends a tag.
11. **Lenient validation that accepts legacy data.**
    - Why: imports and old rows hold values a strict form would reject (e.g. `aggregate_rating_value` copied without `bestRating` normalization
      at `src/data/parse/import/import-recipe.ts:70`, a NUMERIC/nullable `yield`).
    - Impact: the facade rules below bound sizes generously and accept every value the old code could store; a PATCH validates only present
      fields (gainz `validatePresent`); a test round-trips legacy-shaped rows through GET → PATCH.
12. **Minimal icons.**
    - Why: user choice, like gainz.
    - Impact: text buttons; hand-written inline SVGs only for the theme toggle, the menu button, the card menu, the star rating and the flag;
      the app icon (`icon.svg`, `icon-maskable.svg`, PNGs) and `manifest.webmanifest` as in gainz; `assets/favicons/`, `sw.js`,
      `dev/build-icons.ts`, `dev/generate-favicons.js` are deleted.
13. **UI built from Oat.**
    - Why: Oat first (`docs/styling-guidelines.md`).
    - Impact: `.card`, `<ot-dropdown>`, `<dialog>` via `confirmAction()`, `toast()`, `<ot-taginput>` with a `<datalist>`, `<ot-upload>`,
      `<details>` accordions, `aria-busy` loading, `data-variant` buttons. Layouts are fixed by the mockups below.
14. **Delivery straight on `main`; no deployable artifact until phase 7.**
    - Why: user choice; the existing poller (`dev/poll-gh-actions-for-deployment.py:83`) deploys the latest completed run's `prandium` artifact
      from any branch, and its `conclusion=successful` filter is not a GitHub value.
    - Impact: phase 1 fast-forwards `main` to `chore/migrate-to-bun` and replaces `ci.yml` with gainz's `check` job minus the build and upload
      steps. Phase 7 asks the operator to disable the poller before it adds build, upload and `deploy`.
15. **`/thumbnails/*` is behind the auth guard**, like the data routes; images load with the same-origin session cookie.
16. **Sorting keeps today's keys behind an allowlist** (`RECIPE_SORT_KEYS`), with the broken `nutrition_saturatedFat` option
    (`src/tpl/templates/recipe/recipe-list.template.tsx:187`) fixed to `nutrition_saturated_fat`.
17. **Codecov, `.github/actions/setup`, `.github/changelog-config.json`, `.github/codecov.yml`, tag releases and the poller are removed**
    (gainz's pipeline has no coverage upload and deploys from `main`).
18. **The Peggy grammar stays**: `src/backend/features/recipes/internal/ingredient/parser.pegjs`, regenerated by `bun run build:ingredient-parser`
    (`src/scripts/build-ingredient-parser.ts`, `peggy --format es --dts`, no terser step) into committed `parser.js` + `parser.d.ts`; fmt and lint
    ignore `parser.js`, `bun check` reads `parser.d.ts`.
19. **Theme and language live in `localStorage`**; the old `PRANDIUM_DARK_MODE` and `PrandiumLanguage` cookies are ignored.
20. **Screenshots follow gainz**: PNGs in `docs/screenshots/<name>-<theme>.png` (plus `mobile-` variants), referenced by `README.md` through
    `<picture>`; `docs/readme-images/` is deleted.

## Current State

```
Browser ──GET /recipe/12/slug──▶ Bun.serve (src/http/webserver.ts)
                                  │ GLOBAL_MIDDLEWARE: cookies → pageGlobals → language → errorHandler
                                  ▼
            RouterRegistry (src/http/routers/router-registry.ts, needle-di container from src/di.ts)
            ├─ IndexRouter      GET  /                              → IndexController → RecipeListTemplate (Preact SSR)
            ├─ RecipeRouter     GET/POST /recipe/create|import|:id/:slug[/edit|delete|rate|flag]
            │                         → RecipeController → RecipeService / TagService → Database (bun:sqlite)
            ├─ AssetsRouter     GET  /assets/*, /sw.js               (assets/ + out/assets from dev/build.ts: sass, Bun.build)
            └─ ThumbnailsRouter GET  /thumbnails/*                   (<configDir>/thumbnails)
                                  ▼
            HTML; form POST → 302 with ?flash=…

assets/ts: TagFilter (Jaro-Winkler), rating POST, portions form resubmit, ArrayField, image picker, DarkModeSwitcher (cookie), wake lock
src/i18n: server-side en/de, module-global `l` swapped per request (src/http/middleware/language.ts)
src/data: Model classes (Recipe, Review, Tag), RecipeService/TagService (src/data/service), TS migrations + PRAGMA user_version,
          parse/ (schema-parser, import-recipe, duration, ingredient Peggy parser), util/ (sql filters, thumbnails, fetch, convert, constants)
src/main.ts: CLI flags (src/options.ts), settings.json (src/data/settings.ts), DB at <configDir>/data.db (src/data/util/build-db-path.ts:4)
tests/: 30 test files mirroring src/ (+ complex.html, 1x1.png); dev/: build, dev watcher, icons, favicons, example data, ingredient parser,
        deploy poller, ck_migration/ (one-off Python importer)
CI: lint | test (+Codecov) | build (uploads out/) | release on v* tags; README: logo assets/favicon.svg, Codecov badge, links to docs/setup.md
```

Schema (from `src/data/migrations/1-…5-*.ts`): `recipe` (title, flagged, description, source, thumbnail, yield, 11 `nutrition_*` text columns,
prep_time, cook_time in minutes, aggregate_rating_value, aggregate_rating_count, rating, ingredients JSON, instructions JSON, created_at,
updated_at), `tag` (title UNIQUE), `recipe_tag`, `recipe_history (recipe_id, timestamp)`, `recipe_review (recipe_id, date, text)`.

## Desired End State

```
src/
├── backend/
│   ├── main.ts                       readConfig → openDatabase(<configDir>/data.db) → startServer(db, config)
│   ├── config.ts                     readConfig(env): PORT, HOST, PRANDIUM_* (validated), settings.json warning
│   ├── testing.ts                    useServer() (+ temp config dir), useLogs(), useTempDir(), body(), …
│   ├── db/                           db.ts, migrations.ts (+ user_version adoption), migrations/001…005.sql, sql.ts
│   ├── http/                         routing.ts, routes.ts, http.ts, errors.ts, access-log.ts, security-headers.ts, same-origin.ts, server.ts
│   ├── shared/                       log.ts, validate.ts, embedded.ts
│   └── features/
│       ├── recipes/                  recipe.routes.ts (/api/recipes/**, legacy 301s), recipes.facade.ts, recipes.fixtures.ts,
│       │   ├── ports/recipe.ts       RecipeRow, RECIPE_SORT_KEYS
│       │   └── internal/             recipe.controller.ts, recipe.repository.ts, recipe.translator.ts,
│       │                             import/ (import-recipe, schema-parser, duration, util, fetch, convert, constants, pooled-map),
│       │                             ingredient/ (parser.pegjs, parser.js, parser.d.ts, ingredient.ts)
│       ├── tags/                     tag.routes.ts (/api/tags), tags.facade.ts, ports/tag.ts, internal/{tag.controller,tag.repository,tag.translator}.ts
│       ├── thumbnails/               thumbnail.routes.ts (/thumbnails/*), thumbnails.facade.ts, internal/{thumbnail.controller,thumbnail.store}.ts
│       └── auth/ meta/ static/ dev/  ported from gainz
├── frontend/
│   ├── index.html  main.ts  manifest.webmanifest  testing.ts  icons/  dev/hot.ts
│   ├── app/                          pr-app, pr-header, pr-breadcrumbs, pr-theme-toggle, pr-language-switch, router.ts, routes.ts, tab-title.ts
│   ├── http/                         http.ts, errors.ts
│   ├── i18n/                         en.ts, de.ts, language.ts (Language interface)
│   ├── ui/                           base.ts, view.ts, html.ts, styles.ts, theme.ts, i18n.ts, format.ts, toast.ts, modal.ts, confirm/, pagination/,
│   │                                 leave-guard.ts, app.css, shared.css, placeholder.svg, inline-styles.ts
│   └── features/
│       ├── recipes/                  recipes.routes.ts, recipes.facade.ts, recipes.fixtures.ts, pr-recipe-{list,detail,edit,import}.component.*,
│       │   └── internal/             recipe.api.ts, list-query.ts, portions.ts, jaro-winkler.ts, wake-lock.ts, pr-recipe-card, pr-tag-panel,
│       │                             pr-rating, pr-ingredients, pr-list-field, pr-history-field
│       ├── tags/                     tags.facade.ts, internal/tag.api.ts
│       └── auth/                     auth.routes.ts, auth.facade.ts, pr-login.component.*, internal/{auth.api.ts,next-path.ts}
├── shared/                           dto/{recipe,tag,auth,meta,error}.ts, flavors.ts  (type-only)
└── scripts/                          build.ts, build-bundle.probe.ts, migrate.ts, seed.ts, hash-password.ts, screenshots.ts, build-ingredient-parser.ts
deploy/                               prandium-deploy, prandium.service, gh-runner.sudoers
AGENTS.md, CLAUDE.md (symlink to AGENTS.md, as in gainz)
```

Request path (as in gainz `docs/backend.md`, "A request's path"):

```
PATCH /api/recipes/12  {"rating":4.5}
  securityHeaders → accessLog → sameOriginWrites → auth.guard → recipe.routes.ts
  → RecipeController.update: pathId → readJsonObject → translateToEditRecipeDto
  → RecipesFacade.update: #validateEdit → translateDtoToEditRecipe → RecipeRepository.update (one transaction: row, history, tags)
  → RecipeRow → translateToRecipeDto → json()
```

### REST API

| Method + path | Body / query | Answer | Phase |
|---|---|---|---|
| `GET /api/health` | – | `{ status: 'ok', app: 'prandium', auth: boolean }` (public) | 1 |
| `POST /api/auth/login`, `POST /api/auth/logout` | as gainz | as gainz (public) | 1 |
| `GET /api/recipes` | `search`, `tag` (repeated id), `sort` (∈ `RECIPE_SORT_KEYS`, default `title`), `order` (`asc`/`desc`), `limit` 1–200, `offset` 0–100000 | `RecipePageDto { items: RecipeSummaryDto[], total, limit, offset }` | 2 |
| `POST /api/recipes` | `CreateRecipeDto` | 201 `RecipeDto` | 2 |
| `GET /api/tags` | `selected` (repeated id) | `TagDto[] { id, title, recipeCount }` — counts among recipes carrying all selected tags | 2 |
| `GET /thumbnails/*` | – | the image, ETag/304, path-escape guard | 2 |
| `GET /api/recipes/:id` | – | `RecipeDto` | 3 |
| `PATCH /api/recipes/:id` | `EditRecipeDto` (any subset) | `RecipeDto` | 3 |
| `DELETE /api/recipes/:id` | – | 204, thumbnail file removed | 3 |
| `GET /recipe/:id/:slug[/edit]`, `/recipe/create`, `/recipe/import` | – | 301 (public) | 3 |
| `PUT /api/recipes/:id/thumbnail` | raw `image/*` body | `RecipeDto`; 415 for other types, 400 for empty | 4 |
| `DELETE /api/recipes/:id/thumbnail` | – | `RecipeDto` | 4 |
| `POST /api/recipes/import` | `{ urls: string[] }` (1–50 http(s) URLs) | `ImportResultDto { results: { url, recipe: { id, title } \| null, error: string \| null }[] }` | 5 |

`RecipeDto` (camelCase, flavored `RecipeId`, `TagId`, `Iso8601DateTime`): `id, title, flagged, description, source, thumbnail (URL or null), yield,
nutrition { calories, carbohydrate, cholesterol, fat, fiber, protein, saturatedFat, sodium, sugar, transFat, unsaturatedFat }, prepTime, cookTime,
totalTime, aggregateRating { value, count }, rating, ingredients: IngredientDto[], instructions: string[], history: Iso8601DateTime[] (newest
first), reviews: { date, text }[], tags: { id, title }[], createdAt, updatedAt`. `RecipeSummaryDto`: `id, title, flagged, description, thumbnail,
rating, aggregateRating, totalTime, cookedCount, lastCookedAt`. `CreateRecipeDto`/`EditRecipeDto` carry the editable fields with `ingredients`
and `instructions` as `string[]`, `history` as `Iso8601DateTime[]`, `tags` as `string[]`.

Facade rules (lenient by design, decision 11): title 1–500 chars; description ≤ 50 000; source empty or any string ≤ 2000 (the detail page links
it only when it parses as an http(s) URL); yield null or a number > 0 ≤ 10 000 (null is stored as 1, today's default in `Recipe`'s
constructor); nutrition values ≤ 200 chars each; prep/cook integers 0–10⁶; aggregate value 0–10⁶, count integer 0–10⁹, both nullable; rating
0–5; ≤ 1000 ingredients of ≤ 5000 chars; ≤ 1000 instructions of ≤ 50 000 chars; ≤ 10 000 history entries, each a real ISO date-time; ≤ 200 tags
of 1–200 chars, trimmed, empty ones dropped, deduplicated case-insensitively. The UI enforces the tighter form constraints of today (rating
step 0.5, yield 1–99, minutes ≤ 1440). A PATCH whose `rating` turns 0 into > 0 appends "now" to history (today's rule,
`src/controllers/recipe.controller.ts:107`).

### UI

Header (all pages):

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [icon] Prandium   Recipes                 [◐]  [Deutsch ▾]  [Log out]     │  pr-header; ≤560px: ☰ menu (popover)
└──────────────────────────────────────────────────────────────────────────┘  Log out only when auth is on
```

List (`/`):

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Recipes · 128 recipes                          [ Import ] [ + New recipe ]│
│ [ Search title…              ] [ Sort: Title       ▾ ] [↓]               │  search submits on Enter / debounce 300 ms
│ ▸ Tags (2 selected)                                         [ Clear ]    │  <details>; open state is ?tags
│   ┌───────────────────────────────────────────────────────────────────┐  │
│   │ [ Filter tags…   ]                                                │  │  Jaro-Winkler ≥ 0.75, selected never hidden
│   │ (Pasta 12) (Vegetarian 7)● (Quick 3)● (Soup 0 — disabled) …       │  │  aria-pressed buttons
│   └───────────────────────────────────────────────────────────────────┘  │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                             │
│ │ [thumb]  ⋯ │ │ [thumb]  ⋯ │ │ [thumb] ⚑⋯ │  ⋯ = ot-dropdown: Edit, Delete│
│ │ Carbonara  │ │ Minestrone │ │ Ramen      │  card = open-card link       │
│ │ Creamy …   │ │ Hearty …   │ │ Rich …     │  (2-line clamp)              │
│ │ Cooked 3 days ago         │ │ Not cooked yet                           │
│ │ 5× cooked · ★ 4.5 · 👥 4.2 · 35 min                                     │  text labels, no icon font
│ └────────────┘ └────────────┘ └────────────┘                             │
│                 « 1 2 [3] 4 5 »                                          │  pr-pagination, ?page=3
└──────────────────────────────────────────────────────────────────────────┘
Empty: "No recipes found." alert. Delete from the menu: confirmAction() → DELETE → reload list + toast.
```

Detail (`/recipes/:id`):

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Recipes › Spaghetti Carbonara                                            │
│ ⚑ Spaghetti Carbonara                         [Unflag] [Edit] [Delete]   │
│ example.com ↗ · Foreign rating ★★★★☆ 4.21 (312)                          │
│ (Pasta) (Italian) (Quick)                         ← links to /?tag=<id>   │
│ Creamy Roman classic…                                                     │
│ ┌──────────────┐ ┌───────────────────┐                                   │
│ │ [thumbnail]  │ │ Your rating       │  pr-rating: 10 half-star radios,  │
│ └──────────────┘ │ ☆☆☆☆☆  4.5        │  PATCH {rating}, patched in place │
│                  └───────────────────┘                                   │
│ ┌ Nutrition ─────┐ ┌ Times ───────┐ ┌ History ────┐                      │
│ │ Calories 540 … │ │ Prep 10 min  │ │ 3 days ago  │  title = full date   │
│ └────────────────┘ │ Cook 15 min  │ │ 2 weeks ago │                      │
│                    │ Total 25 min │ └─────────────┘                      │
│ ┌ Ingredients ──────────────────────── Portions [−] 4 [+] ┐              │  scaled locally, ?portions= via replaceState
│ │ 400 g   Spaghetti                                       │              │
│ │ 4       Egg yolks                                       │              │
│ │         Salt                                            │              │
│ └─────────────────────────────────────────────────────────┘              │
│ Instructions                                                             │
│ ▾ Step 1   Boil the pasta…                (<details open>)               │
│ Reviews                                                                  │
│ – "Great!"   12 Mar 2024                                                 │
└──────────────────────────────────────────────────────────────────────────┘
Delete: confirmAction() → DELETE → navigate('/') + toast. Wake lock held while connected and visible.
```

Edit (`/recipes/:id/edit`, `/recipes/new`):

```
Recipes › Carbonara › Edit
┌ Basic ───────────────────────┐ ┌ Thumbnail ──────────────────┐
│ Title *        [           ] │ │ [ preview image           ] │  ot-upload, accept="image/*";
│ Description    [           ] │ │ Drop an image or click      │  client rejects non-images and > 10 MiB
│ Source URL     [           ] │ │                  [Remove]   │
│ Yield          [ 4 ]         │ └─────────────────────────────┘
│ Tags  (Pasta ×)(Quick ×)[__] │  ot-taginput + <datalist> from GET /api/tags
└──────────────────────────────┘
┌ Nutrition ─ 11 inputs (3 per row ≤720px, 6 wide) ────────────────────────┐
┌ Times ─ Prep [min] · Cook [min] ┐ ┌ Ratings ─ Foreign value · count · Your rating ┐
┌ History ─ [date][time] [×] …                     [+ Add entry]           ┐  pr-history-field
┌ Ingredients ─ [text] [↑][↓][×] …                 [+ Add ingredient]      ┐  pr-list-field
┌ Instructions ─ [textarea] [↑][↓][×] …            [+ Add instruction]     ┐  pr-list-field multiline
                                                     [Cancel]  [Save]
Save: POST | PATCH (JSON) → PUT | DELETE thumbnail when changed → navigate('/recipes/12') + toast "Recipe saved"
400: toast with the message, form unchanged. Dirty form: in-app navigation asks via confirmAction(), tab close via beforeunload.
```

Import (`/recipes/import`):

```
Recipes › Import
URLs (one per line)  [ textarea, 10 rows                 ]
                     [ Import ]          (aria-busy while running)
┌ # ┬ Source URL                 ┬ Result ───────────────────────┐
│ 1 │ https://example.com/a ↗     │ ✓ [Open]                      │
│ 2 │ https://example.com/b ↗     │ ✗ No schema.org recipe found  │
└───┴─────────────────────────────┴───────────────────────────────┘
```

Login (`/login`): gainz's `gz-login` as `pr-login`, Prandium title and i18n.

## Abstractions and Code Reuse

Ported from gainz with renames only (each together with the gainz test beside it):

- `src/backend/http/{routing,routes,http,errors,access-log,security-headers,same-origin,server}.ts`
- `src/backend/db/{db,migrations,sql}.ts` (minus `DEFAULT_DB_PATH`), `src/backend/shared/{log,validate,embedded}.ts`, `src/backend/testing.ts`
- `src/backend/features/{auth,meta,static,dev}/**`, `src/scripts/{build,build-bundle.probe,migrate,hash-password,screenshots}.ts`
- `src/frontend/{index.html,main.ts,testing.ts,dev/hot.ts}`, `src/frontend/http/*`, `src/frontend/app/{router,tab-title}.ts` and
  `gz-{app,header,breadcrumbs,theme-toggle}` → `pr-*`, `src/frontend/ui/{base,view,html,styles,theme,toast,modal,inline-styles}.ts`,
  `ui/confirm/`, `ui/pagination/`, `ui/{app,shared}.css`, `src/frontend/features/auth/**`
- `.oxlintrc.json`, `bunfig.toml`, `tsconfig.json`, `.bun-version`, `renovate.json`, `.gitattributes`, `.github/workflows/ci.yml`, `deploy/*`,
  `docs/{checklists,coding-guidelines,styling-guidelines}.md`

Not ported: gainz `ui/format.ts` (kg/workout-specific; replaced by Prandium's), `ui/chart/`, `ui/tile/`, `ui/editable-row.ts`, every
`features/{exercises,workouts,stats,weight}` module.

Prandium code reused (moved, reformatted, de-classed):

- `src/data/parse/**`, `src/data/util/{fetch,convert,constants}.ts`, `src/shared/pooled-map.ts` → `src/backend/features/recipes/internal/import/`
  and `internal/ingredient/`; `importRecipes` returns `ImportedRecipe` objects instead of `Recipe` models and takes
  `{ importConcurrency, userAgent, thumbnails }` from the facade.
- `src/data/service/recipe.service.ts` SQL (`tagFilter`, `titleFilter`, synthetic columns, history/review loading) → `RecipeRepository`.
- `src/data/service/tag.service.ts` SQL (`_sameRecipeIds`, `recipeCountColumn`, `synchronizeRecipes`) → `TagRepository`.
- `src/data/util/sql.ts` (`buildFilters`, `buildOrderBySql`) → `src/backend/db/sql.ts` beside gainz's helpers.
- `src/data/util/thumbnails.ts` → `features/thumbnails/internal/thumbnail.store.ts` (`getUniqueFilename`, `downloadThumbnail`, plus `write`,
  `remove`, `resolve` with a path-escape guard).
- `src/i18n/{en,de,mod}.ts` → `src/frontend/i18n/{en,de,language}.ts` (strings reused; `meta.flag` HTML dropped; new keys added per phase).
- `src/tpl/util/format.ts` (`date.formatRelative`, `date.formatMinutes`, `number.format`) → `src/frontend/ui/format.ts`, locale from `ui/i18n.ts`.
- `assets/ts/_util/jaro-winkler.ts`, `assets/ts/page/recipe-detail-page/wake-lock.ts` → `src/frontend/features/recipes/internal/`.
- `src/data/pagination.ts`'s page window → replaced by gainz `ui/pagination/pagination.ts` (`pageItems`).
- `dev/insert-example-data.ts` data → `src/scripts/seed.ts`; `tests/data/parse/complex.html`, `tests/http/router/1x1.png` → beside their tests.

New abstractions:

- `src/shared/flavors.ts` — `RecipeId`, `TagId`, `Iso8601DateTime` (gainz pattern).
- `src/backend/config.ts` — `readConfig(env, { cpuCores, home })` → `Config` or `{ errors: string[] }`.
- `src/backend/http/http.ts` — `readBytes(req, { types, maxBytes })` beside `readJsonObject` for the thumbnail PUT; `queryIds(params, key)`.
- `src/frontend/ui/i18n.ts` — `t()`, `language()`, `setLanguage()`, `LANGUAGE_CHANGE_EVENT`; `PrElement` re-renders on it.
- `src/frontend/ui/leave-guard.ts` — `guardLeave(isDirty)` registering `beforeunload` and a `pr-app` navigation check.
- `features/recipes/internal/list-query.ts` — `parseListQuery(search)`, `listPath(query)` for `/` (like gainz `exercise-filter.ts`).

## Logging & Observability

gainz's logger and access log (`docs/backend.md`, "Logging"); topics `http`, `auth`, `server`, `db`, `static`, `dev`, plus `import`:

```
INFO  server  prandium is running on http://127.0.0.1:8000/
INFO  server  config dir: /home/prandium/.config/prandium
INFO  server  auth: off (PRANDIUM_PASSWORD_HASH is not set)
WARN  server  settings.json is ignored: importConcurrency → PRANDIUM_IMPORT_CONCURRENCY, userAgent → PRANDIUM_USER_AGENT, pageSize → fixed at 24, addHistoryEntryWhenRating → always on
INFO  db      adopted schema version 5 from PRAGMA user_version
INFO  http    POST /api/recipes/import 200 1843ms
WARN  import  https://example.com/b: No schema.org recipe found
ERROR http    PATCH /api/recipes/12 500 3ms  <stack>
```

The access log redacts `password` keys and truncates bodies; binary bodies are logged as `<n bytes image/jpeg>`.

## Implementation

### Phase 1: Foundation

Dependencies: None

Put `main` on the Bun migration, adopt gainz's tooling, replace the whole server and UI stack with gainz's infrastructure (auth off by default,
hot reload with `PRANDIUM_DEV=1`), and move the recipe data code into the new feature layout. At the end the server boots from env, migrates
(adopting old databases), serves the shell with header, theme toggle, language switch and a not-found view, and answers `/api/health`.

**Tasks**:

- [x] Fast-forward `main` to `chore/migrate-to-bun` (`git checkout main && git merge --ff-only chore/migrate-to-bun`) and work on `main` from here.
- [x] Delete the old tree first: `src/{main,options,di,logging,jsx.d}.ts`, `src/{controllers,http,tpl,i18n}/`, `src/shared/*.ts`,
      `src/data/{db,pagination,settings}.ts`, `src/data/{migrations,model,service}/`, `src/data/util/{build-db-path,sql}.ts` (their content is
      re-created below), `assets/` except `favicon.svg` and `placeholder.svg` (kept until moved below), `dev/` except
      `insert-example-data.ts` (kept until phase 7) and `poll-gh-actions-for-deployment.py` (kept until phase 7), including `dev/ck_migration/`,
      `tests/` except `tests/data/parse/complex.html` and `tests/http/router/1x1.png` (moved below), `out/`, `dist/`, `.parcel-cache/`,
      `.editorconfig`, `prandium.iml`, `assets/assets.iml`, `dev/dev.iml`, `.idea/runConfigurations/*`, `docs/development.md`, `docs/readme-images/`.
- [x] `.github/workflows/ci.yml`: gainz's `check` job (SHA-pinned actions, `bun-version-file: .bun-version`, install, fmt:check, lint,
      typecheck, `bun test --parallel`) without the `changes` step, the build step, the upload step and the `deploy` job; delete
      `.github/actions/setup`, `.github/changelog-config.json`, `.github/codecov.yml`.
- [x] Copy gainz `bunfig.toml`, `tsconfig.json`, `.bun-version`, `renovate.json`, `.gitattributes`; `bunfig.toml` `[fmt]` additionally ignores
      `src/backend/features/recipes/internal/ingredient/parser.js` and `**/*.html` fixtures under `src/backend/features/recipes/internal/import/`.
- [x] Copy gainz `.oxlintrc.json`; add `ignorePatterns` for `parser.js`; add an override that
      `src/backend/features/recipes/internal/import/**` may not import `**/http/**`.
- [x] `package.json`: gainz scripts (`start`, `start:dev` with `PRANDIUM_DEV=1 bun --watch`, `test`, `typecheck`, `lint`, `lint:fix`, `fmt`,
      `fmt:check`, `migrate`, `hash-password`) plus `build:ingredient-parser`; dependency `@knadh/oat@1.0.0`; devDependencies `@types/bun`,
      `happy-dom`, `oxlint`, `oxlint-tsgolint`, `typescript` at gainz's exact versions, `peggy` and `schema-dts` pinned to the installed versions;
      remove `@needle-di/core`, `classnames`, `preact`, `preact-render-to-string`, `bootstrap-icons`, `sass`, `terser`; `engines.bun` `1.4.4`;
      refresh `bun.lock`.
- [x] `.idea/prandium.iml` (from gainz's `.idea/gainz.iml`), `.idea/modules.xml` pointing at it, `.idea/runConfigurations/{fmt,fmt_check,lint,
      start,start_dev,test,typecheck}.xml` from gainz.
- [x] `src/shared/flavors.ts`, `src/shared/dto/{meta,error,auth}.ts` (gainz shapes, `app: 'prandium'`).
- [x] Port `src/backend/shared/{log,validate,embedded}.ts` and `src/backend/http/*`; `http/server.ts` takes `(db, config)` and listens on
      `config.host`/`config.port`; `MAX_BODY_BYTES = 10 * 1024 * 1024`; add `readBytes(req, { types, maxBytes })` and `queryIds(params, key)` to
      `http/http.ts`.
- [x] Port `src/backend/db/{db,migrations,sql}.ts` without `DEFAULT_DB_PATH`; append `buildFilters`/`buildOrderBySql` from the old
      `src/data/util/sql.ts` (recover from git) to `sql.ts`.
- [x] `src/backend/db/migrations.ts`: before applying, if `schema_migrations` is absent and `PRAGMA user_version` is N > 0, insert versions 1..N
      with their file names and reset `user_version` to 0 in one transaction; report it through a new `onAdopt(version)` option.
- [x] `src/backend/db/migrations/001-initial-schema.sql` … `005-remove-tag-description.sql` with the SQL of the old
      `src/data/migrations/1-…5-*.ts` (recover from git), byte-for-byte equivalent statements.
- [x] `src/backend/config.ts`: `readConfig(env, { cpuCores, home })` → `{ host, port, configDir, passwordHash, dev, importConcurrency,
      userAgent }` or `{ errors }`; defaults per Acceptance Criteria; `PRANDIUM_IMPORT_CONCURRENCY` integer 1..cpuCores; `PORT` integer 0–65535;
      `~` expanded; `passwordHash` checked with `isPasswordHash`.
- [x] Port `features/{auth,meta,static,dev}` (backend): `AuthOptions` from `config.passwordHash`, `COOKIE_NAME = 'prandium_session'`,
      `DevFacade.enabled()` reads `PRANDIUM_DEV`, static `VENDOR_FILES` for `/vendor/oat.css` and `/vendor/oat.js`, CSP `img-src 'self' data: blob:`.
- [x] `src/backend/http/routes.ts`: `allRoutes(db, config)` = gainz's composition with meta, auth, dev and static routes and an empty
      `auth.guard({})` that later phases fill.
- [x] Port `src/backend/testing.ts`: `useServer({ auth? })` creates a temp config dir with `thumbnails/`, builds a `Config`, starts on port 0,
      and also returns `configDir`.
- [x] `src/backend/main.ts`: gainz `main()` shape: `readConfig(process.env, …)` (log each error, exit 1), create `<configDir>` and
      `<configDir>/thumbnails`, warn on `settings.json`, `openDatabase(<configDir>/data.db, { onMigration, onAdopt })`, `startServer(db, config)`,
      banner lines as in "Logging & Observability", signal handling.
- [x] Port `src/scripts/{migrate,hash-password}.ts`; `migrate.ts` opens `<configDir>/data.db` from `readConfig`.
- [x] Move the recipe parsing code from git history into the new layout: `src/data/parse/{schema-parser,duration,util}.ts`,
      `src/data/parse/import/import-recipe.ts`, `src/data/util/{fetch,convert,constants}.ts`, `src/shared/pooled-map.ts` →
      `src/backend/features/recipes/internal/import/`; `src/data/parse/ingredient/{parser.pegjs,mod.ts}` →
      `internal/ingredient/{parser.pegjs,ingredient.ts}` with `parseIngredients(raw[])` unscaled and unrounded; `src/data/util/thumbnails.ts` →
      `features/thumbnails/internal/thumbnail.store.ts`; `import-recipe.ts` returns plain `ImportedRecipe` objects (`CreateRecipeDto` fields plus
      `reviews`, `thumbnailUrl`) instead of `Recipe`/`Review`/`Tag` models.
- [x] `src/scripts/build-ingredient-parser.ts` (from `dev/build-ingredient-parser.ts`, without terser, with `--dts`); run it and commit
      `parser.js` and `parser.d.ts`.
- [x] Frontend shell: port `index.html` (title "Prandium", `prandium:theme`, `prandium:language` pre-paint script sets `<html lang>`),
      `main.ts`, `testing.ts`, `http/`, `ui/{base,view,html,styles,theme,toast,modal,inline-styles}.ts`, `ui/confirm/`, `ui/pagination/`,
      `ui/{app,shared}.css`, `app/{router,routes,tab-title}.ts`, `pr-app`, `pr-header` (Recipes nav, Log out when auth is on), `pr-breadcrumbs`,
      `pr-theme-toggle`, `dev/hot.ts`, `features/auth/**` (`pr-login`, `/login` route); `GzElement`/`GzView` → `PrElement`/`PrView`, `gz:`
      events → `pr:`; `RouteDef` labels as `() => string` (decision 4).
- [x] `src/frontend/i18n/{language,en,de}.ts` from the old `src/i18n/*` (drop `meta.flag`; add `notFound`, `loading`, login strings,
      `languageNames`); `src/frontend/ui/i18n.ts`; `PrElement` re-renders on `LANGUAGE_CHANGE_EVENT`; `pr-app` updates title and crumbs;
      `src/frontend/ui/format.ts` with `formatRelative`, `formatMinutes`, `formatNumber`, `formatDate` from the old `src/tpl/util/format.ts`,
      locale from `language().meta.bcp47`.
- [x] `src/frontend/app/pr-language-switch.component.{ts,css}`: `<ot-dropdown>` listing English/Deutsch, calling `setLanguage()`.
- [x] `src/frontend/icons/{icon.svg,icon-maskable.svg,icon-192.png,icon-512.png,icon-maskable-512.png}` from `assets/favicon.svg`, rasterized as
      gainz `docs/frontend.md` "Installing" describes; `manifest.webmanifest` (name Prandium); `assets/placeholder.svg` →
      `src/frontend/ui/placeholder.svg`; then delete `assets/`.
- [x] `README.md`: logo → `src/frontend/icons/icon.svg`, drop the Codecov badge and the Preact/needle-di acknowledgements, replace the setup and
      development links with a short "Development" section (`bun install`, `bun run start:dev`, env table) until phase 7 rewrites the README;
      `docs/setup.md` stays until phase 7.
- [x] `.gitignore`: add `dist/`; remove `out/` entries.
- [x] Run `bun run fmt` once over the tree.
- [x] Tests: port the gainz tests of every ported module (`http/*.test.ts`, `db/*.test.ts`, `shared/*.test.ts`, `features/{auth,meta,static,dev}/**/*.test.ts`,
      frontend `{app,ui,http,features/auth}/**/*.test.ts`, `testing.test.ts`), adapted for Prandium names and without workout fixtures; port the
      old parser, duration, schema-parser, import, convert, thumbnails and pooled-map tests from git history beside their modules, with
      `complex.html` and `1x1.png` beside them; ingredient tests assert unscaled values.
- [x] New tests: `config.test.ts` (defaults, each variable, each invalid value, `~` expansion, bad hash); `migrations.test.ts` adoption case
      (DB built with `001`–`005`'s SQL and `user_version = 5` opens with no migration run, five ledger rows, data intact, `user_version = 0`, `onAdopt(5)`
      called) and fresh case (five ledger rows); `main.test.ts` (child process with env prints the banner; `settings.json` warning; invalid env
      exits 1); `ui/i18n.test.ts` (default from `navigator.language`, fallback, persistence, event, `<html lang>`); `pr-language-switch` and
      `pr-breadcrumbs` re-render in German; `static.routes.test.ts` asserts `blob:` in `img-src`.

**Automated Verification**:

- [x] `bun install --frozen-lockfile`, `bun run fmt:check`, `bun run lint`, `bun run typecheck` succeed.
- [x] `bun test --parallel` passes, including `src/backend/db/migrations.test.ts` (adoption) and `src/backend/config.test.ts`.
- [x] `src/backend/main.test.ts`: a `PORT=0` start answers `GET /api/health` with `{ status: 'ok', app: 'prandium', auth: false }` and `GET /` with
      `index.html` containing `<pr-app>`.
- [x] `src/backend/features/static/static.routes.test.ts`: `/vendor/oat.css` served; `/main.ts` transpiled; `/app/pr-app.component.css` served;
      a path escape is 404.
- [x] `git grep -nE "needle|preact|classnames|bootstrap-icons|@injectable|from 'sass'" -- src package.json bun.lock` returns nothing.
- [ ] The CI workflow is green on GitHub for the phase-1 push and uploads no artifact.

**Manual Verification**:

- [ ] `bun run start` serves http://127.0.0.1:8000 with the header; the theme toggle and the language switch work (tab title and nav follow);
      `/nope` shows the not-found view.
- [ ] Starting against a copy of a real `~/.config/prandium` logs "adopted schema version 5" once and nothing on the second start.

### Phase 2: Recipe list

Dependencies: Phase 1

Serve recipes (list and create), tags and thumbnails over the API and build the list page.

**Tasks**:

- [x] `src/shared/dto/recipe.ts`: `RecipeSummaryDto`, `RecipePageDto`, `RecipeSortKey`, `CreateRecipeDto`, `RecipeDto`, `IngredientDto`,
      `ReviewDto`; `src/shared/dto/tag.ts`: `TagDto`.
- [x] `features/recipes/ports/recipe.ts`: `RecipeRow`, `RecipeSummaryRow`, `RECIPE_SORT_KEYS` (`id, title, cooked_count, flagged,
      aggregate_rating_value, rating, created_at, updated_at, last_cooked_at, prep_time, cook_time, total_time` and the 11 `nutrition_*` columns).
- [x] `features/recipes/internal/recipe.repository.ts`: `list(filter, sort, limit, offset)` and `count(filter)` with the SQL of the old
      `RecipeService.list/count` (title `LIKE`, one tag `EXISTS` per id, synthetic `total_time`, `last_cooked_at`, `cooked_count`), ordered by the
      sort column then `id`; `create(input)` in one transaction (row, history, reviews, tags via `TagRepository.replaceForRecipe`); `find(id)`
      (row, tags, history and reviews newest first) for the create response.
- [x] `features/tags/`: `ports/tag.ts`, `internal/tag.repository.ts` (`list(selected)` with the old `_sameRecipeIds`/`recipeCountColumn` SQL,
      ordered by title; `replaceForRecipe(recipeId, titles)`: find or create by title, replace `recipe_tag`, delete tags without recipes),
      translator, controller, `tags.facade.ts`, `tag.routes.ts` (`/api/tags` GET).
- [x] `recipe.translator.ts` (`translateToRecipeSummaryDto`, `translateToRecipePageDto`, `translateToRecipeDto` with `parseIngredients`,
      `translateToCreateRecipeDto`, `translateDtoToCreateRecipe`; thumbnail file → `/thumbnails/<encodeURIComponent(file)>` or null),
      `recipes.facade.ts` (`createRecipesFacade(db, config)`; `list`, `count`, `create` with `#validateCreate` per "Facade rules"),
      `recipe.controller.ts` (`list`, `create`), `recipe.routes.ts` (`/api/recipes` GET, POST).
- [x] `features/thumbnails/`: `thumbnails.facade.ts` (`createThumbnailsFacade(config)`; `store(bytes, type, suggestedName)`, `remove(file)`,
      `download(url, userAgent)`), `internal/thumbnail.controller.ts` (serve with ETag/304, content type from extension, path-escape guard via
      `thumbnail.store.ts#resolve`), `thumbnail.routes.ts` (`/thumbnails/*` GET, HEAD).
- [x] Spread the recipe, tag and thumbnail route tables into `auth.guard()` in `http/routes.ts`.
- [x] `features/recipes/recipes.fixtures.ts` (backend): `createRecipe(post, overrides)`; `features/recipes/recipes.fixtures.ts` (frontend):
      `recipe()`, `summary()`, `tag()` builders.
- [x] Frontend: `features/recipes/internal/recipe.api.ts` (`list`), `features/tags/internal/tag.api.ts` (`list(selected)`), `recipes.facade.ts`,
      `tags.facade.ts`, `recipes.routes.ts` (`/` → `PrRecipeListComponent`, `nav` Recipes), `app/routes.ts`.
- [x] `features/recipes/internal/list-query.ts`: `parseListQuery(search)` → `{ search, tags, sort, order, page, tagsOpen }` (also reading
      `title`, `tagId`, `orderBy`, `tagFilter`), `listPath(query)` (defaults omitted).
- [x] `features/recipes/pr-recipe-list.component.{ts,css}` per the List mockup (`PAGE_SIZE = 24`; `pushState` + reload without remount on
      search/sort/order/tag/page changes; popstate re-reads the query); the card menu's Delete appears in phase 3, Edit and New/Import buttons
      link to routes that arrive in phases 4–5 (the not-found view meanwhile).
- [x] `features/recipes/internal/pr-recipe-card.component.{ts,css}` (open-card, thumbnail or `ui/placeholder.svg`, `<ot-dropdown>` menu,
      flagged style), `internal/pr-tag-panel.component.{ts,css}` (`<details>`, filter input with `jaro-winkler.ts`, `aria-pressed` toggles,
      disabled when count 0 and not selected, Clear).
- [x] i18n keys for the list in `en.ts`/`de.ts`.
- [x] Tests: `recipe.routes.test.ts` (POST minimal and full, validation 400s, legacy-shaped values accepted; list paging bounds and 400s, search,
      tag AND filter, every sort key in both orders, invalid sort 400, totals); `tag.routes.test.ts` (counts with and without selection, zero
      counts, orphan deletion through a second POST is covered in phase 4); `thumbnail.routes.test.ts` (200, 304, 404, escape 404, using
      `configDir` and `1x1.png`); `list-query.test.ts` (incl. legacy names); `jaro-winkler.test.ts`; component tests for `pr-recipe-list`,
      `pr-recipe-card`, `pr-tag-panel` (requests sent, `pushState` paths, disabled tags, fuzzy hiding keeps selected tags).

**Automated Verification**:

- [ ] `bun run fmt:check && bun run lint && bun run typecheck && bun test --parallel` pass; CI is green.
- [x] `src/backend/features/recipes/recipe.routes.test.ts` "lists by every sort key" passes for all `RECIPE_SORT_KEYS`.

**Manual Verification**:

- [ ] Against a copy of a real config dir: the list shows the same recipes, counts and order as the old app for title, rating and last-cooked
      sorting; tag filtering narrows counts; the tag filter input hides unrelated tags; pagination and the back button restore state; an old
      `/?tagId=3&orderBy=rating&order=DESC` link opens the matching list; the layout holds at 320px in both themes.

### Phase 3: Recipe detail

Dependencies: Phase 2

Show a recipe with everything it holds, rate and flag it in place, delete it, and redirect the old URLs.

**Tasks**:

- [ ] `src/shared/dto/recipe.ts`: `EditRecipeDto` with every editable field optional.
- [ ] `RecipeRepository`: `require(id)` (`find` or `notFound('Recipe')`), `update(id, edit, { addHistoryAt })` (only present fields; history
      and tags replaced when present), `delete(id)` returning the thumbnail file name.
- [ ] Facade: `require`, `update` (`#validateEdit` via `validatePresent`; a rating that turns 0 into > 0 appends now), `delete` (removes the row,
      then the file through `ThumbnailsFacade.remove`).
- [ ] Controller and routes: `/api/recipes/:id` GET, PATCH, DELETE; legacy 301 routes (`/recipe/:id/:slug`, `/recipe/:id/:slug/edit`,
      `/recipe/create`, `/recipe/import`; non-numeric id → 404) in `recipe.routes.ts`, exported separately and spread outside `auth.guard()`.
- [ ] Frontend: `recipe.api.ts` (`get`, `update`, `delete`), facade methods; route `/recipes/:id` (`parents`: Recipes).
- [ ] `features/recipes/pr-recipe-detail.component.{ts,css}` per the Detail mockup; Flag/Unflag and rating patch the DOM without re-render
      (`replaceData`); Delete through `confirmAction()` then `navigate('/')` and `toast`; source linked only when it parses as http(s).
- [ ] `internal/pr-rating.component.{ts,css}` (10 half-star radios, readonly mode for the foreign rating, emits `rating-change`),
      `internal/pr-ingredients.component.{ts,css}` (portions 1–99 defaulting to the yield, ± buttons, `replaceState` `?portions=`),
      `internal/portions.ts` (`scaleQuantity(quantity, yield, portions)`, `roundUpToThreeDigits`), `internal/wake-lock.ts` (acquire on connect,
      re-acquire on `visibilitychange`, release on disconnect).
- [ ] The list card's Delete menu item: `confirmAction()` → DELETE → reload + toast.
- [ ] i18n keys for the detail page.
- [ ] Tests: route tests (GET shape incl. unscaled parsed ingredients and their order, 404, PATCH flag, PATCH partial leaves other fields, first
      rating adds history once, legacy-shaped row round-trips GET → PATCH of the whole DTO, DELETE 204 removes the file, each legacy 301 and its
      404); `portions.test.ts` (numbers, ranges, rounding, null yield treated as 1); component tests for detail (every section, empty ones hidden,
      delete confirms then navigates), rating, ingredients (± bounds, URL), wake lock (fake `navigator.wakeLock`), card delete.

**Automated Verification**:

- [ ] `bun run fmt:check && bun run lint && bun run typecheck && bun test --parallel` pass; CI is green.

**Manual Verification**:

- [ ] A real recipe looks complete next to the old app (nutrition, times, history, reviews, tags); the half-star rating sticks after reload;
      portions scale instantly and match the old app's numbers; an old `/recipe/12/slug` bookmark lands on the new page; the screen stays on while
      the page is open on a phone.

### Phase 4: Create and edit

Dependencies: Phase 3

Create and edit recipes in the browser, including tags and the thumbnail, with a leave guard.

**Tasks**:

- [ ] Thumbnail endpoints: recipe controller `putThumbnail` (`readBytes(req, { types: ['image/'], maxBytes: MAX_BODY_BYTES })` →
      `ThumbnailsFacade.store`, update the row, remove the previous file) and `deleteThumbnail`; routes `/api/recipes/:id/thumbnail` PUT, DELETE.
- [ ] Access log: log binary bodies as `<n bytes type>`.
- [ ] Frontend: `http/http.ts` `putBlob(path, blob)`; `recipe.api.ts` (`create`, `putThumbnail`, `deleteThumbnail`); facade methods; routes
      `/recipes/new` (`parents`: Recipes) and `/recipes/:id/edit` (`parents`: Recipes, the recipe).
- [ ] `features/recipes/pr-recipe-edit.component.{ts,css}` per the Edit mockup: `<ot-taginput>` fed tag objects (decision 10) and a `<datalist>`
      from `tagFacade.list()`, `<ot-upload>` with a `URL.createObjectURL` preview and Remove; save sequence POST/PATCH then PUT/DELETE thumbnail.
- [ ] `internal/pr-list-field.component.{ts,css}` (add, remove, up, down; single-line or multiline), `internal/pr-history-field.component.{ts,css}`
      (date + time inputs ↔ ISO date-time in local time).
- [ ] `ui/leave-guard.ts` and the `pr-app` hook: before a route change ask registered guards; `confirmAction()` with "Discard changes?";
      `beforeunload` while dirty.
- [ ] i18n keys for the edit page.
- [ ] Tests: route tests (PATCH tags creates, reuses and deletes orphans; tags with commas survive; history replace; thumbnail PUT 415/400/200
      with the old file removed; DELETE thumbnail; access log shows `<n bytes image/png>`); component tests (form fills from a recipe, tags with
      commas stay whole, list-field reorder, save sends POST then PUT, 400 keeps values and toasts, leave guard asks only when dirty).

**Automated Verification**:

- [ ] `bun run fmt:check && bun run lint && bun run typecheck && bun test --parallel` pass; CI is green.

**Manual Verification**:

- [ ] Create a recipe with an image, tags, history, ingredients and instructions; edit it, reorder steps, replace and remove the image, rename a
      tag so the old one disappears from the tag panel; open and save an old imported recipe unchanged; leaving a dirty form asks first; the
      form fits 320px.

### Phase 5: Import

Dependencies: Phase 4

Import recipes from URLs through the API and the import page.

**Tasks**:

- [ ] DTOs `ImportRecipesDto { urls }`, `ImportResultDto`.
- [ ] `RecipesFacade.import(urls)`: validate 1–50 trimmed http(s) URLs (empty lines dropped); `importRecipes` with `config.importConcurrency`,
      `config.userAgent` and `ThumbnailsFacade.download`; create each success through `create` (tags synced); results in input order; failures
      carry the parser's message and are logged on topic `import`.
- [ ] Controller and route `POST /api/recipes/import`.
- [ ] Frontend: `recipe.api.ts#import`, facade, route `/recipes/import` (`parents`: Recipes), `pr-recipe-import.component.{ts,css}` per the
      Import mockup.
- [ ] i18n keys for the import page.
- [ ] Tests: route test with a local `Bun.serve` fixture server serving `complex.html` and `1x1.png` (success creates recipe, tags and thumbnail;
      a 404 page and a non-recipe page fail with messages; mixed input keeps order; validation 400s); component test (sends lines, renders the
      table, links to `/recipes/:id`).

**Automated Verification**:

- [ ] `bun run fmt:check && bun run lint && bun run typecheck && bun test --parallel` pass; CI is green.

**Manual Verification**:

- [ ] Importing two real recipe URLs creates both with thumbnails and tags, and the result links open them.

### Phase 6: Authentication end to end

Dependencies: Phase 5

Exercise the auth feature ported in phase 1 against every data route and finish the login experience.

**Tasks**:

- [ ] `http/routes.ts`: confirm recipe, tag and thumbnail routes sit inside `auth.guard()`, and meta, auth, legacy redirects, dev and static
      outside; static embeds `#auth-status`.
- [ ] `pr-login`: Prandium copy and German strings; `http.ts` 401 → `/login?next=…` reaches every recipe view (list, detail, edit, import).
- [ ] `docs/deployment.md` stub section "Authentication" (completed in phase 7): `bun run hash-password`, `PRANDIUM_PASSWORD_HASH`, HTTPS proxy
      for the `Secure` cookie.
- [ ] Tests: per guarded route family (`/api/recipes`, `/api/tags`, `/thumbnails/x.png`) 401 without the cookie and 200 with it; `/recipe/1/x`
      redirects and `/api/health` answers without it; each recipe view redirects to `/login?next=` on a 401 (component tests with `useFetch`).

**Automated Verification**:

- [ ] `bun run fmt:check && bun run lint && bun run typecheck && bun test --parallel` pass; CI is green.

**Manual Verification**:

- [ ] With a hash from `bun run hash-password`, the app asks for the password, a password manager fills it, wrong passwords back off, Log out
      returns to the login page, a deep link resumes after login, and thumbnails load after login.

### Phase 7: Ship — single-file build, scripts, CI/deploy, docs

Dependencies: Phase 6

Produce the deployable file, the seed and screenshot scripts, the deploy pipeline, and the documentation.

**Tasks**:

- [ ] Port `src/scripts/build.ts` (`dist/prandium.js`, stamp `<!-- prandium <commit>, built … -->`) and `src/scripts/build-bundle.probe.ts`
      (its tag list: `pr-app`, `pr-recipe-list`, `pr-recipe-detail`, `pr-recipe-edit`, `pr-recipe-import`, `pr-login`); `package.json` `build`;
      `.idea/runConfigurations/build.xml`.
- [ ] `src/scripts/seed.ts`: empty the DB and `thumbnails/`, then create about 30 sample recipes from the old `dev/insert-example-data.ts` data
      through `RecipesFacade.create` (tags, history, ratings, a few generated SVG thumbnails via `ThumbnailsFacade.store`); `package.json`
      `seed`; `.idea/runConfigurations/seed.xml`; delete `dev/insert-example-data.ts`.
- [ ] Port `src/scripts/screenshots.ts` against a seeded temp config dir, writing `docs/screenshots/{list,detail,edit}-{light,dark}.png` and
      `mobile-{list,detail}-{light,dark}.png`; `package.json` `screenshots`; run it.
- [ ] Ask the operator to disable the old poller's cron on the server before this phase is pushed (it would deploy the new `prandium`
      artifact); then delete `dev/poll-gh-actions-for-deployment.py` and `dev/`.
- [ ] `.github/workflows/ci.yml`: add gainz's `changes` step, build and upload steps (artifact `prandium`) and the `deploy` job (runner labels
      `[self-hosted, prandium-prod]`, `prandium-deploy`).
- [ ] `deploy/prandium-deploy`, `deploy/prandium.service` (`EnvironmentFile` with `PRANDIUM_CONFIG_DIR=/home/prandium/.config/prandium`,
      `HOST`, `PORT`, `PRANDIUM_PASSWORD_HASH`), `deploy/gh-runner.sudoers` from gainz; the snapshot keeps gainz's `VACUUM INTO` of `data.db`;
      thumbnails stay in the config dir and are not snapshotted; the health check reads `/api/health`.
- [ ] Docs: `AGENTS.md` (Prandium commands, env table, architecture, docs index) and `CLAUDE.md` as a symlink to it (as in gainz);
      `docs/backend.md` and `docs/frontend.md` written from gainz's with Prandium's features, data model, API table, ingredients/portions, i18n,
      tag sync, thumbnails, import, legacy redirects and lenient validation; `docs/checklists.md`, `docs/coding-guidelines.md`,
      `docs/styling-guidelines.md` from gainz with names adapted (commits on `main`); `docs/deployment.md` (running a build with env vars, reverse
      proxy/TLS, authentication, SELinux notes for `PRANDIUM_CONFIG_DIR/thumbnails` and the systemd unit from the old `docs/setup.md`, runner
      setup, how a deploy works, retiring the poller); `README.md` rewritten in gainz's shape (features, screenshots via `<picture>`, quick start,
      env table); delete `docs/setup.md`.
- [ ] Tests: port gainz `build.test.ts` (child env sets `PRANDIUM_CONFIG_DIR` to a temp dir), `build-bundle.test.ts`, `hash-password.test.ts`;
      `seed.test.ts` (runs against a temp config dir, list total > 0, thumbnails present); a docs test that every `docs/*.md` is listed in
      `AGENTS.md`.

**Automated Verification**:

- [ ] `bun run fmt:check && bun run lint && bun run typecheck && bun test --parallel` pass.
- [ ] `bun run build` writes `dist/prandium.js`, `.map` and `bun-version`; `src/scripts/build.test.ts` starts it with a temp
      `PRANDIUM_CONFIG_DIR` and gets `/api/health`, `/`, `/main.ts` (bundle) and `/vendor/oat.css`.
- [ ] The CI `check` job is green on GitHub for the phase-7 push.

**Manual Verification**:

- [ ] `bun run start:dev`: saving a `.css` restyles in place, saving a `.ts` reloads.
- [ ] On the server: install the self-hosted runner per `docs/deployment.md`, remove the poller's checkout, push to `main` and watch `deploy`
      roll out with the existing `~/.config/prandium` data and thumbnails; `/api/health` reports `auth: true`.
- [ ] The README screenshots show the new UI in both themes.

## Implementation Notes

During implementation, document user feedback, problems, and decisions here.

### Phase 1

- **Route labels take the dictionary** (`title: (l) => l.login.title`, `Label = (language: Language) => string` in `app/router.ts`)
  instead of `() => t().…` (decision 4): `.oxlintrc.json` forbids a `*.routes.ts` to import `ui/`, so route files only `import type`
  `Language`; `pr-app` and `pr-header` call them with `t()`.
- `PrElement.languageChanged()` re-renders by default; `pr-app` overrides it to re-derive the tab title, breadcrumbs and not-found text
  only, since re-rendering would rebuild the view. `useDom()` resets the language to English after each test.
- The guard tests in `auth.routes.test.ts` run against a stand-in guarded route (`/api/data`) on their own `Bun.serve`, with the same hash
  and clock, so the guard is covered before any data route exists. `http.test.ts`, `access-log.test.ts`, `same-origin.test.ts` and
  `security-headers.test.ts` exercise the login/logout and health routes instead of gainz's exercise routes.
- `importRecipes(urls, options)` returns `{ url, recipe, error }` with an `ImportedRecipe` carrying `thumbnailUrl`; it does not download
  the image — the facade will (phase 5), through `ThumbnailStore.download`. The importer reads schema.org JSON as `unknown` through typed
  helpers (`util.ts`), so `schema-dts` was dropped from `devDependencies`. An aggregate rating value is now read as a float ("4.21" was
  read as 4), a missing name falls back to the URL, and a non-2xx page is an error.
- `getUniqueFilename` numbers before the extension (`a-1.jpg`; the old code produced `a.jpg-1.jpg`) and makes names path-safe.
- gainz's date readers (`queryDate`, `pathDate`, `queryMonth`, `isIsoDate`, …) and the workout flavors were not ported.
- `parser.d.ts` is excluded from lint and fmt like `parser.js`; `dev/` (kept until phase 7) is excluded from both too.
- The pagination arrows are `←`/`→` with translated `aria-label`s; the `noun` attribute is gone ("Nothing on this page.").
- `tests/data/parse/complex.html` in git is a placeholder (`<!-- TODO write HTML -->`, the real page was removed as proprietary); the phase 5
  fixture server needs an HTML page written for the purpose.
- The settings.json warning is logged before the server starts, so it is printed even when startup is cut short.

### Phase 2

- Tags are written through `TagFacade.replaceForRecipe`, which `RecipeRepository` receives in its constructor: a feature may not import
  another's `internal/`, and the nested `db.transaction()` becomes a savepoint inside the recipe's transaction. An existing tag is reused
  ignoring case (`title = ? COLLATE NOCASE`, the exact spelling preferred), so "pasta" joins "Pasta".
- `total_time` is `COALESCE(prep_time, 0) + COALESCE(cook_time, 0)` (the old sum was NULL when either was); titles and tags sort binary,
  as before, then by id.
- Prep and cook minutes and the aggregate count are validated as numbers (not integers), like `yield`, because old rows and imports may
  hold fractions; `requiredNumber` rounds to two decimals.
- Dates read from the database are normalized to ISO 8601 by `translateToIsoDateTime` (`CURRENT_TIMESTAMP` wrote `2024-03-12 10:00:00`);
  new rows store `toISOString()`. `isIsoDateTime` refuses `2026-02-30`, which `Date.parse` rolls over.
- The list patches its results, count and tag panel after a change instead of re-rendering, so the search field keeps focus while typing;
  opening the tag panel only `replaceState`s `?tags`.
- `ui/placeholder.svg` is now a transparent plate-and-cutlery glyph over the card's muted background, so it suits both themes.
- The frontend copies `RECIPE_SORT_KEYS` into `list-query.ts`; `list-query.test.ts` compares it with the backend's.
- "CI is green" stays unchecked until the phases are pushed (pushing waits for the operator).

## References

- gainz: https://github.com/dhardtke/gainz (`/tmp/ref/gainz`, `fd74e11`), especially `docs/backend.md`, `docs/frontend.md`,
  `docs/checklists.md`, `docs/styling-guidelines.md`, `docs/deployment.md`, `docs/agents/research/2026-09-29-migrating-from-pico-to-oat.md`
- Oat 1.0.0: https://oat.ink, `@knadh/oat` (`js/taginput.js`, `js/upload.js`, `js/dropdown.js`, `css/*.css`)
- Previous plan: `docs/agents/plans/2026-10-23-migrate-deno-to-bun.md`
- Current code (all recoverable from `ef3f5ec` after phase 1 deletes it): `src/http/routers/{index,recipe}.router.ts`,
  `src/controllers/recipe.controller.ts`, `src/data/service/{recipe,tag}.service.ts`, `src/tpl/templates/recipe/*.tsx`, `assets/ts/**`,
  `src/i18n/*`, `src/data/migrations/*`, `src/data/settings.ts`, `dev/poll-gh-actions-for-deployment.py`
