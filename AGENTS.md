# AGENTS.md

The hard rules for working with this core and the projects built on it, plus the constraints
that are easy to violate. Paths in text are written from a project root, where this repo is checked
out as `core/`; link targets are relative to this file. If the working directory has no `core/`
folder, you are working on the core alone: drop the `core/` prefix; the project paths then exist only
under `example/`. The fuller editing, running, and presenting workflow is in [`core/README.md`](README.md).

## Rules

1. Don't assume. Don't hide confusion. Surface tradeoffs.
2. Minimum code that solves the problem. Nothing speculative.
3. Touch only what you must. Clean up only your own mess.
4. Do not preserve backwards compatibility, optimize for the long run.
5. Comments say what the code does, nothing else. Five lines max, fewer is better.
6. Compose from existing shared pieces. Anything new is ask-first: plan, agree, then build.
7. Read the skill that governs the files you are about to touch, before touching them.
8. Only inspect a page visually when asked to do so, with [`core/skills/page-check/SKILL.md`](skills/page-check/SKILL.md).
9. Always work in the current checkout, only create a git worktree if explicitly asked to do so.
10. Stay inside the repo. Never search, read, or write outside the working directory.

## Observing while you work

1. Stay attentive to problems in this repo's instructions and code as you
   work. A user correction, a failed call, a guess, a workaround, two
   sources that disagree, or a result that surprised you are signals.

2. A suspicion is enough. On any signal, read
   [`core/skills/issue-log/SKILL.md`](skills/issue-log/SKILL.md) before deciding
   it was nothing; it decides whether to log, and how.

3. Then keep working on your original task. Don't patch anything mid-task.

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

**Ask first (rule 6).** Anything other projects might use — the core's kits, theme, tools, and skills —
needs a concise plan and the user's agreement before it changes. So does a new deck, figure, slide
template, block, widget, app, icon, or colour. `core/example/` is the exception: change
it freely. Compose from what already exists unless the user agrees to a new piece.

**Which skill (rule 7).** These are the authoring skills for this repo, not background
reading. Read the skill's `SKILL.md` before the work; it names its reference files, and you open
one only when the task needs it.

| Skill | Governs | Read it before |
|---|---|---|
| [`core/skills/slide-decks/SKILL.md`](skills/slide-decks/SKILL.md) | `decks/`, `visuals/apps/`, `core/deck-kit/`, `core/theme/theme.css`, `visuals/brand.css`, `core/landing/` | adding or reordering slides, writing slide copy, building a deck, placing an existing figure on a slide, changing a template, layout, tag, or theme token |
| [`core/skills/diagrams/SKILL.md`](skills/diagrams/SKILL.md) | `core/drawing-kit/diagram/`, `core/drawing-kit/charts/`, and the diagram-kit drawing code inside a figure module | *constructing* a diagram or chart: drawing one with the kit, editing one, or changing a kit |
| [`core/skills/figures/SKILL.md`](skills/figures/SKILL.md) | `figures/`, `core/figure-kit/` | building or editing a publication figure or the figure kit |
| [`core/skills/illustrations/SKILL.md`](skills/illustrations/SKILL.md) | `visuals/image-prompt.md`, `visuals/assets/generated/` | writing an image-generation prompt; only the SCENE block is written fresh |
| [`core/skills/issue-log/SKILL.md`](skills/issue-log/SKILL.md) | `issues/` | as soon as you suspect a problem in the repo's instructions or code (see *Observing while you work*) |
| [`core/skills/issue-fix/SKILL.md`](skills/issue-fix/SKILL.md) | instructions: skills, `AGENTS.md`, `README.md`, code comments, kit doc headers | changing any instruction, or working through `issues/`, code entries included |
| [`core/skills/page-check/SKILL.md`](skills/page-check/SKILL.md) | headless screenshots and figure exports | looking at a page or exporting a figure, only when the user asks |

Placing an existing figure onto a slide or into another figure is slides/figures work, not
diagram work. Anything structural is a diagram, never a generated illustration. Work that spans
two rows — a figure whose diagram you also change — means reading both.

