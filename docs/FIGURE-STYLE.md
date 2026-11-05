---
name: figures
description: >-
  Compose diagram-kit drawings, nested figures, and native SVG text into publication
  figures on a cm-sized canvas, and export them as SVG / high-res PNG / vector PDF. Use when
  building a figure under `figures/<name>/`, or editing the figure kit (`core/figure-kit/`).
  A figure is also the one reusable drawing: decks import figures and figures nest each
  other; introducing a new shared piece (icon, theme change, any `core/` change) is ask-first.
---

# Building Publication Figures

This skill governs how to assemble **publication figures**: a chosen physical
canvas (cm) holding diagram-kit drawings plus captions/labels, exported as a
self-contained **SVG**, **600 dpi PNG**, or **vector PDF**. It is a sibling of the deck skills:

- [`slide-decks`](SLIDE-STYLE.md) — authoring slides (Reveal).
- [`diagrams`](DIAGRAM-STYLE.md) — *constructing* diagrams with the kit.
- **`figures` (this) — *composing* them into figures.**

Figures and decks share one engine and **the same figures** — a drawing is
authored once, as a figure, and used in both. Only the front-end differs: a deck is Reveal
slides; a figure is one native `<svg>`.

## When to use this

- Building a new figure under `figures/<name>/index.html`.
- Editing the figure kit ([`core/figure-kit/figure.js`](../figure-kit/figure.js) /
  [`figure.css`](../figure-kit/figure.css)).

Just placing an existing diagram on a *slide* is [`slide-decks`](SLIDE-STYLE.md);
*building* a diagram is [`diagrams`](DIAGRAM-STYLE.md).

## Golden rule: compose, don't extend

Build figures from the **diagram kit**, **icons**, **theme tokens**, and **other
figures**. A new icon/colour or any `core/` change (including the figure
kit itself) is discussed with the user first — these files are shared across every
deck and figure.

## Why native SVG (not a slide screenshot)

A figure is built entirely from **native SVG** — the drawings are real `<svg>`
paths/text and captions are SVG `<text>`. It never uses `<foreignObject>`, so the
output is portable and editable in Illustrator/Inkscape and rasterizes cleanly.
(A whole *slide* is HTML/CSS and can only be wrapped in SVG via `foreignObject`,
which only renders in a browser — that is why figures are a separate front-end.)

## Points are the unit

