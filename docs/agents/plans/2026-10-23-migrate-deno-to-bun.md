---
date: 2026-10-23T20:23:31.987873+00:00
git_commit: c465fae99aad48e067c129eb78833bc13a3fe632
branch: main
topic: 'Migrate from Deno to Bun'
tags: [plan, runtime, bun, http, sqlite, tests, tooling, build, ci]
status: implemented
---

# PLAN: Migrate from Deno to Bun

Replace Deno as runtime, package manager, test runner, formatter, linter and bundler with Bun. Along the way, replace Oak with a small
in-house HTTP layer on top of `Bun.serve`, `deno.land/x/sqlite` with `bun:sqlite`, and all `jsr:@std/*` modules with Node built-ins / Bun APIs.

## Acceptance Criteria

- No Deno artefacts remain: `deno.json`, `deno.lock`, `deps.ts`, `deps-test.ts`, `Deno.*` calls, URL / `jsr:` / `npm:` specifier imports, `.idea/deno.xml`,
  `// deno-lint-ignore` comments.
- `bun install`, `bun run lint` (oxlint), `bun fmt --check`, `bun run typecheck`, `bun test` and `bun run build` succeed locally and in CI.
- `bun test --coverage` produces an lcov file that is uploaded to Codecov.
- The app runs via `bun src/main.ts` (dev) and `bun out/server.js` (release) with the same CLI flags (`--help`, `--host`, `--port`, `--configDir`, `--debug`,
  `--secure`/`--cert`/`--key`) and the same behaviour: all pages, recipe import, thumbnails, dark mode, language switch, 404/500 pages.
- An existing SQLite database created by the Deno version opens and migrates unchanged.
- Startup refuses Bun versions outside `>=1.4.4` with a clear error.
- `docs/setup.md`, `docs/development.md` and `README.md` describe Bun only.

## Technical Key Decisions and Tradeoffs

1. **HTTP: plain `Bun.serve`, no framework.**
   - Why: user preference for zero HTTP dependencies.
   - Impact: a small in-house layer in `src/http/` (middleware composition, route registration, static file serving, HTML/redirect response helpers).
     Every route handler is wrapped by the middleware pipeline because `Bun.serve` `routes` bypass `fetch`. Tests call handlers with `new Request(...)` and
     assert on `Response`.
2. **SQLite: `bun:sqlite` behind the existing `Database` class.**
   - Why: built into Bun, API maps 1:1.
   - Impact: only `src/data/db.ts` changes; callers and migrations are untouched. `PRAGMA user_version` keeps working, so existing DBs migrate unchanged.
3. **Tests: native `bun:test`.**
   - Why: no Deno-flavoured assertion dependency; built-in mocking and lcov coverage.
   - Impact: all 20 test files (plus helpers in `tests/_internal/`) rewritten (`Deno.test`/`t.step` → `describe`/`test`, `assert*` → `expect`,
     `stub`/`spy` → `spyOn`/`mock`). `deps-test.ts`, `dev/generate-coverage-report.ts` and the `coverage*` tasks are removed.
     Deno ran each file in an isolated worker (`--parallel`); Bun runs all files in one process, so global state (logger setup, `setLanguage`, `Page`
     statics, the DI `container`) must be reset in `beforeEach`/`afterEach` where tests touch it.
4. **Formatting: `bun fmt` (Bun ≥ 1.4.4); linting: oxlint.**
   - Why: user choice; `bun fmt` accepts Prettier option names in `bunfig.toml` `[fmt]`, oxlint covers all current `deno lint` rules.
   - Impact: Bun ≥ 1.4.4 required everywhere (local Bun is 1.4.3 → upgrade with `bun upgrade`). One-time reformat of the code base.
5. **Std library: Node built-ins and Bun APIs only.**
   - Why: avoid a Deno-centric dependency chain via JSR.
   - Impact: `node:path`, `node:fs`/`node:fs/promises`, `node:util` (`parseArgs`, `styleText`), `Bun.semver`, a `pooledMap` helper and a small logger with
     the same call-site API as `@std/log`. `sprintf` is unused and dropped.
6. **Remaining dependencies from npm, pinned to current majors.**
   - Why: Bun cannot import URLs; major upgrades are out of scope.
   - Impact: `preact@10.24.x`, `preact-render-to-string@6.5.x`, `@needle-di/core`, `classnames`, `schema-dts`; `jsxImportSource: "preact"`.
     `bootstrap-icons` moves from `assets/package.json` into the root `package.json` (single install); `assets/package*.json` are deleted.
7. **Build: `Bun.build` everywhere.**
   - Why: one tool instead of esbuild + deno loader + esbuild CLI + lightningcss + string patching.
   - Impact: `dev/build.ts` bundles client JS (`target: "browser"`), minifies the sass output CSS and bundles the server (`target: "bun"`), injecting
     `BUILD_INFO` via `define`. sass and brotli/gzip stay. Release runs `bun out/server.js`.
