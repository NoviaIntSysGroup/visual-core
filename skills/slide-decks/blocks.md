# Slide Building Blocks


These are the only pieces to compose from. Anything not listed here is a new building block —
discuss it with the user first.

**Where a new piece goes.** Stop at the first that fits:

1. Existing pieces can express it: add nothing.
2. A drawing, still, stepped, or playing a fixed sequence: a figure module, placed with the
   `figure` block.
3. Something the viewer plays with, or that runs without end: an app in `visuals/apps/`,
   placed with the `app` block or as a hero `background`.
4. It arranges a whole slide: a layout.
5. The author places it in a column's `blocks`, and it works at column width: a block, in
   `templates.js`. It gets its own file in `core/deck-kit/` once it has enough code and options
   to stand alone, as `image` does.
6. A layout gives it a fixed spot, or other pieces call it: a widget, in
   `core/deck-kit/widgets/`. `timeline` needs the full slide width, so a layout places it.

Blocks and widgets are always core. What a project adds is a figure, or an app in
`visuals/apps/`.

## Layouts (`layout:` value)

| `layout`   | Use                                              | Fields |
| ---------- | ------------------------------------------------ | ------ |
| `hero`     | Cover slide — one big title with optional badges | `badges` (string[]), `title`, `subtitle`, `byline` (string; optional line under the subtitle), `background` (`"Wash"`, taking `seed`, `variant`, `hue`, and `strength` as slide fields, or a loaded app's global: see **Apps**; plain without one) |
| `columns`  | **Generic default** — title + a row of 1–N equal columns/cards | `title`, `columns` (array), `lead` (string; the framing line over the whole row), `closing` (string; the closing line under the whole row), `timeline` (`{ title, cards, branches, items }`, items `{ date, text, milestone, future, branch, outcome }`, plus `{ src, alt, height }` for a picture or `{ module }` for a figure; a full-width axis of dated entries under the grid), `fragments` (bool, default **true** — the opposite of `toc`), `dividers` (bool, or a per-gap `bool[]` of length `columns.length - 1`; default true), `halign` (`"center"` when the columns should sit centred) |
| `toc`      | Table of contents — a numbered list of the deck's sections | `title`, `items` (array of `{ title, text }`), `highlight` (an item's `title`, or its index; optional), `fragments` (bool, default **false** — the opposite of `columns`) |
| `references` | Printout page — the deck's sources, grouped by topic | `title`, `groups` (array of `{ title, items }`, items `{ name, title, href }`) |