Geometry is in **points** (1 canvas unit = 1 pt; the deck/figure world is point
based — see [AGENTS.md](../AGENTS.md)). Author the canvas in cm and convert at the
boundary with `Units.cm()/mm()/pt()` (`core/drawing-kit/units.js`; `cm(8)` → 226.77 pt). When the exported
SVG is imported at its authored width, **1 unit renders as exactly 1 pt**, so a
`role: 'body'` (8 pt) line is 8 pt at that width. See [Font sizing](#font-sizing).

## A figure is a composition module + a thin shell

A figure is split in two, **two levels deep** under `figures/<name>/` so
`../../core/...` paths resolve (the core's own example figures sit one level deeper
and link the core as `../../../`):

1. **The composition module** `figures/<name>/<name>.js` — the content. It declares
   one global `window.<Name>Figure = { width, height, title, name, className,
   ariaLabel, draw }`. `draw(fig)` does all the drawing in the figure's **own local
   coordinates** (origin `0,0`) and adds **no** `background` — the canvas size,
   background, and chrome are the shell's job. Because the content is a loadable
   module (not an inline `<script>`), **any other figure can nest it** and any deck
   can import it (see below). The figure's own drawing appearance, if any, sits
   beside it in `figures/<name>/<name>.css`, keyed on its diagram's SVG class.
2. **The shell** `figures/<name>/index.html` — identical boilerplate for every
   figure: link the CSS, load the scripts in dependency order (ending with this
   figure's module), then build a canvas of the module's size, `nest` its drawing,
   and `mount`:

```html
<link rel="stylesheet" href="../../core/theme/theme.css">
<link rel="stylesheet" href="../../visuals/brand.css">
<link rel="stylesheet" href="../../core/drawing-kit/icons/icons.css">
<link rel="stylesheet" href="../../core/drawing-kit/diagram/diagram.css">
<link rel="stylesheet" href="./my-figure.css">     <!-- this figure's own styles, if any -->
<link rel="stylesheet" href="../../core/figure-kit/figure.css">
<link rel="stylesheet" href="../../core/theme/chrome.css">
...
<script src="../../core/theme/config.js"></script>
<script src="../../core/drawing-kit/units.js"></script>
<script src="../../core/drawing-kit/icons/icons.js"></script>
<script src="../../core/drawing-kit/diagram/diagram.js"></script>
<script src="../../core/figure-kit/figure.js"></script>
<script src="./my-figure.js"></script>     <!-- this figure's composition module -->
<script>
  Figure.mountModule(window.MyFigure);
</script>
```

That one call is the **whole** script, in every figure document, static or
stepped: the module already carries its size, metadata, and step count, so
`mountModule` builds the canvas, paints the background, drops the drawing in
(`nest` for a static figure, `draw(fig, step)` for a stepped one), and mounts the
chrome. A stepped figure that should open on its last state passes it:

```js
Figure.mountModule(window.ExampleStepsFigure, { step: 'last' });
```

Link `config.js`, `units.js`, `icons.css`/`icons.js`, the diagram kit, and
`core/theme/chrome.css`, then `figure.js`; then the `.js` and `.css` of **every figure
this one nests**, and the figure's own module last.
`config.js` carries the figure font + type scale; `units.js` carries the
`cm()/mm()/pt()` converters. The engine (`core/figure-kit/`) stays project-agnostic —
**all figure content lives under `figures/`**, never in `core/`.

**Several modules, one file.** When drawings share size settings — a family of
variants on one canvas height, say — one file may export one module per variant
plus the figure that sets them side by side. Each is an ordinary module: a deck
imports a variant by its global, and the side-by-side figure nests them.
[`core/example/figures/example-steps/`](../example/figures/example-steps/) is the worked example.

## The composition-module template

**Every figure module has the same nine sections, in this order, under these
names.** Sections 4, 5 and 6 are where a figure differs; the rest is the same
shape everywhere, so any figure reads like the one next to it and a maintainer
always finds the canvas at the top and the arithmetic at the bottom. Omit a
section a figure genuinely has no use for (a static figure has no step model);
never reorder or rename one.

```js
/* <Title> — figure composition module.
   <W> × <H> cm[, N steps]. <what it shows and why it is built this way> */
(function () {
  /* 1 · Imports ------ the same handful of globals in every figure */
  var cm = window.Units.cm, TYPE = window.Config.figure.type, bold = window.Diagram.bold;

  /* 2 · Canvas ------- the page, and the spacings that place its top-level blocks */
  var PAGE = { w: cm(18), h: cm(9), margin: cm(0.5), splitX: cm(11.5) };

  /* 3 · Type --------- point sizes AND every line advance, each named once */
  var TEXT = { title: TYPE.title.size, body: TYPE.body.size, fine: TYPE.fine.size };
  var ROW  = { body: TEXT.body * 1.2, caption: TEXT.fine * 1.25 };

  /* 4 · Colour ------- theme tokens only; a hue and its tint side by side */
  var COLOR = { llm: 'var(--graphic-secondary)', active: 'var(--text)', idle: 'var(--edges)' };
  var TINT  = { llm: 'var(--graphic-secondary-tint)' };

  /* 5 · Layout knobs - INPUTS ONLY, grouped by intent, non-obvious keys commented */
  var BOX = { w: cm(2.5), h: cm(4.2), icon: cm(1.0) };

  /* 6 · Content ------ every string and the ariaLabel, in one place */
  var COPY = { …, ariaLabel: '…' };

  /* 7 · Steps -------- ONE RECORD PER STEP, reading down like a storyboard */
  var STEP = [ { active: [], job: null }, … ];

  /* 8 · Derived ------ memoized; `var g = GEO();` at the top of every draw */
  var _geo;
  function GEO() { return _geo || (_geo = { … }); }

  /* 9 · Helpers → draw → export */
  function draw(fig, step) { var g = GEO(); … }

  window.<Name>Figure = {
    width: PAGE.w, height: PAGE.h,
    title: '…', name: '…', className: '…', ariaLabel: COPY.ariaLabel,
    steps: STEP.length,     // stepped figures only
    images: IMAGES,         // figures that draw rasters only — see Raster images
    draw: draw
  };
})();
```

The rules behind the shape:

- **`PAGE` always**, never bare `W`/`H` or a spray of `padL`/`padR`. `PAGE.w` is
  the authored width in every figure, and height is authored the same way —
  `height: PAGE.h` — *unless it falls out of content*: a data row list, a
  measured box/text stack, or nested children.
  Those compute it in section 8 and export it as
  `get height() { return GEO().h; }` — a getter, not `height: GEO().h`, so the
  file loads before anything its `GEO()` reads (same reason `GEO()` is a
  function — next bullet), with a comment saying it is derived.
- **Knobs are inputs only.** A key computed from another (`linkY = h / 2`)
  belongs in section 8, so tuning a knob never means hunting through arithmetic.
  Children keep their own intrinsic sizes (`FRAME.width`, `PANEL.width`); a module
  never restates them.
- **Name every line advance in section 3.** Never write `TEXT.fine * 1.15` at a
  call site — that is how four different unnamed ratios ended up in this repo.
- **One record per step.** `STEP` is an array of per-step records, so the count
  is `STEP.length` in every figure and each row reads as one beat of the
  animation. Parallel arrays (`{ active: […], job: […] }`) are the old shape;
  they made the step count spell itself three different ways.
- **`GEO()` is a memoized function**, called once at the top of `draw`. Being a
  function costs one line and makes the cross-module case (a figure that reads
  another figure's exported layout) the same shape as every other figure rather
  than a special case.
- **No debug toggle.** The kits draw the frames — see [Debug frames](#debug-frames).
- **Positioning rules are the diagram kit's, unchanged:** one named delta for
  everything in a chain or group, and align borders by reference (`cross()` is
  TikZ's `-|`) rather than typing a similar coordinate twice. See
  [`diagrams`](DIAGRAM-STYLE.md#positioning-one-rhythm-one-delta-no-near-misses).

[`core/example/figures/example-steps/example-steps.js`](../example/figures/example-steps/example-steps.js)
is the worked stepped module.

## Debug frames

Turning the debug frame on for a figure turns it on for **everything inside it**.
There is no flag to set and nothing to write in a figure: press
**Debug** in the figure chrome.

It works because the frames are always in the DOM and merely hidden.
`Diagram.render()` emits each diagram's viewBox outline, `Figure.render()` emits
the page's, and `fig.nestModule()` emits a nested child figure's; `.debug-frame`
in [`diagram.css`](../drawing-kit/diagram/diagram.css) hides them all until the button
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

## Stepped figures

A figure with multiple states (e.g. an animation) declares a `STEP` array — one
record per step (template section 7) — and changes `draw(fig)` to
`draw(fig, step)`. The chrome grows Back / Next buttons and a "Step N of M"
counter automatically:

```js
// In the module — draw receives the step index (0-based)
function draw(fig, step) { var s = STEP[step]; … }

window.MyFigure = {
  width: PAGE.w, height: PAGE.h,
  title: '…', name: '…', className: '…', ariaLabel: COPY.ariaLabel,
  steps: STEP.length,   // always the array's length — never a hand-written count
  draw:  draw
};
```

```js
// In the shell — the same one call, plus where to open
Figure.mountModule(window.MyFigure, { step: 'last' });
```

`mountModule` sees `M.steps`, so it calls `M.draw(fig, step)` directly rather
than via `fig.nest()` (which only passes `fig`), and hands `Figure.mount` the
`redraw` it needs. `step` picks the state the page opens on — an index, or
`'last'` for the final state, usually the one worth exporting.

Do **not** clamp the step inside `draw`: `mount` clamps the initial step and the
Back/Next buttons are bounded, so `draw` is only ever handed a valid index. To
nest a stepped figure into a composite, fix its state with
`fig.nestModule(M, { x, y, step: 3 })`.

### Played figures: `autoplay` + `holds`

Some animations have a beat too small to press through — a figure that appends
one word per frame is seventeen presses of nothing. Such a module adds two
fields and is then **played** on a slide instead of stepped:

```js
autoplay: 300,          // ms per frame
holds:    [0, 11, 12],  // frame indices where playback waits for the presenter
```

The deck's `figure` block honours both: it emits **one fragment per
hold** rather than one per state, and a timer walks the frames between them. So
one press plays one segment of the animation and stops at the next hold. The
frames themselves are ordinary steps — `draw(fig, step)` is unchanged, the
figure page still walks them with Back / Next, and any frame still exports.
`holds[0]` is the state the figure opens on (normally `0`).

A hold is also how an animation gets a **beat to be read**: hold the frame that
sets a new scene, so one press changes what is on screen and the next sets it
moving. Without that, a segment swaps its subject and starts animating in the
same press, and the room never catches what it was asked to look at.

Generating `STEP` rather than typing it is right here — one record per frame
still holds, the array is just built from the content — a figure that writes out
example sentences word by word derives both `STEP` and `HOLDS` from those
sentences. Nothing animates when
Reveal's fragments are off, which covers a normal tab, `?thumb`, and
`?print-pdf`: those all get the final frame, exactly as a stepped figure does.

**Every reusable drawing is a figure**, static or stepped. One with no `steps` is
a still drawing; one with `steps` animates. Either is imported onto a slide whole
(see below) and nested into another figure with `fig.nestModule`.

## Importing a figure onto a slide

A slide shows a drawing by importing its figure: scaling is uniform, so a figure
imports exactly as a placed chart does. Use the deck's `figure`
block, naming the module's global — Reveal fragments then drive the steps, one
per state beyond the first:

```js
{
  "type": "figure",
  "module": "ExampleStepsFigure"
}
```

Static figures work through the same block (no `steps` → no fragments). The size
comes from the deck's one import rule, `1.5 × the authored width, or the largest
value that fits`; a 10pt figure label therefore reads 15pt on a slide — level
with the slide's own `--t-base` prose.

Two consequences worth authoring against:

- **Label at 10pt by default.** A figure destined for a slide should carry its
  primary labels at the 10pt roles (`slideBody`, `label`, `title`, `subtitle`),
  which land at 15pt on the slide. Step down to 8pt (`body` — the publication
  size) only for detail that is deliberately secondary, and to 6pt
  (`legend`, `fine`) only for genuinely
  publication-grade fine print — a legend or data annotation that exists for the
  reader who zooms into the PDF handout, not for the room. A figure whose
  *primary* labels are 8pt is under-sized for a slide even though it is a correct
  print figure; a pure print figure keeps its own sizes and simply shouldn't be
  imported as-is.
- **The scale default is a slide rule.** Figure-to-figure nesting stays at 1.0
  (`fig.nestModule` with no `scale`), because in print the authored cm size *is*
  the real size. Never carry the 1.5 into a composite.

An imported figure brings its page margins with it (`PAGE.margin`). A figure made
to be placed — one diagram, captioned by whoever places it — has no margin: its
canvas is the diagram's own.

## Nesting figures

`fig.nest({ x, y, scale? }, drawFn)` drops a child composition into a parent at
`(x, y)`, optionally scaled. The child's `drawFn(fig)` draws in its own local
coordinates; everything it appends is wrapped in one flat `<g transform>` — the
same construct `place()` uses, so the export pipeline (oklch→sRGB, baseline `dy`,
style inlining) recurses through it and the output stays **a single portable SVG**
(no nested `<svg>`, which PowerPoint/Illustrator import inconsistently).

**Prefer `fig.nestModule(M, { x, y, scale?, step? })`** — same thing, but it takes
the module instead of a bare `drawFn`, so it knows the child's bounds and can
draw its debug frame. Reach for plain `nest` only when there is no module.

Because every figure is a `{ width, height, draw }` module, a composite figure
imports **no text of its own** — it loads its children's sibling modules and nests
each one, adding only the connective layout (here, two section headings and a
rule). The children stay the single source of truth for their content; edit a
caption once and every figure that nests it updates.

```html
<!-- figures/overview/index.html — nests two whole figures -->
<script src="../part-a/part-a.js"></script>
<script src="../part-b/part-b.js"></script>
<script src="./overview.js"></script>   <!-- its draw() uses the two globals above -->
```

```js
// figures/overview/overview.js
var A = window.PartAFigure, B = window.PartBFigure;
function draw(fig) {
  var g = GEO();
  fig.text([COPY.headings[0]], { x: PAGE.w / 2, y: g.topA - SECTION.titleGap, role: 'title' });
  fig.nestModule(A, { x: 0, y: g.topA });        // the whole part-a figure
  fig.rule(PAGE.margin, g.ruleY, PAGE.w - PAGE.margin, g.ruleY);
  fig.text([COPY.headings[1]], { x: PAGE.w / 2, y: g.topB - SECTION.titleGap, role: 'title' });
  fig.nestModule(B, { x: 0, y: g.topB });        // the whole part-b figure
}
```

A composite is itself a module, so it too can be nested into a larger figure. Use
`scale` to place a child smaller — everything in it (text included) scales
uniformly, exactly like a `place()`d diagram.

## Landing page listing

When adding a new figure under `figures/<name>/index.html`, also add a card for
it to the project's root `index.html` Figures panel. Keep the card's metadata
paragraph generic (`Publication figure`) and mark it with `data-figure-meta`;
the landing page reads the live `window.FigureMeta` from the figure's `?thumb`
iframe, so title and physical size stay in sync with the figure's actual
`Figure.mount(...)` call. Do not duplicate hand-written dimensions on the
landing page.

## The `Figure` API

`Figure.create(W, H, opts)` → a figure builder (`opts`: `className`,
`ariaLabel`). `W`/`H` are points — author them with `cm()/mm()`. Builder methods
each append native SVG and return the builder:

- **`background(fill)`** — a full-canvas `<rect>` (e.g. `'var(--background)'` to
  replicate the slide tint; omit for a transparent figure).
- **`place(svgString, { x, y, w, h? })`** — drop a diagram-kit SVG string
  (`Diagram.create(…).render()`) at `(x, y)` scaled to width `w` (height follows
  its aspect unless `h` is given). The drawing is wrapped in a `<g transform>`,
  used verbatim via its own viewBox.
- **`image(href, { x, y, w, h })`** — a raster (a partner logo, a photograph) at
  `(x, y)`, sized `w × h`. `<image>` is native SVG, not `foreignObject`, so it
  exports and nests like any other element. `href` is the ordinary relative path,
  rewritten to a data URI on export — see [Raster images](#raster-images).
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
  size; **`slideBody` (10pt) is the one to reach for in a figure destined for a
  slide** (see [Importing a figure onto a slide](#importing-a-figure-onto-a-slide)),
  with **`slideDetail` (9pt)** the half-step under it for dense secondary text that
  will not fit at 10.
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
[`figure.css`](../figure-kit/figure.css) add **colour only** —
`.fig-label`, `.fig-title`, `.fig-subtitle`, `.fig-slideBody`, `.fig-slideDetail`,
`.fig-body`, `.fig-legend`, `.fig-fine`, plus `.fig-accent` (inline emphasis) and
`.figure-rule`.
Put colour there; size/weight/style live in `config.js`.

### `mountModule(M, opts)` — what a figure document calls

`Figure.mountModule(M, { step })` is the whole script in a
figure document. It builds the canvas from the module's own `width`/`height`,
paints the background, drops the drawing in (`nest` when static, `draw(fig, step)`
when stepped), and mounts the chrome — so no document restates a size, a title,
or a step count. `step` opens the page on a given state (an index or `'last'`).

### `mount(opts)` — the underlying chrome

`Figure.mount({ figure, title, name, steps, step, redraw })` renders a
figure and injects the toolbar (title, physical size, **Export SVG** / **Export
PNG** / **Export PDF**, and the **Debug** toggle) — the figure-side equivalent of
`Deck` injecting `#deck-chrome`. It also exposes `window.FigureMeta` (`name`,
`title`, `widthCm`, `heightCm`, `sizeLabel`) for landing-page thumbnails and other
same-origin index surfaces. `name` is the download basename. For stepped figures, `steps` (total
count) and `redraw(step)` (returns a figure object) grow Back / Next buttons and a
"Step N of M" counter, and `step` sets the initial state (see [Stepped
figures](#stepped-figures)). **Call `mountModule` instead** unless a document
genuinely needs to assemble its own figure object.

## Raster images

Some artwork can't be a path — a partner logo that only exists as a PNG, a
photograph. `fig.image()` places it, and the file is referenced by its **ordinary
relative path**, exactly as a deck would write it. Nothing is copied into the
repo, and swapping a logo means replacing one file.

A module that draws images **declares them**, so the kit can resolve them before
`draw()` runs:

```js
window.MyFigure = {
  width: PAGE.w,
  get height() { return GEO().h; },   // derived — see the PAGE rule
  …,
  images: COPY.research.concat(COPY.industry),   // every path this figure draws
  draw: draw
};
```

`mountModule` preloads that list and **returns a promise**; no shell reads the
return value, so the one-line call is unchanged. Two things come back from each
file, and they do not have the same reach:

- **Its natural size**, via `Figure.imageSize(href)` → `{ w, h }`, so a module
  lays artwork out by the file's real aspect ratio instead of a hand-copied
  number that rots the day someone drops in a better crop. Read from an `<img>`,
  so this works from `file://`.
- **Its bytes**, inlined as a data URI on export. This needs `fetch`, and
  `file://` forbids it — so **exporting** a figure with images needs the dev
  server (`bun run core/tools/serve.js`). **Viewing** one does not.

That asymmetry is the deliberate trade: `file://` binds the *page*, and paying
for it with a committed base64 copy of every logo would be worse than asking for
a server at the moment of export. When the bytes aren't available the chrome
**disables the three exports and says why** — and `serialize()` throws rather
than emitting a figure with the artwork missing, which would look fine to
whoever exported it and be discovered by whoever opened it next.

A grid of logos placed in equal boxes rarely *looks* equal: the ink a mark puts
down can differ 4:1 across a set of vendor files. To scale marks to one optical
weight, a module records each file's ink fraction as a number beside its path,
measured once by `bun run core/tools/mark-coverage.js <file|folder>...` (8-bit PNG). It
is measured offline because reading pixels in the browser means `getImageData`,
and a `file://` image taints the canvas.

The deck's `figure` block honours `images` too: it preloads the set once
per figure before its first draw, so a raster figure imports onto a slide like
any other. Deck documents are two levels deep as well, so the same
`../../visuals/assets/...` path resolves from both surfaces.

## Export

The chrome's export buttons call three functions private to `figure.js`, and
produce **self-contained** files (the source is all native SVG):

- **`download(svgEl, filename)`** — vector SVG with computed styles inlined and a
  physical `cm` size.
- **`downloadPng(svgEl, filename)`** — rasterized at 600 dpi with
  a pHYs chunk tagging the resolution, so it imports at its true physical size.
- **`printPdf(svgEl, opts)`** — a **vector** PDF via the browser: opens the
  self-contained SVG at an exact-size `@page` and calls print (choose *Save as
  PDF*). Text stays vector and selectable; the page is the figure's exact cm size.
  No external libraries — mirrors how the decks export PDF.

The exporter normalizes four things that break in external consumers — **this is
the whole reason figures export cleanly, so keep it when extending the export**:

1. **OKLCH → sRGB.** The theme palette is OKLCH; PowerPoint and many tools render
   `oklch()`/`color-mix()` as **black**. Every colour is converted to sRGB
   hex/rgba via a 1×1 canvas.
2. **`dominant-baseline` → `dy`.** The diagram kit centres labels with
   `dominant-baseline:central`, which PowerPoint ignores (text rides high). The
   exporter rewrites it to `auto` + `dy="0.32em"`.
3. **Strips `fill`/`stroke` presentation attributes** that may still carry
   `var()`/oklch values a naive consumer reads instead of the inlined style.
4. **Physical `width`/`height` in cm.** A unitless SVG width is read as px@96dpi —
   0.75× too small, since our units are points (72dpi) — so PowerPoint shows a
   24cm figure as 18cm. The exported SVG sets `width`/`height` in `cm` (from the
   viewBox), keeping the viewBox for the coordinate mapping.

PNG bakes fonts, markers (arrowheads), and the baseline into pixels, so it is the
safest format for consumers with patchy SVG support. Known caveat: PowerPoint's
SVG importer supports `<marker>` (arrowheads) inconsistently — if arrow tips
disappear in PowerPoint SVG, use the PNG or emit arrowheads as plain paths.

## Fonts & looking identical everywhere

Figures use **Arial/Helvetica**, in every project: a brand changes the slide fonts,
never this one. The font is `Config.figure.font`
in [`config.js`](../theme/config.js), which `config.js` publishes as the CSS custom
property `--f-figure` (one source of truth, shared with `figure.js`'s text
measuring). [`figure.css`](../figure-kit/figure.css) maps it onto `--f-body`/
`--f-display` for the figure subtree, and [`diagram.css`](../drawing-kit/diagram/diagram.css)
points `--diagram-label-font` straight at `--f-figure`, so **a drawing is Arial
wherever it is placed — in a figure or on a slide.** That is deliberate, not a
leak: a label's width is geometrically coupled to the box it sits in, so a
diagram that read Arial in a figure and system-ui on a slide would lay out
differently on the two surfaces. Slide *prose* around the drawing is unaffected
and keeps the deck's `--f-body`. **Helvetica is
one of the 14 standard PDF fonts and Arial is metric-compatible**, so the SVG and
the vector PDF render identically on any machine **without embedding a font** —
that is the whole point of using it here.

If you ever switch figures to a non-standard font, identical rendering is no longer
free: you must **embed** it (base64 `@font-face` in the SVG, or a PDF that subsets
it) or **outline** the text to paths (e.g. opentype.js) — otherwise other viewers
substitute a different font. Stay on Arial/Helvetica to avoid all of that.

## Reuse contract: a placed figure is the drawing only

A figure made to be placed by a slide or another figure is only reusable if it is
**the drawing and nothing else**: its appearance defined on its diagram's own SVG
class (in `<name>.css`), and no text of its own around it. Put the palette on a
wrapping HTML element instead and the drawing renders black inside a figure; emit
the title or description as HTML and a figure can never use it. The surrounding
prose belongs to whoever places the drawing — a slide writes it as its own
`title`/`subtitle`/`text` blocks, a figure draws it with `fig.text`. When building
or editing such a drawing ([`diagrams`](DIAGRAM-STYLE.md)), keep its
`--diagram-*`/palette tokens on the SVG class and let the caller own the captions.

The contract has a second half, and it binds the **figure kit**: a figure-wide
default must never outrank a placed drawing's own rules. Express figure
defaults as **inherited** properties on `.figure` (the root `<svg>`), not as
declarations on element selectors — `fill` on `.figure` is inherited and loses to
any element that styles itself, while `.figure text { fill: … }` (0,1,1) beats the
diagram kit's `.diagram-node-label` (0,1,0) and silently freezes **every** placed
label at one colour. That rule existed once, and it made the diagram kit's
per-node `appearance: { label: … }` a no-op inside figures: the custom property
was set correctly and the fill ignored it, so a drawing's active/inactive
states looked identical and nothing hinted why. When adding a figure-level
default, ask which is stronger — the kit's default or the drawing's own rule —
and make sure the answer is the drawing.

## Font sizing

Because the canvas is in points, importing the SVG **at its authored width** makes
1 unit = 1 pt, so each `text` renders at its role/size in points (a 24 cm figure
with `role: 'body'` → 8 pt). It scales linearly: **pt = size × (import width ÷
authored width)**. A *placed diagram*'s internal labels scale with its placement — a 10 pt
label placed at `w = 185` of a 250-unit viewBox renders at `10 × 185/250 ≈ 7.4`
pt.

**A diagram's label size is authored, not passed in.** Every diagram declares
the size it was drawn at in its own `DIAGRAM` block (`fontSize` + `lineHeight`,
e.g. a `LABEL_SIZE = 8`, or the figure type scale via `TYPE.<role>.size`). That
is a declaration rather
than a preference: these drawings measure a line of text at load and hang their
row rhythm, bus lines and bands off the result, so the size is geometry. A
caller-supplied `fontSize` would grow the labels while the rows stayed put, which
is why none of them takes one — **to make a placed diagram's labels bigger, place
the diagram bigger**, and it all scales together.

A diagram must therefore measure through *its own* metrics —
`measureBlock(segments, { fontSize: diagramMetric('fontSize'), lineHeight:
diagramMetric('lineHeight'), padding: diagramMetric('padding') })` — never bare.
A bare `measureBlock` silently reads `Diagram.defaults` instead, so the
declaration and the layout drift apart the moment either changes. `lineHeight` is
the one that actually sets a text box's height; declaring `fontSize` alone leaves
the box on the kit's rhythm.

## Worked example & running it

[`core/example/figures/example-steps/example-steps.js`](../example/figures/example-steps/example-steps.js)
is the core's worked figure: a **stepped** module with all nine sections, a
diagram placed with `fig.place` and a caption drawn with `fig.text`, with
[`index.html`](../example/figures/example-steps/index.html) the thin shell. The
showcase deck imports it with a `figure` block. A project keeps its own
list of worked examples (composite, data-driven, raster) in its README.

Open any figure's `index.html` directly, or via the dev server
(`bun run core/tools/serve.js`), use the toolbar to export, and press **Debug** to
outline the page, any nested figures, and every placed diagram at once.
