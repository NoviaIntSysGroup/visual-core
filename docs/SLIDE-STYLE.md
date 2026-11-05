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
[`core/theme/theme.css`](../theme/theme.css) and the template/widget CSS; the
fuller editing and publishing workflow is in [README.md](../README.md).

## When to use this

- Adding, removing, or reordering slides in an existing deck.
- Writing or rewording slide text (titles, subtitles, card copy).
- Building a new deck under `decks/<name>/`.
- Choosing colors, tags, or layouts for slide content.

## Golden rule: compose, don't extend

**Build decks only from what already exists in `core/`** — the layouts in
[`core/deck-kit/templates.js`](../deck-kit/templates.js), the widgets in
`core/deck-kit/widgets/`, the project's figures in `figures/`, the icons in [`core/drawing-kit/icons/icons.js`](../drawing-kit/icons/icons.js),
and the semantic tokens in [`core/theme/theme.css`](../theme/theme.css).

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

## Hard constraints (easy to violate)

- **`file://` must keep working.** Classic `<script>`/`<link>` tags only — no ES
  modules, no `fetch`. Keep every deck exactly **two levels deep**
  (`decks/<name>/index.html`) so shared paths stay rooted at `../../core/...`. The
  core's own example decks sit one level deeper and link the core as `../../../`.
- **Keep the `SLIDES:START` / `SLIDES:END` markers intact.** The inline editor
  rewrites the array between them. Never remove or reword the marker comments.
- **The `SLIDES` block is strict JSON, in one format:** exactly what
  `JSON.stringify(slides, null, 2)` writes. Every key and array item goes on its
  own line with a two-space indent, and there are no comments or trailing commas.
  The editor rewrites the whole block this way on every save, so a compact entry
  shows up as an unrelated change in the next diff, and a comment is lost.
- **Editable text needs `data-edit="<slideIndex>/<field>"`** (e.g.
  `1/columns/0/desc`). The existing templates already emit these; if you add an
  editable region you must give it a correct path, and that means touching a
  template — see the golden rule.
- **Fragments only animate in fullscreen.** In a normal tab every `fragment`
  shows at once; fullscreen restarts the slide's fragments. This is deliberate.
- **One `Deck.mount({...})` call per deck**, with a unique `storageKey`.

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

## Available building blocks

These are the only pieces to compose from. Anything not listed here is a new
building block — discuss it with the user first.

**Where a new piece goes.** Stop at the first that fits:

1. Existing pieces can express it: add nothing.
2. A drawing a deck and a figure could share: a figure module, placed with the `figure` block.
3. It arranges a whole slide: a layout.
4. The author places it in a column's `blocks`, and it works at column width: a block, in
   `templates.js`. It gets its own file in `core/deck-kit/` once it has enough code and options
   to stand alone, as `image` does.
5. A layout gives it a fixed spot, or other pieces call it: a widget, in
   `core/deck-kit/widgets/`. `timeline` needs the full slide width, so a layout places it.

Blocks and widgets are always core. What a project adds is a figure, or a hero `background` in
`visuals/backgrounds/`.

### Layouts (`layout:` value)

| `layout`   | Use                                              | Fields |
| ---------- | ------------------------------------------------ | ------ |
| `hero`     | Cover slide — one big title with optional badges | `badges` (string[]), `title`, `subtitle`, `byline` (string; optional line under the subtitle), `background` (the global name of a loaded hero background whose `render(slide)` fills the panel, plain without one; its CSS places the title block, and any extra slide fields reach it. `"Wash"` is the core's own, taking `seed`, `variant`, `hue`, and `strength` as slide fields) |
| `columns`  | **Generic default** — title + a row of 1–N equal columns/cards | `title`, `columns` (array), `lead` (string; the framing line over the whole row), `closing` (string; the closing line under the whole row), `timeline` (`{ title, items }`, items `{ date, text, milestone, future }` (or `{ src, alt, height }` in place of `text`); a full-width axis of dated entries under the grid), `fragments` (bool, default **true** — the opposite of `toc`), `dividers` (bool, or a per-gap `bool[]` of length `columns.length - 1`; default true), `halign` (`"center"` when the columns should sit centred) |
| `toc`      | Table of contents — a numbered list of the deck's sections | `title`, `items` (array of `{ title, text }`), `highlight` (an item's `title`, or its index; optional), `fragments` (bool, default **false** — the opposite of `columns`) |
| `references` | Printout page — the deck's sources, grouped by topic | `title`, `groups` (array of `{ title, items }`, items `{ name, title, href }`) |

