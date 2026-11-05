---
name: illustrations
description: >-
  Write image-generation prompts for illustrations that match the project's
  look, defined in `visuals/image-prompt.md`. Use when the user asks for a prompt for an illustration or picture for a slide,
  or when adding a generated image under `visuals/assets/generated/`. Only the SCENE block
  is written fresh; the STYLE / COLOUR / FORMAT blocks are fixed boilerplate.
---

# Writing Illustration Prompts

This skill governs the **prompts** handed to an external image model so every
generated illustration looks like it came from the same hand as the decks. The
generation itself happens outside this repo; what the repo owns is the prompt
recipe and the resulting file under the project's `visuals/assets/generated/`.

It is a sibling of the drawing skills, and the *last* thing to reach for:

- [`diagrams`](DIAGRAM-STYLE.md) — node/edge diagrams drawn in code.
- [`figures`](FIGURE-STYLE.md) — publication figures composed from those.
- [`slide-decks`](SLIDE-STYLE.md) — placing any of it on a slide.
- **`illustrations` (this) — generated pictures.**

## When to use this

- The user asks for a prompt for an image/illustration for a slide.
- Adding a generated illustration to `visuals/assets/generated/` and onto a slide.

**Not** for anything structural. If the content is a process, a relationship, a
comparison, or a hierarchy, it is a diagram — build it with
[`diagrams`](DIAGRAM-STYLE.md), which stays editable, exports as vector, and
recolours with the theme. An illustration earns its place only as a single
evocative, human beat — a metaphor a diagram would flatten. Use them sparingly;
one per stretch of deck, standing alone on its own slide.

## Golden rule: only SCENE is written fresh

A prompt is the project's fixed blocks plus one SCENE. **The opening line, STYLE,
COLOUR, and FORMAT are fixed boilerplate from `visuals/image-prompt.md` — copy them
verbatim, unchanged.** They are what makes two images look like a set.
All the thinking goes into SCENE. Changing a style/colour/format line to "make
this one work" breaks the set and is a discuss-with-the-user change, exactly like
touching `core/`.

## The prompt shape

```text
<opening line>

SCENE: <one sentence naming the subject, the actors, and the viewpoint, then two
to four short sentences of concrete detail — poses, gestures, how objects are
built, and the absences that carry meaning>

STYLE: <verbatim>

COLOUR: <verbatim>

FORMAT: <verbatim>
```

The opening line, STYLE, COLOUR, and FORMAT come from the project's
`visuals/image-prompt.md`, which also says which phrase, if any,
adapts to the scene (such as the focal object's fill) and the default aspect ratio.

## Writing the SCENE block

- **Name nouns and poses, not moods.** The model draws things, not adjectives.
  "Confused" renders as nothing; a tilted head, a hand on a chin, and one
  floating question mark render as confusion.
- **Say how objects are built.** Give abstract objects a geometric recipe —
  "built from simple geometric shapes — a rounded rectangle body, a dial, a
  lever, a small nozzle". This is what keeps the drawing flat and buildable
  instead of photorealistic.
- **People are simplified and faceless**, seen from behind or in profile,
  standing on a plain ground line. Give each one a distinct gesture; with no
  faces, gesture is the only characterisation you get.
- **One focal object, at most one symbol.** A question mark, an arrow, a spark —
  drawn, never spelled. Keep the whole scene under about five elements.
- **State the absences that matter.** "There is no manual, no instructions, and
  no text anywhere in the image" both fixes the meaning and suppresses the
  model's habit of inventing signage.
- **Repeat the no-text rule inside SCENE**, even though FORMAT already says it.
  Text is the failure mode these models fall back into hardest.

## Generating a set: one sheet, one cell per image

Images that sit side by side on a slide (a row of columns, a before/after) must be
generated **together**. Separate prompts drift — the same robot comes back with a
different body, line weight, and ground line each time, even with identical
boilerplate. One image holding every picture as a cell of a grid keeps the model
drawing from a single design, so the set is consistent. Then crop the cells apart.

The sheet adds one block, `SHEET`, after the opening line, and `SCENE` becomes one
`CELL n:` per image. STYLE and COLOUR stay verbatim; in FORMAT only the aspect
ratio changes (`Wide 3:1` for three across, or the nearest the model offers).

```text
<opening line>

SHEET: One sheet holding <N> separate illustrations in a single row of <N>
equally sized square cells. Cells are separated by wide empty background-colour gutters; no
lines, boxes, borders or dividers are drawn between or around them, and nothing
crosses from one cell into another. <The recurring character or object, built
from simple geometric shapes, described once here.> It is identical in every
cell: same design, same line weight, same scale, same ground line height.

CELL 1: <a SCENE block — subject, actors, viewpoint, detail, absences>
CELL 2: <…>
```

- **Define anything that recurs once, in `SHEET`**, then call it "the robot" in the
  cells. Re-describing it per cell invites a different drawing per cell.
- **Each cell is a complete scene** with its own ground line and margins, written
  by the same rules as a single `SCENE` above.
- **Repeat the no-text rule inside every cell**, as for a single image.

## After generating

Check the returned image before it goes into the repo:

1. **No text, lettering, or numerals anywhere** — including on dials and labels.
2. **Only the COLOUR block's colours**, flat, no gradients or shadows.
3. **The background is the COLOUR block's background**, not white, and not a lighter shade.
4. **Clear margins** — nothing touching or crowding the frame edge.
5. **Uniform line weight**; no sketchy or doubled outlines.
6. **For a sheet, the cells match**: same character design, line weight, and scale
   in every cell. Crop each cell to its own square PNG before saving; if one cell
   is off, regenerate the whole sheet rather than patching a single cell.

Then save it as `visuals/assets/generated/<kebab-case-name>.png` — named for what
it *means* (`tool-no-manual.png`), not what it depicts — and place it on its own
slide ([`slide-decks`](SLIDE-STYLE.md)):

```json
{
  "fragment": false,
  "valign": "center",
  "blocks": [
    {
      "type": "image",
      "src": "../../visuals/assets/generated/tool-no-manual.png",
      "alt": "Four people standing around an unfamiliar machine, wondering how to use it"
    }
  ]
}
```

`alt` is required — it is the only description that survives export and screen
readers. Write it as the sentence you would say out loud about the slide.

## Worked example

`tool-no-manual.png`, an illustration used as the wordless beat between "the
promise is easy to see" and "the promise is not a manual". Its SCENE block, with the rest of the template
verbatim:

```text
SCENE: Four simplified human figures stand together on a plain ground line,
seen from behind and in profile, looking up at a single large unfamiliar
machine. The machine is an abstract, appealing device built from simple
geometric shapes — a rounded rectangle body, a dial, a lever, a small nozzle —
that gives no clue what it is for. One figure tilts their head, one rests a
hand on their chin, one gestures toward it. A single small question mark
floats above the group. There is no manual, no instructions, and no text
anywhere in the image.
```

Note the shape of it: actors and viewpoint first, then the object's geometric
recipe, then one gesture per figure, then the single symbol, then the absences.
Reuse that order for a new scene and the result lands in the same style.