`references` is the one layout written for the exported PDF rather than the room, so below its
`h1` it sets its own print sizes (see *The size floor: `--t-base` is what a slide is written
in* in `core/skills/slide-decks/SKILL.md`). The groups run on as one list, each under its `h2`,
filling each of three columns to 80% of the slide's content height (`--deck-references-fill` in
`core/deck-kit/templates.css`) before moving to the next, divided like `columns`; a group may
continue into the next column. Three columns is the most: a longer list runs off the slide
unseen, so split it across a second references slide. Each item leads with a bold `name` saying
only why it is cited, in words a newcomer understands, plus the year ("First VLA model
(2023)"); no authors or publishers. Under it, the source's real `title`, linked to `href`.
Group by topic, not by source kind: a paper, a model page, and a blog post on the same topic
share a group. It has no fragments, `lead`, or `closing`.

`toc` renders each `items` entry as a zero-padded number, an `h2` title, and an optional `p`
(`text`). `highlight` accents one entry and quiets the others. **The deck's overview slide
always highlights its first section with `fragments: true`**: the full list shows first, and the
next step says "we start here". Every later `toc` slide is a divider that highlights its own
section with `fragments` off, so the section reads as already current. That is why `fragments`
defaults the other way here than on `columns`: a divider recurs through the deck, and should
not cost a press each time it comes round.

**Write `items` and `title` once, on the deck's overview slide.** Every later `toc` slide is a
divider and carries `highlight` alone — it inherits the section list and the heading from that
first slide:

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

Repeating `items` on a divider is the mistake this prevents: the list then has to be re-edited
on every divider whenever a section is reworded. Editing a divider's text in the inline editor
still works — it writes through to the overview slide, which is the one place the sections are
stored. Name the section by its `title`: an index works too, but then reordering sections means
renumbering the dividers, while a title survives the move. A title that names no item logs a
warning and highlights nothing.

`lead` is the slide's framing line, rendered as one row **over** the grid: the setup the
columns are an answer to — the evidence, the premise, or the situation that makes the row worth
showing. It is a `p` (`.deck-slide-lead`), centred on a narrower measure than the page, and
unlike `closing` it carries **no fragment**: it is on screen with the title, because it sets
the steps up rather than being one. Use it when the columns only make sense after a shared
premise; a slide whose columns speak for themselves doesn't need one, and two or three
sentences is the budget before the row below it gets squeezed.

`timeline` is a full-width row **under** the grid, above `closing`: dated entries on one axis,
in time order, each in an equal column, for a history the columns sit in. An optional `title`
heads the row as an `h2`. Labels alternate above and below the axis, each on a short stem from
its circle, headed by its date over the stem. An entry sits in the middle of its column, its label
centred; at an end no branch runs on past, the end entry sits on the edge instead, its label
hanging inward from the stem, so the last gap there is one and a half columns. A label reaches
halfway to its nearest neighbour's column middle on the same side (two columns wide when they
alternate on a plain axis), and a text label never wraps, so a long one overlaps its neighbour.
For histories that part and meet, `branches` adds named tracks `{ name, side, from, to }`
beside the axis, drawn like a git graph, `side` `"above"` or `"below"`: a branch leaves the
axis on a curve before its first entry and merges back after its last, or, with `from: "edge"`
or `to: "edge"`, starts at the left edge or runs to the right one. An item with `branch: i`
sits on that branch with its label on the branch's side; an axis item's label takes the side no
branch is on. A branch runs between the axis items either side of its own, and there each
track's n-th entry shares a column with the others' n-th, whatever their dates. Two branches
`from: "edge"` on both sides, with the axis starting where they meet, show two histories
merging; one branch per side at a time. Spacing is deliberately not to scale: bunched dates
would crowd the axis. Mark each upcoming entry `future: true`: its circle is hollow, and the
track turns dashed halfway between the last past entry and the first future one. An entry with
`milestone: true` gets an accent circle and stem; one with `src` (and `alt`) shows that picture
at the stem's end, `height` points tall (default 64). One with `module` shows that figure there
instead, sized like any imported figure and stepping or playing on its own presses once its
entry has arrived; a picture's or figure's `text`, if any, sits under it, wrapped at the
label's width. Author a figure no wider than its label's room ÷ 1.5. It takes no `maxHeight`:
to resize it, re-author the module. With `cards: true` on the timeline, each entry with a
picture or figure becomes a card instead: a framed box headed by its date on the axis side, as
wide as its content and at most its room less a small gap, so a figure is authored no wider
than that room less the card's padding and frame, 2 × 10 pt, ÷ 1.5 (on a four-step track of 912
pt, `cm(4.7)`). Use it when wide pictures or figures leave unclear which date each belongs to.
The last item, on the axis, may be the `outcome: true` the timeline leads to: a card centred on
the axis in its own column, the axis ending in its circle on the card's left edge, its date
over its `text`. It is as wide as the timeline's widest figure card, so its gaps match theirs;
with no figures, as wide as its text. Use it when the branches merge into one result.
Each side of the axis is as tall as its tallest label, so the axis sits off centre when the
sides differ. Split the slide past about twelve items. With `fragments`, the section (its
title, axis and first entry) arrives on one press after the columns, and each later entry on
its own.

`closing` is the slide's closing line, rendered as one full-width row **under** the grid rather
than inside the last column — a "so what" that answers all the columns belongs to none of them,
and putting it in one of them makes that column taller than its neighbour for no reason. It is
a `p` (`.deck-slide-closing`), quieted and centred, and it steps in last when the slide has
`fragments`. Use `closing` for the one line that closes the slide; a follow-up belonging to a
single column is that column's own `note` block.

