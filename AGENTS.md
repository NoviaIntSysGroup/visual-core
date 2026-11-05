# AGENTS.md

The hard rules for working with this core and the projects built on it, plus the constraints
that are easy to violate. Paths in text are written from a project root, where this repo is checked
out as `core/`; link targets are relative to this file. If the working directory has no `core/`
folder, you are working on the core alone: drop the `core/` prefix; the project paths then exist only
under `example/`. The fuller editing, running, and publishing workflow is in [`core/README.md`](README.md).

## Rules

1. Don't assume. Don't hide confusion. Surface tradeoffs.
2. Minimum code that solves the problem. Nothing speculative.
3. Touch only what you must. Clean up only your own mess.
4. Do not preserve backwards compatibility, optimize for the long run.
5. Comments say what the code does, nothing else. Five lines max, fewer is better.
6. Compose from existing shared pieces. Anything new is ask-first: plan, agree, then build.
7. Read the style doc that governs the files you are about to touch, before touching them.
8. Don't open a browser to check your work. Verifying visually is the user's step.
9. Never create a git worktree or branch unless asked. Work in the current checkout.
10. Stay inside the repo. Never search, read, or write outside the working directory, unless the user names a path for the task.

## Human-first architecture

1. Optimize for a human reader unfamiliar with the implementation.
   Minimize the context they must hold in their head.

2. Optimize for locality of understanding. Code read together should
   usually live together. A cohesive larger module is preferable to many
   tiny modules that must be mentally reassembled.

3. Every abstraction must remove more cognitive load than it introduces.
   Avoid one-use interfaces, factories, wrappers, helpers and extension
   points.

4. Organize primarily around domain concepts and execution flows, not
   technical categories or design patterns. Preserve a top-down reading
   path where practical.

5. Before finishing, trace the primary workflow as a human debugger would.
   Remove unnecessary files, hops, indirection and concepts. The goal is
   not minimum LOC; it is minimum complexity required to understand the
   system.

## Working In This Repo

**Ask first (rule 6).** Anything other projects might use — the core's kits, theme, tools, and docs —
needs a concise plan and the user's agreement before it changes. So does a new deck, figure, slide
template, block, widget, hero background, icon, or colour. `core/example/` is the exception: change
it freely. Compose from what already exists unless the user agrees to a new piece.

**Which style doc (rule 7).** These are the authoring skills for this repo, not background
reading:

| Style doc | Governs | Read it before |
|---|---|---|
| [`core/docs/SLIDE-STYLE.md`](docs/SLIDE-STYLE.md) (`slide-decks`) | `decks/`, `visuals/backgrounds/`, `core/deck-kit/`, `core/theme/theme.css`, `visuals/brand.css`, `core/landing/` | adding or reordering slides, writing slide copy, building a deck, placing an existing figure on a slide, changing a template, layout, tag, or theme token |
| [`core/docs/DIAGRAM-STYLE.md`](docs/DIAGRAM-STYLE.md) (`diagrams`) | `core/drawing-kit/diagram/`, `core/drawing-kit/charts/`, and the diagram-kit drawing code inside a figure module | *constructing* a diagram or chart: drawing one with the kit, editing one, or changing a kit |
| [`core/docs/FIGURE-STYLE.md`](docs/FIGURE-STYLE.md) (`figures`) | `figures/`, `core/figure-kit/` | building or editing a publication figure or the figure kit |
| [`core/docs/IMAGE-STYLE.md`](docs/IMAGE-STYLE.md) (`illustrations`) | `visuals/image-prompt.md`, `visuals/assets/generated/` | writing an image-generation prompt; only the SCENE block is written fresh |

Placing an existing figure onto a slide or into another figure is slides/figures work, not
diagram work. Anything structural is a diagram, never a generated illustration. Work that spans
two rows — a figure whose diagram you also change — means reading both.

**Browser validation (rule 8).** For a minor change (slide copy, a token, an existing layout),
validate in the browser only when explicitly asked. For something new — a deck, slide, figure, or
widget — ask in the plan whether browser validation is wanted, and only start the preview if
it is.

