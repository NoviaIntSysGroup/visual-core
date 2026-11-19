# AGENTS.md

The hard rules for working with this core and the projects built on it, plus the constraints
that are easy to violate. Paths are written from a project root, where this repo is checked out
as `core/`. If the working directory has no `core/` folder, you are working on the core alone:
drop the `core/` prefix; the project paths then exist only under `example/`. The fuller
editing, running, and presenting workflow is in `core/README.md`.

## Rules

1. Don't assume. Don't hide confusion. Surface tradeoffs.
2. Minimum code that solves the problem. Nothing speculative.
3. Touch only what you must. Clean up only your own mess.
4. Optimize for the long run: reshape to fit each new need; never bolt on shims or exceptions.
5. Comments say what the code does, nothing else. Five lines max, fewer is better.
6. Compose from existing shared pieces. Anything new is ask-first: plan, agree, then build.
7. Read the skill that governs the files you are about to touch, before touching them.
8. Only inspect a page visually when asked to do so, or while drawing a figure (its source art
   and its own frames), with `core/skills/page-check/SKILL.md`.
9. Always work in the current checkout, only create a git worktree if asked to do so.
10. Stay inside the repo. Never search, read, or write outside the working directory; scratch
    files go in `tmp/<task>/` at its root, one folder per task, since sessions share `tmp/`.
11. The shell starts in the working directory: never `cd` into it, use paths relative to it.

## Observing while you work

1. Stay attentive to this repo's instructions and code as you work. A user correction, a failed
   call, two sources that disagree, a result that surprised you, reading far more than the task
   needed, code that breaks a *Human-first architecture* rule, or anything you had to guess,
   work around, work out, or be told that no instruction states are signals.

2. A hook loads `core/skills/issue-log/SKILL.md` into every session, and at the end of each
   turn that used tools asks you to sweep the turn for anything to log. A suspicion is enough:
   on any signal, that skill decides whether to log, and how.

3. Then keep working on your original task. Don't patch anything mid-task.

## Human-first architecture

1. Optimize for a human reader unfamiliar with the implementation. Minimize the context they
   must hold in their head.

2. Optimize for locality of understanding. Code read together should usually live together. A
   cohesive larger module is preferable to many tiny modules that must be mentally reassembled.

3. Every abstraction must remove more cognitive load than it introduces. Avoid one-use
   interfaces, factories, wrappers, helpers and extension points.

4. Organize primarily around domain concepts and execution flows, not technical categories or
   design patterns. Preserve a top-down reading path where practical.

5. Before finishing, trace the primary workflow as a human debugger would. Remove unnecessary
   files, hops, indirection and concepts. The goal is not minimum LOC; it is minimum complexity
   required to understand the system.

## Working In This Repo

**Ask first (rule 6).** Anything other projects might use — the core's kits, theme, tools, and
skills — needs a concise plan and the user's agreement before it changes. So does a new deck,
figure, slide template, block, widget, app, icon, or colour. `core/example/` is the exception:
change it freely. Compose from what already exists unless the user agrees to a new piece. Plan
a new look for a shared piece as an option beside the current one, unless asked to replace it.

**Which skill (rule 7).** These are the authoring skills for this repo, not background reading.
Read the skill's `SKILL.md` before the work; it names its reference files, and you open one
only when the task needs it.

| Skill | Governs | Read it before |
|---|---|---|
| `core/skills/slide-decks/SKILL.md` | `decks/`, `visuals/apps/`, `core/deck-kit/`, `core/theme/theme.css`, `visuals/brand.css`, `core/landing/` | adding or reordering slides, writing slide copy, building a deck, placing an existing figure on a slide, changing a template, layout, tag, or theme token |
| `core/skills/diagrams/SKILL.md` | `core/drawing-kit/diagram/`, `core/drawing-kit/charts/`, and the diagram-kit drawing code inside a figure module | *constructing* a diagram or chart: drawing one with the kit, editing one, or changing a kit |
| `core/skills/figures/SKILL.md` | `figures/`, `core/figure-kit/` | building or editing a publication figure or the figure kit |
| `core/skills/style/SKILL.md` | the house style: what a slide or drawing says, wording, colour and form | writing slide copy, or designing or editing a figure or diagram |
| `core/skills/illustrations/SKILL.md` | `visuals/image-prompt.md`, `visuals/assets/generated/` | writing an image-generation prompt; only the SCENE block is written fresh |
| `core/skills/issue-log/SKILL.md` | `issues/` | loaded by a hook at session start (see *Observing while you work*) |
| `core/skills/issue-fix/SKILL.md` | instructions: skills, `AGENTS.md`, `README.md`, code comments, kit doc headers | changing any instruction, or working through `issues/`, code entries included |
| `core/skills/page-check/SKILL.md` | headless screenshots and figure exports | looking at a page or exporting a figure, only when the user asks |