`columns` is the default layout — reach for it unless another is clearly better. Because it
scales from 1 to N columns, a `columns` slide with a single column (or an empty `columns`
array) renders as a plain title-only slide, so it covers simple "title + one block of content"
slides too, not just multi-column ones.

## Column kinds (entries in a `columns` array)

A `columns` slide renders each entry by shape:

- **Block column** — `{ blocks }` where `blocks` is an ordered array of renderable blocks,
  rendered top to bottom. Every column is one, even a heading over one paragraph (`title` +
  `text`). The text blocks are `title` (an `h2`), `subhead` (an `h3` naming a part within the
  column), `subtitle` (a quieted tagline), `text` (plain prose), `quote` (italic, ruled in the
  column's accent), `note` (the quiet follow-up line), `source` (a citation — the repo, paper,
  or URL behind something on the slide), and `code` (a framed snippet, its whitespace kept);
  `source` and `code` are the only blocks set below the size floor — each takes `text` (raw
  markup like `<br>`/`<b>` is fine inline) and stays editable. A `subhead` reads in plain
  `--text` and may add `accent: true` to take the column's accent instead (see the variants
  table). `{ type: 'bullets', items: [...] }` is the bulleted list: each item is its own
  editable string, and a list sits tight against prose above it, while under a column title it
  takes the usual gap. `{ type: 'document', title, byline, text }` reproduces a typed old
  document on a sheet of paper, in a typewriter face, for quoting a few of its lines when its
  look is part of the story; write the title as the original has it, capitals included, and
  mark cut text with `…`. `{ type: 'columns', columns: [...], dividers }` is the slide's column
  grid as a block: equal columns **side by side** inside one column, each a block column with
  its own `blocks`, `valign`, and `halign`, and `dividers` as on the slide. Use it for what
  sits beside each other under or over something spanning the whole column — two titled
  cards over a full-width figure, a small image next to the text about it. Its columns never
  step on their own, but their groups do (*Bracketed groups*), and one level is the limit: a
  nested column cannot hold another `columns` block. Columns hang from the top, so a picture beside
  the words about it sets `valign: 'center'` on its columns; a **row of pictures** keeps the
  top, so a caption that wraps doesn't push its picture off the line the eye follows.
  Visual blocks include `{ type: 'figure', module, maxHeight }` — a whole figure module
  imported onto the slide, its steps (if any) driven by Reveal fragments, and the one way a
  slide shows a drawing (see *Importing a figure onto a slide* in
  `core/skills/figures/SKILL.md`) — `image` (below), the one way a slide shows a still picture
  — and `{ type: 'video', src, alt, maxHeight, caption, start, sound, play }` — a looping clip
  that fills its share of the column and plays while its slide is open (Reveal's
  `data-autoplay`); `src` may be a local file or a URL, and `maxHeight` (points) caps how tall
  it stands, as on an `image`. `start` (seconds) is where it plays and loops from, and the
  frame it shows before. A clip is silent unless `sound: true`; on an iPhone or iPad, one with
  sound plays muted until the page's first tap. `play: "press"` holds it still and adds two
  presses of its own: the first starts it, the next stops it. With fragments off it never
  plays. A clip or picture that fails to load shows the `media-missing` icon and its `alt` text
  instead, so always write `alt`; store a clip locally if the talk cannot do without it.

  `maxHeight` (points) appears on any block that imports a drawing and needs to fit a slide's
  title-to-footer budget — `figure` and `chart`. It caps by constraining width (the dimension
  the deck's `--diagram-scale` import rule actually sizes by), converting to the equivalent
  width using the import's own aspect ratio, so a caller states the real constraint — the
  vertical space actually available — instead of hand-computing a width off the slide. This is
  a property of *this placement*, not of the drawing, so it belongs on the block, never as a
  per-deck CSS rule keyed off a generated class name.

  `{ type: 'image', src, alt, caption, items, columns, maxHeight, widthPercent, cellWidth, cellHeight, width, height, stretch, fit, surface, padding, tint, wash, equalize, optical, ariaLabel }`
  (`core/deck-kit/image.js`) is **the one way to show a still picture** — a photo, an
  illustration, a cover, a partner logo, or an icon — alone or as a set. One picture is written
  on the block itself (`src`, `alt`, `caption`); a set is `items`, each
  `{ src | icon | name, alt, caption, cover }`: a file (`src`), any icon in the
  `core/drawing-kit/icons/icons.js` registry, house or flat (`icon`), or only a `name`, which
  stands in until the file arrives. `columns` is how many share a row (default: all of them).

  **What the block states picks how it sizes.**

  - **Picture sizing** — no slot size given. Each picture takes its natural size, capped at its
    share of the column. `maxHeight` (points) caps how tall it may stand — a row of photos of
    unlike shapes, say. `widthPercent` (0-100) sets the block's width as a percent of the
    column, when full width reads too large. This is the right mode for photos, illustrations,
    and covers.
  - **Slot sizing** — `cellWidth`/`cellHeight` (points, per slot) or `width`/`height` (points
    on the slide, for the whole grid — unlike a chart's, these are never scaled). Every item
    sits in an equal slot, and the slot, not the file, decides how much room it gets, so marks
    of any aspect ratio carry one optical weight. Slot sizing is for a grid that must not grow
    with its column (a strip of small logos); grid sizing is for when the group's total canvas
    space is what's budgeted. Either pair may give just one of its two numbers, and the other
    follows from a square slot or grid. `stretch: true` instead makes the missing **width** the
    space actually available — what a row of wordmark logos wants, where the slide budgets a
    height. `fit: 'cover'` fills the slot and clips the overflow, centred, instead of fitting
    the whole picture in: a fixed crop box for a source with empty margin baked in
    (`"fit": "cover", "cellHeight": 180, "stretch": true`, plus `widthPercent` to pull it in).
    Never cover a logo. An icon or stand-in always takes a slot, since it has no natural size
    of its own.

  Slots are bare by default. `surface: 'soft'` draws the filled slot a block of vendor artwork
  needs to read as one set. `surface: 'portrait'` draws a face photo, round and bordered and
  cropped to fill, with `cellWidth` as its diameter: a per-slide budget against how many
  columns share the row. `padding: true` insets each item from its slot's edge. `tint` names a
  **theme token** (`'graphic-primary'`, the default, or any other semantic token) and overrides
  `--icon-primary` for icons in the block; it is inert on pictures, which are never recoloured.

  `wash` puts a **quiet coloured panel behind the block** — the thing that keeps a slide of
  four icons from reading as four icons on nothing. It is never the point of the slide, so
  everything about it is pale: the four `--graphic-*` hues blended into the canvas, no
  animation, no filters. Write it as an object, `{ seed, variant, hue, strength }`, whose
  **seed** decides the whole panel by hash, not by chance: the same seed gives the same wash on
  every render and in every deck, so a seed can be reused to tie slides together and a deck's
  washes never shuffle mid-talk. `variant` is `blobs` (default — three soft fields; needs
  **area**, and collapses to near-flat in a 100pt slot) or `gradient` (two hues on one of eight
  angles; the right choice for a small panel). `hue` pins the first colour to a `--graphic-*`
  name: with only four hues, hashing alone collides constantly — `wp1`, `wp2`, and `wp3` all
  land on the same one — so a row whose columns must differ pins each and lets the seed shape
  the rest. `strength` is unset / `strong` / `very-strong`, the `--wash-strength*` scale, and
  never a free percentage — a wash picked by eye drifts. Leave the slots bare and the panel
  *is* the slot; give them a `soft` surface and the marks read as cards floating on colour,
  which is the logo-wall version. An icon needs no `equalize`: `Icons.svg()`'s box+FIT fit
  gives every icon in the registry the same crop-to-frame fraction *and* the same
  `--icon-stroke-width`-driven stroke, so two icons given the same box render at both the same
  footprint and the same stroke width. `equalize` is for **slotted pictures only** — logos,
  arbitrary vendor files with no such normalization — and scales every one to the same drawn
  *area*: `true` within one block, a **name** across every block on the slide carrying it.
  Equal area still lets a thin-lined logo read lighter than a solid one, so a logo may carry
  `cover`, its ink fraction, and the area is weighted by it. The number comes from
  `bun run core/tools/mark-coverage.js <file|folder>...` (8-bit PNG with a transparent
  background); the browser can't read pixels from a `file://` image, so it is measured once and
  written beside the `src` — re-run it when a logo is replaced. `optical` (default `1`) blends
  equal box area (`0`) to equal ink area (`1`); a logo without `cover` counts as solid.

  **`caption` is the label under a visual** and works the same on `image` and `video`: a face's
  name, a mark's title. It renders centred on the picture's own axis, never wider than its
  picture or slot so it can never shove a neighbour along a row, and set small and bold
  (`.deck-caption` — see *The size floor: `--t-base` is what a slide is written in* in
  `core/skills/slide-decks/SKILL.md`). Use it where a visual appears as a credit — a row of the
  people behind something — and leave it off where a heading beside the picture already names
  it, as on a presenter slide. It rides on the block rather than being a separate one so a
  label cannot drift away from its picture when a row is reordered. Prose above and below a
  figure is the slide's own blocks (`title`, `subtitle`, `text`) and stays deck-editable; the
  figure contributes only the drawing. A row of figures that reads as a set of cards centres
  every column with `halign: 'center'`.
- **App** — `{ type: 'app', module, play }`: a project app from `visuals/apps/`, live at column
  width (see *Apps*); `play: "press"` gives it two presses of its own after the one that shows
  it: one starts it, one stops it. Its text is the app's own, not deck-editable.
- **Meter** — `{ type: 'meter', level, text }`: three ascending bars with the first `level`
  (1–3) lit in the primary hue, beside `text` in plain `--text` (a `p`, so it stays editable).
  Use it to rate the same thing across a row of columns, such as difficulty; the label names
  the rating, the bars show it.
- **Chart** — `{ type: 'chart', kind, x, y, ..., maxHeight }`: a data chart drawn by the chart
  kit (`core/drawing-kit/charts/charts.js`), which owns every `kind` (`scatter`, `legend`) and
  its fields — see `core/skills/diagrams/charts.md`. The deck loads `charts.css` and
  `charts.js`. Like any placed drawing it is scaled by `--diagram-scale`, so its text is not
  deck-editable; change labels and values in `SLIDES`. Its `width`/ `height` are the chart's
  **drawing** size, in the figure kit's points, and so arrive on the slide scaled too:
  `"width": 140` lands about 210pt wide. That is the opposite of an `image`'s `width`/`height`,
  which are its size **on the slide**. To cap a chart to the slide's space, use `maxHeight`.

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
- **Table** — `{ type: 'table', columns, rows, widths? }`: a header row of `columns` (strings),
  then `rows` of `{ cells, emphasis? }`. `widths` gives each column a percentage; without it
  the columns share equally. Use it for data that reads across — deadlines beside actions
  beside owners. A row may add `emphasis: true` to lift its cells from the quiet `--text-soft`
  default to full `--text`, for the one or two rows that carry the slide.

Any column may add `fragment: false` to stay on screen from the start while the slide's other
columns still step in one by one. Use it for content that frames the slide rather than
advancing it — a presenter photo, a diagram the stepped columns comment on. It only has an
effect when the slide's `fragments` is on.

A column that should build up in parts instead of arriving whole does not mark individual
blocks — see **Bracketed groups** below, the one mechanism for that. Use it sparingly — a
column that steps four times is four presses — and count the whole slide before you do: a
stepped figure in an earlier column already spends a press per frame.

## Bracketed groups

A `blocks` entry can be a plain **array** of blocks instead of one block — "these belong
together" needs no wrapper vocabulary of its own, since a bracket already says it:

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

An ordinary block renders exactly as before; a `[...]` renders its contents as one unit and,
unlike a plain block, is what *steps*: it is the only way to make part of a column arrive on
its own press — the column's own fragment status (`fragments` on the slide, `fragment` on the
column, same as always) is spent on each group in turn instead of on the column arriving as one
lump, so a title/subtitle stays on screen throughout while the groups after them step in one at
a time.

A video inside a group stays paused until that press, then plays from the start. Groups inside
a `columns` block step the same way, column by column, after the groups above it; put the
whole block in a group instead to step it in as one.

Two more column-level fields build on that:

- **`enter`** picks how a stepping group looks before its own press — only meaningful when
  `fragment` isn't `false`. The default `"hidden"` starts from nothing and fades in; `"fade"`
  instead starts at a quiet 0.45 and brightens to full, so the shape of the whole list is
  visible before any of it has "arrived" — useful when the room shouldn't feel like content is
  being hidden from them, just paced. `"none"` shows the group in full from the start and still
  spends its press: a video in it plays only while that press is the current one, so several
  such groups play their clips in turn.
- **`highlight`** names one group — by the `title`/`subhead` text inside it
  (`"highlight": "Second Part"`, preferred whenever a group has one) or, for a group with no
  name of its own, its position among the column's bracketed groups (`"highlight": 2`) — and
  costs exactly **one more press**, always the LAST fragment in the column however many groups
  stepped in before it (zero, if `fragment: false` means they never stepped at all — every
  group is then already on screen and this is the column's only press). Nothing about the named
  group changes; that press instead dims every OTHER group to the same quiet 0.45, leaving it
  the one thing at full strength. Use it as the slide's closing beat, to cue "we'll come back
  to this." It's a trailing marker (the same zero-size-fragment idiom the `toc` layout's own
  step already uses), not a property of the group itself — so it always lands last regardless
  of where among its neighbours that group sits.
- **Slide-level `highlight`** is the same spotlight one level up: a column on the `columns`
  slide, named the same way — by a `title`/`subhead` text inside it
  (`"highlight": "Second Column"`, preferred) or by its 0-based index. It costs one press after
  the slide's `closing` line, and dims the contents of every OTHER column to the same 0.45 (the
  dividers stay at full strength). Use it to cue which column the talk dwells on.

