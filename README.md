# Presentations & Figures

Agents have become very good at making HTML visuals: a presentation, an animation, a figure for a
paper. Left alone, though, they drift from your visual style and write code that is hard for a
human to edit.

This core fixes both. Decks and figures share one theme, one diagram kit, and one set of slide
templates, so agent-made visuals follow your style. Each is plain, readable HTML you can edit
by hand or directly on the slide. You keep what agents are good at and what HTML is good at:
speed, flexibility, animation, and vector export, from slides to 600 dpi publication figures.

Plain HTML, CSS, and JavaScript. **No build step, no framework, no install.** A deck's `index.html`
runs from `file://`, a local server, or a static host, offline, because Reveal.js ships inside the
core. A figure drops onto a slide or into another figure unchanged.

## See It

The core's [example project](https://noviaintsysgroup.github.io/visual-core/example/) is hosted online: a landing page, a showcase deck with every slide template, block, and widget, a short deck on 
Hopfield networks, and three stepped figures. This is what a working project looks like.

The core is not used on its own. It is added to a project repo as a git subtree at `core/`, beside
the project's `visuals/`, `decks/` and `figures/`.

## Projects

The core is committed as ordinary files at `core/`, so a clone or ZIP of a project runs with no
further step. Each project keeps its own copy; a core change reaches it only when it pulls.
Git controls access per repo, so one repo is one audience, and collaborators need no access to the core repo.

### Start A New Project

```powershell
git init my-project
cd my-project
git commit --allow-empty -m "start project"
git subtree add --prefix=core https://github.com/NoviaIntSysGroup/visual-core.git main --squash
mkdir .claude
cp core/.claude/settings.json .claude/
cp core/example/.claude/launch.json .claude/
```

`--prefix=core` puts this repo's root (`theme/`, `deck-kit/`, ...) inside the project's `core/`.
The empty commit gives `subtree add` something to build on. The last three lines install the agent
guardrails before any agent runs; Claude Code reads settings only from the folder it starts in, so
`core/.claude/` has no effect on its own.

**On Windows, run Claude Code inside WSL2.** The guardrails require its sandbox, which does not run
on native Windows, so Claude Code exits at startup there.

Then tell your agent: *Set up this project using `core/docs/NEW-PROJECT.md`.* A new repo has no
`AGENTS.md` yet, so the agent finds that file only because you name it. It creates the landing page,
`AGENTS.md`, and the rest of the structure; you can also follow it by hand.

### Update The Core In A Project

```powershell
git subtree pull --prefix=core https://github.com/NoviaIntSysGroup/visual-core.git main --squash -m "update core"
```

An update can change every deck and figure. Look through the landing page, and undo the merge if
something broke.

An update does not touch the project's copied guardrails. Compare them, and copy over any change:

```powershell
git diff --no-index core/.claude/settings.json .claude/settings.json
git diff --no-index core/example/.claude/launch.json .claude/launch.json
```

### Change The Core From A Project

A change to the core's kits, theme, tools, or docs can reach every project, so agree on it first;
`example/` can change freely. The simplest way is to change a clone of
the core repo and pull it, as above. To send back a change made in a project's `core/`, keep it in
commits that touch nothing else and push them to a branch:

```powershell
git subtree push --prefix=core https://github.com/NoviaIntSysGroup/visual-core.git <branch-name>
```

Merge that branch in the core repo, then pull. Pushing needs write access; without it, send the
change to whoever has it.

## How It Works

A **theme** and a **drawing kit** (icons, units, a TikZ-style diagram kit, a chart kit) feed two
**outputs**, decks and figures. Neither knows about the other, which is why a figure works in both.

```text
  core/theme/ + visuals/brand.css  ·  core/drawing-kit/ (units · icons · diagram · charts)
                    │                                  │
   core/deck-kit/  ──►  decks/<name>/      core/figure-kit/  ──►  figures/<name>/
```

Every page loads `core/theme/theme.css`, then `visuals/brand.css`. The core owns every token; the
brand overrides only semantic colours and fonts.

Keep every deck and figure **two levels deep** (`decks/<name>/index.html`,
`figures/<name>/index.html`) so shared links resolve as `../../core/...`. The core's `example/` is
one level deeper and links `../../../`.

A deck's `index.html` is a `SLIDES` array plus one call:

```js
Deck.mount({
  slides: SLIDES,
  storageKey: 'my-deck',
  logo: '../../visuals/assets/logo.svg',
  logoHeight: 30,   // optional; points, default 32. Sizes the mark by height.
  templates: window.Templates,
});
```

`mount()` snapshots the pristine page, renders `SLIDES` through the templates, starts Reveal, and
wires the editor. A figure is a composition module plus a thin shell calling
`Figure.mountModule(window.<Name>Figure)`. The file-by-file map is in [AGENTS.md](AGENTS.md).

### Figures Are The One Reusable Drawing

A drawing that a deck or another figure reuses is a **figure module** under `figures/<name>/`. It
draws diagram-kit drawings and SVG text on a cm canvas and exports through the figure chrome. It may
be static, stepped, or played (`steps`, `autoplay`, `holds`). A slide imports one with the `figure`
block; another figure nests one with `fig.nestModule`. A placed figure owns only the drawing; titles,
captions, and prose belong to whatever places it.

## Repository Layout

**Your work goes in `decks/`, `figures/`, and `visuals/`; `core/` is the tooling.** A project is
organized by kind, not by deck: a deck's folder holds only its `index.html`, and every visual that
is not a figure goes in `visuals/`.