8. **Root dir & version check.**
   - Why: `Deno.mainModule` and `Deno.version` do not exist in Bun.
   - Impact: `RootDir` derives from `import.meta.dir` (no more test-file special case); `denoVersionIsSatified` becomes `bunVersionIsSatisfied`
     with `REQUIRED_BUN_VERSION_RANGE = ">=1.4.4"` and `Bun.version`.
9. **Delivery on a feature branch; every phase ends green under Bun.**
   - Why: Deno and Bun cannot coexist meaningfully (`deno.json`/`deps.ts` disappear in phase 1).
   - Impact: phase 1 temporarily excludes not-yet-migrated HTTP/entrypoint/dev files from lint, typecheck and tests; phases 2 and 3 remove the exclusions.
     Because `tsc` and Bun follow imports regardless of `exclude`, phase 1 first cuts the two imports from core code into the HTTP/entrypoint layer
     (`NotFoundError`, `ResultWithErrorCode`), and the phase-1 `test` script passes explicit directories instead of relying on excludes.
     `ci.yml` must reference the setup action locally (`./.github/actions/setup`), otherwise the branch keeps using `main`'s Deno setup action.

## Current State

```
deno.json ── tasks, compilerOptions (jsxImportSource = esm.sh preact, lib deno.ns), fmt + lint config
deps.ts   ── single import hub
  ├─ deno.land/x/sqlite@3.9.1   → src/data/db.ts
  ├─ deno.land/x/oak@17.1.0     → src/http/** (10 files), tests/http/**, tests/_internal/mock-context.ts
  ├─ jsr:@needle-di/core        → DI (container + @injectable / inject)
  ├─ esm.sh preact, preact-render-to-string, classnames, schema-dts
  └─ jsr:@std/{path,log,fs,fmt/colors,fmt/printf,flags,semver,async}
deps-test.ts ── deno.land/std@0.170 asserts + mock

Request flow (src/http/webserver.ts):
  Oak.Application
    → Page globals (Page.currentUrl / authorization / dark cookie)
    → languageMiddleware   (?lang= sets cookie "PrandiumLanguage", else read cookie → setLanguage)
    → handleServerError    (try next(); NotFoundError → 404 template, other → 500 template)
    → AssetsRouter     GET /assets/(.+), GET /sw.js   (Oak.send from assets/ then out/assets/, br/gz negotiation, ETag)
    → IndexRouter      GET /
    → RecipeRouter     /recipe/{import,create,:id/:slug,:id/:slug/{edit,rate,delete,flag}} (GET/POST)
    → ThumbnailsRouter GET /thumbnails/(.+)          (Oak.send from <configDir>/thumbnails)
    → handleNotFound   (throws NotFoundError)
  String bodies (rendered templates) are served as text/html by Oak's content-type sniffing.

Build (deno task build):
  dev/bundle.ts (esbuild + @luca/esbuild-deno-loader) → out/server.js, out/assets/index.js
  esbuild CLI minify → *.min.js ; sass → index.css ; lightningcss → index.min.css
  dev/write-build-info.ts patches globalThis["BUILD_INFO"] in out/server.js
  brotli + gzip → *.br / *.gz ; release zip ships server.min.js + assets

CI (.github/workflows/ci.yml): setup-deno → deno fmt --check / deno lint / deno test --coverage / deno coverage / deno task build / release
```

## Desired End State

```
package.json  ── scripts (dev, build, test, test:coverage, lint, fmt, fmt:check, typecheck, build:icons, build:ingredient-parser, insert-example-data)
bun.lock
bunfig.toml   ── [fmt] tabWidth=4, printWidth=160, singleQuote=false ; [test] coverage settings
tsconfig.json ── strict, experimentalDecorators, jsx react-jsx + jsxImportSource preact, types ["bun"]
.oxlintrc.json ── no-undef, eqeqeq, no-eval, no-throw-literal, default-param-last, no-sparse-arrays, no-const-assign,
                  typescript/no-non-null-asserted-optional-chain ; ignorePatterns: src/data/parse/ingredient/parser.js, dev/generate-favicons.js

Request flow (src/http/webserver.ts):
  Bun.serve({
    hostname, port, tls?,
    routes: {                        ← built from RouterRegistry; each handler wrapped by compose(globalMiddleware, handler)
      "/assets/*":            { GET },
      "/sw.js":               { GET },
      "/":                    { GET },
      "/recipe/import":       { GET, POST },
      "/recipe/create":       { GET, POST },
      "/recipe/:id/:slug":    { GET },
      "/recipe/:id/:slug/edit":   { GET, POST },
      "/recipe/:id/:slug/rate":   { POST },
      "/recipe/:id/:slug/delete": { GET, POST },
      "/recipe/:id/:slug/flag":   { GET },
      "/thumbnails/*":        { GET },
    },
    fetch: compose(globalMiddleware, notFound)   ← unmatched paths / methods → 404 page
  })
  globalMiddleware = [pageGlobals, language, errorHandler]
  Handler    = (req: AppRequest) => Response | Promise<Response>
  Middleware = (req: AppRequest, next: () => Promise<Response>) => Promise<Response>
  AppRequest = { request: Request, url: URL, params: Record<string,string>, cookies: Bun.CookieMap }
               url honours X-Forwarded-Proto / X-Forwarded-Host (replaces Oak's `proxy: true`, needed behind the documented nginx setup)

Build (bun run build): dev/build.ts → out/assets/index.min.{js,css}(+.br/.gz), out/server.js (minified, BUILD_INFO defined)
CI: oven-sh/setup-bun → bun fmt --check / bun run lint / bun run typecheck / bun test --coverage / bun run build / release
```

