---
name: style
description: >-
  The house style for what goes on a slide or into a drawing, whichever kit makes it: what a
  slide argues, when a figure earns its place, plain wording, capitalization, and how colour and
  form encode meaning. Use before writing slide copy, or designing or editing a figure or
  diagram. The kits' own skills say how to build it; this says what good looks like.
---

# House Style

These are judgments no kit can make for you. A preference that code can enforce is a kit
default instead, so it is not repeated here.

## Content

- **A narrative slide argues.** State the question that matters, make the reasoning step
  explicit (premise → conclusion), and pose the puzzle the next slides answer. Dated facts
  belong in a timeline, not in bullet lists.
- **A figure shows what the text does not.** A drawing that only illustrates the headings
  beside it goes; with no figure that carries information, the slide is text only.
- **Write for a lay reader.** Plain words and concrete examples, not a specialist's terms or
  compressed metaphors. Before paraphrasing a source, check its wording and how it is commonly
  explained.

## Capitalization

**Titles are Title Case; prose is sentence case.** This follows from the role and needs no
deliberation.

Title Case covers the heading roles: a slide title, every column or card title, each `toc` item
title. Capitalize every word **except** articles, coordinating
conjunctions, and prepositions of **three letters or fewer** (`a`, `an`, `the`, `and`, `or`,
`but`, `nor`, `of`, `to`, `in`, `on`, `at`, `by`, `for`), and capitalize even those when one
is the title's first or last word:

- "The Power **of** Large Language Models": `of` is two letters, so it stays down.
- "How **to** Think **About** AI Agents": `to` is down; `About` is five letters, so it is up.
- "**A** Powerful Tool **With** No Instruction Manual": `A` leads the title, so it is up.

Everything else is prose and takes sentence case: subtitles, descriptions, quotes, notes, bullet
items, labels. Acronyms keep their own casing (`AI`, `LLM`, `AR & VR`). No stylesheet can apply
this (`text-transform` has no stop-word rule and would lowercase `AI`), so it is written that
way in the source.

## Visual encoding

- **Encode each distinction once.** When colour already separates two categories, a second cue
  (dash, weight, opacity, shape) must carry a meaning of its own or go. Re-check old cues
  whenever the encoding changes.
- **Colour means something.** A `--graphic-*` hue names one category, the same on the slide
  and in its figures; a word in the text takes the hue of what it names. An element that
  belongs to no category (a divider, a border between regions) takes `--edges` or `--text`,
  never `--accent`, which in the default theme is the same blue as `--graphic-primary`.
- **Reuse one treatment.** As few line widths, strokes, fills, and corner styles as possible;
  start from the kit defaults and add a different treatment only when it carries a meaning,
  named after that meaning.
- **Corners are rounded**, as the kits draw them; a new line or frame rounds its corners
  unless there is a reason not to.
- **Things that look aligned are aligned.** Two gaps or borders meant to match share one
  variable; a near-miss reads as sloppy at slide size.