Placing an existing figure onto a slide or into another figure is slides/figures work, not
diagram work. Anything structural is a diagram, never a generated illustration. Work that spans
two rows — a figure whose diagram you also change — means reading both.

**The core is a subtree.** In a project, `core/` is ordinary committed files, one project's
copy of the core. An agreed core change goes in commits that touch only `core/`, and reaches
the core repo with `git subtree push`. Updating the core and changing it from a project are in
`core/README.md`, under *Keeping a project in sync with the core*. Starting a project, or
moving a deck between projects, follows `core/skills/new-project/SKILL.md`.

## Conventions & Constraints

- **`file://` must keep working.** Use classic `<script>` tags, no ES modules, no `fetch`, and
  keep every deck and figure document exactly **two levels deep** (`decks/<name>/index.html`,
  `figures/<name>/index.html`) so shared paths stay `../../core/...`. The core's own `example/`
  is the one exception: laid out like a project one level deeper, it links `../../../`.
- **Presentations must work offline.** Everything a deck needs to run is local: Reveal is in
  `core/deck-kit/reveal/`, and fonts are system fonts. Remote media is allowed, and any picture
  or clip that fails to load shows a stand-in. Never link a script or stylesheet from a CDN.
- **`SLIDES:START` / `SLIDES:END` markers** in a deck's `index.html` are load-bearing: the
  inline editor rewrites the array between them. Never remove or reword them, and keep anything
  the editor must not touch outside them. The block is strict JSON in the format
  `JSON.stringify(slides, null, 2)` writes, with no comments, so a save changes only the edited
  lines.
- **Points are the unit.** The Reveal canvas is `960×540` — a PowerPoint 16:9 page — so one
  canvas unit = 1 pt. The type scale and spacing tokens hold point values, written in `px`
  because CSS px == our point; never use `pt`/`cm`/`mm` keywords in CSS (they drift 96-vs-72).
  Diagram geometry is authored in the same point unit, and `Units.cm()/mm()/pt()` convert
  physical sizes for print figures (`cm(8)` → 226.77 pt).
- **Non-scaled surfaces use screen px.** Reveal scales the slide canvas up to the viewport, so
  the point tokens render at their intended size *only inside a deck*. Surfaces that render the
  theme outside that transform — the landing page (`index.html`), the toolbars in `chrome.css`,
  and the figure page in `figure.css` — must size with literal screen px, not the point-valued
  type/spacing tokens, or they come out half-size. Colours and other non-size tokens are still
  shared.
- **Markdown wraps at 95 columns.** Rewrap only the paragraphs you change. Table rows, code
  blocks, HTML, and a line holding one long code span or URL may run over.

## Architecture

The core is grouped by what is inside. Each folder's API is in the skill that governs it (table
above) and in its files' doc headers; this section holds only what crosses folders.

| Folder | Globals | Holds |
|---|---|---|
| `theme/` | `Config` | `theme.css`, loaded by every page: the source of truth for tokens. `config.js` (figure font and type scale, the same in every project) and `chrome.css` (the one toolbar look), loaded by deck and figure pages only |
| `drawing-kit/` | `Units`, `Icons`, `Diagram`, `Charts` | Diagrams, charts, and icons, for decks and figures. `diagram` and `charts` carry colour fallbacks used only when no theme is loaded |
| `math/` | `Tex`, `MathJax` | LaTeX to vector SVG; `math.js` loads before `tex-svg.js` |
| `deck-kit/` | `Deck`, `Templates`, `FigureImport`, `ImageBlock`, `Reveal` | Decks: rendering, templates, blocks, `widgets/` (core only), the editor, PDF export |
| `figure-kit/` | `Figure` | Composes figures, for figure pages and for the deck's `figure` block; export and the figure page |
| `landing/` | — | The project's index page; not loaded by decks or figures |
| `tools/`, `skills/` | — | Never loaded by a page |
| `example/` | — | The core's own project. `decks/showcase/` has one slide per template, block, and widget: where a core change is looked at |