## Abstractions and Code Reuse

- `package.json` - new; dependencies `preact`, `preact-render-to-string`, `@needle-di/core`, `classnames`; devDependencies `@types/bun`, `typescript`,
  `oxlint`, `schema-dts`, `bootstrap-icons`, `sass`, `peggy`, `terser`; `"engines": { "bun": ">=1.4.4" }`
- `bunfig.toml`, `tsconfig.json`, `.oxlintrc.json` - new (see Desired End State)
- `deno.json`, `deno.lock`, `deps.ts`, `deps-test.ts`, `assets/package.json`, `assets/package-lock.json` - deleted
- `src`
  - `shared/errors.ts` - new; `NotFoundError` moved here from `http/middleware/error.ts` (imported by `controllers/recipe.controller.ts:8`)
  - `shared/types.ts` - new; `ResultWithErrorCode` moved here from `main.ts` (imported by `options.ts:2`)
  - `logging.ts` - becomes the logger (replaces `@std/log`), keeping call-site API
    - `log.debug/info/warn/error(msg | () => msg | Error)` - lazy messages preserved
    - `LogLevels`, `LogRecord { msg, level, levelName, loggerName }`, `BaseHandler` class with overridable `handle(record)` (subclassed by
      `tests/_internal/disable-logging.ts` `CapturingLogHandler`)
    - `consoleLogHandlerFactory()` - colours via `util.styleText`
    - `setupLogger(handlerFactory, debug)` - unchanged signature
  - `shared/colors.ts` - new; tiny wrappers (`cyan`, `brightCyan`, `gray`, …) over `util.styleText` used where `Colors.*` was used
  - `shared/pooled-map.ts` - new; `pooledMap(limit, iterable, fn): AsyncIterable` (same semantics as `@std/async`)
  - `shared/util.ts` - `getHome` → `os.homedir()`; `RootDir` from `import.meta.dir`; `BUILD_INFO` read as `globalThis.BUILD_INFO`
  - `options.ts` - `flags.parse` → `util.parseArgs` with all options declared (`port`/`host`/`configDir`/`cert`/`key` as `string`, `debug`/`secure`/`help`
    as `boolean`) so both `--port=9000` and `--port 9000` work; defaults + `--help` text unchanged; `port` converted to number
  - `main.ts` - `bunVersionIsSatisfied`, `REQUIRED_BUN_VERSION_RANGE`, `BootData.bunVersion/requiredBunVersionRange`; `fs.mkdir({recursive:true})`
  - `data/db.ts` - `bun:sqlite` `Database`; same public methods (`single`, `exec`, `prepare`, `transaction`, `migrate`, `query`, `close`, `dispose`);
    all queries use positional `?` parameters, so no named-parameter handling is needed. New private `normalizeBindings(values)`:
    `Date` → `toISOString()` (deno-sqlite did this implicitly; bound in `recipe.service.ts:96-97,146,160,255`), `undefined` → `null`; omit the
    argument entirely when no values are given. `unload` listener → `process.on("exit")`
  - `data/settings.ts`, `data/util/thumbnails.ts`, `controllers/recipe.controller.ts` - `Deno.*` file I/O → `Bun.file`/`Bun.write`/`fs.promises`
  - `data/parse/import/import-recipe.ts` - `pooledMap` from `shared/pooled-map.ts`
  - `http/server/` - new in-house HTTP layer
    - `types.ts` - `AppRequest`, `Handler`, `Middleware`, `RouteTable`
    - `compose.ts` - `compose(middlewares, handler): Handler`
    - `request.ts` - `toAppRequest(req, params)`; builds `url` honouring `X-Forwarded-Proto`/`X-Forwarded-Host` (Oak `proxy: true`)
    - `responses.ts` - `html(body, init?)` (`text/html; charset=utf-8`), `text(body)` (`text/plain`, e.g. `rate` returns `"Ok"`), `redirect(url)` (302, like Oak)
    - `static-files.ts` - `serveFile(req, root, relativePath): Promise<Response | undefined>` replicating Oak `send()`: URL-decode path, traversal guard,
      refuse dotfiles, br/gz precompressed variants via `Accept-Encoding` with `Content-Encoding` + `Vary`, `Content-Type` derived from the
      *original* filename (not the `.br`/`.gz`), `Last-Modified`, weak `ETag` + `If-None-Match` → 304, HEAD support. Relative path is taken from
      `url.pathname` minus the route prefix (not `params["*"]`)
    - `cookies.ts` - parse `Cookie` header into `Bun.CookieMap`, append `Set-Cookie` headers from `cookies.toSetCookieHeaders()` to the response
  - `http/routers/router.ts` - `Router` base class now collects `routes(): RouteTable` entries via `get(path, handler)`/`post(path, handler)` with optional prefix
  - `http/routers/*.router.ts` - handlers take `AppRequest`, return `Response`; `Oak.send` → `serveFile`
  - `http/middleware/{error,language}.ts`, `http/middleware/helpers/*.ts`, `http/util/parameters.ts` - take `AppRequest`/`URL` instead of `Oak.Context`
  - `http/webserver.ts` - `Bun.serve`; resolves its promise on `SIGINT`/`SIGTERM` after `server.stop()` so `main()` can dispose the DB (Oak's `listen` blocked the same way)
- `tests` - all files on `bun:test`; `_internal/mock-context.ts` deleted; `_internal/with-temp.function.ts` uses `fs.mkdtemp`/`fs.rm`;
  `_internal/disable-logging.ts` uses the new logger's `BaseHandler`
- `dev` - `build.ts` (new, replaces `bundle.ts`, `write-build-info.ts`, `ensure-dir-exists.ts`); `internal/util.ts` on `Bun.spawn`;
  `intellij-deno.ts`, `generate-coverage-report.ts` deleted; other scripts ported to `Bun.file`/`Bun.write`

## Logging & Observability

Output format stays identical, e.g.:

```
INFO Server started: Listening on http://127.0.0.1:8000
DEBUG [DB] Using database /home/me/.config/prandium/db.sqlite3
ERROR The installed version of Bun does not satisfy the required version range >=1.4.4. Please install a compatible Bun version and try again.
```

## Implementation

### Phase 1: Bun toolchain and core runtime

Dependencies: None. Work on branch `chore/migrate-to-bun`.

Set up the Bun project, replace all non-HTTP Deno usage, move the data layer to `bun:sqlite` and run all non-HTTP tests on `bun:test`.
Temporarily excluded (until phase 2): `src/http/**`, `src/main.ts`, `tests/http/**`, `tests/main.test.ts`, `tests/_internal/mock-context.ts`;
(until phase 3): `dev/**`, `src/data/parse/ingredient/parser.js` (generated, still carries the Deno preamble).

**Tasks**:

- [x] Upgrade local Bun to ≥ 1.4.4 (`bun upgrade`)
- [x] Move `NotFoundError` to `src/shared/errors.ts` and `ResultWithErrorCode` to `src/shared/types.ts`; update imports in
      `src/controllers/recipe.controller.ts`, `tests/controllers/recipe.controller.test.ts`, `src/options.ts`, `src/http/middleware/error.ts`, `src/main.ts`
      so no non-excluded module imports `src/http/**` or `src/main.ts`
- [x] Add `package.json` with dependencies from decision 6 and scripts `test` (phase 1: `bun test tests/data tests/controllers tests/tpl`),
      `test:coverage`, `lint`, `fmt`, `fmt:check`, `typecheck`; run `bun install` to create `bun.lock`
- [x] Add `bunfig.toml` with `[fmt]` (`tabWidth = 4`, `useTabs = false`, `printWidth = 160`, `singleQuote = false`, `proseWrap = "preserve"`) and ignore of
      `src/data/parse/ingredient/parser.js`, `dev/generate-favicons.js`
- [x] Add `tsconfig.json` (strict, `experimentalDecorators`, `jsx: "react-jsx"`, `jsxImportSource: "preact"`, `lib: ["dom","dom.iterable","esnext"]`,
      `types: ["bun"]`, `moduleResolution: "bundler"`, `allowImportingTsExtensions`, `noEmit`) with temporary `exclude` of the files listed above
- [x] Add `.oxlintrc.json` mapping the `deno.json` lint rules; temporary `ignorePatterns` for the files listed above
- [x] Delete `deno.json`, `deno.lock`, `deps.ts`, `deps-test.ts`, `assets/package.json`, `assets/package-lock.json`; drop `deno.ns` from `assets/tsconfig.json`
- [x] Replace every `../deps.ts` import in non-excluded files with direct imports (`preact`, `preact-render-to-string`, `classnames`, `@needle-di/core`,
      `schema-dts`, `node:path`, …); `container` moves to `src/di.ts`
- [x] Rewrite `src/logging.ts` as the logger (see Abstractions); update all `log.*` call sites only where the API differs (none expected);
      port `tests/_internal/disable-logging.ts` (`disableLogging`, `CapturingLogHandler`) to it
- [x] Add `src/shared/colors.ts` and replace `Colors.*` usages
- [x] Add `src/shared/pooled-map.ts` and use it in `src/data/parse/import/import-recipe.ts`
- [x] `src/shared/util.ts`: `os.homedir()`, `RootDir` from `import.meta.dir`
      ```ts
      const RootDir = IS_COMPILED ? import.meta.dir : path.resolve(import.meta.dir, "..", "..");
      ```
- [x] `src/options.ts`: `util.parseArgs` with all options declared, the same defaults and help text; `port` converted to number
- [x] `src/data/db.ts`: `bun:sqlite` (`new Database(path, { create: true })`, `query(sql).all(...bindings)` for entries, `prepare(sql).all(...bindings)` in
      `prepare()`, `finalize()`, `transaction(fn)()`, `PRAGMA user_version` via `query().get()`); parameter type `SQLQueryBindings[]`;
      route every binding through `normalizeBindings` (`Date` → ISO string, `undefined` → `null`)
- [x] `src/data/settings.ts`, `src/data/util/thumbnails.ts`, `src/controllers/recipe.controller.ts`: `Deno.*` → `Bun.file(...).text()`, `Bun.write`, `fs.promises.rm`,
      `fs.existsSync`; remove commented-out Deno code
- [x] Replace `// deno-lint-ignore` comments with `// oxlint-disable-next-line <rule>` (or remove where no longer needed)
- [x] Convert the 13 non-HTTP test files to `bun:test` (`describe`/`test`, `expect(...).toEqual/toThrow/rejects`, `spyOn`/`mock`, `mock.restore()`);
      `tests/_internal/with-temp.function.ts` on `fs.mkdtemp`/`fs.rm`; replace `Deno.chdir` in `schema-parser.test.ts` with `root(...)` paths;
      restructure `tests/data/parse/import/import-recipe.test.ts` (its `simpleTest(t: Deno.TestContext, …)` helper creates steps dynamically) into
      a `describe` block with table-driven `test.each`; reset shared global state (logger, `setLanguage`, DI `container`) in `beforeEach`/`afterEach`
      where tests depend on it
- [x] Add a `db.ts` test that inserts and reads back a recipe with `Date` fields and an `undefined` optional field (`thumbnail`)
- [x] Add a regression test that opens a DB created with the current schema version (fixture built by running all migrations, then reopened) and asserts
      `migrate()` is a no-op and data is readable
- [x] Add unit tests for `pooledMap` (concurrency limit, order of results, error propagation), the logger (level filtering, lazy messages) and `parseOptions`
      (defaults, `--port=9000`, `--debug`, `--help` → 0)
- [x] `.github/actions/setup/action.yml`: replace `setup-deno` + `deno cache` with `oven-sh/setup-bun` (`bun-version: 1.4.4`) + `bun install --frozen-lockfile`;
      inputs `denoVersion`/`denoDir` → `bunVersion`; cache `~/.bun/install/cache` keyed on `bun.lock`
- [x] `.github/workflows/ci.yml`: use `./.github/actions/setup` (local path); trigger paths `bun.lock`, `package.json`, `bunfig.toml`, `tsconfig.json`,
      `.oxlintrc.json` instead of the Deno files; lint job runs `bun fmt --check`, `bun run lint`, `bun run typecheck`; test job runs
      `bun test --coverage --coverage-reporter=lcov --coverage-dir=out/coverage` and uploads `out/coverage/lcov.info`; build job temporarily disabled (`if: false`) until phase 3
- [x] Run `bun fmt` once and commit the reformat separately

**Automated Verification**:

- [x] `bun install --frozen-lockfile` succeeds
- [x] `bun test` passes (all non-excluded tests, including the new DB-reopen, `pooledMap`, logger and `parseOptions` tests)
- [x] `bun run typecheck` passes
- [x] `bun run lint` and `bun fmt --check` pass
- [x] `git grep -nE "Deno\.|deps\.ts|jsr:|npm:|https://(deno\.land|esm\.sh)" -- src tests ':!src/http' ':!src/main.ts' ':!tests/http' ':!tests/main.test.ts' ':!tests/_internal/mock-context.ts'`
      finds nothing
- [ ] CI lint and test jobs are green on the branch (branch not pushed yet)

### Phase 2: HTTP layer on `Bun.serve` and entrypoint

Dependencies: Phase 1.

Replace Oak with the in-house HTTP layer, migrate `main.ts`, rewrite the 7 coupled test files, add client asset building + dev workflow, and remove the
phase-1 exclusions for `src/http/**`, `src/main.ts` and `tests/**`.

**Tasks**:

- [x] Add `src/http/server/types.ts`, `compose.ts`, `request.ts`, `responses.ts`, `cookies.ts`, `static-files.ts` (see Abstractions)
- [x] `src/http/routers/router.ts`: `Router` with `prefix`, `get(path, handler)`, `post(path, handler)`, `routes(): RouteTable`
- [x] `AssetsRouter`: `/assets/*` and `/sw.js`; try `assets/` then `out/assets/` via `serveFile`; fall through to not-found when missing
- [x] `ThumbnailsRouter`: `/thumbnails/*` via `serveFile(req, getThumbnailDir(configDir), <pathname after "/thumbnails/">)`
- [x] `IndexRouter`, `RecipeRouter`: same routes and methods as today (GET routes also answer HEAD); `ctx.request.body.form()/formData()` →
      `req.request.formData()`; `ctx.request.hasBody` → `req.request.body !== null`; `ctx.response.body = …` → `html(…)` (`rate` → `text(…)`);
      `ctx.response.redirect` → `redirect(…)`
- [x] `middleware/error.ts`: `errorHandler` middleware (NotFoundError → 404 page, else log + 500 page) and `notFound` handler
- [x] `middleware/language.ts`: read `?lang` / cookie via `req.cookies`; setting the cookie results in a `Set-Cookie` header
- [x] `middleware/helpers/{current-url,order-by-helper,pagination-helper}.ts`, `util/parameters.ts`: accept `AppRequest`/`URL`
- [x] `src/http/webserver.ts`: build route table from `RouterRegistry`, wrap each handler with `compose([pageGlobals, language, errorHandler], handler)`,
      `fetch` fallback = `compose([...], notFound)`, `tls: { cert: Bun.file(cert), key: Bun.file(key) }` when `--secure`, log the "Server started" line,
      resolve on `SIGINT`/`SIGTERM` after `server.stop()`
- [x] `src/main.ts`: `bunVersionIsSatisfied(version = Bun.version, range = REQUIRED_BUN_VERSION_RANGE)` using `Bun.semver.satisfies`; `BootData` fields renamed;
      error message mentions Bun
- [x] Rewrite `tests/main.test.ts`, `tests/http/error.test.ts`, `tests/http/util/parameters.test.ts`,
      `tests/http/router/{assets,index,thumbnails}.router.test.ts`, `tests/http/middleware/helpers/pagination-helper.test.ts` on `bun:test` with real
      `Request`/`Response`; delete `tests/_internal/mock-context.ts`
- [x] Add tests for the new layer: `compose` order and short-circuiting; `serveFile` (URL-encoded names, traversal `../` and dotfiles rejected, `.br`/`.gz`
      served with `Content-Encoding` and the original `Content-Type` when accepted, `If-None-Match` → 304, HEAD); `toAppRequest` with
      `X-Forwarded-Proto: https` yields an `https:` URL and redirects keep it; language cookie set/read; `rate` responds `text/plain`;
      unmatched path and unsupported method (e.g. `DELETE /`) → 404 page; end-to-end test that starts `spawnServer` on port 0 and fetches `/`,
      `/recipe/create`, `/assets/favicon.svg`, `/does-not-exist`
- [x] Add `dev/build.ts` with an `assets` target: `sass` → `out/assets/index.css`, `Bun.build` client JS (`assets/index.ts`, `target: "browser"`) →
      `out/assets/index.js`, plus `--watch` mode; script `build:assets`
- [x] Add `dev/dev.ts` that spawns `build:assets --watch` and `bun --watch src/main.ts --debug` via `Bun.spawn` and forwards exit signals
      (cross-platform, no reliance on `&`); script `dev`
- [x] Switch the `test` script back to plain `bun test`
- [x] Update `dev/build-icons.ts` (now reads `node_modules/bootstrap-icons/…`) and `dev/internal/util.ts` (`Bun.spawn`, `process.platform`) so `build:icons` works
- [x] Remove the phase-1 exclusions for `src/http/**`, `src/main.ts`, `tests/**` from `tsconfig.json` and `.oxlintrc.json`

**Automated Verification**:

- [x] `bun test` passes, including all new HTTP-layer tests and the end-to-end server test
- [x] `bun run typecheck`, `bun run lint`, `bun fmt --check` pass
- [x] `git grep -nE "Deno\.|deps\.ts|jsr:|npm:|https://(deno\.land|esm\.sh)|deno-lint" -- src tests ':!src/data/parse/ingredient/parser.js'` finds nothing
- [x] `bun run build:assets` creates `out/assets/index.js` and `out/assets/index.css`
- [ ] CI lint and test jobs are green (branch not pushed yet)

**Manual Verification**:

- [ ] `bun run dev`, then in the browser: recipe list (filter by tag, order, pagination), recipe detail (portions, rating), create, edit with thumbnail upload,
      delete, flag, import by URL — all behave as before
- [ ] Dark mode toggle and `?lang=` switch persist across requests; thumbnails load; `/does-not-exist` shows the 404 page
- [ ] Starting against an existing `~/.config/prandium` from the Deno version shows all existing recipes

### Phase 3: Production build, release, dev scripts and docs

Dependencies: Phase 2.

Finish the build pipeline, port/delete the remaining dev scripts, re-enable CI build/release and update all documentation and IDE configuration.

**Tasks**:

- [x] `dev/build.ts` `build` target: clean `out/`, copy static assets (`favicons/`, `icons.svg`, `placeholder.svg`, `sw.js`), build assets, minify CSS
      (`Bun.build` with the CSS entry and `minify: true`) → `index.min.css`, minified client JS → `index.min.js`, server bundle
      (`src/main.ts`, `target: "bun"`, `minify: true`, `define: { "globalThis.BUILD_INFO": JSON.stringify(info) }`) → `out/server.js`,
      brotli + gzip of `index.min.{js,css}` via `node:zlib` (no CLI dependency)
- [x] Build info string keeps today's format: `Build <hash> (tag <tag>) compiled <UTC date>` (git via `Bun.spawn`)
- [x] `src/shared/util.ts`: switch `globalThis["BUILD_INFO"]` to `globalThis.BUILD_INFO` so `define` applies
- [x] Delete `dev/bundle.ts`, `dev/write-build-info.ts`, `dev/ensure-dir-exists.ts`, `dev/intellij-deno.ts`, `dev/generate-coverage-report.ts`
- [x] Port `dev/build-ingredient-parser.ts` (preamble → `/* oxlint-disable */`; peggy/terser via `bunx`), `dev/insert-example-data.ts`; scripts
      `build:ingredient-parser`, `build:icons`, `insert-example-data` in `package.json`; regenerate `src/data/parse/ingredient/parser.js`;
      remove `dev/**` from the remaining exclusions
- [x] Remove the `// deno-lint-ignore-file` line from `dev/generate-favicons.js`
- [x] Add a test that runs the build and asserts: `out/server.js` exists and contains the build info string; `out/assets/index.min.{js,css}` and their
      `.br`/`.gz` exist; `bun out/server.js --help` exits 0
- [x] `.github/workflows/ci.yml`: re-enable build job (drop the `apt-get`/`npm install -g` tooling and the `npm i path-to-regexp` debug step; run `bun run build`)
- [x] `.github/workflows/ci.yml` release job: stop deleting `server.js` (it is now the minified server bundle); fix the existing bug where
      `cd ../assets/; rm index.css* index.js` targets the repository's `assets/` instead of `out/assets/` — remove the non-minified
      `out/assets/index.css` and `out/assets/index.js` instead; zip contents otherwise unchanged
- [x] `docs/setup.md`: systemd `ExecStart=/home/prandium/.bun/bin/bun /home/prandium/repository/out/server.js` (no Deno permission flags); update SELinux
      notes from `.deno/bin/deno` to `.bun/bin/bun`
- [x] `docs/development.md`: Bun ≥ 1.4.4 install, `bun install`, `bun run dev`, `bun test`, `bun fmt`, `bun run lint`; HTTPS dev server via
      `bun src/main.ts --secure --key=key.pem --cert=cert.pem`; remove the JetBrains Deno hint
- [x] `README.md`: acknowledgements — Deno → Bun, remove Oak/deno-sqlite/tsyringe, add needle-di, Preact, oxlint
- [x] `.idea`: delete `deno.xml` and Deno-typed run configurations; add npm-type run configurations for `build`, `dev`, `test`, `test:coverage`, `lint`, `fmt`,
      `fmt:check`, `build:icons`, `insert-example-data`; delete `update_lock_file.xml`, `coverage.xml`, `coverage_html.xml`, `test_no_check.xml`;
      remove the `Deno` entry from `jsonSchemas.xml`; drop Deno references from `.idea/.gitignore`
- [x] `.gitignore`: ensure `out/`, `node_modules/` remain ignored; remove Deno-specific entries if any

**Automated Verification**:

- [x] `bun run build` succeeds and the build test passes
- [x] `bun test`, `bun run typecheck`, `bun run lint`, `bun fmt --check` pass with no exclusions left except generated files
- [x] `git grep -niE "deno" -- . ':!docs/agents'` finds nothing
- [ ] CI is fully green (lint, test, build) on the branch (branch not pushed yet)

**Manual Verification**:

- [ ] Unpack the CI artifact zip into an empty directory, run `bun server.js` from it and browse list/detail pages with assets, icons and thumbnails loading;
      page source contains the `<!-- Build … -->` comment

## Implementation Notes

During implementation, document user feedback, problems, and decisions here.

### Phase 1

- Commits: `9b5fee2` (migration), `e1260ca` (bun fmt reformat). The pre-staged `.agents/` files and the `src/prandium.iml` deletion were left out of both.
- `bun fmt` with no arguments formats the whole repository; `bunfig.toml` `ignorePatterns` restrict it to `src/`, `tests/`, `dev/` (old `deno fmt` scope).
  `bun run lint` runs `oxlint src tests dev` for the same reason. oxlint's `correctness` category is enabled on top of the mapped Deno rules;
  `no-unused-vars` ignores `_`-prefixed names (Deno convention).
- TypeScript resolved to 7.0.2; it handles `experimentalDecorators` and the preact JSX setup without changes.
- `Database` opens with `strict: true` so `db.test.ts`' named `:title` parameter binds as `{ title }`. `query()` uses `prepare()` + `finalize()` instead of
  the caching `db.query()` because SQL is often built dynamically. One process-wide `exit` listener closes all open databases.
- `pooledMap` is an async generator: results in input order, errors collected into an `AggregateError` after all successful values (as in `@std/async`).
- Logger: the record's `args` are kept behind a getter so `{ ...record }` yields exactly `msg/level/levelName/loggerName`, which `LogCapture2` relies on.
  Until `setupLogger` is called, INFO and above go to the console (needed for `--help`, which is parsed before the logger is set up).
- `parseOptions` uses `parseArgs` with `strict: false` (unknown flags are ignored like before); `--debug=false` style values are honoured.
- Bug found by the test port: whitespace-only reviews were imported with empty text. The Deno test passed vacuously (`assertObjectMatch` against `[]`);
  `parseReviews` now filters on the trimmed text.
- `settings.test.ts` derives the expected JSON parse error message at runtime because JavaScriptCore words it differently from V8.
- The setup action no longer checks out the repository itself (a local action needs the checkout first); each CI job checks out explicitly.

### Phase 2

- Commit: `cb79c27`.
- `Bun.serve` answers HEAD for GET routes itself and falls back to `fetch` for unsupported methods on matched routes (verified with a probe), so
  `Router` only registers GET/POST. Wildcard routes get empty `params`; the file name is taken from the pathname.
- Routers throw `NotFoundError` for missing assets/thumbnails and for `POST /recipe/import` without body/URLs (Oak fell through to the 404 handler).
- `toAppRequest` rebuilds the URL from the forwarded protocol/host: the WHATWG `host` setter keeps the old port when the new host has none.
  Invalid forwarding headers fall back to the request URL. `current-url.ts` (Host header port patch) was deleted.
- `serveFile` additionally sends `Vary: Accept-Encoding` (Oak did not). `Cache-Control: max-age=0` and the weak ETag format match Oak.
- `main()` result is now the process exit code (Deno version ignored it); `spawnServer` takes optional `signal`/`onListen` for the end-to-end test.
- Colours honour `NO_COLOR` like `@std/fmt/colors`.
- sass 1.106 warns about the `if()` syntax in `assets/scss/mixins/spacing.scss`; the `if-function` deprecation is silenced in `dev/build.ts` (TODO there).
- `dev/dev.ts` runs `build.ts assets --watch`, `bun --watch dev/build-icons.ts` and `bun --watch src/main.ts --debug` (extra args go to the server).
- Smoke test against a temporary config dir: all pages, assets, `sw.js`, 404, `?lang=de`, create/edit (multipart with thumbnail), thumbnail serving,
  `rate` (text/plain) and forwarded-header redirects work.

### Phase 3

- Commits: `753a4b2` (build), `c4149e0` (docs), `9e0d0b2` (IDE).
- `dev/build.ts build` takes `--outDir` (default `out/`) so `tests/dev/build.test.ts` builds into a temp dir instead of wiping `out/`.
- Client JS is minified by bundling `assets/index.ts` again with `minify: true` rather than re-minifying `out/assets/index.js`.
- `parser.js` regenerated with peggy 5 (`bun x peggy` / `bun x terser`); ingredient tests pass unchanged.
- `tsconfig.json` gets `moduleDetection: "force"` so `dev/dev.ts` (top-level await, no imports) type-checks.
- `insert-example-data.ts` passed the thumbnail URL as the user agent; fixed while porting.
- `.idea/jsonSchemas.xml` only contained the Deno schema and was deleted; `run:debug`, `run:dev`, `test:watch` configurations were replaced by `dev`.
- README: ESBuild was also removed from the acknowledgements (no longer used).
- Not changed (pre-existing, outside the plan): the release job creates the zip inside `out/` but `ncipollo/release-action` looks for
  `prandium-<tag>.zip` in the workspace root. `git describe --tags` finds no tags with the default shallow checkout, so CI build info has no tag.

## References

- Bun v1.4.4 release (introduces `bun fmt`): https://bun.com/blog/bun-v1.4.4
- `Bun.serve` routes, `BunRequest`, `Bun.CookieMap`: https://bun.com/docs/api/http
- `bun:sqlite`: https://bun.com/docs/api/sqlite
- `bun:test` and coverage: https://bun.com/docs/cli/test
- `Bun.build`: https://bun.com/docs/bundler
- oxlint rules: https://oxc.rs/docs/guide/usage/linter/rules
- Current entry points: `src/main.ts`, `src/http/webserver.ts`, `src/data/db.ts`, `deps.ts`, `deno.json`, `.github/workflows/ci.yml`
