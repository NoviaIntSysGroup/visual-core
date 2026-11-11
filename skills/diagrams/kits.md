# Changing The Diagram And Chart Kits

## Standalone kits

`diagram` and `charts` are sibling kits. Each works with no other file loaded,
and each takes on the project's look when the theme is loaded:

| Setting | Kit default | Project override |
|---|---|---|
| Geometry | `Diagram.defaults` / `Charts.defaults` (JS) | options the caller passes |
| Type size, font | the kit's JS default; a CSS fallback for the family | `Config.figure` ([`config.js`](../../theme/config.js)) |
| Units | points | the caller uses `Units.cm()` |
| Colour | the fallbacks below | theme tokens ([`theme.css`](../../theme/theme.css)) |

Colour fallbacks live in each kit's one block of local variables (`--diagram-*`,
`--chart-*`), and answer "the plainest rendering that keeps the meaning", not
"a copy of the theme":

- lines and text (`--edges`, `--border`, `--text`, `--text-soft`) → `currentColor`;
- decorative fills (`--graphic-soft`, `--graphic-neutral`) → `transparent`;
- widths and weights → a plain value (`1px`, `0.5px`);
- category hues (`--graphic-primary/secondary/tertiary`) → the kit's own
  `#4477AA`, `#EE6677`, `#228833` (Paul Tol's colour-blind-safe "bright").

Derived tokens (`--graphic-*-tint`, accent shades) get **no** fallback — they are
derived in `theme.css`, and repeating the `color-mix` in a kit is a second owner.
The project palette still lives only in `visuals/brand.css`; these fallbacks apply only
when no theme is loaded. Figures (`figures/`) are project pieces and use theme
tokens directly, without fallbacks.

## Out of scope (ask first)

Curved `out`/`in`/`bend` edges, arbitrary node shapes, auto-routing around
obstacles, a first-class bus/manifold primitive, and resolving theme tokens to px
in JS. Extending the kit is a `core/` change — golden
rule.
