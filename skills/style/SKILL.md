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
  explicit (premise → conclusion), and pose the puzzle the next slides answer. The next lead
  picks the argument up by answering that puzzle, not by summarising its own slide. Dated
  facts belong in a timeline, not in bullet lists.
- **Show it rather than say it.** Whenever a figure (a diagram, chart, image, or illustration)
  can carry a message, use it instead of text, and cut the text it replaces. A drawing that
  only decorates the headings beside it goes.
- **A picture shows the finding**, not a portrait of who found it. Build it from real vector
  art (a public-domain SVG, recoloured to theme tokens, credited in the module header), then
  from the drawing kit, and generate an image last. A real object drawn to look like itself
  (a brain, a hand) comes from real art, never from made-up coordinates, which look wrong; a
  plainly stylised one (people as circles and capsules) may be built from kit shapes. One or
  two lines under it state the message. A picture that comes out small
  beside empty space means the layout is wrong: measure where the space goes and reshape it.
- **Motion carries the message, or it goes.** Animate what happens in time: a flow, a signal
  spreading, a rhythm, a zoom into another scale. What a still frame shows equally well, such
  as a cause and its effect, is steps. Tell it in beats (set the scene, reveal, the event), and
  end on the frame that summarises it.
- **Write and draw for a lay reader.** Plain words and concrete examples, not a specialist's
  terms or compressed metaphors. Before paraphrasing a source, check its wording and how it is
  commonly explained. A drawn object is one a non-engineer would name on sight, with only the
  parts that carry the point; for a historical machine, a real photo can beat a schematic.

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
- **Colour means something.** A `--graphic-*` hue names one category, on the slide, in its
  figures, and for the rest of the deck; a word in the text takes the hue of what it names.
  Items that order or position already sets apart need no hues of their own. An element that
  belongs to no category (a divider, a border between regions) takes `--edges` or `--text`,
  never `--accent`, which in the default theme is the same blue as `--graphic-primary`.
- **Reuse one treatment.** As few line widths, strokes, fills, and corner styles as possible,
  across a drawing and the figures shown beside it (a timeline row, a set of columns), whose
  caption lines match in number, size, and form; matching the set outranks real art in
  another style. Start from the kit defaults and add a different treatment only when it
  carries a meaning, named after that meaning.
- **Corners are rounded**, as the kits draw them; a new line or frame rounds its corners
  unless there is a reason not to.
- **Things that look aligned are aligned.** Two gaps or borders meant to match share one
  variable; a near-miss reads as sloppy at slide size.
