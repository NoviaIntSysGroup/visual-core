---
name: slide-decks
description: >-
  Create and edit Reveal.js slide decks in this repo. Use when adding or
  editing slides, writing slide content, or building a new deck under `decks/`.
  Composes decks only from the existing shared templates, widgets, figures, icons,
  and theme tokens — introducing a new template, widget, icon, or color/theme
  change is out of scope and must be discussed with the user first.
---

# Creating Slide Decks

This skill governs how to author slide content in this repo: which layout to
reach for, which element/tag a piece of text *is*, and which theme tokens to
style with — so every deck stays consistent. Visual styling itself lives in
[`core/theme/theme.css`](../../theme/theme.css) and the template/widget CSS; the
fuller editing and publishing workflow is in [README.md](../../README.md).

## When to use this

- Adding, removing, or reordering slides in an existing deck.
- Writing or rewording slide text (titles, subtitles, card copy).
- Building a new deck under `decks/<name>/`.
- Choosing colors, tags, or layouts for slide content.

Reference files, read when the task needs them:

- [blocks.md](blocks.md) — every layout, column kind, bracketed group, widget, app, and icon.
- [deck-kit.md](deck-kit.md) — which file a CSS rule lives in, and how template text stays editable, for an agreed deck-kit change.

## Golden rule: compose, don't extend

**Build decks only from what already exists in `core/`** — the layouts in
[`core/deck-kit/templates.js`](../../deck-kit/templates.js), the widgets in
`core/deck-kit/widgets/`, the project's figures in `figures/`, the icons in [`core/drawing-kit/icons/icons.js`](../../drawing-kit/icons/icons.js),
and the semantic tokens in [`core/theme/theme.css`](../../theme/theme.css).

If a slide seems to need something that isn't already there — **a new layout, a
new widget, a new icon, a new color, or any edit to `theme.css`, `templates.*`,
or a widget** — **stop and discuss it with the user before building it.**
These files are shared across every deck, the landing page, and the editor/export
chrome, so a change is never local. The default answer to "can I add a template/
color?" is *ask first*. Reshape the content to fit existing pieces whenever you
can; only escalate when the content genuinely cannot be expressed with them.

Deck `index.html` files should stay free of utility-class clutter. Prefer the
structured `SLIDES` fields and existing shared classes/widgets over sprinkling
one-off classes through content. Small, local styling is still fine for minor
text-level fixes such as boldfacing a phrase or changing the color of a few words,
as long as it uses existing semantic tokens and does not introduce a new visual
system.

## How a deck is wired

A deck's `index.html` links the shared CSS/JS, holds the `SLIDES` array between
the markers, and ends with one `Deck.mount(...)`. `mount()` renders each entry
in `SLIDES` through the template named by its `layout`, starts Reveal, and wires
the editor.

```js
Deck.mount({
  slides:     SLIDES,
  storageKey: 'my-deck',                   // unique per deck
  logo:       '../../visuals/assets/logo.svg',
  logoHeight: 30,                          // optional; points, default 32
  templates:  window.Templates,
});
```

`logo` picks the bottom-right brand mark — usually the project's mark under
`visuals/assets/`, though a deck may point at any file. The
mark is sized by **height**, so marks of any aspect ratio carry the same optical
weight; `logoHeight` overrides that height when a wordmark's subline needs more
room to stay legible.

Fragments animate only in fullscreen: in a normal tab every fragment shows at once,
and entering fullscreen restarts the current slide's fragments. This is deliberate.
`?thumb` renders a chrome-less, non-interactive first slide; `?print-pdf` loads
Reveal's print CSS and opens the print dialog.

## Building blocks

Every slide is composed from the core's layouts, column kinds, bracketed groups,
widgets, the project's apps, and icons. Their fields, options, and when to reach
for each are in [blocks.md](blocks.md): read it before choosing a layout or
adding a block.

## The `SLIDES` data shape

