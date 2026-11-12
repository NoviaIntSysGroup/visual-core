---
name: new-project
description: >-
  Create a new presentations project on this core, or bring a deck into a project from
  another one. Use when the user wants a new project repo, when `core/` exists but the
  project root around it does not, or when a deck, figure, or asset moves between projects.
  A project is built by adding only what it needs, never by copying a project and deleting.
---

# Starting A New Project

A project is a repo holding `core/`, `visuals/`, `decks/`, `figures/`, a landing page, and an agent
file. The core is committed inside it as a git subtree, so a clone or ZIP runs by double-clicking.

Read `core/AGENTS.md` first (once `core/` exists); its rules apply during setup too.

## Golden rule: add what is needed, never delete what is not

**Start empty and copy things in.** Never start from a copy or clone of another project:

- Deleting a deck leaves its assets behind; nothing tracks which are still used.
- A kept `.git` carries the old project's history, including anything private.
- A copied `core/` cannot be updated: git answers `'core' was never added`.

One repo is one audience. A public repo holds only public material, in its history too, so public
and private decks never share a repo.

## Ask the user first

1. The project's name, and who it is for.
2. Public or private repo.
3. The palette and logo, or the core's neutral defaults and a placeholder logo for now.
4. Any decks to bring from another project, and its path.

## Create the project

Run from the new project's folder. If `core/` exists, start at step 2.

1. **Add the core.** The empty commit gives `subtree add` something to build on. Use the core's
   HTTPS URL.

   ```bash
   git init
   git commit --allow-empty -m "start project"
   git subtree add --prefix=core https://github.com/NoviaIntSysGroup/visual-core.git main --squash
   ```

2. **Copy the guardrails,** before anything else, unless `.claude/settings.json` already exists.
   Claude Code reads settings only from the folder it starts in, so `core/.claude/` has no effect on
   its own. On Windows it must run inside WSL2; on native Windows these settings make it exit at startup.

   ```bash
   mkdir .claude
   cp core/.claude/settings.json .claude/
   cp core/example/.claude/launch.json .claude/
   ```

3. **Copy the skeleton.** Copy `core/example/index.html` to `index.html` and `core/.gitignore` to
   `.gitignore`. From `core/example/visuals/`, copy only `brand.css`, `image-prompt.md`, and
   `assets/logo.svg`, to the same places under `visuals/`. Create `decks/` and `figures/`.
4. **Fix the landing page.** The example's page is the template; its look stays in `core/landing/`,
   so core updates restyle it. In `index.html`:
   - Change `../theme/` to `core/theme/` and `../landing/` to `core/landing/`.
   - Replace the title, description, logo, hero and about copy, and footer.
   - Remove the example cards, but keep both panels, even when empty.
   - Point the hero's button and preview at the main deck; until there is one, remove both.
   - Public repo: uncomment the GitHub link in the top bar and fill it in. Otherwise delete it.
5. **Fill in the visuals.**
   - `visuals/brand.css`: the raw `--color-*` palette, then the semantic overrides (tokens are in
     `core/theme/theme.css`). An empty file keeps the neutral defaults.
   - `visuals/image-prompt.md`: the title, and every `<…>` except the SCENE and `<focal object>`,
     with hexes from `brand.css`. Delete the paragraph about copying this file.
   - `visuals/assets/logo.svg`: replace the placeholder.
6. **Write `AGENTS.md`** from the template below.
7. **Write the README:** what the project is, then the quick start (clone, open `index.html`).
8. **Add the first deck or figure,** if wanted. See
   [Create a new deck](../slide-decks/SKILL.md#create-a-new-deck) and
   [A figure is a composition module + a thin shell](../figures/SKILL.md#a-figure-is-a-composition-module--a-thin-shell).

The `AGENTS.md` template, with every `<…>` filled in:

````markdown
# AGENTS.md

This is the <name> project: decks and figures built on the shared core in `core/`.
Project work goes in `decks/`, `figures/`, and `visuals/`; `core/` is the tooling they are built with.
The core's rules, file map and constraints apply here in full. Read [core/AGENTS.md](core/AGENTS.md)
before touching anything:

@core/AGENTS.md

**`core/` is this project's copy of the shared core**, not project content. A change there reaches
other projects when it is pushed to the core repo, so it falls under the core's ask-first rule.
````

The file map stays in `core/AGENTS.md`, which updates with the core. Add to this file only what is
true of this project alone.

## Bring in a deck from another project

Copy, then let the two versions diverge; a fix in one does not reach the other. The guardrails block
reads outside the project, so ask the user to add the other project's folder to the session, or to
copy the files in themselves.

1. **The deck:** the whole `decks/<name>/` folder.
2. **Its figures:** every `figures/<name>/` the deck's `index.html` links, and any figure those
   nest (listed in each figure's `index.html`).
3. **Its assets:** every `../../visuals/...` file named in the deck and the copied figures,
   including stylesheets (such as a portraits file) and any app it places, at the same paths.
4. **A new `storageKey`** in `Deck.mount`. Drafts are stored per browser origin, so two projects on
   one dev server port would share one otherwise.
5. **A landing-page card** for the deck and each figure worth listing, figures inside a `card-group`.
6. **Its look.** The deck now takes this project's `brand.css`. Tell the user its colours changed,
   and replace any slide naming the old project's logo or partners.

**Moving into a public repo, stop and show the user** what will become public: people's emails and
portraits, partner logos, budget or other project figures. Publish only on their say-so.

## Check the result

Before reporting the project ready:

1. No `<…>` is left in `AGENTS.md`. In `visuals/image-prompt.md`, only the SCENE and `<focal object>`
   keep theirs.
2. No page outside `core/` links `../../../`, or `../theme/` from the root.
3. Every relative `src` and `href` in `index.html`, `decks/*/` and `figures/*/` resolves, and so
   does every `../../visuals/` and `../../figures/` path in their `.js` and `.css`. The showcase's
   Missing Media slide links missing files on purpose; drop it from a copied deck.
4. The deck's `storageKey` differs from the project it came from.
5. `.claude/settings.json` matches `core/.claude/settings.json`, and `.claude/launch.json` matches
   `core/example/.claude/launch.json`.

Opening the pages is the user's step (rule 8): tell them to double-click `index.html`.
