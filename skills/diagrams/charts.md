# Charts


[`core/drawing-kit/charts/charts.js`](../../drawing-kit/charts/charts.js) (`window.Charts`) draws data
charts. Unlike a diagram, a chart's marks are placed by **scales from data**, not
by named nodes, so it does not use `Diagram.create`. It follows the same
diagram conventions otherwise: classic IIFE, geometry in JS, appearance in
[`charts.css`](../../drawing-kit/charts/charts.css), a `role="img"` + `aria-label` root
(written from the data unless `spec.ariaLabel` is given), an intrinsic viewBox
that only scales down, and `--viewbox-width` for the deck's import rule.

`Charts.render(spec)` dispatches on `spec.kind` and returns `{ svg, width, height }`
in points. A slide places it with one `chart` block ([`slide-decks`](../slide-decks/blocks.md)); a figure
with `fig.place(Charts.render(spec).svg, { x, y, w })`. Adding a kind is an entry
in the kit's `KINDS` table and its builder — no template change.

| `kind` | Fields |
|---|---|
| `scatter` | `x: { title, from, to, ticks }` (points at `"YYYY-MM"` or `"YYYY-MM-DD"`; ticks every quarter, or `ticks: "year"` for a tick at each new year with the year centred over its span), `y: { title, unit, min, max, ticks }` (`ticks` lists the values to mark, e.g. `[0, 1]`; default four even steps; `grid: false` drops the gridlines), `series: [{ label, muted, points: [{ label, labelPos, x, y, size }] }]`, `size: { max }`, `legend` (`false` to leave it to a shared `legend`), `width`, `height` |
| `legend` | `items: [label \| { label, muted }]` — a row of series keys in hue order, for charts that share it |

Rules:

- **An axis is named by its `title`** (plus `unit` in brackets), drawn on the
  chart. Leave a title out only where the tick labels already say what the axis
  is — years on a release-date axis — and the chart is the tighter for it.
- **One hue per series, in fixed order, at most three** — the three category
  hues. A fourth series is a different chart, never a generated hue.
- **Grey is context, colour is the story.** A `muted` series takes no hue: a
  pale neutral dot, outlined, never labelled on the plot, drawn beneath the
  coloured points. The coloured series keep the hues in order, so muting one never
  repaints the others.
- **Size is area.** A point's `size` (a model's parameter count, say) sets its
  dot's area, up to `Charts.defaults.dotMax` radius at `size.max`. Charts that
  sit side by side share one `size.max` so equal sizes draw equal dots.
- **A legend only for two or more series.** A single series is named by the
  title placed around the chart (a slide column title, a figure's `fig.text`).
  Charts that share one key (same series, same order) each set `legend: false`
  and one `legend` chart is placed beside them, so a hue means one thing.
- **Labels never collide by luck.** A scatter label sits right of its dot by
  default; `labelPos` (`left`, `above`, `below`) moves one that would overlap.
  The plot narrows itself so every right-hand label stays on the canvas.
- Label size is `Config.figure.type.slideBody` (10.6 pt, 15.9 pt on a slide).