`SLIDES` is an array of plain objects, each with a `layout`. Example (from the
core's [showcase deck](../../example/decks/showcase/index.html)):

```js
const SLIDES = [
  {
    "layout": "hero",
    "badges": [
      "Core",
      "Showcase",
      "TODAY"
    ],
    "title": "Core Showcase",
    "subtitle": "Every slide template, block, and widget the core ships, on one deck."
  },
  {
    "layout": "columns",
    "title": "Text Columns",
    "lead": "The lead line frames the row. It is on screen with the title and never steps.",
    "columns": [
      {
        "blocks": [
          {
            "type": "title",
            "text": "First Column"
          },
          {
            "type": "text",
            "text": "A column is a stack of blocks."
          }
        ]
      },
      {
        "blocks": [
          {
            "type": "title",
            "text": "Text Blocks"
          },
          {
            "type": "subtitle",
            "text": "A quieted tagline under the title"
          },
          {
            "type": "text",
            "text": "Plain prose is a text block."
          }
        ]
      }
    ]
  }
];
```

To add or remove slides, columns, or badges, edit this array directly (between
the markers). To reword existing text, you can also use the on-slide editor.

## Formulas

Write LaTeX between dollar signs in any editable text: `$E = mc^2$` inline,
`$$\frac{a}{b}$$` display (in the `SLIDES` JSON, backslashes are doubled). It is drawn as
vector paths in the text colour and size. A `$` beside a space (`$5 and $10`) stays text.
The deck's `index.html` loads `core/math/math.js` then `core/math/tex-svg.js`, before `deck.js`;
without them `$` is plain text. While editing, formulas show as their `$source$`.
Formulas cannot span markup (`<b>` inside `$…$`).

## Writing slide content — tags & roles

**The tag sets size and leading.** The four tag rules at the top of
[`deck.css`](../../deck-kit/deck.css) decide a slide's text size and line-height, so
"how big is this text?" is answered by its tag. The few components that deviate
state it in their own rule, with a scale token, and `grep font-size` lists them
all (see [Where a CSS rule lives](deck-kit.md#where-a-css-rule-lives)). A deck never writes a
`font-size` or `line-height`.

Prose is **1.4**: slide columns run about 45 characters, so lines are short —
1.5 makes a four-line paragraph read as a list, 1.3 is too tight to scan from the
back of a room. Headings are 1.1. Before these were centralised, four different
leadings were in play and a plain paragraph fell through to Reveal's default,
which is why paragraphs and notes visibly disagreed on the same slide.

**The tags are mechanical, not a design decision.** Don't deliberate over
whether something is an `h2` or an `h3`; the four rows below decide it:

| Tag  | Role                                                                   | Per slide   | Size              |
| ---- | ---------------------------------------------------------------------- | ----------- | ----------------- |
| `h1` | **Slide title** — the single headline                                  | exactly one | `--t-xl` (28pt)   |
| `h2` | **Column / card / list-item heading** — the only other heading a slide normally has | many | `--t-md` (20pt)   |
| `h3` | **A heading nested inside** a column that already has an `h2`          | rare        | `--t-base` (16pt) |
| `p`  | **All prose** — subtitles, taglines, descriptions, quotes, notes       | many        | `--t-base` (16pt) |

The tag's job is the outline (accessibility, PDF structure, the editor's mental
model). It is never a size lever: **never promote text to a heading because you
want it bigger.** A subtitle stays a `p` and is distinguished by a class, because
it is supporting prose and has no place in the outline.

Three deviations sit above the tag's size. The hero cover's subtitle takes `--t-md`
via `.hero-content p` ([`templates.css`](../../deck-kit/templates.css)), since the cover
is the only slide read with nothing competing for attention; its byline stays at
`--t-base`. The `toc` layout's section number (`.deck-toc-num`, also in
`templates.css`) takes `--t-lg`: a display enumerator read down the left edge of the
list, not prose. And a timeline's date (`.timeline-date`, in
[`timeline.css`](../../deck-kit/widgets/timeline.css)) takes `--t-md`, because it leads
its entry.