**Git (rule 9).** Rule 9 overrides any harness default that suggests isolating background work in
a worktree.

**The core is a subtree.** In a project, `core/` is ordinary committed files, one project's copy of
the core. An agreed core change goes in commits that touch only `core/`, and reaches the core repo
with `git subtree push`. Updating the core and changing it from a project are in
[`core/README.md`](README.md#projects). Starting a project, or moving a deck between projects, follows
[`core/docs/NEW-PROJECT.md`](docs/NEW-PROJECT.md) (`new-project`).

## Conventions & Constraints

- **`file://` must keep working.** Use classic `<script>` tags, no ES modules, no `fetch`, and
  keep every deck and figure document exactly **two levels deep** (`decks/<name>/index.html`,
  `figures/<name>/index.html`) so shared paths stay `../../core/...`. The core's own
  `example/` is the one exception: laid out like a project one level deeper, it links `../../../`.
- **Presentations must work offline.** Everything a deck needs to run is local: Reveal is in
  `core/deck-kit/reveal/`, and fonts are system fonts. Remote media is allowed, and any picture or
  clip that fails to load shows a stand-in. Never link a script or stylesheet from a CDN.
- **`SLIDES:START` / `SLIDES:END` markers** in a deck's `index.html` are load-bearing: the
  inline editor rewrites the array between them. Never remove or reword them, and keep anything
  the editor must not touch outside them. The block is strict JSON in the format
  `JSON.stringify(slides, null, 2)` writes, with no comments, so a save changes only the edited lines.
- **Editable text carries `data-edit="<slideIndex>/<field>"`** (for example
  `1/columns/0/description`). Any new template region that should be editable needs this path.
- **Points are the unit.** The Reveal canvas is `960×540` — a PowerPoint 16:9 page — so one
  canvas unit = 1 pt. The type scale and spacing tokens hold point values, written in `px`
  because CSS px == our point; never use `pt`/`cm`/`mm` keywords in CSS (they drift 96-vs-72).
  Diagram geometry is authored in the same point unit, and `Units.cm()/mm()/pt()` convert
  physical sizes for print figures (`cm(8)` → 226.77 pt).
- **Non-scaled surfaces use screen px.** Reveal scales the slide canvas up to the viewport, so
  the point tokens render at their intended size *only inside a deck*. Surfaces that render the
  theme outside that transform — the landing page (`index.html`), the toolbars in `chrome.css`, and the figure page in `figure.css` —
  must size with literal screen px, not the point-valued type/spacing tokens, or they come out
  half-size. Colours and other non-size tokens are still shared.
- **Fragments only animate in fullscreen.** In a normal tab every `fragment` shows at once;
  entering fullscreen restarts the current slide's fragments. This is deliberate.
- **Heading/prose roles.** Pick tags by semantic role, never by size: `h1` = the one slide title,
  `h2` = every column/card heading, `h3` = a heading nested inside a column (rare), `p` = all prose.
- **`?thumb`** renders a chrome-less, non-interactive first slide. **`?print-pdf`** loads Reveal's
  print CSS and auto-opens the print dialog.

## Architecture

The core is grouped by what is inside. `theme/` holds the tokens every page loads, plus the settings and toolbar look decks and figures share; `drawing-kit/`
draws diagrams, charts, and icons; `math/` turns LaTeX into vector SVG; `deck-kit/` builds decks; `figure-kit/` composes figures, for figure pages and for decks that import a figure;
`landing/` builds the index page that lists them.
`tools/` and `docs/` are never loaded by a page. `example/` is the core's own small project, so
the core can be run and changed without one. A project adds its own `visuals/`, `decks/`, and
`figures/` beside `core/`.

**Theme** (`core/theme/`) — `theme.css` is loaded by every page; `config.js` and `chrome.css` by deck and figure pages only:

| Path | Global | Owns |
|---|---|---|
| `theme.css` | — | Fonts, semantic tokens (`--text`, `--background`, `--border`, `--accent`, `--graphic-*`) — colours and fonts are neutral defaults that `visuals/brand.css` overrides; everything else is core-owned, point type scale, spacing, icon stroke, motion. Source of truth for anything the browser renders; a kit (`diagram`, `charts`) may carry standalone fallbacks, used only when no theme is loaded |
| `config.js` | `Config` | JS settings CSS can't supply: figure font + type scale. The same in every project — a brand does not override them; every other variable stays in its own module |
| `chrome.css` | — | The one toolbar look (`.chrome`); where it sits is in `deck.css` and `figure.css` |

**Drawing kit** (`core/drawing-kit/`) — what diagrams, charts, and icons are drawn with, in decks and figures:

| Path | Global | Owns |
|---|---|---|
| `units.js` | `Units` | `cm()/mm()/pt()` converters to the point base |
| `icons/icons.js` + `.css` | `Icons` | Icon registry in a normalized square viewBox. `place(...)` embeds an icon as a `<g>` in a parent `<svg>`; `svg(...)` returns it standalone |
| `icons/flat-icons.js` | extends `Icons` | Imported single-region artwork, `fixedStroke: false` |
| `diagram/diagram.js` + `.css` | `Diagram` | TikZ-style named node/edge layout; geometry in JS, appearance in theme tokens. `Diagram.defaults` owns diagram geometry defaults |
| `charts/charts.js` + `.css` | `Charts` | Data charts (`scatter`, `legend`) placed by scales from data. Sibling of `diagram`; `Charts.render(spec)` dispatches on `spec.kind`. `Charts.defaults` owns chart geometry defaults |

**Math** (`core/math/`) — LaTeX to vector SVG, for decks and figures that load it:

| Path | Global | Owns |
|---|---|---|
| `math.js` | `Tex` | MathJax config, `Tex.ready`, `Tex.render` (one formula to `<svg>`), and `typeset`/`untypeset` for `$…$` and `$$…$$` in slide text. Loaded before `tex-svg.js` |
| `tex-svg.js` | `MathJax` | MathJax 3.2.2 combined TeX-input, SVG-output bundle as published, with its `LICENSE`. To upgrade, replace both |

**Deck kit** (`core/deck-kit/`) — decks only:

| Path | Global | Owns |
|---|---|---|
| `deck.js` | `Deck` | Renders `SLIDES`, inline editor, PDF export, the stand-in for media that fails to load; `editAttr` and `caption`, the helpers the deck kit's blocks and widgets share |
| `deck.css` | — | What applies to every slide: slide structure, `.reveal h1…p` sizes, the import rule, the fragment marker, laser pointer, the toolbar's place, edit outlines, print rules. A component's own rules live in its own CSS |
| `reveal/` | `Reveal` | reveal.js 5.1.0 as published, with its licence. To upgrade, replace `reveal.js`, `reveal.css`, and `LICENSE` |
| `templates.js` + `.css` | `Templates` | Slide layouts |
| `figure-import.js` + `.css` | `FigureImport` | The `figure` block: imports a figure module onto a slide and drives its steps |
| `image.js` + `.css` | `ImageBlock` | The `image` block: one picture or a grid of them — photos, logos, icons |
| `widgets/<name>.js` + `.css` | — | Non-SVG widgets: `badge`, `timeline`, `wash` |

**Figure kit** (`core/figure-kit/`) — composing a figure, used by figure pages and by every deck that imports one (the `figure` block); export and the page chrome serve figure pages only:

| Path | Global | Owns |
|---|---|---|
| `figure.js` | `Figure` | Composes diagram-kit drawings, nested figures, SVG text, formulas (`math`), and rasters on a cm canvas (`create`, `preload`; decks use these too); SVG / 600 dpi PNG / vector PDF export and the figure page (`mount`, `mountModule`) |
| `figure.css` | — | Figure artifact styling, on figure pages and imported figures alike, then the figure page around it; `.figure-chrome h1` sizes figure headings |

**Landing** (`core/landing/`) — the project's index page:

| Path | Global | Owns |
|---|---|---|
| `landing.css` | — | Top bar, hero, tabs, cards, about, footer, and bare `h1/h2/h3/p` for the landing page only; not loaded by decks or figures |
| `landing.js` | — | Tab toggle, deferred thumbnails, card titles from each thumbnail's `DeckMeta` / `FigureMeta` |

**Example** (`core/example/`) — the core's own project, laid out like one, one level deeper:

| Path | Global | Owns |
|---|---|---|
| `index.html` | — | Landing page for the pages below; the template a project's landing page is copied from |
| `.claude/launch.json` | — | The preview config a project copies, with its `core/tools/serve.js` path; never used from here |
| `visuals/` | — | An empty `brand.css`, so the core's neutral defaults show, an `image-prompt.md` template, placeholder assets, and the Hopfield deck's `HopfieldBackground` in `backgrounds/` |
| `decks/showcase/index.html` | — | One slide per template, block kind, and widget; where a core change is looked at |
| `decks/hopfield-networks/` | — | A short real deck; its hero `background` is a live network |
| `figures/example-steps/` | `ExampleStepsFigure` | One stepped figure; the worked example in FIGURE-STYLE.md |
| `figures/hopfield-state/` | `HopfieldStateFigure` | The Hopfield deck's stepped figure: neurons as pixels, and the state as all their values |
| `figures/hopfield-landscape/` | `HopfieldLandscapeFigure` | The Hopfield deck's stepped figure: stored images as valleys, and a state running downhill into one |
| `figures/hopfield-heart-equations/` | `HopfieldHeartWeightFigure`, `HopfieldHeartEnergyFigure`, `HopfieldHeartUpdateFigure` | The Hopfield deck's three equation figures, one heart each, stepped; `hopfield-heart-{weight,energy,update}/` hold their pages |

**Project** — beside `core/`, one set per project. Locality above governs the core. A project is
organized by kind, because its content belongs to the project rather than to one deck: a deck's
folder holds only its `index.html`, a figure's folder that figure, and `visuals/` every other visual.

| Path | Global | Owns |
|---|---|---|
| `visuals/brand.css` | — | The project's `--color-*` palette and its semantic colour (and optionally CSS font) overrides. Loaded right after `core/theme/theme.css` on every page. Raw `--color-*` never leave this file, and it overrides nothing structural. Figure, diagram, and chart labels always use `--f-figure` from `config.js` |
| `visuals/image-prompt.md` | — | The fixed blocks of the project's illustration prompts (see IMAGE-STYLE.md) |
| `visuals/vendor-icons.js` | extends `Icons` | Third-party marks, never recoloured; project-only, so the core ships no trademarks. Loaded explicitly after `icons.js` |
| `visuals/backgrounds/<name>-background.js` + `.css` | e.g. `<Name>Background` | A hero `background`, whether one deck uses it or several; its CSS also places the title block. Not a widget: widgets are core only |
| `visuals/assets/` | — | Project media: logos, portraits, partner marks, covers, generated illustrations |
| `decks/<name>/index.html` | — | The `SLIDES` array + one `Deck.mount({...})` call |
| `figures/<name>/<name>.js` | `<Name>Figure` | `{ width, height, title, name, className, ariaLabel, steps?, draw }`; `draw(fig[, step])` renders in local coordinates and adds **no** background. Nine-section template, see FIGURE-STYLE.md. The only way to make a drawing that a deck or another figure reuses; one file may export several modules that share size settings |
| `figures/<name>/<name>.css` | — | The figure's drawing appearance, on its diagram's SVG class; loaded by every page that shows the figure |
| `figures/<name>/index.html` | — | Thin shell → `Figure.mountModule(window.<Name>Figure)` |
| `index.html` | — | Landing page: hero, cards, and about, on `core/landing/`; copied from the example's |
| `.claude/` | — | The agent guardrails: `settings.json` copied from `core/.claude/`, `launch.json` from `core/example/.claude/`. Claude Code reads settings only from the folder it starts in. Agents cannot edit these; the user does |

**Mechanics not visible from the paths:**

- **Heading sizes are per surface**, not global: landing page → `core/landing/landing.css`, deck → `.reveal h1…p` in
  `deck.css`, figure → `.figure-chrome h1`. To resize a tag's slide text, edit `core/deck-kit/deck.css`; a component deviating from it says so in its own CSS.
- **Text never resizes on its own.** `theme.css` sets `--diagram-scale: 1.5` and `deck.css` applies it to
  both kinds of import — a placed drawing (`.diagram`, `.chart`) and a whole imported figure (`.figure`)
  — as intrinsic size × scale capped at 100% of the container: *1.5, or the largest that fits*.
  An 8pt figure label reads 12pt on a slide. Figure pages don't link `deck.css`, so they keep
  their authored cm size. Text added *around* an import belongs to the slide or figure and takes
  that surface's type scale.
- **Icon colour and stroke are independent toggles**, not icon kinds: colour defaults to
  `--icon-*` but is inert on brand marks; stroke is a fixed absolute width unless
  `fixedStroke: false`.
- **`image`** is the one way to show a still picture, alone or as a set. With no slot size each
  picture takes its own size; stating `cellWidth`/`cellHeight` or `width`/`height` puts every
  item in an equal slot, for logos and icons. `equalize` sizes slotted logos to one drawn area,
  weighted by each logo's `cover` (ink fraction from `mark-coverage.js`) when given. **`wash`** is a coloured backdrop panel whose hue is
  picked by hashing a seed string, so the same seed is always the same wash. The **`figure`**
  block (`figure-import.js`) imports a whole figure onto a slide and drives its steps from Reveal fragments, or plays them
  on a timer when the module declares `autoplay`/`holds`.
- **Rasters in figures** are listed in the module's `images` as ordinary relative paths and
  inlined as data URIs on export — so *exporting* such a figure needs the dev server, *viewing*
  it does not.
- **Nesting:** `fig.nestModule(M, {x,y,scale?})` drops a child composition module into a parent
  as one flat `<g transform>`; `fig.nest({x,y,scale?}, drawFn)` is the bounds-less form beneath it.
- **Saving edits:** on the dev server, the editor's **Done** sends the page to the server with a
  `PUT`, which overwrites that existing `.html` file with no prompts. This `fetch` is the one exception to the
  no-`fetch` rule: only the server's injected script sets `window.DEV_SERVER`, so it never runs on
  `file://`, where the editor uses the browser's file picker, or a download without one.
- **Debug frames** are always emitted and CSS-hidden; the chrome's Debug button reveals them all
  and `serialize()` strips them from every export.

## Running It

There is no build, test, or lint step. Validation is opening the page.

| Task | Command |
|---|---|
| Live-reload dev server (port 8099), from the project root; the core's example is at `/core/example/` | `bun run core/tools/serve.js` |
| Dev server for the core alone, from the core folder; `/` redirects to `/example/` | `bun run tools/serve.js` |
| Dev server started by an agent, so it never takes the user's port 8099; stop it when done | `PORT=8100 bun run core/tools/serve.js` |
| Regenerate icon bounding boxes | `bun run core/tools/icon-metrics.js` |
| Ink coverage for optically sized marks | `bun run core/tools/mark-coverage.js <file\|folder>...` |

Opening any deck's or figure's `index.html` directly also works; you only lose auto-refresh and
prompt-free saving (see **Saving edits**).
Without a project, open `example/index.html` in the core.

**Gotcha:** the on-slide editor autosaves a draft to `localStorage` under
`deck-draft:<storageKey>:v1`. That draft shadows hand-edits to the same `SLIDES` fields until it
clears. If a file change does not appear in the browser, clear that key or finish the on-screen
edit with **Done**.
