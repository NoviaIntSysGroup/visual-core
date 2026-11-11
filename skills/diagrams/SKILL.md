---
name: diagrams
description: >-
  Build or edit node/edge diagrams on this repo's shared diagram kit
  (`window.Diagram`, `core/drawing-kit/diagram/`). Use when drawing a new diagram
  inside a figure module (`figures/<name>/`), editing an existing one, or changing
  the diagram kit or its sibling chart kit (`core/drawing-kit/charts/`). A new
  diagram is a new figure, and a kit change is a `core/` change: both are discussed
  with the user first.
---

# Building Diagrams

This skill governs how to **construct** diagrams and composed SVG figures with
the shared kit so they stay simple and consistent. Authoring slide *content* (and
merely placing an existing figure onto a slide) is the
[`slide-decks`](../slide-decks/SKILL.md) skill.

The kit is [`core/drawing-kit/diagram/diagram.js`](../../drawing-kit/diagram/diagram.js)
(`window.Diagram`) + [`core/drawing-kit/diagram/diagram.css`](../../drawing-kit/diagram/diagram.css).
It builds diagrams the way TikZ does: declare named boxes, connect them by name,
let the layout fall out — instead of hand-tuning coordinate offsets.

## When to use this

- Drawing a new diagram in a figure module (`figures/<name>/<name>.js`).
- Editing an existing diagram.
- Changing the kit (`core/drawing-kit/diagram/diagram.js` / `.css`).

Just importing an existing figure into a deck (`{ type: 'figure', module }`)
needs none of this — see [`slide-decks`](../slide-decks/SKILL.md). A diagram that a deck or
another figure reuses is always a figure; see [`figures`](../figures/SKILL.md).

Reference files, read when the task needs them:

- [variants.md](variants.md) — several variants of one diagram, and their shared viewBox.
- [charts.md](charts.md) — data charts on the chart kit.
- [kits.md](kits.md) — changing the diagram or chart kit, once agreed.

## Golden rule: ask first, geometry in JS, appearance in CSS

- **A new diagram is a new figure, and a kit change is a `core/` change** —
  every deck, the landing page, and the editor/export chrome share the kit.
  Discuss either with the user before building. Reshape content into existing
  figures when you can.
