# Image Prompt — Core Example

The fixed blocks of every illustration prompt in this project. The method — when to use an
illustration, how to write the SCENE, generating a set, checking the result — is in
`core/skills/illustrations/SKILL.md`. Copy the blocks below verbatim and write only the SCENE fresh.

A new project copies this file to `visuals/image-prompt.md` and replaces every `<…>` with its own
look, taking the hexes from its `brand.css`.

## The fixed blocks

```text
<opening line: medium and mood, e.g. "A minimal flat vector line illustration in a calm, editorial style.">

SCENE: <one sentence naming the subject, the actors, and the viewpoint, then two
to four short sentences of concrete detail — poses, gestures, how objects are
built, and the absences that carry meaning>

STYLE: <line weight, fills, what is never drawn (gradients, shading, textures,
scenery), how figures are simplified, composition and margins>

COLOUR: A strictly limited flat palette and nothing else.
  background   <name>  <#hex>
  outlines and figures  <name>  <#hex>
  <focal object> fill   <name>  <#hex>
  one accent detail     <name>  <#hex>
Flat fills only, no tints or blends beyond these colours.

FORMAT: <aspect ratio, e.g. "Square 1:1">, high resolution, plain <background>
background, no border or frame, no text, no lettering, no numerals, no watermark,
no logo, no signature.
```

In the COLOUR block, `<focal object> fill` is the only phrase that adapts: rename it to whatever
the focal object of *this* scene is. The colour, the hex, and every other line stay as written.

## Colour roles

Each colour in a fixed role. The hexes are the sRGB values of the tokens in `brand.css` — if a
token changes, update this file, so a generated image still sits on a slide without a seam.

| Role in the image | Token | Hex |
| --- | --- | --- |
| Background (matches the slide canvas) | `--background` | `<#hex>` |
| Every outline, and all people | `--text` | `<#hex>` |
| The focal object's fill | `--graphic-primary` | `<#hex>` |
| One accent detail | `--graphic-secondary` | `<#hex>` |

## Format

<The default aspect ratio and when to change it. Change only the aspect ratio in the FORMAT
line and leave every other word intact.>
