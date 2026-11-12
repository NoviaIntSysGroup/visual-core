# The Figure API

## The `Figure` API

`Figure.create(W, H, opts)` → a figure builder (`opts`: `className`,
`ariaLabel`). `W`/`H` are points — author them with `cm()/mm()`. Builder methods
each append native SVG and return the builder:

- **`background(fill, radius?)`** — a full-canvas `<rect>` (e.g. `'var(--background)'` to
  replicate the slide tint; omit for a transparent figure), its corners rounded by `radius`.
- **`place(svgString, { x, y, w, h? })`** — drop a diagram-kit SVG string
  (`Diagram.create(…).render()`) at `(x, y)` scaled to width `w` (height follows
  its aspect unless `h` is given). The drawing is wrapped in a `<g transform>`,
  used verbatim via its own viewBox.
- **`image(href, { x, y, w, h })`** — a raster (a partner logo, a photograph) at
  `(x, y)`, sized `w × h`. `<image>` is native SVG, not `foreignObject`, so it
  exports and nests like any other element. `href` is the ordinary relative path,
  rewritten to a data URI on export — see [Raster images](SKILL.md#raster-images).
- **`math(tex, opts)`** — a LaTeX formula as vector paths (MathJax), so it exports
  to SVG, PNG and PDF like any other element. `(x, y)` is the formula's baseline,
  placed per `align`; `size` is the em in pt; `cls` overrides the colour. The page
  must load `core/math/math.js` then `core/math/tex-svg.js`, before `figure.js`. It is one
  formula per call and does not wrap.
- **`text(content, opts)`** — native `<text>`. `content` is a string (auto-wrapped
  when `opts.wrap` + `opts.w`) or an array of lines; a line is a string or an
  array of `{ t, cls }` segments for inline styling (e.g. a coloured word).
  `opts`: `x`, `y`, `w`, `align` (`'start'|'middle'|'end'`, default middle),
  `role`, `size` (pt), `weight`, `style`, `lineHeight`, `cls`, `wrap`. **`role`**
  (the SVG parallel of a slide tag) is the normal way to type text:
  `label | title | subtitle | slideBody | slideDetail | body | legend | fine` pulls
  **size + weight + style** from the figure type scale in `config.js` and applies the
  matching `.fig-<role>` class. `body` (8pt) is the default and the publication
  size; **`slideBody` (10.6pt) and `slideDetail` (8pt) are the two roles of a figure made for a
  slide** (see [Importing a figure onto a slide](SKILL.md#importing-a-figure-onto-a-slide)): they read 15.9pt
  and 12pt at the 1.5× import, the slide's `--t-base` and `--t-sm`. The other roles are for
  publication figures.
  `size`/`weight`/`style` override the role; `cls` adds classes.
- **`rule(x1, y1, x2, y2, opts?)`** — a `<line>` (e.g. a column divider), styled
  by `.figure-rule`. `opts: { stroke, width, opacity, dash, cls }` overrides that
  for one line — `dash` takes an array (`{ dash: [3.4, 2.8] }`) or a string.
- **`rect(x, y, w, h, opts)`** — a filled rect: a band, a zebra row, a bar, a
  colour chip. `opts: { fill, opacity, stroke, width, radius, cls }`.
- **`path(d, opts)`** — an arbitrary path for shapes the above don't cover (a
  milestone diamond), same paint options.
- **`nest({ x, y, scale? }, drawFn)`** — run `drawFn(fig)` and wrap everything it
  appends in one `<g transform="translate(x y) scale(s)">`, so a child composition
  authored in local coordinates lands at `(x, y)`. The basis of figure nesting.
- **`nestModule(M, { x, y, scale?, step? })`** — nest a whole composition
  **module** instead of a bare `drawFn`. Prefer this: because the module carries
  its bounds, the child's debug frame can be drawn too, which a bare `drawFn`
  can never know. `step` fixes a stepped child at one state.
- **`render()`** → the figure `<svg>` string. **`mount(...)`** usually calls this
  for you.

Use `rule`/`rect`/`path` rather than building SVG strings by hand with `raw()`.
They round coordinates the same way the rest of the kit does and keep appearance
in one place; hand-built markup is how `.toFixed(2)` noise and stray
`stroke-dasharray` attributes accumulated here before.

Size + weight + style come from the type scale (`Config.figure.type` in
`config.js`) via `role`; the `.fig-<role>` classes in
[`figure.css`](../../figure-kit/figure.css) add **colour only** —
`.fig-label`, `.fig-title`, `.fig-subtitle`, `.fig-slideBody`, `.fig-slideDetail`,
`.fig-body`, `.fig-legend`, `.fig-fine`, plus `.fig-accent` (inline emphasis) and
`.figure-rule`.
Put colour there; size/weight/style live in `config.js`.

### `mountModule(M, opts)` — what a figure document calls

`Figure.mountModule(M, { step })` is the whole script in a
figure document. It builds the canvas from the module's own `width`/`height`,
paints the background (corners rounded by the module's optional `radius`, in points), drops the drawing in (`nest` when static, `draw(fig, step)`
when stepped), and mounts the chrome — so no document restates a size, a title,
or a step count. `step` opens the page on a given state (an index or `'last'`).

### `mount(opts)` — the underlying chrome

`Figure.mount({ figure, title, name, steps, step, redraw })` renders a
figure and injects the toolbar (title, physical size, **Export SVG** / **Export
PNG** / **Export PDF**, and the **Debug** toggle) — the figure-side equivalent of
`Deck` injecting `#deck-chrome`. Inside an iframe it also posts its metadata (`name`,
`title`, `widthCm`, `heightCm`, `sizeLabel`) to the parent, for landing-page thumbnails. `name` is the download basename. For stepped figures, `steps` (total
count) and `redraw(step)` (returns a figure object) grow Back / Next buttons and a
"Step N of M" counter, and `step` sets the initial state (see [Stepped
figures](SKILL.md#stepped-figures)). **Call `mountModule` instead** unless a document
genuinely needs to assemble its own figure object.

## Debug frames

Turning the debug frame on for a figure turns it on for **everything inside it**.
There is no flag to set and nothing to write in a figure: press
**Debug** in the figure chrome.

It works because the frames are always in the DOM and merely hidden.
`Diagram.render()` emits each diagram's viewBox outline, `Figure.render()` emits
the page's, and `fig.nestModule()` emits a nested child figure's; `.debug-frame`
in [`diagram.css`](../../drawing-kit/diagram/diagram.css) hides them all until the button
puts `.debug-on` on `<body>`. Three levels are styled apart — `--page`, `--nest`,
`--component` (a placed diagram) — because a figure with several placed diagrams
otherwise reads as a pile of identical rectangles, and the stroke is
`non-scaling-stroke` so a deeply scaled diagram's frame is not thinner than the page's.

Two consequences worth knowing:

- **The toggle survives stepping.** The class is on `<body>`, not on the `<svg>`
  the stage replaces on every step, so you can leave it on and click through.
- **Frames never ship.** `serialize()` deletes them from the export clone, so SVG,
  PNG and PDF are unaffected whatever state the button is in. It does this
  *after* the style-inlining pass, which pairs source and clone children by
  index — removing them earlier would hand every later sibling its neighbour's
  computed style.

Decks get the same frames free (they load `diagram.css`, and every diagram
draws its own), waiting on a `.debug-on` toggle in `#deck-chrome`.
