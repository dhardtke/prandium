# Styling guidelines

- **Oat first.** [Oat](https://oat.ink) provides typography, colors, form controls, tables and both
  themes. Hand-written CSS is a thin layer built from Oat's unprefixed tokens (`--primary`,
  `--muted-foreground`, `--border`, `--space-*`, `--radius-medium`, …), so it follows the active
  theme. Prandium's palette is a set of token values in `ui/app.css` — blue as the brand, the contrast
  tokens retuned — and `ui/contrast.test.ts` holds every text pair to WCAG AA (4.5:1) and the
  control borders to 3:1 in both themes. Before writing a box of your own, check whether Oat already draws it: **a card is `.card`**,
  a dropdown is `<ot-dropdown>`, a loading state is `aria-busy="true"`, layout is
  `.vstack` / `.hstack` / `.gap-*`, a scrolling table is `<div class="table">`, a toast is
  `toast()` from `ui/toast.ts`, which calls `ot.toast()`, and a confirmation is `confirmAction()`
  from `ui/confirm/confirm.ts`, Oat's `<dialog>`, never the native `confirm()`. Hand-rolling one of these produces a box that
  competes with Oat and has to be re-themed by hand. Never name a bespoke class after an Oat
  component or utility — `.row`, `.badge`, `.toast`, `.error`, `.small` and `.table` are all Oat's.
- **No CSS in JavaScript.** Every rule lives in an external `.css` file — `ui/app.css` for the
  document, `ui/shared.css` for utilities adopted by every component, and a component's `<tag>.component.css`
  beside its `<tag>.component.ts`. The build carries the component stylesheets as text inside its
  bundle (`ui/inline-styles.ts`); that is output, not source, and does not bend the rule.
- **Selectors nest.** A rule that would repeat a prefix — `article.open-card`,
  `article.open-card:hover .open`, `article.open-card .actions` — nests instead as
  `article.open-card { &:hover .open { … } & .actions { … } }`, so each block reads as one component
  and the media queries that only adjust it sit inside it. There is no preprocessor: this is the
  browser's own nesting, and `&` is always written explicitly.
- **Grouped surfaces.** The page is gray (`--background`) and cards are white (`--card`) without a
  border, so a card stands apart by its fill; `shared.css` also fills every `<details>` with
  `--card`. The 3:1 `--border` and `--input` are for controls — inputs, outline buttons, badges —
  not for boxes.
- **Every page fits a 320px-wide screen.** Narrow-screen rules live in the stylesheet of the
  component they adjust, at the existing breakpoints (560px header, 640px open cards, 720px
  forms and list rows), and a wide child shrinks or wraps rather than widening the page. Two traps: Oat's
  `.table` has a 320px `min-width`, which `shared.css` undoes, and a grid item with an
  `aspect-ratio` takes its width from its height unless it is stretched. At ≤720px `shared.css`
  gives every button, link button, select and text-like input a 44px (`2.75rem`) minimum height,
  and an icon button the same minimum width, so each fits a fingertip.
- **No stylesheet declares a font size.** Body text is Oat's `1rem` everywhere, headings come from
  Oat's fluid scale, and emphasis is weight and color. A heading that would be too loud is a lower
  level instead (the detail page's small cards are `h3`s), never a smaller font. Oat sets no root or
  `:host` font size, so nothing has to be pinned. `pr-rating` sizes its stars with `--star-size`,
  a width and height, not a font size.
- **Color buttons only with Oat's variants** — `data-variant="secondary|danger"`, `.outline`,
  `.ghost`, `.icon` — never with custom CSS or token overrides on the button. No exceptions remain:
  the header's icon-only controls are `.ghost.icon` buttons.
- Shadow roots don't inherit document styles, so Oat is adopted into each one _and_ linked in
  `index.html`. Its tokens are declared on `:root` and reach every shadow root by inheritance. The
  theme is `data-theme` on `<html>`, which `app.css` turns into `color-scheme`; Oat's
  `light-dark()` tokens follow it everywhere.
- **CSS keeps double quotes**, while the TypeScript around it uses single ones. Double quotes are
  the prevailing CSS convention, so the `[fmt]` section of `bunfig.toml` overrides `singleQuote`
  back off for `**/*.css`.
