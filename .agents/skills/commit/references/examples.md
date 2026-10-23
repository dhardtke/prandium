# Five real commit messages, annotated

These are taken verbatim from this repository's log. Three of them predate the
type prefix; their subject lines would now read `feat: …`. Everything below the
subject line is the current standard.

Read them in order. They run from the shortest correct message to the longest,
and the point of the sequence is that the length tracks how much reasoning there
was to record — not how much code moved.

Two of them are longer than the current standard asks for. Several subject lines
here would now be trimmed — "Load each route's script and stylesheet only when
that route is opened" would read "Load route scripts and styles on demand" — and
the six-paragraph message at the end is the ceiling for an unusually deep change,
not a model to match. Copy how each paragraph works, not how many there are.

## Contents

1. [No body at all](#1-no-body-at-all)
2. [One paragraph](#2-one-paragraph)
3. [Two facets, one gotcha](#3-two-facets-one-gotcha)
4. [Closing on verification](#4-closing-on-verification)
5. [The long form](#5-the-long-form)

---

## 1. No body at all

```
chore: Update AGENTS.md
```

That is the whole message, and it is correct. Nothing about editing an
instructions file needs explaining; a paragraph here would say "AGENTS.md was
updated" in more words and make the log slower to scan. `chore: Add .idea` and
`chore: Add oxfmt` are the same shape.

The test is not diff size. It is whether a reader would have a question the diff
cannot answer.

---

## 2. One paragraph

```
chore: Rename format scripts to fmt and apply oxfmt

Renames the "format"/"format:check" package scripts to "fmt"/"fmt:check"
and updates the command list in AGENTS.md. Running the script formatted
the repository with oxfmt for the first time, which accounts for the
whitespace-only changes across src, test, public and docs.
```

This diff touched every directory in the project, and it still only needs one
paragraph — because there is exactly one thing a reader needs told, and it is
the second sentence. Without it, the enormous whitespace diff looks like
something went wrong. With it, the reader knows to skip the whole thing.

That second sentence is the entire reason this commit has a body. Notice it is
doing the job described in SKILL.md as stating the negative space: nothing here
was reviewed line by line, and saying so up front is more honest and more useful
than letting someone find out by reading four hundred lines of reindentation.

---

## 3. Two facets, one gotcha

```
Use stock Pico buttons in the navbar and a switch for the theme

The navbar entries were plain links dressed up by twenty lines of bespoke
CSS, with a hover state invented for this project that matched no other
button in the app. They are now Pico buttons: `secondary outline` at
rest, and the active page renders as the solid `secondary` variant. No
stylesheet colours them — `#renderView()` toggles the `outline` class
next to the `aria-current` attribute it already managed, so the active
state is a change of Pico variant rather than a recolouring. What is left
in gz-app.css is sizing only, because Pico sizes buttons for touch and
the header is a single compact row.

The theme control loses its Auto mode and becomes a Pico switch. With
`system` gone there is no state meaning "no attribute", so `applyThemeTo`
always sets one. A visitor who has never chosen is seeded once from
prefers-color-scheme; the first flip stores an explicit choice that wins
from then on. A `"system"` value written by the previous version is no
longer valid and falls through to that same default, so this needs no
migration code.

The switch syncs by setting `input.checked` rather than re-rendering:
a re-render would destroy the input mid-click and drop keyboard focus
after a Space-bar toggle.
```

The structure is one paragraph per facet of the change, then a short one for the
detail that would otherwise get "cleaned up" by the next person.

Paragraph one opens with the problem in the past tense — twenty lines of bespoke
CSS and a hover state matching nothing else — then states the replacement, then
explains why no stylesheet colours the buttons. That last clause is the reasoning
a reader could not recover from the diff.

Paragraph two carries the migration sentence. Someone reviewing a change to
stored preference values will immediately wonder about existing users; the
paragraph answers before they ask.

Paragraph three is three lines long and is arguably the most valuable in the
message. `input.checked` instead of a re-render looks like an inconsistency
until you know it protects focus during a Space-bar toggle. Written down, it
survives. Not written down, it gets refactored away and the bug comes back.

---

## 4. Closing on verification

```
Pin every dependency to an exact version and require Bun 1.4

Replaces the caret and "latest" ranges with the versions currently
resolved, so an install produces the same tree on every machine and an
upgrade is always a deliberate edit rather than a side effect of when
someone happened to run bun install.

bunfig.toml sets install.exact so a later `bun add` writes an exact
version instead of quietly reintroducing a range.

engines.bun records the runtime requirement. Bun does not enforce the
field — an install against ">=99.0.0" still succeeds — so it documents
the requirement rather than gating it, and the README says as much.

Verified on Bun 1.4.2: 27 tests pass, tsc is clean, the frontend modules
resolve, and a running server still serves the API, the app and the
vendored Pico stylesheet.
```

Two things to take from this one.

The third paragraph admits a limitation instead of overselling the change. It
would have been easy to write "engines.bun requires Bun 1.4" and leave it; the
message says the field is not enforced and is therefore documentation. Commit
bodies that only ever report success stop being trusted.

The closing paragraph is what verification should look like: the exact runtime,
the test count, the specific things exercised. "Verified" on its own tells a
reader nothing, because it does not distinguish between running the suite and
glancing at the file.

---

## 5. The long form

```
Load each route's script and stylesheet only when that route is opened

Opening the dashboard downloaded the whole app: all eleven component
scripts and all eleven component stylesheets, 35 requests and 94 KB, for a
page that needs five components. The chart, the set row and both detail
views were fetched, parsed and defined before the first paint, on every
visit, whether or not anyone went near them.

Two things caused it. gz-app statically imported all five route views, so
the module graph pulled in everything; and styles.js kept a hard-coded
manifest of every component and fetched all of their stylesheets behind one
top-level await.

Now define() awaits a component's stylesheet before registering the
element, and every component module awaits its own define(). Because a
top-level await blocks the modules that import it, awaiting a dynamic
import of a view resolves only once that view and everything it renders
have both their scripts and their CSS — so a lazily loaded page is fully
styled on its first paint, and stylesFor() can stay synchronous for the
constructor. The manifest is gone; a component is registered by existing.

A cold dashboard load now fetches five component scripts and five
stylesheets rather than eleven of each: 23 requests and 45 KB. The chart is
downloaded only when an exercise page is opened.

Three details the swap has to respect. The header updates synchronously so
a click is answered while the module is still in flight, and the outgoing
view stays on screen rather than the page going blank. A monotonic token
guards against two navigations resolving out of order, bumped on every
entry because navigate() re-dispatches hashchange for the current path.
And a failed import is caught and toasted instead of leaving a nav button
that looks dead.

Only the five route views are loaded dynamically. A component that a view
renders inside itself stays a static import in that view's module: those
elements are handed their data as properties, and assigning a property to
an element whose class has not been defined yet leaves an expando that
shadows the accessor for good, blanking the row or the chart with no error.
```

Six paragraphs, and each one is doing a different job.

**Problem, measured.** 35 requests and 94 KB against a page needing five
components. Concrete enough that the improvement can be checked later.

**Diagnosis.** Two named causes. Not "the bundling was inefficient".

**Mechanism, with the reasoning.** The middle sentence explains _why_ awaiting a
dynamic import is sufficient — because a top-level await blocks importers — which
is the non-obvious property the whole design rests on.

**Result, measured against the opening.** 23 requests and 45 KB, directly
comparable to the first paragraph's numbers. This is why the opening was
quantified.

**The details that look optional and are not.** Synchronous header update,
monotonic token, caught import failure. Each gets one sentence with its reason
attached.

**The boundary of the change.** Only route views are dynamic, and then the
hazard that forces it: assigning a property to an undefined element leaves an
expando that shadows the accessor permanently, with no error. That paragraph is
a trap marked on a map. It is worth more than the rest of the message.

Note what is absent throughout: no bullet lists, no "This commit", no adjectives
doing work that a number should do, and no sentence that could have been written
without reading the code.