`deck-kit/reveal/` (reveal.js 5.1.0) and `math/tex-svg.js` (MathJax 3.2.2) are vendored as
published: never edit them; upgrade by replacing the files and their `LICENSE`.

**Project** — beside `core/`, organized by kind, because its content belongs to the project
rather than to one deck:

- `visuals/brand.css` — the `--color-*` palette and semantic colour (optionally font)
  overrides, loaded right after `theme.css`. Raw `--color-*` never leave it; it overrides
  nothing structural.
- `visuals/vendor-icons.js` — third-party marks, never recoloured; project-only, so the core
  ships no trademarks.
- `visuals/apps/` — live, interactive pieces. Not widgets: widgets are core only.
- `visuals/assets/`, `visuals/image-prompt.md` — media, and the fixed blocks of illustration
  prompts.
- `decks/<name>/index.html` — only the `SLIDES` array and one `Deck.mount({...})` call.
- `figures/<name>/` — one figure module, its CSS, and a thin `index.html`. A figure module is
  the only way to make a drawing a deck or another figure reuses.
- `.claude/` — copied from `core/.claude/` and `core/example/.claude/`; agents cannot edit it.

**Mechanics not visible from the paths:**

- **Heading sizes are per surface**, not global: landing page → `core/landing/landing.css`,
  deck → `.reveal h1…p` in `deck.css`, figure → `.figure-chrome h1`. To resize a tag's slide
  text, edit `core/deck-kit/deck.css`; a component deviating from it says so in its own CSS.
- **Text never resizes on its own.** `theme.css` sets `--diagram-scale: 1.5` and `deck.css`
  applies it to both kinds of import — a placed drawing (`.diagram`, `.chart`) and a whole
  imported figure (`.figure`) — as intrinsic size × scale capped at 100% of the container:
  *1.5, or the largest that fits*. An 8pt figure label reads 12pt on a slide, provided the
  figure is authored no wider than its column ÷ 1.5 and no taller than `maxHeight` ÷ 1.5, or
  the scale drops (see the `figures` skill). Figure pages don't link `deck.css`, so they keep
  their authored cm size. Text added *around* an import belongs to the slide or figure and
  takes that surface's type scale.
- **Dev-server only:** the server's injected script sets `window.DEV_SERVER`, and only code
  that checks it may `fetch`. The deck editor's **Done** sends the page back with a `PUT`,
  which overwrites that existing `.html` file with no prompts; figure export fetches image
  bytes. Without the server, **Edit** and a figure with images' exports show disabled, with a
  note on hover.

## Running It

There is no build, test, or lint step. Validation is opening the page.

| Task | Command |
|---|---|
| Live-reload dev server (port 8099), from the project root; the core's example is at `/core/example/` | `bun run core/tools/serve.js` |
| Dev server for the core alone, from the core folder; `/` redirects to `/example/` | `bun run tools/serve.js` |
| Regenerate icon bounding boxes | `bun run core/tools/icon-metrics.js` |
| Ink coverage for optically sized marks | `bun run core/tools/mark-coverage.js <file\|folder>...` |

Opening any deck's or figure's `index.html` directly also works; you lose auto-refresh,
editing, and exporting figures with images (see **Dev-server only**). Without a project, open
`example/index.html` in the core.

**Gotcha:** the on-slide editor autosaves a draft to `localStorage` under
`deck-draft:<storageKey>:v1`. While it exists, the deck shows the draft's slides, not the
file's. A hand-edit to `SLIDES` discards the draft on the next load, so finish an on-slide edit
with **Done** before editing the file.