- **Geometry is JS; appearance is CSS.** SVG path coordinates can't read CSS
  `var()`, so positions/sizes/gaps live in JS as numbers. Colours, strokes,
  fonts, and weights come from [`diagram.css`](../../drawing-kit/diagram/diagram.css) and
  the figure's own CSS via semantic theme tokens. There are **no font metrics at build
  time** (see [Sizing](#sizing--no-wrapping)).
- **Points are the unit.** Geometry numbers are points — the deck canvas is
  `960×540` (a PowerPoint 16:9 page), so 1 unit = 1 pt. A diagram's viewBox is
  its intrinsic size in points; for a figure meant for print, author the viewBox
  in physical units via `Units.cm()` / `mm()` / `pt()` (`core/drawing-kit/units.js`; e.g. `cm(8)` →
  226.77 pt). On-screen size is a CSS concern (`max-width: 100%`); physical cm
  reaches output only at an exported `<svg>`'s `width`/`height`, derived from the
  viewBox — **never put a `physical` flag on the diagram** (keep it
  mode-agnostic, sized by its viewBox).

## The simplest path

A diagram is four steps. Keep to them and a new figure stays small:

```js
var d = Diagram.create(W, H, { className: 'my-figure', ariaLabel: '…' });
d.node('a', { x: X, y: Y, w: WIDTH, frame: true, label: 'Hello' });   // 1. boxes
d.node('b', { x: X2, y: Y2, w: 40, h: 40, shape: 'circle', frame: true });
d.edge('a', 'b', { arrow: true });                                    // 2. wiring
return d.render('my-figure');                                         // → SVG string
```

1. **Set the viewBox + figure defaults once** on `create(...)` (gap, radius,
   `ariaLabel`). The default label `fontSize` and the geometry defaults come from
   `Diagram.defaults` (diagram.js); `lineHeight` defaults to `fontSize`.
2. **Declare boxes at a chosen width.** You set the width; for block-label boxes
   the **height falls out of the content** (see below). Plain / icon-only nodes
   still take an explicit `h`.
3. **Place boxes** by `x, y` — and when several must line up (rows or a band),
   by one rule (centre − h/2), and derive anything that must line up with an
   already-placed node from it — see
   [Positioning](#positioning-one-rhythm-one-delta-no-near-misses).
4. **Wire with edges** (node-to-node, or to bare coordinates for buses/ports).

## Nodes and labels

`d.node(name, spec)` — `spec` carries `x, y, w[, h]`, optional `shape`
(`'rect' | 'circle' | 'ellipse'`), `frame` (draw the box), `icon`, `class`,
`appearance`, and a `label`.

**A label is either:**

- **a string** — one label, placed `labelPos: 'center' | 'above' | 'below'`; or
- **a block label** — an **array of segments** for multi-line / titled content:

```js
label: [
  { lines: ['WP1: Integrated Domain Knowledge'], class: 'wp-title' },
  { lines: ['T1.1 …', 'T1.2 …'], gapBefore: 8, class: 'wp-task' }
]
```

Segment fields (all optional except the lines): `fontSize`, `class`,
`lineHeight`, `gapBefore` (space before the segment), `indent`.
**Padding applies to single-line boxes too** — "block label" just means "the kit
lays the text out," not "must be multi-line."

**Inline emphasis: use `Diagram.bold`, never a hand-written `<tspan>`.** Label
text is inserted raw, so a line can carry inline markup — but centred labels are
drawn with `dominant-baseline="central"`, and WebKit does not resolve a `<tspan>`'s
own baseline against its parent `<text>`. A bare `<tspan>` therefore drops to the
alphabetic baseline: in Safari the emphasised words ride up and render visibly
oversized, while Chrome and Firefox look correct. `Diagram.bold` emits the
`dominant-baseline="inherit"` that pins them.

```js
label: [{ lines: [Diagram.bold('Input'), 'Tell me a joke.'] }]     // whole line
lines: ['The cat sat on the ' + Diagram.bold('mat')]               // inline
Diagram.bold(t, { weight: TYPE.subtitle.weight, style: 'italic' }) // other roles
Diagram.bold('CC:', { cls: 'ps-legend-key', weight: null })        // weight in CSS
```

Block-label node fields: `padding` (number or `{x, top, bottom}`),
`minHeight`, `valign` (`'center' | 'top'`), `align` (`'center' | 'start' | 'end'`).
Horizontal padding lands on the side the text is anchored to; centred text needs
none.

## Sizing & no wrapping

- **Width is yours; height is the content's** — for **block-label nodes only**.
  Box height = `padding + Σ lineHeight` (TikZ "shrink to fit", height only),
  floored by `minHeight`. A plain or icon-only node has no content to measure, so
  it still takes an explicit `h`. There are no font metrics at build time, so
  **width is never auto-fit** — set `w`.
- **Text never wraps.** Pass each line explicitly and widen the node to fit. (The
  kit has no wrap helper — wrapping needs glyph metrics it doesn't have.)
- **Measure before placing.** `Diagram.measureBlock(segments, { padding,
  lineHeight, minHeight })` returns the height a block will get, so you can size
  and distribute boxes (e.g. a band of cards) *before* you create the nodes.

## Positioning: one rhythm, one delta, no near-misses

Three rules, in the order they bite. All three say the same thing: **a position
that means "the same as that one" must be computed from it, never re-typed.**

### 1. Place by centre so the rhythm is identical

When boxes must line up — rows, or a band whose edge taps share heights — place
each by its **centre**, offset by its own half-height, so the rhythm is identical
everywhere. (A standalone box can just take `x, y`.) `boxTop` is a small **local
helper you write**, not a kit call:

```js
function boxTop(c, h) { return c - h / 2; }   // top of a box of height h centred on y = c
```

When a set of boxes share a content shape (e.g. an id + two lines), derive **one**
height with `measureBlock` and reuse it as the centring offset for all of them,
rather than giving each box type its own height constant.

### 2. One delta for everything that belongs together

Elements in one chain or group — a column of boxes wired top to bottom, a row of
cards, a stack of rows — are separated by **one named gap variable**, and each
element after the first is **derived** from its predecessor. Author the first
position and the delta; never author the second, third, and fourth positions.

```js
// The column is a chain: input -> process -> output, one gap for the whole thing.
var COLUMN = { inputY: cm(1.40), flowGap: cm(0.60), boxH: cm(2.5), … };

var inputH = Diagram.measureBlock(inputSegments, { … });      // content-driven: measure it
var boxTop = COLUMN.inputY + inputH + COLUMN.flowGap;
var outputY = boxTop + COLUMN.boxH + COLUMN.flowGap;          // same delta, so the two
                                                              // connecting arrows are
                                                              // exactly the same length
```

Hand-placing each box at a plausible `cm()` instead is the bug this prevents: the
gaps come out *nearly* equal (`0.53` vs `0.60` cm), and the arrows drawn across
them are visibly different lengths. **Equal-looking gaps that are not the same
variable are a defect**, whatever the number says. The same holds for anything
else that repeats: a lane inset, a tap pitch, a caption's drop below its box.

### 3. Align borders by reference — `cross()` is TikZ's `-|`

To put something flush with another node, take the coordinate **from that node**.
`d.cross(a, b)` returns `{ x: from a, y: from b }` — exactly TikZ's `(a -| b)` —
and `d.between(a, b, t)` interpolates. Both resolve any ref: a node name, a
`'node.anchor'` (`n s e w ne nw se sw`), a `['node.anchor', { dx, dy }]` offset,
or a literal coord. Nodes must already be declared, so build the reference side
first.

```js
// The card's top border sits ON the text field's top border (usesX -| field.north-west),
// and the next card's bottom border ON the score table's bottom border.
var p = d.cross({ x: GEO.usesX, y: 0 }, 'text-field.nw');
d.node('card-0', { x: p.x, y: p.y, w: GEO.usesW, frame: true, … });

var q = d.cross({ x: GEO.usesX, y: 0 }, 'cands.sw');
d.node('card-1', { x: q.x, y: q.y - cardHeight(card), … });   // bottom-aligned
```

Two coordinates that *look* the same in the source (`cm(1.45)` here, `cm(1.55)`
there) are the failure mode: the borders land a millimetre apart and the figure
reads as sloppy at slide size. If two things are meant to line up, only one of
them owns a number.

## Variable order for composed figures

Keep a composed illustration's top-level variables in the order a maintainer
would tune the figure. Put **user-tunable knobs first**, then derived geometry.
Every non-obvious variable should carry a short same-line comment saying what it
moves, sizes, or controls. The same maintainer-first ordering governs figure
**composition modules** under `figures/` (see [`figures`](../figures/SKILL.md)
"Ordering a composition module") — the principle is shared; only the converters
differ.

The recommended order below is for a **viewBox-fraction** diagram (the on-screen
deck/figure diagrams authored with `x(v)`/`y(v)`). A **print-physical**
diagram authored directly in `cm()` follows the same shape but swaps the fraction converters for **named `cm()`
sizes** as step 4: the dimensions a human changes first (`DATA_W`/`DATA_H`,
`FRAME_W`/`FRAME_H`, the region gaps), then a `LAYOUT` knob object, then a
`COPY`/`FRAMES` content object, then derived geometry. Either way: knobs and
content above, derived geometry below.

Recommended order:

1. **ViewBox** — `VB_W`, `VB_H`. (No debug toggle: the kit draws every
   diagram's frame itself — see [Debug frames](../figures/figure-api.md#debug-frames).)
2. **`DIAGRAM` config** — kit-level metric overrides only when this whole figure
   needs them.
3. **Coordinate helpers** — `x(v)`, `y(v)`, and `s(v)` if needed.
4. **Authored geometry groups** — group by tuning intent, e.g. `COLUMN`,
   `OBJECTIVE_ROWS`, `PACKAGE_BAND`, `CONNECTORS`, `TEXT`, `LEGEND`.
5. **Derived geometry** — computed column positions, buses, shared rows, and
   helpers such as `boxTop(c, h)`.
6. **Content data** — labels, packages, link maps, and other authored content.

Example shape:

```js
var VB_W = 720;              // overall SVG width (points; 1 unit = 1pt)
var VB_H = 375;              // overall SVG height

// Typography from the config.js type scale — never hard-code point sizes.
var TYPE = window.Config.figure.type;
var TEXT = {
  bodySize: TYPE.body.size,   // base box text + line rhythm (the `body` role)
  taskSize: TYPE.fine.size    // dense detail rows step down to `fine`
};

var DIAGRAM = {
  className: 'project-structure', // CSS hook for this figure
  ariaLabel: '…',                 // accessible SVG label
  gap: 0,                         // connector standoff from node endpoints
  fontSize: TEXT.bodySize,        // default label size, from config (not a literal)
  lineHeight: TEXT.bodySize       // lineHeight is absolute pt; base it on the scale
};

function x(v) { return v * VB_W; }
function y(v) { return v * VB_H; }

// Spatial geometry only — grouped under one config object by tuning intent.
var LAYOUT = {
  columns:    { challengeW: x(0.167), objectiveW: x(0.146), packageW: x(0.39), gap: x(0.12) },
  soRows:     { top: y(0.02), step: y(0.14) },
  connectors: { busOvershoot: y(0.021), tapGap: y(0.025), portR: 2.5 }
};
```

## Edges, ports, and buses

`d.edge(from, to, opts)` — `from`/`to` is a node name, a `'node.anchor'`, a
`['node.anchor', { dx, dy }]` offset, or a literal `{x, y}`.

- **Anchors:** `center` + eight compass points (`n s e w ne nw se sw`), e.g.
  `'a.s'`. With no anchor, the endpoint is the border intersection toward the
  other end — connect by name and the sides resolve themselves.
- **Anchor offset:** `['a.s', { dx, dy }]` anywhere a ref is taken slides that
  point by a **named delta** — `{ dx: LANE / 2 }`, never a literal `{ dx: 7 }`.
  The outward normal is kept, so the edge still exits along the face and the
  `gap` standoff still applies; it is TikZ's `([xshift=…]a.south)`. Use it to
  tuck an endpoint onto a lane or clear a neighbour. On a bare node ref (no
  anchor) it shifts the point off the resolved border — usually a mistake.
- **The gap is the "border":** node endpoints stop `gap` units short of the box
  (the arrowhead tip lands there); **coordinate endpoints get no gap**.
- **Routes:** `straight`, `hv`/`vh` (one corner), `vhv`/`hvh` (shared bus at
  `mid`), `arc`, or explicit `via` waypoints. Corners round via `corner`. An
  `arc` is a circular arc from start to end whose apex stands `bulge` off the
  chord (half the chord makes a semicircle);
  positive bows to the left of travel (up for a left-to-right edge), so an edge
  and its return, both with the same positive `bulge`, bow apart like a cycle.
  Arrowheads follow the curve; `via` is ignored. Place
  waypoints with `between()` / `cross()` to stay free of magic numbers.

The above (anchors, gap, routes) is the `edge()` API. **Ports, buses, and tap
pitch are not kit features — they are patterns you build from nodes and edges:**

- **Ports (pattern)** = small `shape:'circle', frame:true` nodes placed by
  coordinate. There is no `port()` call.
- **Buses / branches (pattern)** = coordinate-to-coordinate edges. To wire one
  layer to a row of columns, draw a bus as a coord-to-coord edge and connect each
  column to it with its own drop. (Note `vhv`/`hvh` only *bend* when the ends
  differ on the routed axis; aligned columns collapse to a straight drop, so draw
  the bus explicitly.)
- **Fixed tap pitch (pattern).** When several edges leave one box, write a small
  helper that spaces the taps at a **constant pitch centred on the box** — not
  spread across the box edge — so the gap between edges is identical regardless of
  box height or edge count (a small `tapYs(center, count)`).

## Appearance & accessibility

- **Appearance is CSS.** `diagram.css` defines `--diagram-*` variables (node fill/
  stroke, edge colour/width, label colour/font, icon parts) mapped to semantic
  theme tokens. A diagram restyles by **remapping those `--diagram-*` tokens**
  to its own vocabulary (in the figure's `<name>.css`), and/or per-element via an
  `appearance` object (prefer semantic token values). A node's `opacity` (a
  plain 0–1 number, not a token) fades the whole node — an idle actor, say —
  and keeps its hue.
- **Every `appearance` value is a token — a figure never mixes a colour.** The
  strings you pass are `var(--…)` and nothing else: no `oklch()`, no hex, no
  `color-mix()`. A framed box takes its hue *and* the matching
  `--graphic-*-tint` for its fill (theme.css). Key the pair **by role**, so the
  stroke and fill can't drift:

  ```js
  var COLOR = { llm: 'var(--graphic-secondary)', resources: 'var(--graphic-primary)' };
  var TINT  = { llm: 'var(--graphic-secondary-tint)', resources: 'var(--graphic-primary-tint)' };
  function frameApp(role) { return { stroke: COLOR[role], fill: TINT[role] }; }
  ```

  If the token you need doesn't exist, that is the signal to **stop and add it
  to `theme.css`** (ask-first) — not to compute it here. Deriving locally is how
  an off-palette hue and three different box fills got into this repo.
- **Line widths are the theme's three, nothing between.** A stroke a figure draws itself (an edge,
  a ring, an arrow, a frame) is `var(--line-width)`, `var(--line-width-strong)`, or
  `var(--line-width-very-strong)`, never a literal such as `1.4`; an exception needs the user's
  explicit request. See
  [`figures`](../figures/SKILL.md#the-composition-module-template).
- **Default first — no extra CSS.** Start with kit defaults and add nothing
  unless a visual distinction is explicitly required. Do not add colour, opacity,
  font, or stroke overrides speculatively. When a distinction is needed, prefer
  the `appearance` object in JS over a new CSS rule; add a CSS rule only when
  `appearance` cannot express it (e.g. an SVG `filter`). No figure
  stylesheet at all is a valid and preferred outcome when the defaults suffice.
- **Keep the palette on the diagram's own SVG class** (the `className` given to
  `Diagram.create`), never on a slide-only wrapper such as a card `<div>`. A
  diagram must be **self-contained** so the figure that draws it can be placed on
  a slide or nested into another figure with no wrapper around it
  ([`figures`](../figures/SKILL.md)); a palette stranded on a wrapper makes the
  placed SVG render black.
- **A placed figure draws the diagram, never the words around it.** No `card()`-style
  helper emitting a title/subtitle/description: that text belongs to whoever places
  the figure — a slide's block column, or another figure's `fig.text` — and only
  they can make it deck-editable or lay it out on a cm canvas. The diagram's own
  labels (node text inside it) are of course its own.
- **Names describe the visible part** (`--connector-color`,
  `--workspace-panel-fill`), not generic words like `box`/`surface`.
- **Reuse shapes/edges by default** — as few distinct line widths, strokes,
  fills, corner styles as possible. Introduce a different treatment only when it
  carries meaning, and name it after that meaning.
- **Accessible name — required, and always in `DIAGRAM.ariaLabel`.** Every diagram
  declares its accessible name in the `DIAGRAM` config as `ariaLabel`
  and passes it to `create(...)` → the root `<svg>` gets `role="img"` +
  `aria-label`. The kit emits those attributes **only when the label is
  non-empty**, so a forgotten label silently produces an unlabeled figure — treat
  `ariaLabel` as mandatory, not optional, and never invent a separate top-level
  `ARIA` variable for it (that is exactly how the home drifts between diagrams).
  - **One diagram:** `DIAGRAM.ariaLabel` is a string, passed straight
    through — `create({ ariaLabel: DIAGRAM.ariaLabel, … })`.
  - **Several variants:** the accessible name lives in the per-variant registry
    (see [Variants of one diagram](variants.md#variants-of-one-diagram)), not under
    `DIAGRAM`. The registry passes each variant's `ariaLabel` to its builder, so
    a builder never names its own variant key.
- **Debug frame: write nothing.** A diagram does **not** declare a debug
  toggle or draw its own outline. `Diagram.render()` emits every diagram's
  viewBox frame automatically, and
  [`diagram.css`](../../drawing-kit/diagram/diagram.css) hides it until the figure chrome's
  **Debug** button puts `.debug-on` on `<body>` — which is what makes one toggle
  reveal a figure *and* every diagram inside it at once. `figure.js` strips the
  frames from every export, so they can never ship. **Never restyle
  `.debug-frame` in a figure's CSS** (that is how the old per-diagram frames
  drifted apart) and never reuse a guide/ruler class for it.

## The diagram shape

A diagram is drawn by code inside a figure module (a classic IIFE), structured
as:

- A **`DIAGRAM` config** object (`className`, the **required** `ariaLabel` — a
  string, or a per-variant map; see [Appearance & accessibility](#appearance--accessibility) —
  and any metric overrides; leave metric keys undefined to inherit
  `Diagram.defaults`).
- A **`diagram()` factory** that calls `Diagram.create(...)` resolving metrics
  via a small `diagramMetric(name)` helper, then returns `d`. **Never read an
  optional `DIAGRAM.foo` metric directly in layout math**; use
  `diagramMetric('foo')` so deleting an override falls back to
  `Diagram.defaults` instead of producing `undefined`/`NaN`.
- **Builder helpers that take `d`** and add nodes/edges to it; a thin top-level
  build function that calls them in order and returns `d.render(id)`, which the
  figure's `draw` places with `fig.place`.
- **Authored geometry in viewBox-relative units, kept separate from kit metrics:**
  author spatial geometry as `0–1` fractions of the viewBox and convert at the
  boundary — `x(v) = v · VB_W`, `y(v) = v · VB_H`, and `s(v) = v · min(VB_W, VB_H)`
  for size. Group these authored values by tuning intent under one config object
  (e.g. a `LAYOUT` with `columns` / `soRows` / `packageBand` / `connectors`
  sub-groups, plus a `LEGEND`); derive shared rows/buses from them; let builders
  consume only those named values. This is *spatial* geometry only.
- **Font sizes come from `config.js`, never hard-coded.** Label point sizes are the
  figure type scale in [`config.js`](../../theme/config.js) (`Config.figure.type` —
  `body`, `fine`, …), the same scale figures use, so a diagram and the figure that
  embeds it share one rhythm. Read those into the diagram's `TEXT`/`DIAGRAM`
  config (e.g. `fontSize: Config.figure.type.body.size` for the base, stepping a
  dense detail row down to `fine`) instead of writing literal points like `8`/`6`.
  `lineHeight` is an absolute point value too (defaults to `fontSize`); base it on
  the same scale. Font *family* and colour stay CSS.
- **Intrinsic size:** the kit emits `width`/`height` = the viewBox; size with CSS
  `max-width: 100%` to scale *down* only. Avoid `width: 100%` on composed
  illustrations unless you intend to stretch them.

Use resolved metrics everywhere a kit default may apply:

```js
function diagramMetric(name) {
  var defaults = window.Diagram && window.Diagram.defaults;
  return DIAGRAM[name] == null && defaults ? defaults[name] : DIAGRAM[name];
}

var d = Diagram.create(VB_W, VB_H, {
  className: DIAGRAM.className,
  ariaLabel: DIAGRAM.ariaLabel,
  gap: diagramMetric('gap'),
  lineHeight: diagramMetric('lineHeight'),
  padding: diagramMetric('padding')
});

var h = Diagram.measureBlock(segments, {
  padding: diagramMetric('padding'),
  lineHeight: diagramMetric('lineHeight')
});
```

### Worked examples

A project lists its own worked diagrams in its README; the core's
[`example-steps`](../../example/figures/example-steps/example-steps.js) figure places
a small one.

## Defaults & override tiers

Geometry defaults belong to the kit, not to project settings: they live in
`core/drawing-kit/diagram/diagram.js` as `Diagram.defaults` (SVG path coordinates can't read
CSS `var()`, so geometry stays JS). Override order, lowest first:

1. **Kit** — `Diagram.defaults` in `diagram.js` (the place to tune); a deck can
   also mutate it once at runtime (e.g. `Diagram.defaults.gap = 10;`).
2. **Diagram** — `Diagram.create(w, h, { … })`.
3. **Element** — `node({ … })` / `edge(a, b, { … })`.

Metric defaults include `gap`, `corner`, node `radius`/`fontSize`/`labelGap`,
arrowhead size, and the block-label `padding` and `lineHeight` — all from
`Diagram.defaults`. The kit emits the default label
**font size** inline (`fontSize`); pass a per-node/segment `fontSize` to
override one label. **Source those point sizes from the `config.js` type scale**
(`Config.figure.type` — `slideBody`, `slideDetail`, `body`, …) rather than literals, so
diagrams and the figures that embed them share one scale. Base a diagram on
`body` (8 pt) when it is publication-first and on `slideBody` (10.6 pt, with `slideDetail`
for secondary text) when it is built for a slide — see [`figures`](../figures/SKILL.md#importing-a-figure-onto-a-slide). **`lineHeight` defaults to
`fontSize`** (kept linked), so the label size lives in one place; it stays an
absolute point value and only the font *family*/colour are CSS.
