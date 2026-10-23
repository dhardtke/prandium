# Checklists

What a common change touches, in order. Each step links to the section that explains why; the
linter, the typechecker and the tests catch most steps that are skipped, but not all of them.

## An API endpoint

1. Declare the request and response shapes in `src/shared/dto/<feature>.ts`, type-only and
   camelCase, with flavored ids and dates ("Translators" in `docs/backend.md`).
2. Add the SQL to the feature's `internal/<entity>.repository.ts`. A write of more than one
   statement is one method in `db.transaction()` ("Transactions").
3. Add the facade method in `<feature>.facade.ts`; a write validates the request DTO there before
   it reaches the repository ("Facades").
4. Add the translator functions in `internal/<entity>.translator.ts`, naming every field — never a
   spread.
5. Add the controller method in `internal/<x>.controller.ts`, throwing through `http/errors.ts`
   rather than answering an error itself ("Errors").
6. Add a one-line handler to the `*.routes.ts` file the URL's prefix names.
7. Cover it over HTTP in that route file's `*.routes.test.ts`, with the owning feature's fixtures
   ("Tests").

A new data feature also spreads its routes into `src/backend/http/routes.ts`, inside
`auth.guard()`.

## A schema change

1. Add `src/backend/db/migrations/<NNN>-<name>.sql`, numbered above the last one. Never edit an
   applied migration ("Migrations").
2. Rebuilding a table copies its ids and its `AUTOINCREMENT` sequence, and the migration must pass
   `PRAGMA foreign_key_check`.
3. Update the row types and the repository, then `docs/backend.md` ("Data model").

## A frontend API call

1. Add the method to the API class that owns the URL's prefix, `internal/<x>.api.ts`.
2. Add a one-line facade method in `<feature>.facade.ts`, using the backend's verb.
3. Test the URL and body it sends in `<feature>.facade.test.ts`.

## A component

1. Create `pr-<name>.component.ts` and `pr-<name>.component.css` side by side, the module ending
   in `await define('pr-<name>', TheClass, import.meta.url)` ("Components" in `docs/frontend.md`).
2. Put it in `internal/` unless another feature renders it, and export the class only when another
   module needs it.
3. Import it statically from the view that renders it ("Import boundaries").
4. Read data only through facades, and interpolate only through `html`.
5. Give each element a test asserts on a `data-testid`, and test it under `useDom()` with
   `mount()` ("Tests").
6. Style it with Oat first and its own stylesheet second (`docs/styling-guidelines.md`), and
   check it at 320 px.

## A page

1. Add a route to the feature's `<feature>.routes.ts`: a `pattern`, its `keys`, a `view()` that
   `import()`s the view, and a `title`, plus `parents` for a detail page or `nav` for a header
   link ("Routing").
2. A new feature's route list is spread into `src/frontend/app/routes.ts`, in header order.
3. Extend `PrView` unless the page must render visibly at once, as the login page does.

## Before committing

1. Update `docs/` in the same commit; a new document is also added to the list in `AGENTS.md`.
2. Run `bun run fmt`, `bun run lint`, `bun run typecheck` and `bun test --parallel`.