`references` is the one layout written for the exported PDF rather than the
room, so below its `h1` it sets its own print sizes (see [the size floor](#the-size-floor--t-base-is-what-a-slide-is-written-in)).
The groups run on as one list, each under its `h2`, filling each of three
columns to 80% of the slide's content height (`--deck-references-fill` in
[`templates.css`](../deck-kit/templates.css)) before moving to the next, divided like
`columns`; a group may continue into the next column, so a growing list needs
no rebalancing by hand. Each
item leads with a bold `name` saying only why it is cited, in words a newcomer
understands, plus the year ("First VLA model (2023)"); no authors or
publishers. Under it, the source's real `title`, linked to `href`.
Group by topic, not by source kind: a paper, a model page, and a blog post on
the same topic share a group. It has no fragments, `lead`, or `closing`.

`toc` renders each `items` entry as a zero-padded number, an `h2` title, and an
optional `p` (`text`). Omit `highlight` for a plain deck overview; set it to an
entry's `title` to accent that section and quiet the others, so the same slide can
be repeated as a divider when a new section starts. Adding `fragments: true` holds
that highlight back until the first forward step — the opening overview becoming
"and we start here" — while a divider slide leaves `fragments` off so its section
reads as already current. That is also why `fragments` defaults the other way
here than on `columns`: a divider is repeated through the deck, and should not
cost a press each time it comes round.

**Write `items` and `title` once, on the deck's overview slide.** Every later
`toc` slide is a divider and carries `highlight` alone — it inherits the section
list and the heading from that first slide:

```js
{
  "layout": "toc",
  "title": "What We'll Cover",
  "highlight": "Getting Started",
  "fragments": true,
  "items": [ … ]
},
…
{
  "layout": "toc",
  "highlight": "Working With Agents"
},
```

Repeating `items` on a divider is the mistake this prevents: the list then has to
be re-edited on every divider whenever a section is reworded. Editing a divider's
text in the inline editor still works — it writes through to the overview slide,
which is the one place the sections are stored. Name the section by its `title`:
an index works too, but then reordering sections means renumbering the dividers,
while a title survives the move. A title that names no item logs a warning and
highlights nothing.

`lead` is the slide's framing line, rendered as one row **over** the grid: the
setup the columns are an answer to — the evidence, the premise, or the situation
that makes the row worth showing. It is a `p` (`.deck-slide-lead`), centred on a
narrower measure than the page, and unlike `closing` it carries **no fragment**: it
is on screen with the title, because it sets the steps up rather than being one.
Use it when the columns only make sense after a shared premise; a slide whose
columns speak for themselves doesn't need one, and two or three sentences is the
budget before the row below it gets squeezed.

`timeline` is a full-width row **under** the grid, above `closing`: dated entries
evenly spaced on one axis, in time order, for a history the columns sit in.
An optional `title` heads the row as an `h2`. Labels alternate above and below
the axis, each on a straight stem from its circle, so a label may be two
entries wide; the date sits next to the axis on both sides, so the bands mirror. Spacing is deliberately not to scale: bunched dates would crowd
the axis. Mark each upcoming entry `future: true`: its circle is hollow, and
the track turns dashed halfway between the last past entry and the first
future one. An entry with `milestone: true` gets an accent circle and stem; one with
`src` (and `alt`) shows that picture instead of `text`, on the far side of its date, `height` points tall (default 64), and
any picture makes both label bands taller. Keep `date` and
`text` to one short line, and split the slide past about twelve items. With
`fragments`, the section (its title, axis and first entry) arrives on
one press after the columns, and each later entry on its own.

`closing` is the slide's closing line, rendered as one full-width row **under** the
grid rather than inside the last column — a "so what" that answers all the
columns belongs to none of them, and putting it in one of them makes that column
taller than its neighbour for no reason. It is a `p` (`.deck-slide-closing`), quieted
and centred, and it steps in last when the slide has `fragments`. Use `closing` for
the one line that closes the slide; a follow-up belonging to a single column is
that column's own `note` block.

`columns` is the default layout — reach for it unless another is clearly better.
Because it scales from 1 to N columns, a `columns` slide with a single column (or
an empty `columns` array) renders as a plain title-only slide, so it covers simple
"title + one block of content" slides too, not just multi-column ones.

### Column kinds (entries in a `columns` array)

A `columns` slide renders each entry by shape:

- **Block column** — `{ blocks }` where `blocks` is an ordered array of
  renderable blocks, rendered top to bottom. Every column is one, even a heading
  over one paragraph (`title` + `text`). The text blocks are `title` (an `h2`), `subhead` (an `h3`
  naming a part within the column), `subtitle` (a quieted tagline), `text`
  (plain prose), `quote` (italic, ruled in the column's accent), `note` (the
  quiet follow-up line), `source` (a citation — the repo, paper, or URL
  behind something on the slide), and `code` (a framed snippet, its whitespace
  kept); `source` and `code` are the only blocks set below the size floor
  — each takes `text` (raw markup like `<br>`/`<b>` is fine inline) and stays
  editable. A `subhead` reads in plain
  `--text` and may add `accent: true` to take the column's accent instead (see
  the variants table).
  `{ type: 'bullets', items: [...] }` is the bulleted list: each item is its own
  editable string, and a list sits tight against prose above it, while under a column title it takes the usual gap. `{ type: 'row', blocks: [...], valign }` lays
  its own blocks **side by side** in equal shares instead of stacking them — a
  small image next to the text about it, under a title that still spans the
  whole column. Only that: a row wanting unequal tracks is the slide's column
  grid, not a block. Its blocks are centred against each other, which is what a
  picture beside the words about it wants; `valign: 'top'` hangs them from the
  row's top edge instead (note the default is the opposite of a column's, which
  hangs from the top unless it sets `valign: 'center'`), for a **row of pictures**, where the pictures are the
  line the eye follows and a caption that wraps would otherwise push its own
  picture up off that line. Visual blocks include
  `{ type: 'figure', module, maxHeight }` — a whole figure
  module imported onto the slide, its steps (if any) driven by Reveal
  fragments, and the one way a slide shows a drawing (see
  [Importing a figure onto a slide](FIGURE-STYLE.md#importing-a-figure-onto-a-slide)) —
  `image` (below), the one way a slide shows a still picture — and
  `{ type: 'video', src, alt, maxHeight, caption }` — a silent looping clip that
  fills its share of the column and plays while its slide is open (Reveal's
  `data-autoplay`); `src` may be a local file or a URL, and `maxHeight` (points)
  caps how tall it stands, as on an `image`. A clip or picture that fails to load
  shows the `media-missing` icon and its `alt` text instead, so always write `alt`;
  store a clip locally if the talk cannot do without it.

  `maxHeight` (points) appears on any block that imports a drawing
  and needs to fit a slide's title-to-footer budget — `figure` and
  `chart`. It caps by
  constraining width (the dimension the deck's `--diagram-scale` import rule
  actually sizes by), converting to the equivalent width using the
  import's own aspect ratio, so a caller states the real constraint — the
  vertical space actually available — instead of hand-computing a width off
  the slide. This is a property of *this placement*, not of the drawing, so
  it belongs on the block, never as a per-deck CSS rule keyed off a generated
  class name.

  `{ type: 'image', src, alt, caption, items, columns, maxHeight, widthPercent,
  cellWidth, cellHeight, width, height, stretch, fit, surface,
  padding, tint, wash, equalize, optical, ariaLabel }`
  ([`image.js`](../deck-kit/image.js)) is **the one way to show a still
  picture** — a photo, an illustration, a cover, a partner logo, or an icon —
  alone or as a set. One picture is written on the block itself (`src`, `alt`,
  `caption`); a set is `items`, each `{ src | icon | name, alt, caption, cover }`:
  a file (`src`), any icon in the [`Icons`](../drawing-kit/icons/icons.js)
  registry, house or flat (`icon`), or only a `name`, which stands in until the
  file arrives. `columns` is how many share a row (default: all of them).

  **What the block states picks how it sizes.**

  - **Picture sizing** — no slot size given. Each picture takes its natural
    size, capped at its share of the column. `maxHeight` (points) caps how tall
    it may stand — a row of photos of unlike shapes, say. `widthPercent` (0-100) sets
    the block's width as a percent of the column, when full width reads too
    large. This is the right mode for photos, illustrations, and covers.
  - **Slot sizing** — `cellWidth`/`cellHeight` (points, per slot) or
    `width`/`height` (points on the slide, for the whole grid — unlike a
    chart's, these are never scaled). Every item sits in an equal
    slot, and the slot, not the file, decides how much room it gets, so marks
    of any aspect ratio carry one optical weight. Slot sizing is for a grid that
    must not grow with its column (a strip of small logos); grid sizing is for
    when the group's total canvas space is what's budgeted. Either pair may give
    just one of its two numbers, and the other follows from a square slot or grid.
    `stretch: true` instead
    makes the missing **width** the space actually available — what a row of
    wordmark logos wants, where the slide budgets a height. `fit: 'cover'`
    fills the slot and clips the overflow, centred, instead of fitting the whole
    picture in: a fixed crop box for a source with empty margin baked in
    (`"fit": "cover", "cellHeight": 180, "stretch": true`, plus `widthPercent` to pull
    it in). Never cover a logo. An icon or stand-in always takes a slot, since
    it has no natural size of its own.

  Slots are bare by default. `surface: 'soft'` draws the filled slot a block of
  vendor artwork needs to read as one set. `surface: 'portrait'` draws a face photo,
  round and bordered and cropped to fill, with `cellWidth` as its diameter: a per-slide
  budget against how many columns share the row.
  `padding: true` insets each item from its slot's edge. `tint` names a **theme
  token** (`'graphic-primary'`, the default, or any other semantic token) and
  overrides `--icon-primary` for icons in the block; it is inert on
  pictures, which are never recoloured.

  `wash` puts a **quiet coloured panel behind the block** — the thing that keeps
  a slide of four icons from reading as four icons on nothing. It is never the
  point of the slide, so everything about it is pale: the four `--graphic-*`
  hues blended into the canvas, no animation, no filters. Write it as an object,
  `{ seed, variant, hue, strength }`, whose **seed** decides the whole panel by
  hash, not by chance: the same seed gives the same wash on every render and in
  every deck, so a seed can be reused to tie slides together and a deck's
  washes never shuffle mid-talk. `variant` is `blobs` (default —
  three soft fields; needs **area**, and collapses to near-flat in a 100pt
  slot) or `gradient` (two hues on one of eight angles; the right choice for a
  small panel). `hue` pins the first colour to a `--graphic-*` name: with only four
  hues, hashing alone collides constantly — `wp1`, `wp2`, and `wp3` all land on
  the same one — so a row whose columns must differ pins each and lets the seed
  shape the rest. `strength` is unset / `strong` / `very-strong`, the
  `--wash-strength*` scale, and never a free percentage — a wash picked by eye
  drifts. Leave the slots bare and the panel *is* the slot; give them a `soft`
  surface and the marks read as cards floating on colour, which is the
  logo-wall version. An icon needs no `equalize`: `Icons.svg()`'s box+FIT fit
  gives every icon in the registry the same crop-to-frame fraction *and* the
  same `--icon-stroke-width`-driven stroke, so two icons given the same box
  render at both the same footprint and the same stroke width. `equalize` is for
  **slotted pictures only** — logos, arbitrary vendor files with no such
  normalization — and scales every one to the same drawn *area*: `true` within
  one block, a **name** across every block on the slide carrying it. Equal area
  still lets a thin-lined logo read lighter than a solid one, so a logo may carry
  `cover`, its ink fraction, and the area is weighted by it. The number comes from
  `bun run core/tools/mark-coverage.js <file|folder>...` (8-bit PNG with a
  transparent background); the browser can't read pixels from a `file://` image,
  so it is measured once and written beside the `src` — re-run it when a logo is
  replaced. `optical` (default `1`) blends equal box area (`0`) to equal ink area
  (`1`); a logo without `cover` counts as solid.

  **`caption` is the label under a visual** and works the same on `image`
  and `video`: a face's name, a mark's title. It renders centred on
  the picture's own axis, never wider than its picture or slot so it can never
  shove a neighbour along a row,
  and set small and bold (`.deck-caption` — see [the size floor](#the-size-floor--t-base-is-what-a-slide-is-written-in)).
  Use it where a visual appears as a credit — a row of the people behind
  something — and leave it off where a heading beside the picture already names
  it, as on a presenter slide. It rides on the block rather than being a
  separate one so a label cannot drift away from its picture when a row is
  reordered. Prose above and below a figure is the slide's own blocks
  (`title`, `subtitle`, `text`) and stays deck-editable; the figure contributes
  only the drawing. A row of figures that reads as a set of cards centres every
  column with `halign: 'center'`.
- **Meter** — `{ type: 'meter', level, text }`: three ascending bars with the first
  `level` (1–3) lit in the primary hue, beside `text` in plain `--text` (a `p`, so
  it stays editable). Use it to rate the same thing across a row of columns, such
  as difficulty; the label names the rating, the bars show it.
- **Chart** — `{ type: 'chart', kind, x, y, ..., maxHeight }`: a data
  chart drawn by the chart kit ([`core/drawing-kit/charts/`](../drawing-kit/charts/charts.js)), which
  owns every `kind` (`scatter`, `legend`) and its fields — see
  [DIAGRAM-STYLE.md](DIAGRAM-STYLE.md#charts). The deck loads `charts.css` and
  `charts.js`. Like any placed drawing it is scaled by `--diagram-scale`, so its
  text is not deck-editable; change labels and values in `SLIDES`. Its `width`/
  `height` are the chart's **drawing** size, in the figure kit's points, and so
  arrive on the slide scaled too: `"width": 140` lands about 210pt wide. That is
  the opposite of an `image`'s `width`/`height`, which are its size **on the
  slide**. To cap a chart to the slide's space, use `maxHeight`.

  ```js
  {
    "type": "chart",
    "kind": "scatter",
    "maxHeight": 320,
    "x": {
      "title": "Release date",
      "from": "2025-07",
      "to": "2026-12"
    },
    "y": {
      "title": "Success rate",
      "unit": "%",
      "min": 0,
      "max": 100
    },
    "series": [
      {
        "label": "Series A",
        "points": [
          {
            "label": "A1",
            "x": "2025-09",
            "y": 12.4
          }
        ]
      }
    ]
  }
  ```
- **Table** — `{ type: 'table', columns, rows, widths? }`: a header row of
  `columns` (strings), then `rows` of `{ cells, emphasis? }`. `widths` gives each
  column a percentage; without it the columns share equally. Use it for data
  that reads across — deadlines beside actions beside owners. A row may add
  `emphasis: true` to lift its cells from the quiet `--text-soft` default to
  full `--text`, for the one or two rows that carry the slide.

Any column may add `fragment: false` to stay on screen from the start while the
slide's other columns still step in one by one. Use it for content that frames
the slide rather than advancing it — a presenter photo, a diagram the stepped
columns comment on. It only has an effect when the slide's `fragments` is on.

A column that should build up in parts instead of arriving whole does not mark
individual blocks — see **Bracketed groups** below, the one mechanism for that.
Use it sparingly — a column that steps four times is four presses — and count
the whole slide before you do: a stepped figure in an earlier column already
spends a press per frame.

### Bracketed groups

A `blocks` entry can be a plain **array** of blocks instead of one block —
"these belong together" needs no wrapper vocabulary of its own, since a
bracket already says it:

```js
"blocks": [
  {
    "type": "title",
    "text": "Fade and Highlight"
  },
  {
    "type": "subtitle",
    "text": "Each bracketed group is one press"
  },
  [
    {
      "type": "subhead",
      "text": "First Part"
    },
    {
      "type": "text",
      "text": "Faded groups show the shape of the list before it arrives."
    }
  ],
  [
    {
      "type": "subhead",
      "text": "Second Part"
    },
    {
      "type": "text",
      "text": "The last press dims every group except this one."
    }
  ],
  [
    {
      "type": "subhead",
      "text": "Third Part"
    },
    {
      "type": "text",
      "text": "Titles and subtitles outside a group stay on screen."
    }
  ]
]
```

An ordinary block renders exactly as before; a `[...]` renders its contents
as one unit and, unlike a plain block, is what *steps*: it is the only way to
make part of a column arrive on its own press — the column's own fragment
status (`fragments` on the slide, `fragment` on the column, same as always) is
spent on each group in turn instead of on the column arriving as one lump, so
a title/subtitle stays on screen throughout while the groups after them step
in one at a time.

A `row` takes groups too: a bracketed cell (`"blocks": [chart, [video]]`)
steps in on its own press after the rest of the column, under the same
`fragment` and `enter` rules. A cell of brackets (`[[videoA], [videoB]]`)
stacks several groups in the cell, and they step in turn. A video inside a
group stays paused until that press, then plays from the start. Row groups
are not counted by `highlight` or `startAfter`.

Two more column-level fields build on that:

- **`enter`** picks how a stepping group looks before its own press — only
  meaningful when `fragment` isn't `false`. The default `"hidden"` starts from
  nothing and fades in; `"fade"` instead starts at a quiet 0.45 and brightens
  to full, so the shape of the whole list is visible before any of it has
  "arrived" — useful when the room shouldn't feel like content is being
  hidden from them, just paced. `"none"` shows the group in full from the
  start and still spends its press: a video in it plays only while that press
  is the current one, so several such groups play their clips in turn.
- **`highlight`** names one group — by the `title`/`subhead` text inside it
  (`"highlight": "Second Part"`, preferred whenever a group has one) or,
  for a group with no name of its own, its position among the column's
  bracketed groups (`"highlight": 2`) — and costs exactly **one more press**,
  always the LAST fragment in the column however many groups stepped in
  before it (zero, if `fragment: false` means they never stepped at all —
  every group is then already on screen and this is the column's only
  press). Nothing about the named group changes; that press instead dims
  every OTHER group to the same quiet 0.45, leaving it the one thing at full
  strength. Use it as the slide's closing beat, to cue "we'll come back to
  this." It's a trailing marker (the same zero-size-fragment idiom the `toc`
  layout's own step already uses), not a property of the group itself — so it
  always lands last regardless of where among its neighbours that group sits.
- **Slide-level `highlight`** is the same spotlight one level up: a column on the
  `columns` slide, named the same way — by a `title`/`subhead` text inside it
  (`"highlight": "Second Column"`, preferred) or by its 0-based index. It costs one press after the slide's
  `closing` line, and dims the contents of every OTHER column to the same 0.45 (the
  dividers stay at full strength). Use it to cue which
  column the talk dwells on.

Dividers follow along: the rule between two columns is drawn by whichever of
them appears **last**, so a divider never reaches the slide ahead of the content
it separates. Normally that is the column on the right, which is the ordinary
case and unchanged; it flips only where an always-on column sits to the right of
a stepping one — a `fragment: false` figure between two stepping text columns —
and there the left column carries the rule on its own right edge.

The per-gap array form (`"dividers": [false, true, false]`) opts out of that
dance: it draws a flat rule on exactly the gaps set `true` and is for a row
shown all at once — columns paired two-and-two, a cover beside its text, with a
rule only between the pairs.

Any column may also add `valign: 'center'` to sit centred against the row rather
than hanging from its top edge. A `row` block defaults the other way — its cells
centre unless it sets `valign: 'top'` — because a picture beside its words should
share a middle, while columns of prose should share a first line. Use it for a column that is a *card* — a portrait,
a single short figure — never for one holding prose: columns of text must start
on a shared baseline. The names say the axis at both levels: the slide's own
`halign` centres the grid's columns horizontally, a column's `valign` centres
that one column vertically.

`halign` is the horizontal twin, and it takes two values. `halign: 'end'` pushes
the column's content to its inner edge instead of hanging on the outer one.
Columns are left-aligned by default and normally stay that way — this is for a
*pair* that belongs together but sits in two tracks, where the equal halves would
otherwise leave the width of the canvas between them (a portrait in the left
column, the details about it in the right). Put it on the left column only; the
right one is already left-aligned, which is the direction it should lean.

`halign: 'center'` sits the column's blocks and its lines on the column's own
centre line. Use it when the row reads as a **set of cards** rather than as
columns of prose — a row of figures, each with its title, subtitle, and
description. Put it on
**every** column of the row: half-centred rows read as a mistake. It is still
opt-in, because ordinary columns of prose are easier to read left-aligned; don't
reach for it on a slide that is three paragraphs.

**Fragments step in DOM order**, so a column may hold fragments of its own — a
stepped figure, or `class="fragment fade-up"` inside a raw-HTML block — and they
interleave correctly with the column-level ones. A stepped figure in the first
column therefore runs all its steps before a later column appears, which is the
usual thing to want: build the mechanism, then comment on it.

A figure whose module declares `autoplay` **plays** instead of stepping: the
same block, but one press starts an animation and it runs to the module's next
`holds` frame on its own (see [FIGURE-STYLE.md](FIGURE-STYLE.md#played-figures-autoplay--holds)).
The slide names nothing extra — how a drawing is paced belongs to the drawing.

To start a figure's steps later than its place in the page, give its block
`startAfter`: the group they follow, named like `highlight` — by a group's
`title`/`subhead` text, or by its 0-based position among the slide's bracketed
groups (counted across all columns, in page order) — or `"last"`. That lets a
figure stand on screen from the start (`fragment: false` on its column) while
the text beside it steps in first. Only the figure's steps move, as one run;
the slide's `closing` and `highlight` presses still come after them. A name that
matches no group logs a warning and leaves the order as it was.

### Widgets

| Widget | Global | Location | What it is |
| ------ | ------ | -------- | ---------- |
| Badge | `window.Badge` | `core/deck-kit/widgets/` | Theme-token pill, used for the hero badge row |
| Wash | `window.Wash` | `core/deck-kit/widgets/` | Quiet coloured backdrop picked by a seed (an `image` block's `wash`, or a hero `background`) |
| Timeline | `window.Timeline` | `core/deck-kit/widgets/` | Dated entries evenly spaced on one axis, labels alternating above and below, a dashed future, stepping in one by one (the `columns` layout's `timeline` field) |

The HTML widgets in `core/deck-kit/widgets/` are **deck-only**. A drawing shared
between decks and [publication figures](FIGURE-STYLE.md) is a figure module under
`figures/<name>/`, imported with a `figure` block. A deck opts a widget or a figure in
via its `<link>`/`<script>` tags in `index.html` — for a figure, its `<name>.js` and,
when it has one, its `<name>.css`; the core's showcase deck
([`core/example/decks/showcase/index.html`](../example/decks/showcase/index.html)) wires every
widget and shows every layout and block kind.
Widgets are core only. A hero `background` is a project's cover art: it lives in
`visuals/backgrounds/`, whether one deck uses it or several, and a deck loads it like any other
file (`../../visuals/backgrounds/<name>-background.js`), after the core widgets.
The core's [Hopfield deck](../example/decks/hopfield-networks/index.html) is the worked example.

### Icons

[`core/drawing-kit/icons/icons.js`](../drawing-kit/icons/icons.js) (`window.Icons`) holds **one**
registry of inline-SVG geometry — `person`, `robot`, `globe`, `doc`, `code`,
`calendar` and others; the file itself is the list — drawn in a normalized
`0 0 100 100` box and fitted by a shared box+FIT model, `place(name, x, y,
size, className, opts)` embedding an icon as a `<g>` inside a parent `<svg>`
(a diagram node) and `svg(name, label, opts)` returning the same icon as its
own standalone `<svg>` (an HTML box — used by the `image` block).
Every icon carries two independent, orthogonal toggles rather than being one
of several fixed "kinds":

- **Colour** — the default is themed per-part via `--icon-*` classes
  (`icon-line`, `-fill`, `-card`, ...) mapped to semantic tokens in
  [`core/drawing-kit/icons/icons.css`](../drawing-kit/icons/icons.css); figures and diagrams
  may override those variables locally. An icon may instead be `appearance`-
  **inert**, recording its own `viewBox` in place of a `box` and rendering
  untouched — the case for a project's vendor marks (a project's `visuals/vendor-icons.js`, never
  in the core), which stay full colour on any theme because recolouring a trademark is what
  the vendors' guidelines forbid.
- **Stroke width** — `fixedStroke: true` (the default) pins a line icon's
  stroke to the theme's absolute width regardless of placement size, which is
  what keeps a row of house icons at different sizes reading as one line
  weight. `fixedStroke: false` lets the stroke scale *with* the icon instead —
  right for a mark placed once, alone, as a self-contained pictogram (a pinned
  absolute stroke goes blobby at small placement sizes; a proportional one
  doesn't).

A deck or figure opts a registered extension in by loading its `<script>`
after `icons.js`; each one calls `Icons.extend()` with its own map of entries,
so they're placed by name exactly like a hand-authored house icon — nothing
else about the calling code changes. One extension ships in the core:
[`flat-icons.js`](../drawing-kit/icons/flat-icons.js), whole imported single-colour
artwork (e.g. `domain-knowledge`, shown today via an `image` block but not
specific to it), each entry `fixedStroke: false`. These were originally
converted from source SVG exports by a script that stripped each file's own
baked stroke colour/width so every entry inherits the same `--icon-*`
tokens a house icon does, rather than the crop-only fit carrying the
correction — that source and script have since been removed, so
`flat-icons.js` is hand-edited directly now. Needing an icon that isn't in the
registry, or a mark for a new vendor, is a new building block either way —
ask first.

### Diagram kit

Decks don't build diagrams directly — they import a **figure** that draws one
(the `figure` block). Figures draw with the shared kit
([`core/drawing-kit/diagram/diagram.js`](../drawing-kit/diagram/diagram.js), `window.Diagram`),
which builds node-and-edge figures the way TikZ does.

**Building or editing a diagram is out of scope for slide authoring, and changing
the kit is a `core/` change and ask-first (golden rule).** When you do that (with
the user's go-ahead), follow the **[`diagrams`](DIAGRAM-STYLE.md)** skill, which
covers the kit's node/edge model, block labels, content-driven sizing, and
ports/buses.

## The `SLIDES` data shape

`SLIDES` is an array of plain objects, each with a `layout`. Example (from the
core's [showcase deck](../example/decks/showcase/index.html)):

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
[`deck.css`](../deck-kit/deck.css) decide a slide's text size and line-height, so
"how big is this text?" is answered by its tag. The few components that deviate
state it in their own rule, with a scale token, and `grep font-size` lists them
all (see [Where a CSS rule lives](#where-a-css-rule-lives)). A deck never writes a
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
via `.hero-content p` ([`templates.css`](../deck-kit/templates.css)), since the cover
is the only slide read with nothing competing for attention; its byline stays at
`--t-base`. The `toc` layout's section number (`.deck-toc-num`, also in
`templates.css`) takes `--t-lg`: a display enumerator read down the left edge of the
list, not prose. And a timeline's date (`.timeline-date`, in
[`timeline.css`](../deck-kit/widgets/timeline.css)) takes `--t-md`, because it leads
its entry.

### Font weight

Three tokens in [`theme.css`](../theme/theme.css), one per role — a rule states the
role, never a raw number. Body prose needs none, because it inherits the normal weight:

| Token | Value | Role |
| ----- | ----- | ---- |
| `--w-medium` | 500 | Headings; quiet standalone lines (hero byline, page number); an emphasised table row. |
| `--w-semibold` | 600 | Labels that name rather than speak — `.deck-caption`, a table header, the `toc` number, chrome. |
| `--w-bold` | 700 | Strong inline emphasis (`.deck-accent`); figure titles and IDs. |

Figure-*native* text sets weight through `Config.figure.type` in
[`config.js`](../theme/config.js) instead — SVG placed by `figure.js` can't read a
CSS variable — with 400 for normal text and 700 for bold.

### Prose variants

Everything above covers *size*. What varies beyond it — quiet, italic, ruled,
emphasised — is a small closed set of classes on a `p`, so a slide never
hand-styles prose:

| Class | What it is |
| ----- | ---------- |
| `.deck-column-subtitle` | A tagline under a heading: quieted (`--text-soft`), hugging the heading above. Emitted by a `subtitle` block. |
| `.deck-column-subhead` | The `h3` tier — a named part *inside* a column, in plain `--text`. Air above it, none below, so it binds to what it introduces. Emitted by a `subhead` block. Plain is the default because most subheads are a **name** rather than one part of a set: a project the column is about. The accent says "these belong together", so a lone subhead wearing it states a relationship the slide doesn't have. |
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
  set in [`templates.css`](../deck-kit/templates.css). It is the only place `--t-xs`
  appears on a slide; a citation for one claim on an ordinary slide stays a
  `source` block.

### Imported drawings have their own floor

Text inside a placed chart or an imported figure is authored in the
drawing's own points and arrives on the slide scaled by `--diagram-scale` (1.5,
or the largest factor that fits). So the drawing's points are not the slide's
points, and its floor is stated in the figure kit's terms:

| Authored size | On a slide at 1.5× | Use for |
| ------------- | ------------------ | ------- |
| **10pt** (`slideBody`, `label`, `title`, `subtitle`) | 15pt | **The default.** Every label a viewer is meant to read while you talk. |
| **8pt** (`body` — the publication size) | 12pt | Secondary detail — an annotation under a label that already carries the point. |
| **6pt** (`legend`, `fine`) | 9pt | Only genuinely publication-grade fine print: a legend or data annotation carried over from a print figure, there for the reader who zooms into the PDF handout. |

Author slide-bound figures at **10pt by default** and step down only for detail
that is deliberately secondary. A drawing whose *primary* labels are 8pt is
under-sized for a slide, even though it exports correctly as a print figure. Full
rules in [FIGURE-STYLE.md](FIGURE-STYLE.md#importing-a-figure-onto-a-slide).

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
and `lowercase` destroys `AI`. Both [`deck.css`](../deck-kit/deck.css) and
[`landing.css`](../landing/landing.css) therefore set `text-transform: none`
deliberately — overriding Reveal's own uppercasing — so what the `SLIDES` array
says is exactly what the slide shows, which is also what lets the inline editor
round-trip text unchanged. Capitalization is an authoring decision, made once,
in the array.

## Color tokens

Use the semantic tokens from [`core/theme/theme.css`](../theme/theme.css) in slide
content, widgets, and figures. Raw `--color-*` palette tokens are named by hue/material
and stay inside the project's `visuals/brand.css`, where they define the project's
palette by overriding the semantic colours. `brand.css` overrides colours and
the CSS fonts only; every structural token belongs to `core/theme/theme.css`. Labels
inside a placed diagram, chart, or imported figure keep the figure font from
`config.js` whatever the brand font is (see [FIGURE-STYLE.md](FIGURE-STYLE.md#fonts--looking-identical-everywhere)).

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
  diagrams.
- **Use shadows for interactivity.** Shadows should primarily support hoverable or
  clickable elements such as cards, buttons, and editor chrome.

## Diagrams & graphic styling

Diagrams are styled through the same semantic color tokens as everything else.
The rules for *building* diagrams — naming graphic parts after their visible role,
reusing as few shapes/strokes/fills as possible, and making any visual exception
carry meaning — live in the **[`diagrams`](DIAGRAM-STYLE.md)** skill, since
they only apply when you're constructing a figure (an ask-first `core/` change).

## Where a CSS rule lives

**A rule lives with the code that emits its class.** The test: deleting a component
should delete its rules with it, leaving nothing behind in a shared file.

| File | Owns |
| ---- | ---- |
| [`theme.css`](../theme/theme.css) | Token values only, including those more than one surface reads |
| `visuals/brand.css` | The project's palette and semantic colour overrides |
| [`deck.css`](../deck-kit/deck.css) | What applies to every slide, whichever components it holds: tag sizes, Reveal resets, slide frame, fragments, the laser pointer, edit mode, print. Also anything several deck components share, such as `.deck-fragment-marker` |
| [`templates.css`](../deck-kit/templates.css) | Classes emitted by `templates.js` |
| [`image.css`](../deck-kit/image.css), [`figure-import.css`](../deck-kit/figure-import.css), `widgets/<name>.css` | Classes emitted by their own JS |
| `visuals/backgrounds/*.css`, `figures/<name>/*.css` | That one hero background, or that one figure |

Three consequences:

- **A size deviation is an ordinary declaration** in the component's own rule, using
  a scale token and never a literal. On a `p` or `li` it needs the `.reveal .x` form,
  which outranks the tag rule whatever the load order.
- **A component may reach for another's class** when the need is its own, as
  `figure-import.css` does for `.deck-columns-grid`. The rule goes with the component
  that needs it.
- **The toolbar is shared, its placement is not.** [`chrome.css`](../theme/chrome.css)
  holds only the `.chrome` look that deck and figure pages both use. The toolbar's
  place on a deck is in `deck.css`, and the figure page around it in
  [`figure.css`](../figure-kit/figure.css).

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
   drawings label at 10pt, with 8pt/6pt reserved for secondary and
   publication-fine detail.
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
   [showcase deck](../example/decks/showcase/index.html), to `decks/<name>/` (two levels
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

> **Gotcha:** the on-slide editor autosaves a draft to `localStorage` under
> `deck-draft:<storageKey>:v1`. That draft shadows hand-edits to the same `SLIDES`
> fields until it clears. If a file change doesn't appear, clear that key or finish
> the on-screen edit with **Done**.

## How a deck maps

| Text                              | Tag                                 |
| --------------------------------- | ----------------------------------- |
| Hero title / content-slide title | `h1`                                |
| Hero subtitle                     | `p` (`.hero-content p`)             |
| Column title                      | `h2`                                 |
| Column subtitle                   | `p` (`.deck-column-subtitle`)        |
| Pulled quote / follow-up note     | `p` (`.deck-quote` / `.deck-note`)    |