Dividers follow along: the rule between two columns is drawn by whichever of them appears
**last**, so a divider never reaches the slide ahead of the content it separates. Normally that
is the column on the right, which is the ordinary case and unchanged; it flips only where an
always-on column sits to the right of a stepping one — a `fragment: false` figure between two
stepping text columns — and there the left column carries the rule on its own right edge.

The per-gap array form (`"dividers": [false, true, false]`) opts out of that dance: it draws a
flat rule on exactly the gaps set `true` and is for a row shown all at once — columns paired
two-and-two, a cover beside its text, with a rule only between the pairs.

**`halign` and `valign` mean the same at every level.** Set on the slide, a column, or a
block, they align what that one thing holds, and everything around it keeps its own alignment:
`halign` takes `'center'` or `'end'`, `valign` takes `'center'` or `'top'`. Content is
left- and top-aligned by default and normally stays that way, so each is opt-in:

- `valign: 'center'` sits a column centred against the row rather than hanging from its top
  edge, for a column that is a *card* — a portrait, a single short figure — never for prose:
  columns of text must start on a shared baseline. The same holds for the columns of a
  `columns` block.
- `halign: 'end'` pushes a column's content to its inner edge, for a *pair* that belongs
  together but sits in two tracks (a portrait in the left column, the details about it in the
  right). Put it on the left column only; the right one already leans the right way.
