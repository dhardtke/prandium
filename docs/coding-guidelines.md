# Coding guidelines

Dependencies are pinned to exact versions — no `^` or `~` ranges — so an install resolves the same
tree on any machine and upgrades only ever happen deliberately. `bunfig.toml` sets `install.exact`,
which keeps a later `bun add` from writing a caret range and undoing that. `engines.bun` records
the required runtime, but Bun does not enforce the field on install: it documents the requirement
rather than gating it.

Upgrades arrive as pull requests from Renovate (`renovate.json`), which keeps the exact pins exact,
moves the action SHAs in `.github/workflows/` along with their version comments, and bumps the Bun
that CI runs through `.bun-version`. It waits until an npm release is three days old and refreshes
the lockfile's transitive dependencies weekly. `bun` and `@types/bun` arrive in one pull request,
as do `oxlint` and `oxlint-tsgolint`, since each pair has to move together. Nothing automerges:
merging to `main` deploys, so every upgrade is merged by hand once its `check` job is green.
The `bun` pull request also moves the exact `engines.bun`, and the server follows on deploy (see
"How a deploy works" in `docs/deployment.md`).

TypeScript and JavaScript use single quotes, CSS double; `bun run fmt` enforces both.

A member that overrides one from its base class is marked `override`. `noImplicitOverride` makes
`bun run typecheck` enforce it both ways, so a renamed or misspelled `CeElement` hook fails the
check instead of silently never running.

Private class members use `#` names, never TypeScript's `private` modifier. A `#` name is private
at runtime as well as to the compiler, and it cannot collide with a member a class inherits — which
matters for components, whose base is `HTMLElement`. Since a `#` name cannot be a parameter
property, `bun run lint` bans parameter properties altogether (`typescript/parameter-properties`);
a `private` method or field in a class body is not caught by any rule.

Code carries no comments unless one records something the code cannot: a non-obvious constraint, an
external quirk, a reason a surprising choice is deliberate. Never a restatement of what the next
lines do — if that is what a comment would say, the fix is a clearer name or a smaller function.
A comment that earns its place is one short line; there are no JSDoc blocks or file headers that
describe what the code does. Explanation of why the code is the way it is belongs in these
documents and in commit messages.

Code, comments, docs and commit messages are written in American English.

Commits go directly on `main`; don't open a feature branch unless asked.
