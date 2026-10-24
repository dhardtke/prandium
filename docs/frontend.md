# Frontend (`src/frontend/`)

The rules every change follows, then the patterns and gotchas the code does not make obvious.

No build step: `index.html` is the only page and loads `main.ts`, which imports the `app/ce-app.component.ts` shell. Routes are real
extension-less paths (`/recipes/3`) that the server answers with `index.html`. A module's URL is its path below `src/frontend/`.

## Layout

```
src/frontend/
├── index.html  main.ts  manifest.webmanifest  testing.ts
├── icons/      the app icon
├── dev/        hot.ts, the hot-reload client (development only, imported by nothing)
├── app/        ce-app shell, ce-header, ce-breadcrumbs, ce-theme-toggle, ce-language-switch, router.ts, routes.ts, tab-title.ts
├── http/       http.ts (get/post/put/patch/remove/putBlob), errors.ts (ApiError, errorMessage)
├── i18n/       language.ts (the Language interface), en.ts, de.ts
├── ui/         what any component may use
└── features/<feature>/
    ├── <feature>.routes.ts  <feature>.facade.ts  route views and components other features render
    └── internal/            *.api.ts classes and what only this feature uses
```

Features: `recipes` (list, detail, edit, import), `tags` (a facade only), `auth` (login).

`ui/` holds: `base.ts` (`CeElement`: open shadow root, `data-action` click/submit delegation, `template()`/`render()`, a re-render on a
language change; `define()`), `view.ts` (`CeView`), `html.ts` (`html`, `raw()`), `styles.ts`, `theme.ts`, `i18n.ts`, `format.ts`,
`toast.ts`, `modal.ts`, `confirm/` (`confirmAction()`), `leave-guard.ts`, `pagination/`, `placeholder.svg`, `app.css` and `shared.css`.

`app/` reaches features only through their route lists, except `ce-header`, which imports `auth.facade.ts` for Log out.

## Components

- A component is `ce-<name>.component.ts` + `ce-<name>.component.css` side by side. The module ends with
  `await define('<tag>', TheClass, import.meta.url)`; every instance adopts the sheet. A test fails any component without its `.css`.
- **The top-level `await` is load-bearing**: "module loaded" means "stylesheet loaded", so a lazily imported view paints styled at once.
- Route views extend `CeView`: `load()` on connect, `readyTemplate()`/`errorTemplate()`, `titleFor(data)`/`pageTitle`,
  `parentsFor(data)`/`pageParents` (breadcrumb parents that need the data, as the edit page names its recipe), `reload()`, `show(data)`,
  `replaceData(data)` (store only, for views patching their own DOM), `numericAttribute()`. The login and import pages are plain
  `CeElement`s: they load nothing and must render at once.
- All interpolation goes through `html`, which escapes; `raw()` only for markup another `html` call produced.
- List items are `shared.css`'s `article.open-card`: the title anchor's `::after` covers the card, so it stays a real link; the card menu
  sits in `.actions`, above the overlay.

### Patching instead of re-rendering

A view never re-renders what the user is working in. The recipe list patches its results, count and tag panel after a change, so the
search field keeps focus while the debounced search runs; the detail page patches the flag button, the rating and the history after a
PATCH, so portions typed and steps folded stay; `ce-ingredients` patches its rows when the portions change. A language change re-renders
every `CeElement`, except where that would lose input: `ce-app` only re-derives the title and breadcrumbs, the edit view re-renders only
while clean, and the list and history fields carry their values across.

## Features and facades

- One API class per URL prefix in `internal/` (`recipe.api.ts` owns `/api/recipes/**`, `tag.api.ts` `/api/tags`).
- The facade module exports ready instances (`recipeFacade`, `tagFacade`) of thin classes whose methods delegate in one line.
- A component reads data only through facades, including other features' facades — never another feature's `internal/`.

## Routing

- Routes live in `<feature>.routes.ts`: a regex `pattern`, its `keys`, a `view(params)` that `import()`s the view, plus optional `title`,
  `parents` and `nav`. Labels and titles are `(l: Language) => string`, called with the current dictionary on every render, so they
  follow a language change; route files only `import type` `Language`, since they may not import `ui/`.
