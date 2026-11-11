# Diagram Variants

## Variants of one diagram

One file can hold **several diagrams as named variants** — a family of workflow
diagrams built off one row layout, say — each exported as its own figure module
(see [`figures`](../figures/SKILL.md), "Several modules, one file"). Group diagrams
into one file when **both** hold:

- **They share one viewBox** — same coordinate space, same `x/y/s`, so they render
  at identical size and rhythm (this is the [one-viewBox](#viewbox-one-per-variant-a-shared-fixed-axis)
  rule; a diagram needing a different aspect is a separate figure, not a variant).
- **They are meant to be used together to convey one message** — shown in sequence
  or side by side as facets of the same idea. In practice they usually share a
  layout, but a shared layout is the *symptom*, not the test: the test is that they
  belong to the same message. Two unrelated figures that merely happen to share a
  `500×500` viewBox do **not** belong in one file.

When both hold, expose the types through **one variant registry** — the single home
for everything that differs per type. Bind each build function to its canvas width
and accessible name, one figure module per entry:

```js
/* One figure module per variant: its canvas is the diagram's, drawn 1:1. */
function variantFigure(name, width, build, ariaLabel) {
  return { width: width, height: VB_H, name: name, ariaLabel: ariaLabel, …,
           draw: function (fig) { fig.place(build(ariaLabel), { x: 0, y: 0, w: width }); } };
}

var VARIANT = {
  current: variantFigure('current-workflow', WIDTH.square, currentDiagram, 'Current workflow: …'),
  future:  variantFigure('future-workflow',  WIDTH.wide,   futureDiagram,  'Future workflow: …')
};

window.CurrentWorkflowFigure = VARIANT.current;
window.FutureWorkflowFigure = VARIANT.future;
```

Rules that keep the structure enforceable:

- **One registry, keyed by variant id.** Adding a type is a single-entry edit.
  Don't scatter parallel maps (a separate `BUILD` map *and* a separate `ariaLabel`
  map drift apart — keep them in one table).
- **Builders never name their own variant key.** A builder takes `(ariaLabel)`
  and passes the label straight to `diagram(...)`; it must not read
  `VARIANT.current` or an ariaLabel literal. Central resolution is what stops the
  accessible name from drifting between the three places it could live.
- **Keep per-type data to dispatch, width, and accessible name.** The registry
  holds the build function, canvas width, and `ariaLabel`. Authored geometry and content stay in the
  builders and the shared geometry groups (`POS`, `SIZE`, `ROW`, …) — variants are
  *facets of one layout*, so most of their substance is shared, not per-entry.

## ViewBox: one per variant, a shared fixed axis

A diagram is drawn in **one viewBox** — one coordinate space — and its on-screen
size is always a CSS concern (`max-width: 100%`, scale *down* only), never the
viewBox. The intrinsic aspect ratio belongs to the figure, not the page.

A single diagram owns exactly one viewBox. A file of **variants**
(see [Variants of one diagram](#variants-of-one-diagram)) may, however,
host variants of **different widths** — provided they share the fixed (height /
short-side) axis and authoring stays normalized: square variants and a wide one
sharing `VB_H`/`VB_S = cm(6)` and differing only in canvas width
(`WIDTH.square = cm(6)` vs `WIDTH.wide = cm(9)`).

A **different aspect ratio is only a reason to split** when the variants would
*not* share that fixed axis, or when folding them in would force builders to
re-base their sizes on the variable width. If a candidate variant keeps the shared
axis, prefer a variant over a second figure — duplicating the whole control-
variable table across two files is the worse outcome.

The mechanism that makes per-variant width safe is **keeping the fixed-axis
converters width-independent and threading width only through placement**:

- **Width-independent sizing.** `y(v) = v · VB_H` and `s(v) = v · VB_S` key off the
  shared axis, so every size, row, and pod-internal offset is identical across
  variants regardless of canvas width. A repeated sub-figure (a "pod", a card)
  renders at the same size and rhythm in every variant.
- **Width-explicit placement.** Horizontal placement uses `x(width, v) = v · width`
  bound to the active variant's canvas, and `create(...)` takes that width
  (`diagram(width, opts)`). Do **not** re-base module-internal widths on the wider
  canvas, or a module distorts when the width changes — author panel/pod widths in
  `s()` (or `x(width, …)` only for genuinely canvas-relative spans like pod
  separation).
- **Keep the shared axis equal across *figures* too.** A separate diagram that
  wants to sit beside these at a matching size simply reuses the same fixed axis
  (`VB_H = cm(6)`, and the wide `cm(9)` canvas).

A wide variant is the worked shape: it sets `WIDTH.wide = cm(9)` but shares
`VB_H = VB_S = cm(6)` with the square variants, authors each repeated pod with
`s()`/`y()` (so one pod is dimensionally identical to a square variant), and
threads `WIDTH.wide` only through `x(width, v)` to place the pod centers across
the wide canvas.