- `halign: 'center'` on a column centres its blocks and lines, for a row that reads as a **set
  of cards** — figures, each with its title and description — and goes on **every** column of
  the row, since half-centred rows read as a mistake. On the slide it centres the grid's
  columns; on one block it centres just that block, such as an intro line over left-aligned
  prose.

**Fragments step in DOM order**, so a column may hold fragments of its own — a stepped figure,
or `class="fragment fade-up"` inside a raw-HTML block — and they interleave correctly with the
column-level ones. A stepped figure in the first column therefore runs all its steps before a
later column appears, which is the usual thing to want: build the mechanism, then comment on
it.

A figure whose module declares `autoplay` **plays** instead of stepping: the same block, but
one press starts an animation and it runs to the module's next `holds` frame on its own (see
*Stepped and played figures* in `core/skills/figures/SKILL.md`). The slide names
nothing extra — how a drawing is paced belongs to the drawing.

To start a figure's steps later than its place in the page, give its block `startAfter`: the
group they follow, named like `highlight` — by a group's `title`/`subhead` text, or by its
0-based position among the slide's bracketed groups (counted across all columns, in page order)
— or `"last"`. That lets a figure stand on screen from the start (`fragment: false` on its
column) while the text beside it steps in first. Only the figure's steps move, as one run; the
slide's `closing` and `highlight` presses still come after them. A name that matches no group
logs a warning and leaves the order as it was.