### Font weight

Three tokens in [`theme.css`](../../theme/theme.css), one per role — a rule states the
role, never a raw number. Body prose needs none, because it inherits the normal weight:

| Token | Value | Role |
| ----- | ----- | ---- |
| `--w-medium` | 500 | Headings; quiet standalone lines (hero byline, page number); an emphasised table row. |
| `--w-semibold` | 600 | Labels that name rather than speak — `.deck-caption`, a table header, the `toc` number, chrome. |
| `--w-bold` | 700 | Strong inline emphasis (`.deck-accent`); figure titles and IDs. |

Figure-*native* text sets weight through `Config.figure.type` in
[`config.js`](../../theme/config.js) instead — SVG placed by `figure.js` can't read a
CSS variable — with 400 for normal text and 700 for bold.

### Prose variants

Everything above covers *size*. What varies beyond it — quiet, italic, ruled,
emphasised — is a small closed set of classes on a `p`, so a slide never
hand-styles prose:

| Class | What it is |
| ----- | ---------- |
| `.deck-column-subtitle` | A tagline under a heading: quieted (`--text-soft`), hugging the heading above. Emitted by a `subtitle` block. |
| `.deck-column-subhead` | The `h3` tier — a named part *inside* a column, in plain `--text`. Air above it, none below, so it binds to what it introduces. A column made of named parts and no `h2` may open with one; there it takes no air, so it starts level with a neighbouring column's title. Emitted by a `subhead` block. Plain is the default because most subheads are a **name** rather than one part of a set: a project the column is about. The accent says "these belong together", so a lone subhead wearing it states a relationship the slide doesn't have. |
| `.deck-subhead-accent` | The same subhead with the accent on (`accent: true`) — `--column-accent`, spacing unchanged. For a column whose subheads genuinely read as a set of parts. |
| `.deck-quote` | A pulled quote: italic, ruled on the left in the column's own accent. Emitted by a `quote` block. |
| `.deck-note` | The quiet follow-up under a quote or a block of prose — the "so what" line. Quieted by colour, never by shrinking below the floor. Emitted by a `note` block. |
| `.deck-source` | A citation: the repo, paper, or URL behind something on the slide. Shrunk to `--t-sm`, because it is read off the exported PDF rather than off the wall. Emitted by a `source` block. |
| `.deck-caption` | The label under a visual — a face's name, a mark's title. The other variant set below the floor (`--t-sm`), in a heavier weight to hold up at that size, because it labels a picture rather than speaking to the room. Emitted by an `image` or `video` block's `caption`. |
| `.deck-accent` | Inline emphasis on a word carrying a *meaning* hue (`--graphic-secondary` = agent) — the slide twin of the figure kit's `.fig-accent`. |

**`--column-accent` saves you naming a hue.** Every column of a `columns` slide
inherits the same accent, `--accent`. Anything inside that needs an accent reads
`var(--column-accent)` rather than picking one, which is what `.deck-quote` does. A hue that carries *meaning* is the
exception and stays explicit — `.deck-accent` is a fixed `--graphic-secondary` in
every column, because it means "agent" wherever it appears.

If a slide seems to need a fifth variant, that is a shared change — ask first
(golden rule).

### The size floor: `--t-base` is what a slide is written in

A slide is read from the back of a room. **Everything that goes directly on a
slide is `--t-base` (16pt) or larger** — every card title, description, subtitle,
lead-in, quote, attribution line, and label. That is the floor, not the average:
if a column doesn't fit at `--t-base`, the fix is to cut words or split the
slide, never to shrink the type.

The smaller rungs are for text that **labels rather than speaks** — never for
prose that didn't fit:

- **`--t-sm` (12pt) and `--t-xs` (10pt) — handout text and picture labels.**
  Source citations, footnotes, references, licence/credit lines: text that
  exists so the reader of the exported PDF can check where something came from,
  and that nobody in the room needs to read off the wall. Plus the label under a
  visual, which is bound to its picture the way a label inside a drawing is
  bound to the shape it names — read off the picture, not scanned as part of the
  column, and set in a heavier weight so the smaller size stays legible from the
  room. A slide reaches this rung through exactly four things — the **`source`
  block** (`.deck-source`), a visual block's **`caption`** (`.deck-caption`), a
  **`code` block** (`.deck-code`), read for its exact characters, and
  the hero cover's **badge row** (`.badge`), the funder/credit/date strip that
  frames the deck rather than speaking to the room — and no other way. Each size
  is set in that component's own rule, so a deck still never writes a `font-size`.
- **The `references` layout is a printout page**, so the floor does not apply
  below its `h1`: group headings (`h2`) take `--t-sm` and entries take `--t-xs`,
  set in [`templates.css`](../../deck-kit/templates.css). It is the only place `--t-xs`
  appears on a slide; a citation for one claim on an ordinary slide stays a
  `source` block.

### Imported drawings have their own floor

Text inside a placed chart or an imported figure is authored in the drawing's own
points and arrives scaled by `--diagram-scale` (1.5, or the largest factor that fits).
Such a drawing labels in `slideBody` (15.9pt on the slide, the slide's `--t-base`), with
`slideDetail` (12pt on the slide) only for deliberately secondary detail. Typing that
text, and sizing a figure so it keeps the full 1.5 in its column, is the
[`figures`](../figures/SKILL.md#importing-a-figure-onto-a-slide) skill.

Conventions:

- **One `h1` per slide.** It names what the slide is about. Both the hero cover
  and content slides follow this.
- **Every column/card heading is `h2`.** Whether the slide has two columns or
  five cards, their titles are all `h2` — they are the same role.
- **Subtitles are `p`, not headings.** A subtitle is supporting prose under an
  `h1`/`h2`, distinguished by a class (`.deck-column-subtitle`,
  `.hero-content p`) — never by promoting it to a
  heading level.
- **All descriptive prose is `p`**, even inside a styled box. Don't use `div` for
  sentences.
- **`h1 → h2` is the normal slide.** `h3` exists for a heading *nested inside* a
  column that already has an `h2`, which is rare — if you are reaching for one,
  check that the column really has named sub-parts.

### Capitalization

**Titles are Title Case; prose is sentence case.** Like the tags themselves,
this follows from the role and needs no deliberation.

Title Case covers the three heading roles — the `h1` slide title, every `h2`
column/card title, and each `toc` item title. Capitalize every word **except**
articles, coordinating conjunctions, and prepositions of **three letters or
fewer** (`a`, `an`, `the`, `and`, `or`, `but`, `nor`, `of`, `to`, `in`, `on`,
`at`, `by`, `for`) — and capitalize even those when one is the title's first or
last word:

- "The Power **of** Large Language Models" — `of` is two letters, so it stays down.
- "How **to** Think **About** AI Agents" — `to` is down; `About` is five letters, so it is up.
- "**A** Powerful Tool **With** No Instruction Manual" — `A` leads the title, so it is up.

Everything else on a slide is prose and takes **sentence case**: subtitles,
descriptions, quotes, notes, bullet items, and the slide's `closing` line. A
subtitle sits under a Title Case heading and reads as the quieter line for it.
Acronyms keep their own casing throughout (`AI`, `LLM`, `AR & VR`).

**No stylesheet enforces this, and none can.** `text-transform` has no
stop-word rule: `capitalize` yields "The Power **Of** Large Language Models",
and `lowercase` destroys `AI`. Both [`deck.css`](../../deck-kit/deck.css) and
[`landing.css`](../../landing/landing.css) therefore set `text-transform: none`
deliberately — overriding Reveal's own uppercasing — so what the `SLIDES` array
says is exactly what the slide shows, which is also what lets the inline editor
round-trip text unchanged. Capitalization is an authoring decision, made once,
in the array.

## Color tokens

Use the semantic tokens from [`core/theme/theme.css`](../../theme/theme.css) in slide
content, widgets, and figures. Raw `--color-*` palette tokens are named by hue/material
and stay inside the project's `visuals/brand.css`, where they define the project's
palette by overriding the semantic colours. `brand.css` overrides colours and
the CSS fonts only; every structural token belongs to `core/theme/theme.css`. Labels
inside a placed diagram, chart, or imported figure keep the figure font from
`config.js` whatever the brand font is (see [`figures`](../figures/export.md#fonts--looking-identical-everywhere)).

Semantic tokens are a shared contract, not incidental implementation details.
Removing or renaming a semantic token is a breaking change for shared templates,
widgets, figures, diagrams, the landing page, and the editor/export chrome.

**Do not modify `core/theme/theme.css` to add or restyle slides.** Theme changes
affect every deck, the landing page, and the editor/export chrome — make them
only in consultation with the user (golden rule).

| Token | Use |
| ---- | --- |
| `--text` | Generic readable text and dark diagram labels |
| `--text-soft` | Subtitles, subcaptions, secondary text, and quiet chrome |
| `--background` | Slide canvas background |
| `--background-plain` | Plain white slide canvas when a slide needs to differ from the default canvas |
| `--border` | Frame borders around cards, panels, controls, and similar boxed elements |
| `--edges` | Connected lines in diagrams, graphs, rulers, flows, and other edge-based illustrations |
| `--line-width` | Default width for ordinary frames, dividers, and borders |
| `--line-width-strong` | Stronger width for diagram edges and diagram frame borders |
| `--line-width-very-strong` | Coloured lines whose colour must read at a glance |
| `--accent` | Default brand accent when one emphasis color is enough |
| `--accent-strong` | Stronger shade of the accent hue |
| `--graphic-primary` | Main graphic color for element surfaces, icons, marks, and visual highlights |
| `--graphic-secondary` | Second graphic color for alternate element surfaces, icons, marks, or categories |
| `--graphic-tertiary` | Third graphic color for additional visual categories |
| `--graphic-neutral` | Neutral graphic color for quiet visual elements and decorative tints |
| `--graphic-soft` | Soft graphic fill for panels, cards, controls, diagram regions, and icon interiors |
| `--graphic-*-tint` | The faint fill of a surface that carries its own hue — a framed diagram box under a `--graphic-*` stroke. One per graphic hue |
| `--tint-strength` | How much hue a `*-tint` carries. Blended into `--background`, so the result is opaque and exports cleanly |
| `--wash-strength`, `--wash-strength-strong`, `--wash-strength-very-strong` | The same blend at the three steps a decorative backdrop (an `image` block's `wash`) uses. A scale of its own, not the `*-tint` one, so retuning a wash never repaints a framed diagram box |
| `--shadow`, `--shadow-hover` | Shadows for interactive elements, primarily buttons and cards |
| `--opacity-dim` | Content stepped back from a spotlight or still waiting its turn, and a disabled control |

- **Prefer role over hue.** A widget or figure should ask for `--border`, `--accent`, or
  a `--graphic-*` token, not a raw `--color-<name>`, unless it is
  mapping a semantic token inside `brand.css`.
- **Keep one meaning per token.** If a white rectangle is a workspace panel, map
  the local variable to `--graphic*`; if it is the whole slide canvas, use
  `--background*`.
- **Add local names for graphic parts.** Use names like
  `--workspace-panel-fill` or `--connector-color` when a diagram needs a local
  vocabulary, then map those names to semantic theme tokens.
- **Use backgrounds only for the canvas.** `--background*`
  are for the slide background, not for cards, icon interiors, framed panels, or
  diagram shapes.
- **Use graphic colors for visible elements.** `--graphic-*` tokens are the
  default palette for element surfaces, icons, marks, diagram panels, and other
  visual objects.
- **Never derive a colour at the call site.** A faint fill, a lighter shade, a
  blend — if you find yourself writing `color-mix()` or a literal `oklch()`/hex
  in a slide, widget, or figure, the option you need is missing from
  `theme.css`. Adding it there is the fix (and is ask-first); mixing it locally
  puts the design decision somewhere no one can retune it, and it drifts —
  three figures once carried three copies of the same box fill.
- **Use accent shades as one-hue variants.** Reach for `--accent` and
  `--accent-strong` when a design needs different strengths of the
  same brand color, not as a general multi-color graphic palette.
- **Use borders and edges separately.** `--border` is for frames around boxes;
  `--edges` is for connected lines in diagrams, graphs, and rulers.
- **Use line widths consistently.** `--line-width` is the default for ordinary
  frames and dividers; `--line-width-strong` is for edges and borders inside
  diagrams; `--line-width-very-strong` is for coloured lines whose colour must read.
- **Use shadows for interactivity.** Shadows should primarily support hoverable or
  clickable elements such as cards, buttons, and editor chrome.

## Diagrams & graphic styling

Diagrams take the same semantic colour tokens as everything else; building one is
the [`diagrams`](../diagrams/SKILL.md) skill.

## Per-slide checklist

1. Exactly one `h1` (the slide title).
2. Every column/card heading is `h2`; `h3` only for a heading nested inside one.
3. Every sentence of prose is a `p` — including subtitles, quotes, and notes.
4. Slide, column, and `toc` titles are Title Case (articles/conjunctions/short
   prepositions down, unless first or last); all prose is sentence case.
5. No `font-size` in a deck. If something needs to look different, it needs a
   *variant class*, not a size.
6. Every piece of slide text is `--t-base` or larger; the smaller rungs appear
   only through a `source` block (citations for the PDF handout), a visual
   block's `caption` (the label under a picture), a `code` block, the hero
   `badge` row (the funder/credit/date strip), and the `references` printout page. Imported
   drawings label in `slideBody`, with `slideDetail` reserved for secondary
   detail.
7. Prose variants come from the closed set (`subtitle`, `quote`, `note`,
   `source`, `.deck-accent`); a column's colour comes from `--column-accent`, not
   a hand-picked hue.
8. Colors come from semantic tokens; no edits to `theme.css`, `templates.*`, or
   widgets without first discussing with the user.
9. Deck `index.html` content carries no inline `style` attributes — if you are
   writing one, the variant you need is missing and that is an ask-first change.

## Workflows

### Add or edit a slide in an existing deck

1. Open the deck's `index.html` and find the `SLIDES` array (between the markers).
2. Add/edit an object using an existing `layout` and the fields above.
3. Follow the tag/role and color-token rules; run the per-slide checklist.
4. Verify in the browser (open the file directly, or use the dev server below).

### Create a new deck

1. Copy an existing deck of the project, or the core's
   [showcase deck](../../example/decks/showcase/index.html), to `decks/<name>/` (two levels
   deep). From the showcase, change its `../../../` core links to `../../core/`, and copy the
   placeholders it names from `core/example/visuals/assets/`, or replace them.
2. Replace the `SLIDES` array with the new content.
3. Set a unique `storageKey` in the `Deck.mount(...)` call.
4. Add a card linking the new deck to the project's root `index.html`.

### Run it

Open any deck's `index.html` directly, or use the optional live-reload server:

```powershell
bun run core/tools/serve.js
```

## How a deck maps

| Text                              | Tag                                 |
| --------------------------------- | ----------------------------------- |
| Hero title / content-slide title | `h1`                                |
| Hero subtitle                     | `p` (`.hero-content p`)             |
| Column title                      | `h2`                                 |
| Column subtitle                   | `p` (`.deck-column-subtitle`)        |
| Pulled quote / follow-up note     | `p` (`.deck-quote` / `.deck-note`)    |