- Links are plain `<a href="/…">`; `ce-app` intercepts plain same-origin clicks on extension-less, non-`/api` paths without query or
  fragment and calls `navigate()`. A link with a query (a detail page's tag, `/?tag=3`) is a full page load.
- The list keeps its state in the query string (`search`, `tag` repeated, `sort`, `order`, `page`, `tags` = panel open) and changes it with
  `history.pushState` without remounting; `parseListQuery()` also reads the old app's `title`, `tagId`, `orderBy` and `tagFilter`, and the
  next `pushState` rewrites them (`features/recipes/internal/list-query.ts`).
- Breadcrumbs are derived from the matched route (or the view's `pageParents`), never history. `APP_TITLE` must match `index.html`'s
  `<title>` (tested).
- `ce-app` keeps the old view until the new one's `ready` resolves (capped at 300 ms) and removes the old children rather than
  `replaceChildren(view)`, which would reconnect and refetch.
- **Leaving unsaved changes**: a view registers `guardLeave(isDirty)` from `ui/leave-guard.ts`. `ce-app` asks `confirmLeave()` before
  following a link, and on Back/Forward puts the URL back when declined; the browser asks before the tab closes. A confirmed leave clears
  the guards, so the navigation that follows does not ask twice.

## Import boundaries

`bun run lint` holds these in `.oxlintrc.json`:

- A module under `features/<a>/` may not import `features/<b>/internal/`.
- Nothing under `app/`, `ui/`, `http/` or `main.ts` may import any `internal/`.
- No component may import an `*.api.ts` or `http/http.ts`.
- `ui/` and `http/` may not import `features/` or `app/` (so `http.ts` signals 401 with the `pr:unauthorized` event instead of navigating).
- A `*.routes.ts` may not import `internal/`, `*.api.ts`, `*.facade.ts`, `http/` or `ui/`.

**Only route views are dynamically imported. A component a view renders must be a static import in that view's module** — otherwise
property assignments land on an un-upgraded element, shadow the class accessors, and it renders blank with no error. The same holds for
Oat's elements: the edit view sets `<ot-taginput>`'s `value` only once `customElements.whenDefined()` resolved.

## Types

- Wire types come from `src/shared/dto/` (one file per feature) and flavors from `src/shared/flavors.ts`, always with `import type`.
  `src/shared/` is outside the web root, so a surviving runtime import would 404: **`src/shared/` must stay free of runtime code**. Values
  the frontend needs (`RECIPE_SORT_KEYS`) are its own copy, pinned by a test against the backend's.

## i18n

`ui/i18n.ts` holds the current language (`en` or `de`) in `localStorage` (`cena:language`), defaulting from `navigator.languages`,
falling back to English. `t()` returns the dictionary (`i18n/en.ts`, `i18n/de.ts`, both of `i18n/language.ts`'s shape, with the same keys,
tested). `setLanguage()` updates `<html lang>` and emits `LANGUAGE_CHANGE_EVENT`, which every `CeElement` follows. The pre-paint script in
`index.html` sets `<html lang>` before any module runs. `ui/format.ts` formats dates, minutes and numbers in the current language's
`bcp47` locale. API error messages stay English and are shown as they are.

## Feature notes

- **Auth**: a 401 navigates to `/login?next=…`; `toastError()` stays silent for 401. `authFacade.enabled()` reads the `#auth-status` JSON
  the server embeds. `ce-login` renders its form in light DOM, so password managers find it.
- **List**: `PAGE_SIZE` 24; the tag panel hides tags whose Jaro-Winkler similarity to the filter text is below 0.75, never a selected one,
  and disables tags with a count of 0. Delete from a card's menu confirms, deletes and reloads the page of results.
- **Detail**: ingredients arrive in the stored order; `ce-ingredients` sorts them for display (quantity and unit first, by unit, then a
  quantity alone, then neither, as the old app did) and scales `quantity × portions / yield` locally, rounded to three digits
  (`internal/portions.ts`), keeping `?portions=` with `replaceState`. `ce-rating` is ten half-star radios. `ScreenWakeLock` keeps the
  screen on while the page is open, taking the lock again when the tab returns to view.
- **Edit**: tags go to Oat's `<ot-taginput>` as objects (`{ title, toString }`), because its `value` setter splits strings on commas. The
  thumbnail is picked through `<ot-upload>`, previewed with an object URL (the CSP allows `blob:`), refused client-side unless an image of
  at most 10 MB, and saved after the recipe with `PUT`/`DELETE /api/recipes/:id/thumbnail`. `ce-history-field` keeps a stored timestamp
  while its row is untouched.

## Loading

- Served from source, each module is transpiled on request. **The transpiler erases types without checking them** — `bun run typecheck` is
  the only type gate.
- A deployed build serves one bundle at `/main.ts` and one `/main.css` (see "Single-file build" in `docs/backend.md`).
- The server versions every URL through an import map, so `import.meta.url` carries `?v=`; anything keyed by a module's URL uses its
  pathname (as `styles.ts` does).

## Hot reload

`bun run start:dev` only. Saving a `.css` refetches into the same `CSSStyleSheet`, so it restyles in place; a `.ts`, `index.html`, manifest
or icon reloads the page.

## Theming

`ui/theme.ts` sets `data-theme` on `<html>` (stored as `cena:theme`); `app.css` turns it into `color-scheme`, and Oat's
`light-dark()` tokens follow into every shadow root. Brand tokens are overridden in `app.css`, and `ui/contrast.test.ts` checks them
against WCAG AA. The `theme-color` values live in three places — `--card` in `app.css`, the inline script in `index.html` and
`THEME_COLORS` in `theme.ts` — kept equal by `theme.test.ts`.

## Installing

`manifest.webmanifest`, no service worker. The PNG icons are rasterized by hand whenever an SVG changes: in Chromium, draw the SVG onto a
canvas at the target size and save it as PNG — `icon-192.png` and `icon-512.png` from `icon.svg`, `icon-maskable-512.png` from
`icon-maskable.svg`. `static.routes.test.ts` checks the sizes.

## Tests

- Component tests call `useDom()` from `src/frontend/testing.ts` (one happy-dom window per process). `await import()` the component in
  `beforeAll` after `useDom()`. `fetch` answers `.css` with an empty 200 and rejects anything else; use `useFetch()` with
  `respondWith()`/`respondTo('GET /api/…', …)` and read requests with `sent('POST /api/…')`. `useDom()` resets the language to English
  after each test.
- A module that reads the browser on load (`theme.ts`, `i18n.ts`) is imported with a query string (`./i18n.ts?3`) for a fresh instance per
  test. A test without a DOM must not import a component module statically; helpers it needs live in their own modules
  (`tag-filter.ts`, `history-time.ts`).
- Set attributes before appending: use `mount(tag, attributes)`. Find elements only by `data-testid`.
- Oat's elements are not loaded under happy-dom; a test that needs one defines a stand-in (`ce-recipe-edit.component.test.ts` defines
  `ot-taginput` with its comma-splitting `value`).
- Domain test data comes from `features/recipes/recipes.fixtures.ts` (`recipe()`, `summary()`, `recipePage()`, `tag()`).
- `bun fmt` reformats markup inside `html` templates, so text assertions trim.
