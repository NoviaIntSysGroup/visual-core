# Changing The Deck Kit

## Where a CSS rule lives

**A rule lives with the code that emits its class.** The test: deleting a component
should delete its rules with it, leaving nothing behind in a shared file.

| File | Owns |
| ---- | ---- |
| [`theme.css`](../../theme/theme.css) | Token values only, including those more than one surface reads |
| `visuals/brand.css` | The project's palette and semantic colour overrides |
| [`deck.css`](../../deck-kit/deck.css) | What applies to every slide, whichever components it holds: tag sizes, Reveal resets, slide frame, fragments, the laser pointer, edit mode, print. Also anything several deck components share, such as `.deck-fragment-marker` |
| [`templates.css`](../../deck-kit/templates.css) | Classes emitted by `templates.js` |
| [`image.css`](../../deck-kit/image.css), [`figure-import.css`](../../deck-kit/figure-import.css), `widgets/<name>.css` | Classes emitted by their own JS |
| `visuals/apps/*.css`, `figures/<name>/*.css` | That one app, or that one figure |

Three consequences:

- **A size deviation is an ordinary declaration** in the component's own rule, using
  a scale token and never a literal. On a `p` or `li` it needs the `.reveal .x` form,
  which outranks the tag rule whatever the load order.
- **A component may reach for another's class** when the need is its own, as
  `figure-import.css` does for `.deck-columns-grid`. The rule goes with the component
  that needs it.
- **The toolbar is shared, its placement is not.** [`chrome.css`](../../theme/chrome.css)
  holds only the `.chrome` look that deck and figure pages both use. The toolbar's
  place on a deck is in `deck.css`, and the figure page around it in
  [`figure.css`](../../figure-kit/figure.css).

## Editable text

Text the editor can change carries `data-edit="<slideIndex>/<field>"`, the path of its field in
`SLIDES` (for example `1/columns/0/description`). A new template region that should be editable
needs this path.