## Widgets

| Widget | Global | Location | What it is |
| ------ | ------ | -------- | ---------- |
| Badge | `window.Badge` | `core/deck-kit/widgets/` | Theme-token pill, used for the hero badge row |
| Wash | `window.Wash` | `core/deck-kit/widgets/` | Quiet coloured backdrop picked by a seed (an `image` block's `wash`, or a hero `background`) |
| Timeline | `window.Timeline` | `core/deck-kit/widgets/` | Dated entries evenly spaced on one axis, labels alternating above and below, named branches leaving and rejoining it like a git graph, a dashed future, stepping in one by one (the `columns` layout's `timeline` field) |

The HTML widgets in `core/deck-kit/widgets/` are **deck-only**. A drawing shared between decks
and publication figures (`core/skills/figures/SKILL.md`) is a figure module under
`figures/<name>/`, imported with a `figure` block. A deck opts a widget or a figure in via its
`<link>`/`<script>` tags in `index.html` — for a figure, its `<name>.js` and, when it has one,
its `<name>.css`; the core's showcase deck (`core/example/decks/showcase/index.html`) wires
every widget and shows every layout and block kind. Widgets are core only. What a project adds
that runs live is an app — see **Apps** below.

## Apps

An app is a project's live piece: one that keeps its own state, or answers the viewer's
pointer or sliders — a simulation, or a drawing the viewer changes. A drawing that shows the
same picture each time it reaches a given step, moving or not, is a figure instead, played with
`autoplay` and `holds` when it moves; it gets the figure page, export, nesting, and landing card
that an app never has. An app lives in `visuals/apps/<name>.js` + `.css`, whether one deck uses
it or several, and exposes one global with a `render(spec)` that returns its markup; from then
on the app drives itself, listening for its own input or running its own loop. A slide places
it in one of two ways, and the app is the same either way:

- **In a column** — `{ type: 'app', module: 'DotProduct' }`, at its own size. `render` gets the
  block.
- **As a hero `background`** — `"background": "HopfieldNetwork"`, filling the cover panel.
  `render` gets the slide, its extra fields included, and the app's CSS also places the title
  block. Returning `Wash.render(slide)` first keeps the wash under the app's scene.

**An app is never scaled.** It is shown at the size it is built at, so its text lands at the
size it is set in: an SVG drawing carries `width` and `height` equal to its `viewBox`, and
nothing stretches it to its column. Design it to fit the place it goes. Its text takes two
sizes: a caption in HTML around the drawing — a readout, a slider's label — is `--t-base`, and
the text inside the drawing — an axis title or number, a part's label — is `--t-sm`. A heading
over the app is the slide's own block, not the app's. Math in an app's HTML is `$…$`, as in
slide text, and `render` passes its markup through `Tex.typeset`; a live value stays outside
the `$…$`. Math inside an SVG drawing, which MathJax can't reach, is written by hand in the
LaTeX convention: a variable italic (*θ*, *i*), a vector bold and upright (**w**), a function
name upright (cos).

A deck loads an app like any other file (`../../visuals/apps/<name>.js` and its `.css`), after
the core widgets and before `deck.js`; an app with math also needs the deck's `core/math/`
scripts. An app that animates runs only while its slide is `present` and, inside a stepping
group, only while that group is the current press — or, placed with `play: "press"`, while its
own start press is (a `.deck-app-start` marker right after the app's markup, which the app's
own running check reads, followed by a `.deck-app-stop` press that stops it before the slide
moves on) — and stands still under `?print-pdf` and reduced motion; a PDF shows its starting
state. The core's Hopfield deck (`core/example/decks/hopfield-networks/index.html`) places
one on its cover, and the dot-product deck (`core/example/decks/dot-products/index.html`) one
in a column.

**Input works by mouse and by touch.** An app listens for pointer events, never mouse events,
which don't fire while a finger moves; anything driven by hover also works while a finger is
down. A touch drag on an `app` block never swipes the slide, and Reveal ignores the keyboard
while an `<input>` has focus. A hero background keeps the swipe, as it fills the cover: an app
there puts `data-prevent-swipe` on its own interactive part.

## Icons

`core/drawing-kit/icons/icons.js` (`window.Icons`) holds **one** registry of inline-SVG
geometry — `person`, `robot`, `globe`, `doc`, `code`, `calendar` and others; the file itself is
the list — drawn in a normalized `0 0 100 100` box and fitted by a shared box+FIT model,
`place(name, x, y, size, className, opts)` embedding an icon as a `<g>` inside a parent `<svg>`
(a diagram node) and `svg(name, label, opts)` returning the same icon as its own standalone
`<svg>` (an HTML box — used by the `image` block). Every icon carries two independent,
orthogonal toggles rather than being one of several fixed "kinds":

- **Colour** — the default is themed per-part via `--icon-*` classes (`icon-line`, `-fill`,
  `-card`, ...) mapped to semantic tokens in `core/drawing-kit/icons/icons.css`; figures and
  diagrams may override those variables locally. An icon may instead be `appearance`-
  **inert**, recording its own `viewBox` in place of a `box` and rendering untouched — the case
  for a project's vendor marks (a project's `visuals/vendor-icons.js`, never in the core),
  which stay full colour on any theme because recolouring a trademark is what the vendors'
  guidelines forbid.
- **Stroke width** — `fixedStroke: true` (the default) pins a line icon's stroke to the theme's
  absolute width regardless of placement size, which is what keeps a row of house icons at
  different sizes reading as one line weight. `fixedStroke: false` lets the stroke scale *with*
  the icon instead — right for a mark placed once, alone, as a self-contained pictogram (a
  pinned absolute stroke goes blobby at small placement sizes; a proportional one doesn't).

A deck or figure opts a registered extension in by loading its `<script>` after `icons.js`;
each one calls `Icons.extend()` with its own map of entries, so they're placed by name exactly
like a hand-authored house icon — nothing else about the calling code changes. One extension
ships in the core: `core/drawing-kit/icons/flat-icons.js`, whole imported single-colour artwork
(e.g. `domain-knowledge`, shown today via an `image` block but not specific to it), each entry
`fixedStroke: false`. These were originally converted from source SVG exports by a script that
stripped each file's own baked stroke colour/width so every entry inherits the same `--icon-*`
tokens a house icon does, rather than the crop-only fit carrying the correction — that source
and script have since been removed, so `flat-icons.js` is hand-edited directly now. Needing an
icon that isn't in the registry, or a mark for a new vendor, is a new building block either way
— ask first.

## Diagram kit

Decks don't build diagrams directly — they import a **figure** that draws one (the `figure`
block). Figures draw with the shared kit (`core/drawing-kit/diagram/diagram.js`,
`window.Diagram`), which builds node-and-edge figures the way TikZ does.

**Building or editing a diagram is out of scope for slide authoring, and changing the kit is a
`core/` change and ask-first (golden rule).** When you do that (with the user's go-ahead),
follow **`core/skills/diagrams/SKILL.md`**, which covers the kit's node/edge model, block
labels, content-driven sizing, and ports/buses.