**The core is a subtree.** In a project, `core/` is ordinary committed files, one project's copy of
the core. An agreed core change goes in commits that touch only `core/`, and reaches the core repo
with `git subtree push`. Updating the core and changing it from a project are in
[`core/README.md`](README.md#keeping-a-project-in-sync-with-the-core). Starting a project, or moving a deck between projects, follows
[`core/skills/new-project/SKILL.md`](skills/new-project/SKILL.md).

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

## Architecture

The core is grouped by what is inside. `theme/` holds the tokens every page loads, plus the settings and toolbar look decks and figures share; `drawing-kit/`
draws diagrams, charts, and icons; `math/` turns LaTeX into vector SVG; `deck-kit/` builds decks; `figure-kit/` composes figures, for figure pages and for decks that import a figure;
`landing/` builds the index page that lists them.
`tools/` and `skills/` are never loaded by a page. `example/` is the core's own small project, so
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
| `landing.css` | — | Top bar, hero, tabs, collapsible card groups, cards, about, footer, and bare `h1/h2/h3/p` for the landing page only; not loaded by decks or figures |
| `landing.js` | — | Tab toggle, deferred thumbnails, card titles each thumbnail sends by `postMessage` |

**Example** (`core/example/`) — the core's own project, laid out like one, one level deeper:

| Path | Global | Owns |
|---|---|---|
| `index.html` | — | Landing page for the pages below; the template a project's landing page is copied from |
| `.claude/launch.json` | — | The preview config a project copies, with its `core/tools/serve.js` path; never used from here |
| `visuals/` | — | An empty `brand.css`, so the core's neutral defaults show, an `image-prompt.md` template, placeholder assets, a generated illustration, and the example decks' apps |
| `decks/showcase/index.html` | — | One slide per template, block kind, and widget; where a core change is looked at |
| `figures/example-steps/` | `ExampleStepsFigure` | One stepped figure; the worked example in the `figures` skill |
| other `decks/`, `figures/` | — | The Hopfield and dot-product decks, with the figures they import, as real examples |

**Project** — beside `core/`, one set per project. Locality above governs the core. A project is
organized by kind, because its content belongs to the project rather than to one deck: a deck's
folder holds only its `index.html`, a figure's folder that figure, and `visuals/` every other visual.

| Path | Global | Owns |
|---|---|---|
| `visuals/brand.css` | — | The project's `--color-*` palette and its semantic colour (and optionally CSS font) overrides. Loaded right after `core/theme/theme.css` on every page. Raw `--color-*` never leave this file, and it overrides nothing structural. Figure, diagram, and chart labels always use `--f-figure` from `config.js` |
| `visuals/image-prompt.md` | — | The fixed blocks of the project's illustration prompts (see the `illustrations` skill) |
| `visuals/vendor-icons.js` | extends `Icons` | Third-party marks, never recoloured; project-only, so the core ships no trademarks. Loaded explicitly after `icons.js` |
| `visuals/apps/<name>.js` + `.css` | e.g. `<Name>` | A live, interactive piece, whether one deck uses it or several: `render(spec)` returns its markup and the app drives itself. Placed with the `app` block, or as a hero `background`, where its CSS also places the title block. Not a widget: widgets are core only |
| `visuals/assets/` | — | Project media: logos, portraits, partner marks, covers, generated illustrations |
| `decks/<name>/index.html` | — | The `SLIDES` array + one `Deck.mount({...})` call |
| `figures/<name>/<name>.js` | `<Name>Figure` | `{ width, height, title, name, className, ariaLabel, steps?, draw }`; `draw(fig[, step])` renders in local coordinates and adds **no** background. Nine-section template, see the `figures` skill. The only way to make a drawing that a deck or another figure reuses; one file may export several modules that share size settings |
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
  An 8pt figure label reads 12pt on a slide, provided the figure is authored no wider than its column ÷ 1.5 and no taller than `maxHeight` ÷ 1.5, or the scale drops (see the `figures` skill). Figure pages don't link `deck.css`, so they keep
  their authored cm size. Text added *around* an import belongs to the slide or figure and takes
  that surface's type scale.
- **Dev-server only:** the server's injected script sets `window.DEV_SERVER`, and only code that
  checks it may `fetch`. The deck editor's **Done** sends the page back with a `PUT`, which
  overwrites that existing `.html` file with no prompts; figure export fetches image bytes.
  Without the server, **Edit** and a figure with images' exports show disabled, with a note on hover.

## Running It

There is no build, test, or lint step. Validation is opening the page.

| Task | Command |
|---|---|
| Live-reload dev server (port 8099), from the project root; the core's example is at `/core/example/` | `bun run core/tools/serve.js` |
| Dev server for the core alone, from the core folder; `/` redirects to `/example/` | `bun run tools/serve.js` |
| Regenerate icon bounding boxes | `bun run core/tools/icon-metrics.js` |
| Ink coverage for optically sized marks | `bun run core/tools/mark-coverage.js <file\|folder>...` |

Opening any deck's or figure's `index.html` directly also works; you lose auto-refresh, editing,
and exporting figures with images (see **Dev-server only**).
Without a project, open `example/index.html` in the core.

**Gotcha:** the on-slide editor autosaves a draft to `localStorage` under
`deck-draft:<storageKey>:v1`. While it exists, the deck shows the draft's slides, not the file's.
A hand-edit to `SLIDES` discards the draft on the next load, so finish an on-slide edit with
**Done** before editing the file.