```text
index.html                    landing page: hero, cards, and about, on core/landing/
.claude/                      agent guardrails and preview config, copied from core/
visuals/
  brand.css                   the palette: semantic colour (and font) overrides
  image-prompt.md             fixed blocks of the illustration prompts
  backgrounds/                hero backgrounds, for one deck or several
  assets/                     logos, portraits, partner marks, covers, generated illustrations
decks/<name>/
  index.html                  SLIDES + Deck.mount(...)
figures/<name>/
  <name>.js                   figure composition module(s)
  <name>.css                  the figure's drawing appearance, when it has any
  index.html                  thin shell + Figure.mountModule(...)
core/                         this repo
  theme/                      the look, loaded by every page
  drawing-kit/                what diagrams, charts, and icons are drawn with
  math/                       LaTeX to vector SVG, for decks and figures that load it
  deck-kit/                   what decks are built with
  figure-kit/                 what figures are built with: figure pages, and decks that import one
  landing/                    the index page
  tools/                      dev server and measuring scripts; not loaded by any page
  docs/                       the four style guides and new-project setup; not loaded by any page
  example/                    the core's example project, one level deeper
```

## Editing A Deck

### On The Slides

1. Open a deck through the dev server, or open its `index.html` directly.
2. Click **Edit**, click editable text, and type. Edits autosave in the browser.
3. Click **Done** to write the edits into the deck's `index.html`. The dev server saves at once.
   Opened directly, Chrome or Edge asks you to pick the file (and may ask again in a later
   session); other browsers download a copy.

This edits existing text. Add or remove slides, columns, chips, and block options in the `SLIDES`
array between the `SLIDES:START` and `SLIDES:END` markers.

> **Gotcha:** drafts are kept in localStorage under `deck-draft:<storageKey>:v1` and shadow
> hand-edits to the same `SLIDES` fields. If a file change does not appear, clear that key or
> finish the edit with **Done**.

### In A Text Editor

The dev server is optional ([Bun](https://bun.sh)); it adds live reload. Run it from the project root:

```powershell
bun run core/tools/serve.js
```

It serves that folder on `http://localhost:8099` (or `$PORT`): `/` is the landing page,
`/decks/<name>/` a deck, `/figures/<name>/` a figure, `/core/example/` the core's example.

Working on the core alone, run `bun run tools/serve.js` from the core folder; `/` redirects to the example.

## Animations & Presenting

Fragments animate only in fullscreen. In a normal tab every fragment is visible so content can be
read and edited; entering fullscreen restarts the current slide's fragments.

## Style Guides

Read the guide that matches the work before following any how-to below:

| Guide | For |
|---|---|
| [SLIDE-STYLE.md](docs/SLIDE-STYLE.md) | Writing slides and building decks: layouts, tags, colour tokens |
| [DIAGRAM-STYLE.md](docs/DIAGRAM-STYLE.md) | Constructing diagrams and charts on the shared kits |
| [FIGURE-STYLE.md](docs/FIGURE-STYLE.md) | Composing publication figures and exporting them |
| [IMAGE-STYLE.md](docs/IMAGE-STYLE.md) | Writing prompts for generated illustrations |

[AGENTS.md](AGENTS.md) is the manual for coding agents: the rules, the file map, and the
constraints that are easy to violate.

## How-Tos

### Add a New Deck

1. Copy an existing deck, or `core/example/decks/showcase/`, to a new folder under `decks/`.
2. Root core links at `../../core/...` (the showcase writes `../../../`) and load
   `../../visuals/brand.css` right after `theme.css`. From the showcase, also copy the placeholders
   it names from `core/example/visuals/assets/`, or replace them.
3. Replace the `SLIDES` array and set a unique `storageKey`.
4. Add a card to the root `index.html`.

### Add A Publication Figure

1. Copy a figure folder of similar shape, or `core/example/figures/example-steps/`.
2. Put the composition in `figures/<name>/<name>.js`.
3. Keep `figures/<name>/index.html` a thin shell that loads dependencies and calls
   `Figure.mountModule(window.<Name>Figure)`, with core links at `../../core/...`.
4. Add a card to the Figures panel in the root `index.html`.

### Add A Generated Illustration

Write the prompt per [IMAGE-STYLE.md](docs/IMAGE-STYLE.md), with the fixed blocks from
`visuals/image-prompt.md`. Illustrations are for sparse, wordless visual beats; processes,
relationships, comparisons, and hierarchies stay editable diagrams or figures. Save the image as
`visuals/assets/generated/<kebab-case-name>.png`, add it with an `image` block, and always write `alt`.

### Add A Slide Template

Agree on it first. Add the layout function to `core/deck-kit/templates.js` and its styling to
`core/deck-kit/templates.css`. Editable text carries `data-edit="<slideIndex>/<field>"` so the
editor can map edits back into `SLIDES`. Templates use semantic tokens from `core/theme/theme.css`
(`--text`, `--background`, `--border`, `--accent`, `--graphic-*`); raw `--color-*` tokens stay in
`visuals/brand.css`.

### Reuse A Drawing In A Deck

Make it a figure, drawing only the picture, and import it with
`{ "type": "figure", "module": "<Name>Figure" }`. The deck loads the figure's `.js` and `.css` with
classic `<script>` and `<link>` tags, to keep `file://` working. Icon geometry belongs in
`core/drawing-kit/icons/icons.js` and default icon appearance in `icons.css`; see
[DIAGRAM-STYLE.md](docs/DIAGRAM-STYLE.md).
