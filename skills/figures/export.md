# Exporting Figures

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
in [`config.js`](../../theme/config.js), which `config.js` publishes as the CSS custom
property `--f-figure` (one source of truth, shared with `figure.js`'s text
measuring). [`figure.css`](../../figure-kit/figure.css) maps it onto `--f-body`/
`--f-display` for the figure subtree, and [`diagram.css`](../../drawing-kit/diagram/diagram.css)
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
