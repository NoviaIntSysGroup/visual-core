/* Embedding Space — figure composition modules.
   Two 20.8 × 7.4 cm stepped figures sharing the pictures, the input cells, and the plane of e.
   EmbeddingSpaceFigure, 16 steps in two phases. One embedding model reads six inputs, one per step, and each
   comes out as a two-number embedding e that lands as an arrow in the plane of e. Phase one feeds
   pictures of three cats and three vehicles: the cats point one way, the vehicles another. The plane
   then clears, and phase two feeds the word, a picture, and a sound of a cat, then of a car: they group
   by thing, not by kind. Colour marks the group throughout: yellow for cats, green for vehicles.
   Each phase ends by marking a small angle within a group and a large one between the groups.
   EmbeddingSearchFigure, 5 steps. The same six pictures are stored as unit keys k on the unit circle.
   A picture query, then a text query, lands as a unit q, and the keys are ranked by q · k = cos θ.
   EmbeddingClassifierFigure, 15 frames in two phases, played. Fitting: many labelled cat and car pictures land as
   unit embeddings, drawn as dots, the groups overlapping where a picture shows both. Each is projected onto a unit
   direction w and laid out as its score s = w · e, with each group's kernel density above the scores. w then turns,
   5° a frame, from where the groups mix to where they separate best. Using: w stays, and three new pictures are
   scored, each reading P(cat) off the two densities at its score: the cat density's share of both.
   EmbeddingBestWFigure, 10.1 × 7.0 cm, 4 steps, for a two-column slide: the classifier's best w alone, with the
   labelled embeddings projected onto it and the two densities over the score line under the plane; then the same
   three new pictures, one a step, each with its P(cat) and P(car). */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  /* A one-column slide fits 592 pt at the deck's 1.5× import (888 pt), so 20.8 cm; 7.4 cm stays under its 330 pt budget. */
  var PAGE = { w: cm(20.8), h: cm(7.4) };
  var MID  = cm(3.7);   /* the row everything centres on: the inputs, the model, e, and the plane's origin */

  /* ---- Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.slideBody.size, detail: TYPE.slideDetail.size };
  var ROW  = { note: TEXT.label * 1.9 };   /* between the two lines of the closing note */

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = {
    /* One hue per group (cell column): yellow for the cats, green for the vehicles; w in blue, the deck's colour for weights. */
    group: ['var(--graphic-tertiary)', 'var(--graphic-secondary)'], w: 'var(--graphic-primary)',
    edge: 'var(--edges)', node: 'var(--graphic-soft)', ink: 'var(--text)', hole: 'var(--background)'
  };
  var TINT = ['var(--graphic-tertiary-tint)', 'var(--graphic-secondary-tint)'];

  /* ---- Layout knobs ------------------------------------------------------- */
  /* Theme line widths: thin for the axes, unlit edges, and fine detail; strong for lit edges and outlines; very strong for the vectors. */
  var LINE = { thin: 'var(--line-width)', strong: 'var(--line-width-strong)', vector: 'var(--line-width-very-strong)' };
  var HEAD = { length: cm(0.25), half: cm(0.1) };
  /* The inputs: two columns of three cells; a cell's side, the gap between cells, the inset of its content as a share of the side. */
  var CELL = { x: cm(0.2), side: cm(1.5), gap: cm(0.4), inset: 0.1, radius: cm(0.1) };
  var FEED = { from: cm(3.75), to: cm(4.3) };   /* the arrow from the inputs into the model */
  var BARS = { count: 11, fill: 0.55 };        /* a sound's bars, and the share of each bar's slot it fills */
  /* The model: each layer's x and node count, the distance between its nodes, their radius, and the name's baseline. */
  var NET  = { xs: [cm(4.6), cm(5.8), cm(7.0), cm(8.2)], counts: [5, 4, 3, 2], pitch: cm(0.75), r: cm(0.18), nameY: cm(6.5) };
  var READOUT = { x: cm(8.7) };                 /* where e's readout starts */
  var LAND = { gap: cm(0.3) };                  /* the arrow from e into the plane keeps this clear at both ends */
  /* The plane: its origin's x (its y is MID), half its side, the length of one unit, and a tick's half-length. */
  var PLANE = { x: cm(17.0), half: cm(3.5), unit: cm(2.6), tick: cm(0.1) };
  var NAME  = 1.3;                              /* a group's name, in units from the origin along its first arrow */
  /* The θ arcs, in units: between the groups' first arrows, with its label further out; within group 0, spanning
     its arrows, with its label `past` degrees below its lower end. */
  var ARC   = { between: 0.55, label: 0.8, within: 0.75, past: 7 };
  var NOTE  = { x: cm(13.5), y: cm(5.4) };      /* the closing note, in the plane's empty lower left */

  /* The search figure: the query cell left of centre, its embedding q's readout, a plane of its own, and the ranked keys on the right. */
  var QUERY  = { x: cm(0.2), side: cm(1.8), labelGap: cm(0.25), feed: { from: cm(2.2), to: cm(2.8) }, readout: cm(3.0) };
  var SPLANE = { x: cm(10.5), half: PLANE.half, unit: PLANE.unit, tick: PLANE.tick };
  var TIP    = 1.18;                            /* a key's or q's name, in units from the origin along its arrow */
  /* The list: its left edge and right edge, the header's baseline, the first row's top, the rows' pitch, a thumbnail's side,
     where a key's name starts, and a score bar's zero line, length at 1, and height. */
  var LIST   = { x: cm(14.5), right: cm(20.6), headerY: cm(0.55), top: cm(0.85), pitch: cm(1.05), thumb: cm(0.85),
                 name: cm(15.6), zero: cm(16.9), bar: cm(2.4), barH: cm(0.3) };

  /* The classifier figure: a plane of its own, a dot's and a projection's radius, w's label (`turn` degrees
     below w, `len` units out), the score line (its zero, the length of one unit, its baseline, a tick's
     half-length, the gap to its labels, the baseline of the verdict under them), and the arrow into it. */
  var CPLANE  = { x: cm(4.0), half: PLANE.half, unit: PLANE.unit, tick: PLANE.tick };
  var DOT     = { r: cm(0.08), foot: cm(0.05) };
  var MEET    = { half: cm(0.12) };   /* half the tick where a new picture's line meets a density */
  var WLABEL  = { turn: 11, len: 0.7 };
  var SCORE   = { zero: cm(15.3), unit: cm(4.6), y: cm(4.8), tick: cm(0.1), labelGap: cm(0.6), verdict: cm(6.6) };
  var UNROLL  = { from: cm(8.1), to: cm(10.2) };
  /* Each group's kernel density over the score line: the taller curve's height in every frame, its kernel's width in
     score units, and its samples; the new picture's cell, its label's gap, and its readout's x. */
  var DENSITY = { height: cm(2.4), bandwidth: 0.09, samples: 60 };
  var FRESH   = { x: cm(10.7), y: cm(0.5), side: cm(1.5), labelGap: cm(0.2), readout: cm(12.6) };
  var PLAY    = { ms: 300 };   /* per frame while w turns */

  /* The best-w figure, for a two-column slide: its canvas; the plane in the upper left (its origin, the length of one unit,
     and how far its axes reach each way, in units, past the data so their names sit clear of it); the new picture to its
     right (the column's middle, the label's baseline, the cell's top and side, the first readout's baseline); and the
     score line under both (its zero, unit, baseline, and density height). */
  var BPAGE  = { w: cm(10.1), h: cm(7.0) };
  var BPLANE = { x: cm(2.5), y: cm(3.0), unit: cm(1.8), left: 1.2, right: 1.45, top: 1.35, bottom: 0.45, gap: cm(0.12) };
  var BFRESH = { x: cm(7.9), label: cm(0.5), top: cm(0.75), side: cm(1.5), readout: cm(2.9) };
  var BSCORE = { zero: cm(5.05), unit: cm(4.1), y: cm(6.05), height: cm(1.9) };

  /* The summary slide's two thumbnails, for half a column of a three-column slide, beside its text: the canvas, the plane's centre, the length of one unit,
     how far its axes reach in units, and where w's name sits in units. */
  var TPAGE  = { w: cm(3.1), h: cm(3.1) };
  var TPLANE = { x: cm(1.55), y: cm(1.55), unit: cm(1.1), reach: 1.3, w: 1.3 };

  /* ---- Content ------------------------------------------------------------ */
  /* Each phase: its two groups' names, then its inputs in the order they are fed in, each with its cell's
     column (= group) and row, and the embedding it comes out as: unit length, group 0 near 32°, group 1 near 118°. */
  var PHASES = [
    { groups: ['cats', 'vehicles'], inputs: [
      { thing: 'cat',   kind: 'image', col: 0, row: 0, e: [0.85, 0.53] },
      { thing: 'tiger', kind: 'image', col: 0, row: 1, e: [0.74, 0.67] },
      { thing: 'lion',  kind: 'image', col: 0, row: 2, e: [0.93, 0.37] },
      { thing: 'car',   kind: 'image', col: 1, row: 0, e: [-0.47, 0.88] },
      { thing: 'truck', kind: 'image', col: 1, row: 1, e: [-0.64, 0.77] },
      { thing: 'van',   kind: 'image', col: 1, row: 2, e: [-0.28, 0.96] }
    ] },
    { groups: ['cat', 'car'], inputs: [
      { thing: 'cat', kind: 'text',  col: 0, row: 0, e: [0.85, 0.53] },
      { thing: 'cat', kind: 'image', col: 0, row: 1, e: [0.77, 0.64] },
      { thing: 'cat', kind: 'sound', col: 0, row: 2, e: [0.91, 0.42] },
      { thing: 'car', kind: 'text',  col: 1, row: 0, e: [-0.47, 0.88] },
      { thing: 'car', kind: 'image', col: 1, row: 1, e: [-0.34, 0.94] },
      { thing: 'car', kind: 'sound', col: 1, row: 2, e: [-0.57, 0.82] }
    ] }
  ];
  /* The search: the six pictures stored as keys, each a unit embedding at `deg` degrees, and the two queries, a picture
     and a phrase, in the order they are asked, each landing as a unit q at `deg` and outlined in its nearest group's hue. */
  var SEARCH = {
    keys: [
      { thing: 'cat',   kind: 'image', col: 0, deg: 30 },
      { thing: 'tiger', kind: 'image', col: 0, deg: 55 },
      { thing: 'lion',  kind: 'image', col: 0, deg: 10 },
      { thing: 'car',   kind: 'image', col: 1, deg: 120 },
      { thing: 'truck', kind: 'image', col: 1, deg: 145 },
      { thing: 'van',   kind: 'image', col: 1, deg: 95 }
    ],
    queries: [
      { thing: 'kitten', kind: 'image', col: 0, deg: 42 },
      { thing: 'bus',    kind: 'text',  col: 1, deg: 106 }
    ]
  };
  /* The classifier: each group's unit embeddings as angles (cats, then cars, overlapping between 63° and 84°, where
     a picture shows both); w's direction in degrees, turning from a poor one to the best in equal steps; the
     and the new pictures scored in phase two, each with the group its picture is coloured as. */
  var CLASSIFY = {
    groups: [
      [8, 14, 20, 25, 30, 34, 38, 43, 48, 55, 63, 78],
      [70, 84, 96, 102, 108, 114, 120, 126, 132, 138, 146, 154]
    ],
    turn: { from: 35, to: -15, by: 5 },
    fresh: [
      { thing: 'kitten', col: 0, deg: 60 },
      { thing: 'both',   col: 0, deg: 76 },
      { thing: 'truck',  col: 1, deg: 140 }
    ]
  };
  var COPY = {
    words: { cat: '“cat”', car: '“car”', bus: '“a bus”' },
    /* Each picture in its own units from its top-left, inside `box`, drawn part by part in order. A part is a path
       (`d`, every number pair a point) or a circle (`at`, `r`), painted as `body` (the hue, outlined), `hole` (the
       background), `hub` (soft), `ink` (filled), or `line` (stroked). The car is the learned-fields figure's. */
    pictures: {
      cat: { box: { w: 2, h: 2 }, parts: [
        { as: 'body', d: 'M0.2 1.1 Q0.2 1.85 1 1.85 Q1.8 1.85 1.8 1.1 L1.72 0.15 L1.25 0.52 Q1 0.47 0.75 0.52 L0.28 0.15 Z' },
        { as: 'hole', at: [0.68, 1.0], r: 0.15 }, { as: 'hole', at: [1.32, 1.0], r: 0.15 },
        { as: 'ink',  d: 'M0.68 0.87 Q0.75 1 0.68 1.13 Q0.61 1 0.68 0.87 Z M1.32 0.87 Q1.39 1 1.32 1.13 Q1.25 1 1.32 0.87 Z' },
        { as: 'ink',  d: 'M0.9 1.25 L1.1 1.25 L1 1.36 Z' },
        { as: 'line', d: 'M1 1.36 L1 1.46 M0.86 1.53 Q1 1.6 1 1.46 Q1 1.6 1.14 1.53' },
        { as: 'line', d: 'M0.62 1.3 L0.02 1.2 M0.62 1.38 L0.02 1.47 M1.38 1.3 L1.98 1.2 M1.38 1.38 L1.98 1.47' }
      ] },
      tiger: { box: { w: 2, h: 2 }, parts: [
        { as: 'body', at: [0.42, 0.45], r: 0.27 }, { as: 'body', at: [1.58, 0.45], r: 0.27 },
        { as: 'ink',  at: [0.42, 0.45], r: 0.12 }, { as: 'ink',  at: [1.58, 0.45], r: 0.12 },
        { as: 'body', d: 'M0.15 1.1 C0.15 0.686 0.531 0.35 1 0.35 C1.469 0.35 1.85 0.686 1.85 1.1 C1.85 1.514 1.469 1.85 1 1.85 C0.531 1.85 0.15 1.514 0.15 1.1 Z' },
        { as: 'ink',  d: 'M0.88 0.36 L1 0.66 L1.12 0.36 Z M0.62 0.48 L0.8 0.68 L0.7 0.44 Z M1.38 0.48 L1.2 0.68 L1.3 0.44 Z' },
        { as: 'ink',  d: 'M0.16 1 L0.5 1.1 L0.17 1.2 Z M0.22 1.38 L0.52 1.34 L0.3 1.5 Z M1.84 1 L1.5 1.1 L1.83 1.2 Z M1.78 1.38 L1.48 1.34 L1.7 1.5 Z' },
        { as: 'hole', at: [0.84, 1.42], r: 0.22 }, { as: 'hole', at: [1.16, 1.42], r: 0.22 },
        { as: 'hole', at: [0.68, 0.95], r: 0.12 }, { as: 'hole', at: [1.32, 0.95], r: 0.12 },
        { as: 'ink',  at: [0.68, 0.95], r: 0.06 }, { as: 'ink',  at: [1.32, 0.95], r: 0.06 },
        { as: 'ink',  d: 'M0.88 1.22 L1.12 1.22 L1 1.36 Z' }
      ] },
      lion: { box: { w: 2, h: 2 }, parts: [
        { as: 'body', d: 'M1 0.08 L1.14 0.24 L1.32 0.14 L1.4 0.34 L1.61 0.3 L1.61 0.52 L1.82 0.56 L1.75 0.76 L1.94 0.87 L1.8 1.03 '
                       + 'L1.94 1.19 L1.75 1.3 L1.82 1.5 L1.61 1.54 L1.61 1.76 L1.4 1.72 L1.32 1.92 L1.14 1.82 L1 1.98 L0.86 1.82 '
                       + 'L0.68 1.92 L0.6 1.72 L0.39 1.76 L0.39 1.54 L0.18 1.51 L0.25 1.3 L0.06 1.19 L0.2 1.03 L0.06 0.87 L0.25 0.76 '
                       + 'L0.18 0.56 L0.39 0.52 L0.39 0.3 L0.6 0.34 L0.68 0.14 L0.86 0.24 Z' },
        { as: 'body', at: [0.6, 0.6], r: 0.16 }, { as: 'body', at: [1.4, 0.6], r: 0.16 },
        { as: 'ink',  at: [0.6, 0.6], r: 0.07 }, { as: 'ink',  at: [1.4, 0.6], r: 0.07 },
        { as: 'body', at: [1, 1.1], r: 0.58 },
        { as: 'hole', at: [0.78, 0.98], r: 0.1 }, { as: 'hole', at: [1.22, 0.98], r: 0.1 },
        { as: 'ink',  at: [0.78, 0.98], r: 0.05 }, { as: 'ink',  at: [1.22, 0.98], r: 0.05 },
        { as: 'hole', at: [0.89, 1.36], r: 0.16 }, { as: 'hole', at: [1.11, 1.36], r: 0.16 },
        { as: 'ink',  d: 'M0.9 1.2 L1.1 1.2 L1 1.31 Z' }
      ] },
      kitten: { box: { w: 2, h: 2 }, parts: [
        { as: 'body', d: 'M1.5 1.85 Q1.98 1.82 1.88 1.25 Q1.85 1.15 1.79 1.23 Q1.86 1.68 1.5 1.7 Z' },
        { as: 'body', d: 'M0.55 1.88 Q0.45 1.2 0.85 0.95 L1.25 0.95 Q1.65 1.2 1.55 1.88 Z' },
        { as: 'body', d: 'M0.72 0.55 L0.75 0.1 L1 0.36 Z M1.38 0.55 L1.35 0.1 L1.1 0.36 Z' },
        { as: 'body', at: [1.05, 0.68], r: 0.38 },
        { as: 'ink',  at: [0.91, 0.64], r: 0.06 }, { as: 'ink', at: [1.19, 0.64], r: 0.06 },
        { as: 'ink',  d: 'M0.99 0.79 L1.11 0.79 L1.05 0.86 Z' }
      ] },
      car: { box: { w: 3.1, h: 1.48 }, parts: [
        { as: 'body', d: 'M0.1 1.2 L0.1 0.85 Q0.1 0.7 0.3 0.68 L0.8 0.62 L1.2 0.25 Q1.3 0.15 1.45 0.15 L2.1 0.15 Q2.25 0.15 2.35 0.28 '
                       + 'L2.65 0.62 L2.85 0.66 Q3 0.7 3 0.85 L3 1.2 Z' },
        { as: 'hole', d: 'M1.3 0.6 L1.5 0.3 L1.85 0.3 L1.85 0.6 Z M2 0.6 L2 0.3 L2.25 0.3 L2.5 0.6 Z' },
        { as: 'ink',  at: [0.75, 1.2], r: 0.28 }, { as: 'ink', at: [2.35, 1.2], r: 0.28 },
        { as: 'hub',  at: [0.75, 1.2], r: 0.11 }, { as: 'hub', at: [2.35, 1.2], r: 0.11 }
      ] },
      truck: { box: { w: 3.1, h: 1.48 }, parts: [
        { as: 'body', d: 'M0.1 1.15 L0.1 0.12 L1.95 0.12 L1.95 1.15 Z' },
        { as: 'body', d: 'M2.05 1.15 L2.05 0.42 L2.6 0.42 L2.95 0.8 Q3 0.85 3 0.95 L3 1.15 Z' },
        { as: 'hole', d: 'M2.15 0.72 L2.15 0.52 L2.55 0.52 L2.75 0.72 Z' },
        { as: 'ink',  at: [0.5, 1.2], r: 0.25 }, { as: 'ink', at: [1.3, 1.2], r: 0.25 }, { as: 'ink', at: [2.55, 1.2], r: 0.25 },
        { as: 'hub',  at: [0.5, 1.2], r: 0.1 },  { as: 'hub', at: [1.3, 1.2], r: 0.1 },  { as: 'hub', at: [2.55, 1.2], r: 0.1 }
      ] },
      van: { box: { w: 3.1, h: 1.48 }, parts: [
        { as: 'body', d: 'M0.1 1.2 L0.1 0.3 Q0.1 0.15 0.25 0.15 L2.3 0.15 Q2.45 0.15 2.55 0.3 L2.95 0.75 Q3 0.8 3 0.9 L3 1.2 Z' },
        { as: 'hole', d: 'M0.3 0.6 L0.3 0.32 L0.9 0.32 L0.9 0.6 Z M1.05 0.6 L1.05 0.32 L1.65 0.32 L1.65 0.6 Z M1.8 0.6 L1.8 0.32 L2.35 0.32 L2.7 0.6 Z' },
        { as: 'ink',  at: [0.7, 1.2], r: 0.28 }, { as: 'ink', at: [2.4, 1.2], r: 0.28 },
        { as: 'hub',  at: [0.7, 1.2], r: 0.11 }, { as: 'hub', at: [2.4, 1.2], r: 0.11 }
      ] }
    },
    /* Each sound's loudness along its clip, 0 to 1, drawn as bars: a meow swells and fades, an engine throbs. */
    loudness: {
      cat: function (t) { return Math.sin(Math.PI * t) * (0.8 + 0.2 * Math.sin(3 * Math.PI * t)); },
      car: function (t) { return 0.6 + 0.25 * Math.sin(5 * Math.PI * t); }
    },
    model: 'embedding model',
    blank: '\\mathbf{e} = \\begin{bmatrix} e_1 \\\\ e_2 \\end{bmatrix}',
    axes: ['e_1', 'e_2'],
    notes: ['\\text{same class: } \\cos\\theta \\approx 1', '\\text{other class: } \\cos\\theta \\approx 0'],
    search: {
      query: 'query', keys: 'keys',
      blank: '\\mathbf{q} = \\begin{bmatrix} q_1 \\\\ q_2 \\end{bmatrix}',
      header: '\\mathbf{q} \\cdot \\mathbf{k}_i',
      ariaLabel: 'Six pictures, a cat, a tiger, a lion, a car, a truck, and a van, are stored as keys k1 to k6: unit embeddings, drawn as arrows ending on the unit circle in the plane of e, the cats one way and the vehicles another. A query is embedded the same way, as a unit vector q. First a picture of a kitten: q lands among the cats, and the keys are ranked by q dot k, which for unit vectors is cos theta, with the cat, tiger, and lion on top. Then the phrase "a bus": q swings over to the vehicles, and the same keys re-rank with the van, car, and truck on top, though no bus is stored.'
    },
    classify: {
      groups: ['cats', 'cars'],
      ends: ['more car', 'more cat'],
      score: 's = \\mathbf{w} \\cdot \\mathbf{e}',
      verdicts: ['this w mixes the groups', 'the best w separates them'],
      fresh: 'new picture',
      bestLabel: 'Labelled pictures of cats and cars land as unit embeddings, drawn as dots in the plane of e: the cats one way, the cars another, overlapping in between. Each dot is projected onto the best unit direction w, and its score s = w dot e is laid out on a line under the plane, from more car on the left to more cat on the right, with the density of each group drawn above its scores: the two densities barely overlap. Then three new pictures are scored with this w, each reading P(cat) off the two densities at its score: a kitten gets P(cat) = 0.91, a picture of both a cat and a car about 0.5, and a truck close to 0.',
      ariaLabel: 'Many labelled pictures of cats and cars land as unit embeddings, drawn as dots in the plane of e: the cats one way, the cars another, and the two groups overlapping in between, where a picture shows both a cat and a car. Each dot is projected onto a unit direction w, and the projections are laid out on a line as the score s = w dot e, from more car on the left to more cat on the right, with the density of each group drawn above its scores. At first w mixes the two groups and their densities overlap; then w turns, a few degrees at a time, and the two densities pull apart until the best w separates them. Then w stays fixed, and each new picture gets the probability that it is a cat from the two densities at its score: the cat density divided by the sum of both. Three new pictures are scored: a kitten gets P(cat) = 0.91, a picture of both a cat and a car about 0.5, and a truck close to 0.'
    },
    ariaLabel: 'An embedding model turns each input into a two-number embedding e, drawn as an arrow in the plane of e. First, pictures of a cat, a tiger, a lion, a car, a truck, and a van: the three cats point one way and the three vehicles another. Then the plane clears, and the word cat, a picture of a cat, and a meow go in, then the word car, a picture of a car, and an engine sound: the cat inputs point the same way whatever their kind, and so do the car inputs, almost at right angles to the cats. After each set, a small angle theta is marked within a group and a large one between the groups: cos theta is close to 1 within a class and close to 0 between classes.'
  };

  /* ---- Steps --------------------------------------------------------------
     One record per step: the phase, the input being fed in (an index into its inputs, or null), how many
     of its inputs have landed in the plane, and whether the angles within and between the groups are marked.
     Each phase opens on its inputs and an empty plane, and closes by marking the angles. */
  var STEP = [];
  PHASES.forEach(function (ph, p) {
    STEP.push({ phase: p, input: null, landed: 0, angle: false });
    ph.inputs.forEach(function (_, i) { STEP.push({ phase: p, input: i, landed: i + 1, angle: false }); });
    STEP.push({ phase: p, input: null, landed: ph.inputs.length, angle: true });
  });

  /* The search: the stored keys alone, then each query as it lands (an index into SEARCH.queries), then the keys ranked by it. */
  var SEARCH_STEP = [
    { query: null, ranked: false },
    { query: 0,    ranked: false },
    { query: 0,    ranked: true },
    { query: 1,    ranked: false },
    { query: 1,    ranked: true }
  ];

  /* The classifier, phase one: the labelled embeddings alone, then projected onto each of w's directions in turn
     (an index into the turn), the first and the last with their verdict. Phase two keeps the best w and scores each
     new picture (an index into CLASSIFY.fresh). Playback holds at the labelled dots, at the poor w, at the best w,
     and before each new picture; the timer plays only w's turn. */
  var CLASSIFY_STEP = [{ w: null, verdict: null, using: false, fresh: null }];
  var TURNS = (CLASSIFY.turn.from - CLASSIFY.turn.to) / CLASSIFY.turn.by;
  for (var k = 0; k <= TURNS; k++) {
    CLASSIFY_STEP.push({ w: k, verdict: k === 0 ? 0 : k === TURNS ? 1 : null, using: false, fresh: null });
  }
  CLASSIFY.fresh.forEach(function (_, i) { CLASSIFY_STEP.push({ w: TURNS, verdict: null, using: true, fresh: i }); });
  var CLASSIFY_HOLDS = [0, 1, 1 + TURNS].concat(CLASSIFY.fresh.slice(1).map(function (_, i) { return 2 + TURNS + i; }));

  /* ---- Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var pitch = CELL.side + CELL.gap, rows = 3;
    var top = MID - (rows * CELL.side + (rows - 1) * CELL.gap) / 2;
    var layers = NET.xs.map(function (x, k) {
      var n = NET.counts[k];
      return { x: x, ys: Array.apply(null, Array(n)).map(function (_, i) { return MID + (i - (n - 1) / 2) * NET.pitch; }) };
    });
    var phases = PHASES.map(function (ph) {
      return {
        cells: ph.inputs.map(function (inp) { return { x: CELL.x + inp.col * pitch, y: top + inp.row * pitch }; }),
        readouts: ph.inputs.map(function (inp) { return '\\mathbf{e} = \\begin{bmatrix} ' + inp.e[0].toFixed(2) + ' \\\\ ' + inp.e[1].toFixed(2) + ' \\end{bmatrix}'; })
      };
    });
    var all = [].concat.apply([COPY.blank], phases.map(function (p) { return p.readouts; }));
    var widest = Math.max.apply(null, all.map(function (tex) { return measure(tex).w; }));
    return (_geo = {
      layers: layers, phases: phases,
      land: { from: READOUT.x + widest + LAND.gap, to: PLANE.x - PLANE.half - LAND.gap }
    });
  }

  /* The search: each key's and query's unit vector, each query's readout and its score on every key
     (q · k, which is cos θ since both have length one), and the keys' order from the highest score down. */
  var _search;
  function SEARCH_GEO() {
    if (_search) return _search;
    function unit(deg) { var a = deg * Math.PI / 180; return [Math.cos(a), Math.sin(a)]; }
    var keys = SEARCH.keys.map(function (k) { return unit(k.deg); });
    var queries = SEARCH.queries.map(function (qu) {
      var q = unit(qu.deg);
      var scores = keys.map(function (k) { return q[0] * k[0] + q[1] * k[1]; });
      return {
        e: q, scores: scores,
        order: scores.map(function (_, i) { return i; }).sort(function (a, b) { return scores[b] - scores[a]; }),
        readout: '\\mathbf{q} = \\begin{bmatrix} ' + q[0].toFixed(2) + ' \\\\ ' + q[1].toFixed(2) + ' \\end{bmatrix}'
      };
    });
    var all = [COPY.search.blank].concat(queries.map(function (qu) { return qu.readout; }));
    var widest = Math.max.apply(null, all.map(function (tex) { return measure(tex).w; }));
    return (_search = {
      keys: keys, queries: queries,
      cell: { x: QUERY.x, y: MID - QUERY.side / 2 },
      land: { from: QUERY.readout + widest + LAND.gap, to: SPLANE.x - SPLANE.half - LAND.gap }
    });
  }

  /* The classifier: each unit w, and under it every labelled embedding's and new picture's score s = w · e (both
     have length one, so s is the cosine of the angle between them) and projection onto w; each new picture's
     P(cat) under the best w; and how far w's line reaches each way from the origin, in units. */
  var _classify;
  function CLASSIFY_GEO() {
    if (_classify) return _classify;
    function unit(deg) { var a = deg * Math.PI / 180; return [Math.cos(a), Math.sin(a)]; }
    function project(w, deg) {
      var e = unit(deg), s = e[0] * w[0] + e[1] * w[1];
      return { e: e, s: s, foot: [s * w[0], s * w[1]] };
    }
    var degs = [];
    for (var k = 0; k <= TURNS; k++) degs.push(CLASSIFY.turn.from - k * CLASSIFY.turn.by);
    var ws = degs.map(function (deg) {
      var w = unit(deg), images = [], W;
      CLASSIFY.groups.forEach(function (gd, col) {
        gd.forEach(function (d) { var im = project(w, d); im.col = col; images.push(im); });
      });
      W = { deg: deg, w: w, images: images };
      /* The taller of the two densities anywhere on the score line, which every frame draws at DENSITY.height. */
      var tallest = 0;
      for (var i = 0; i <= DENSITY.samples; i++) {
        var v = -1 + 2 * i / DENSITY.samples;
        tallest = Math.max(tallest, density(W, 0, v), density(W, 1, v));
      }
      W.peak = tallest;
      return W;
    });
    var best = ws[ws.length - 1];
    return (_classify = {
      ws: ws, best: best,
      fresh: CLASSIFY.fresh.map(function (f) {
        var im = project(best.w, f.deg), cat = density(best, 0, im.s), car = density(best, 1, im.s);
        im.p = cat / (cat + car);
        return im;
      }),
      reach: CPLANE.half / CPLANE.unit * 0.95
    });
  }

  /* ---- Helpers ------------------------------------------------------------ */
  function r(n) { return Math.round(n * 100) / 100; }
  function xy(p) { return r(p[0]) + ' ' + r(p[1]); }
  /* Group col's kernel density of its scores under w's fit W, at score v. A score lies in [−1, 1], so each kernel
     is mirrored at both ends, keeping the mass that would spill past them. */
  function density(W, col, v) {
    var sum = 0, n = 0;
    W.images.forEach(function (im) {
      if (im.col !== col) return;
      n++;
      [im.s, 2 - im.s, -2 - im.s].forEach(function (m) { var z = (v - m) / DENSITY.bandwidth; sum += Math.exp(-z * z / 2); });
    });
    return sum / n;
  }
  function measure(tex) { return window.Tex.render(tex, { unitsPerEm: TEXT.label }); }

  function ring(c, rr) {
    return 'M' + xy([c[0] - rr, c[1]]) + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] + rr, c[1]])
      + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] - rr, c[1]]);
  }

  /* A point of plane P (PLANE or SPLANE), from coordinates in units or from an angle in degrees and a length in units. */
  function plane(P, v) { return [P.x + v[0] * P.unit, MID - v[1] * P.unit]; }
  function polar(P, deg, len) { var a = deg * Math.PI / 180; return plane(P, [len * Math.cos(a), len * Math.sin(a)]); }
  function angle(e) { return Math.atan2(e[1], e[0]) * 180 / Math.PI; }

  function arrow(fig, from, to, color, width) {
    var dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy);
    var ux = dx / len, uy = dy / len;
    var bx = to[0] - ux * HEAD.length, by = to[1] - uy * HEAD.length;
    fig.rule(from[0], from[1], bx, by, { stroke: color, width: width });
    fig.path('M' + xy(to) + ' L' + xy([bx - uy * HEAD.half, by + ux * HEAD.half])
      + ' L' + xy([bx + uy * HEAD.half, by - ux * HEAD.half]) + ' Z', { fill: color });
  }

  /* A picture, fitted inside a cell's inset and centred in it: each part mapped from picture units and painted by its role. */
  function picture(fig, pic, c, side, hue) {
    var inset = side * CELL.inset, inner = side - 2 * inset, unit = inner / Math.max(pic.box.w, pic.box.h);
    var ox = c.x + inset + (inner - pic.box.w * unit) / 2, oy = c.y + inset + (inner - pic.box.h * unit) / 2;
    function at(p) { return [ox + p[0] * unit, oy + p[1] * unit]; }
    var paint = {
      body: { fill: hue, stroke: COLOR.edge, width: LINE.strong }, hole: { fill: COLOR.hole },
      hub: { fill: COLOR.node }, ink: { fill: COLOR.ink }, line: { fill: 'none', stroke: COLOR.ink, width: LINE.thin }
    };
    pic.parts.forEach(function (part) {
      var d = part.d
        ? part.d.replace(/(-?[\d.]+) (-?[\d.]+)/g, function (_, x, y) { return xy(at([+x, +y])); })
        : ring(at(part.at), part.r * unit);
      fig.path(d, paint[part.as]);
    });
  }

  /* A sound as a row of bars centred on the cell's middle, each as tall as the clip is loud there. */
  function bars(fig, loud, c, side, hue) {
    var inset = side * CELL.inset, inner = side - 2 * inset, slot = inner / BARS.count, w = slot * BARS.fill;
    for (var k = 0; k < BARS.count; k++) {
      var h = Math.max(w, inner * loud((k + 0.5) / BARS.count));
      fig.rect(c.x + inset + k * slot + (slot - w) / 2, c.y + side / 2 - h / 2, w, h,
        { fill: hue, stroke: COLOR.edge, width: LINE.thin, radius: w / 2 });
    }
  }

  /* One input's cell of a given side: framed in its group's tint, outlined in its hue while active, and its content drawn inside. */
  function cell(fig, inp, c, side, active) {
    var hue = COLOR.group[inp.col];
    fig.rect(c.x, c.y, side, side, active
      ? { fill: TINT[inp.col], stroke: hue, width: LINE.vector, radius: CELL.radius }
      : { fill: TINT[inp.col], stroke: COLOR.edge, width: LINE.thin, radius: CELL.radius });
    if (inp.kind === 'text') fig.text(COPY.words[inp.thing], { x: c.x + side / 2, y: c.y + side / 2 + TEXT.label * 0.3, role: 'slideBody' });
    else if (inp.kind === 'image') picture(fig, COPY.pictures[inp.thing], c, side, hue);
    else bars(fig, COPY.loudness[inp.thing], c, side, hue);
  }

  /* The model: every edge between neighbouring layers, lit in the input's hue while it is fed in; then the nodes, the output pair filled. */
  function model(fig, layers, hue) {
    var paint = hue ? { stroke: hue, width: LINE.strong } : { stroke: COLOR.edge, width: LINE.thin };
    for (var k = 1; k < layers.length; k++) {
      layers[k].ys.forEach(function (yb) { layers[k - 1].ys.forEach(function (ya) { fig.rule(layers[k - 1].x, ya, layers[k].x, yb, paint); }); });
    }
    layers.forEach(function (L, k) {
      L.ys.forEach(function (y) {
        var out = hue && k === layers.length - 1;
        fig.path(ring([L.x, y], NET.r), { fill: out ? hue : COLOR.node, stroke: COLOR.edge, width: LINE.strong });
      });
    });
    fig.text(COPY.model, { x: (NET.xs[0] + NET.xs[NET.xs.length - 1]) / 2, y: NET.nameY, role: 'slideBody' });
  }

  /* The plane of e: two axes through the origin, a tick at ±1 on each, and their names. */
  function axes(fig, P) {
    var o = plane(P, [0, 0]);
    fig.rule(o[0] - P.half, o[1], o[0] + P.half, o[1], { stroke: COLOR.edge, width: LINE.thin });
    fig.rule(o[0], o[1] - P.half, o[0], o[1] + P.half, { stroke: COLOR.edge, width: LINE.thin });
    [-1, 1].forEach(function (u) {
      var p = plane(P, [u, u]);
      fig.rule(p[0], o[1] - P.tick, p[0], o[1] + P.tick, { stroke: COLOR.edge, width: LINE.thin });
      fig.rule(o[0] - P.tick, p[1], o[0] + P.tick, p[1], { stroke: COLOR.edge, width: LINE.thin });
    });
    fig.math(COPY.axes[0], { x: o[0] + P.half, y: o[1] + TEXT.label * 1.3, size: TEXT.label, align: 'end' });
    fig.math(COPY.axes[1], { x: o[0] + TEXT.detail, y: o[1] - P.half + TEXT.label, size: TEXT.label, align: 'start' });
  }

  /* An arc from angle a to b (degrees, a < b) at a radius in units, and θ centred on a point. */
  function theta(fig, a, b, radius, at) {
    var rr = radius * PLANE.unit;
    fig.path('M' + xy(polar(PLANE, a, radius)) + ' A' + r(rr) + ' ' + r(rr) + ' 0 0 0 ' + xy(polar(PLANE, b, radius)), { fill: 'none', stroke: COLOR.ink, width: LINE.strong });
    fig.math('\\theta', { x: at[0], y: at[1] + TEXT.label * 0.3, size: TEXT.label, align: 'middle' });
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig, step) {
    var s = STEP[step], g = GEO(), ph = PHASES[s.phase], pg = g.phases[s.phase];
    var feeding = s.input != null ? ph.inputs[s.input] : null;
    var hue = feeding ? COLOR.group[feeding.col] : null;

    /* This phase's inputs, the model, and the embedding the current input comes out as. */
    ph.inputs.forEach(function (inp, i) { cell(fig, inp, pg.cells[i], CELL.side, i === s.input); });
    arrow(fig, [FEED.from, MID], [FEED.to, MID], COLOR.edge, LINE.strong);
    model(fig, g.layers, hue);
    fig.math(feeding ? pg.readouts[s.input] : COPY.blank, { x: READOUT.x, y: MID + TEXT.label * 0.3, size: TEXT.label, align: 'start' });
    arrow(fig, [g.land.from, MID], [g.land.to, MID], COLOR.edge, LINE.strong);

    /* The plane, every input landed this phase as an arrow in its group's hue, and each group named once its first arrow lands. */
    axes(fig, PLANE);
    var o = plane(PLANE, [0, 0]), landed = ph.inputs.slice(0, s.landed);
    landed.forEach(function (inp) { arrow(fig, o, plane(PLANE, inp.e), COLOR.group[inp.col], LINE.vector); });
    var firsts = ph.groups.map(function (_, col) { return landed.filter(function (inp) { return inp.col === col; })[0]; });
    firsts.forEach(function (first, col) {
      if (!first) return;
      var p = polar(PLANE, angle(first.e), NAME);
      fig.text(ph.groups[col], { x: p[0], y: p[1] + TEXT.label * 0.3, role: 'slideBody' });
    });

    /* The small angle spanning group 0, the large one between the groups' first arrows, and what they say. */
    if (s.angle) {
      var spread = landed.filter(function (inp) { return inp.col === 0; }).map(function (inp) { return angle(inp.e); });
      var lo = Math.min.apply(null, spread), hi = Math.max.apply(null, spread);
      theta(fig, lo, hi, ARC.within, polar(PLANE, lo - ARC.past, ARC.within));
      var a = angle(firsts[0].e), b = angle(firsts[1].e);
      theta(fig, a, b, ARC.between, polar(PLANE, (a + b) / 2, ARC.label));
      COPY.notes.forEach(function (tex, k) { fig.math(tex, { x: NOTE.x, y: NOTE.y + k * ROW.note, size: TEXT.label, align: 'start' }); });
    }
  }

  /* A score as the list prints it, two decimals with a true minus sign. */
  function score(v) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(2); }

  function drawSearch(fig, step) {
    var s = SEARCH_STEP[step], g = SEARCH_GEO(), P = SPLANE;
    var query = s.query != null ? SEARCH.queries[s.query] : null, qg = query ? g.queries[s.query] : null;

    /* The query cell, empty until a query is asked, and the embedding q it comes out as. */
    var c = g.cell, side = QUERY.side;
    fig.text(COPY.search.query, { x: c.x + side / 2, y: c.y - QUERY.labelGap, role: 'slideBody' });
    if (query) cell(fig, query, c, side, true);
    else fig.rect(c.x, c.y, side, side, { fill: COLOR.hole, stroke: COLOR.edge, width: LINE.thin, radius: CELL.radius });
    arrow(fig, [QUERY.feed.from, MID], [QUERY.feed.to, MID], COLOR.edge, LINE.strong);
    fig.math(qg ? qg.readout : COPY.search.blank, { x: QUERY.readout, y: MID + TEXT.label * 0.3, size: TEXT.label, align: 'start' });
    arrow(fig, [g.land.from, MID], [g.land.to, MID], COLOR.edge, LINE.strong);

    /* The plane with its unit circle, every key as an arrow ending on it in its group's hue, and q in ink. */
    axes(fig, P);
    var o = plane(P, [0, 0]);
    fig.path(ring(o, P.unit), { fill: 'none', stroke: COLOR.edge, width: LINE.thin });
    SEARCH.keys.forEach(function (k, i) {
      arrow(fig, o, plane(P, g.keys[i]), COLOR.group[k.col], LINE.vector);
      var p = polar(P, k.deg, TIP);
      fig.math('\\mathbf{k}_' + (i + 1), { x: p[0], y: p[1] + TEXT.label * 0.3, size: TEXT.label, align: 'middle' });
    });
    if (query) {
      arrow(fig, o, plane(P, qg.e), COLOR.ink, LINE.vector);
      var t = polar(P, query.deg, TIP);
      fig.math('\\mathbf{q}', { x: t[0], y: t[1] + TEXT.label * 0.3, size: TEXT.label, align: 'middle' });
    }

    /* The keys, in stored order until ranked, then from the highest score down: the top three outlined,
       each with its score as a bar from the zero line and as a number. */
    fig.text(COPY.search.keys, { x: LIST.x, y: LIST.headerY, role: 'slideBody', align: 'start' });
    var order = s.ranked ? qg.order : SEARCH.keys.map(function (_, i) { return i; });
    if (s.ranked) {
      fig.math(COPY.search.header, { x: LIST.zero + LIST.bar / 2, y: LIST.headerY, size: TEXT.label, align: 'middle' });
      var bottom = LIST.top + (order.length - 1) * LIST.pitch + LIST.thumb;
      fig.rule(LIST.zero, LIST.top, LIST.zero, bottom, { stroke: COLOR.edge, width: LINE.thin });
    }
    order.forEach(function (i, row) {
      var k = SEARCH.keys[i], y = LIST.top + row * LIST.pitch, mid = y + LIST.thumb / 2;
      cell(fig, k, { x: LIST.x, y: y }, LIST.thumb, s.ranked && row < 3);
      fig.math('\\mathbf{k}_' + (i + 1), { x: LIST.name, y: mid + TEXT.label * 0.3, size: TEXT.label, align: 'start' });
      if (!s.ranked) return;
      var v = qg.scores[i], len = Math.abs(v) * LIST.bar;
      fig.rect(v < 0 ? LIST.zero - len : LIST.zero, mid - LIST.barH / 2, len, LIST.barH,
        { fill: COLOR.group[k.col], stroke: COLOR.edge, width: LINE.thin });
      fig.text(score(v), { x: LIST.right, y: mid + TEXT.label * 0.3, role: 'slideBody', align: 'end' });
    });
  }

  /* A dot in a group's hue. */
  function dot(fig, p, hue, radius) { fig.path(ring(p, radius), { fill: hue, stroke: COLOR.edge, width: LINE.thin }); }

  /* A new, unlabelled picture: a neutral cell outlined in ink, holding its picture, or for `both` the cat in its
     upper left and the car in its lower right. */
  function fresh(fig, f, c, side) {
    fig.rect(c.x, c.y, side, side, { fill: COLOR.hole, stroke: COLOR.ink, width: LINE.strong, radius: CELL.radius });
    if (f.thing !== 'both') return picture(fig, COPY.pictures[f.thing], c, side, COLOR.group[f.col]);
    var part = side * 0.6, rest = side - part;
    picture(fig, COPY.pictures.cat, { x: c.x, y: c.y }, part, COLOR.group[0]);
    picture(fig, COPY.pictures.car, { x: c.x + rest, y: c.y + rest }, part, COLOR.group[1]);
  }

  function drawClassify(fig, step) {
    var s = CLASSIFY_STEP[step], g = CLASSIFY_GEO(), P = CPLANE, C = COPY.classify;
    var W = s.w != null ? g.ws[s.w] : null, f = s.fresh != null ? CLASSIFY.fresh[s.fresh] : null, fg = f ? g.fresh[s.fresh] : null;
    var o = plane(P, [0, 0]), y = SCORE.y, lo = scoreX(-1), hi = scoreX(1);
    var dash = [cm(0.08), cm(0.08)];
    function along(t) { return plane(P, [t * W.w[0], t * W.w[1]]); }
    function scoreX(v) { return SCORE.zero + v * SCORE.unit; }
    function densityY(col, v) { return y - density(W, col, v) / W.peak * DENSITY.height; }

    /* The plane, w's line through the origin, and in phase one a dashed drop from each labelled dot to its foot on w;
       in phase two only the new picture's. */
    axes(fig, P);
    if (W) {
      var a = along(-g.reach), b = along(g.reach);
      fig.rule(a[0], a[1], b[0], b[1], { stroke: COLOR.edge, width: LINE.strong });
    }
    var dropped = W && !s.using ? W.images : fg ? [fg] : [];
    dropped.forEach(function (im) {
      var p = plane(P, im.e), q = plane(P, im.foot);
      fig.rule(p[0], p[1], q[0], q[1], { stroke: COLOR.edge, width: LINE.thin, dash: dash });
    });

    /* Every labelled embedding as a dot in its group's hue, each group named beside its middle, the feet on w,
       and the new picture's embedding in ink. */
    g.ws[0].images.forEach(function (im) { dot(fig, plane(P, im.e), COLOR.group[im.col], DOT.r); });
    CLASSIFY.groups.forEach(function (degs, col) {
      var p = polar(P, (degs[0] + degs[degs.length - 1]) / 2, NAME);
      fig.text(C.groups[col], { x: p[0], y: p[1] + TEXT.label * 0.3, role: 'slideBody' });
    });
    dropped.forEach(function (im) { dot(fig, plane(P, im.foot), im === fg ? COLOR.ink : COLOR.group[im.col], DOT.foot); });
    if (fg) dot(fig, plane(P, fg.e), COLOR.ink, DOT.r);
    if (!W) return;

    /* w itself, from the origin to length one, named just off its line. */
    arrow(fig, o, along(1), COLOR.w, LINE.vector);
    var t = polar(P, W.deg - WLABEL.turn, WLABEL.len);
    fig.math('\\mathbf{w}', { x: t[0], y: t[1] + TEXT.label * 0.3, size: TEXT.label, align: 'middle' });

    /* w's line laid flat as the score line from −1 to 1: a tick at each end and at 0, what each end means, every
       group's density above it, every labelled score as a dot, and at the turn's two ends whether w separates the groups. */
    arrow(fig, [UNROLL.from, y], [UNROLL.to, y], COLOR.edge, LINE.strong);
    fig.rule(lo, y, hi, y, { stroke: COLOR.edge, width: LINE.strong });
    [-1, 0, 1].forEach(function (v) { fig.rule(scoreX(v), y - SCORE.tick, scoreX(v), y + SCORE.tick, { stroke: COLOR.edge, width: LINE.thin }); });
    var ly = y + SCORE.labelGap;
    fig.text(C.ends[0], { x: lo, y: ly, role: 'slideBody', align: 'start' });
    fig.math(C.score, { x: SCORE.zero, y: ly, size: TEXT.label, align: 'middle' });
    fig.text(C.ends[1], { x: hi, y: ly, role: 'slideBody', align: 'end' });
    CLASSIFY.groups.forEach(function (_, col) {
      var d = 'M' + xy([lo, y]);
      for (var i = 0; i <= DENSITY.samples; i++) {
        var v = -1 + 2 * i / DENSITY.samples;
        d += ' L' + xy([scoreX(v), densityY(col, v)]);
      }
      fig.path(d + ' L' + xy([hi, y]) + ' Z', { fill: TINT[col], opacity: 0.6, stroke: COLOR.group[col], width: LINE.strong });
    });
    W.images.forEach(function (im) { dot(fig, [scoreX(im.s), y], COLOR.group[im.col], DOT.r); });
    if (s.verdict != null) fig.text(C.verdicts[s.verdict], { x: SCORE.zero, y: SCORE.verdict, role: 'slideBody' });
    if (!f) return;

    /* Phase two, the new picture: its cell and what it scores, a dashed line up from its score through both
       densities, a short ink tick where it meets each one that rises off the score line, and the two probabilities they give. */
    fig.text(C.fresh, { x: FRESH.x + FRESH.side / 2, y: FRESH.y - FRESH.labelGap, role: 'slideBody' });
    fresh(fig, f, { x: FRESH.x, y: FRESH.y }, FRESH.side);
    var fx = scoreX(fg.s), meets = [densityY(0, fg.s), densityY(1, fg.s)];
    fig.rule(fx, y, fx, Math.min(meets[0], meets[1]), { stroke: COLOR.ink, width: LINE.thin, dash: dash });
    dot(fig, [fx, y], COLOR.ink, DOT.r);
    meets.forEach(function (my) {
      if (y - my > DOT.r) fig.rule(fx - MEET.half, my, fx + MEET.half, my, { stroke: COLOR.ink, width: LINE.strong });
    });
    var readouts = ['P(\\text{cat}) = ' + fg.p.toFixed(2), 'P(\\text{car}) = ' + (1 - fg.p).toFixed(2)];
    readouts.forEach(function (tex, k) {
      fig.math(tex, { x: FRESH.readout, y: FRESH.y + FRESH.side / 2 + (k - 0.5) * ROW.note + TEXT.label * 0.3, size: TEXT.label, align: 'start' });
    });
  }

  /* The best w alone, the classifier's end state: the labelled embeddings dropped onto w's line, and the score line under
     the plane with each group's density and every score. */
  function drawBest(fig, step) {
    var g = CLASSIFY_GEO(), B = g.best, C = COPY.classify, P = BPLANE, S = BSCORE, dash = [cm(0.08), cm(0.08)];
    var f = step ? CLASSIFY.fresh[step - 1] : null, fg = f ? g.fresh[step - 1] : null;
    function at(v) { return [P.x + v[0] * P.unit, P.y - v[1] * P.unit]; }
    function polarAt(deg, len) { var a = deg * Math.PI / 180; return at([len * Math.cos(a), len * Math.sin(a)]); }
    function scoreX(v) { return S.zero + v * S.unit; }
    function densityY(col, v) { return S.y - density(B, col, v) / B.peak * S.height; }

    /* The plane's axes, a tick at 1 on each, and their names past their ends. */
    var o = at([0, 0]), xr = at([P.right, 0]), yt = at([0, P.top]);
    fig.rule(at([-P.left, 0])[0], o[1], xr[0], o[1], { stroke: COLOR.edge, width: LINE.thin });
    fig.rule(o[0], yt[1], o[0], at([0, -P.bottom])[1], { stroke: COLOR.edge, width: LINE.thin });
    var one = at([1, 1]);
    fig.rule(one[0], o[1] - PLANE.tick, one[0], o[1] + PLANE.tick, { stroke: COLOR.edge, width: LINE.thin });
    fig.rule(o[0] - PLANE.tick, one[1], o[0] + PLANE.tick, one[1], { stroke: COLOR.edge, width: LINE.thin });
    fig.math(COPY.axes[0], { x: xr[0] + P.gap, y: o[1] + TEXT.label * 0.3, size: TEXT.label, align: 'start' });
    fig.math(COPY.axes[1], { x: o[0], y: yt[1] - P.gap, size: TEXT.label, align: 'middle' });

    /* w's line and a dashed drop to its foot from each labelled embedding, or once a new picture is scored, from its
       embedding alone; the embeddings and feet in their group's hue, the new picture's in ink, each group named, and w. */
    var reach = 1.15, a = at([-reach * B.w[0], -reach * B.w[1]]), b = at([reach * B.w[0], reach * B.w[1]]);
    fig.rule(a[0], a[1], b[0], b[1], { stroke: COLOR.edge, width: LINE.strong });
    var dropped = fg ? [fg] : B.images;
    dropped.forEach(function (im) {
      var p = at(im.e), q = at(im.foot);
      fig.rule(p[0], p[1], q[0], q[1], { stroke: COLOR.edge, width: LINE.thin, dash: dash });
    });
    B.images.forEach(function (im) { dot(fig, at(im.e), COLOR.group[im.col], DOT.r); });
    dropped.forEach(function (im) { dot(fig, at(im.foot), im === fg ? COLOR.ink : COLOR.group[im.col], DOT.foot); });
    if (fg) dot(fig, at(fg.e), COLOR.ink, DOT.r);
    CLASSIFY.groups.forEach(function (degs, col) {
      var p = polarAt((degs[0] + degs[degs.length - 1]) / 2, NAME);
      fig.text(C.groups[col], { x: p[0], y: p[1] + TEXT.label * 0.3, role: 'slideBody' });
    });
    arrow(fig, o, at(B.w), COLOR.w, LINE.vector);
    var t = polarAt(B.deg - WLABEL.turn, WLABEL.len);
    fig.math('\\mathbf{w}', { x: t[0], y: t[1] + TEXT.label * 0.3, size: TEXT.label, align: 'middle' });

    /* The score line from −1 to 1 with a tick at each end and at 0, what each end means, each group's density, and every score. */
    var lo = scoreX(-1), hi = scoreX(1), ly = S.y + SCORE.labelGap;
    fig.rule(lo, S.y, hi, S.y, { stroke: COLOR.edge, width: LINE.strong });
    [-1, 0, 1].forEach(function (v) { fig.rule(scoreX(v), S.y - SCORE.tick, scoreX(v), S.y + SCORE.tick, { stroke: COLOR.edge, width: LINE.thin }); });
    fig.text(C.ends[0], { x: lo, y: ly, role: 'slideBody', align: 'start' });
    fig.math(C.score, { x: S.zero, y: ly, size: TEXT.label, align: 'middle' });
    fig.text(C.ends[1], { x: hi, y: ly, role: 'slideBody', align: 'end' });
    CLASSIFY.groups.forEach(function (_, col) {
      var d = 'M' + xy([lo, S.y]);
      for (var i = 0; i <= DENSITY.samples; i++) {
        var v = -1 + 2 * i / DENSITY.samples;
        d += ' L' + xy([scoreX(v), densityY(col, v)]);
      }
      fig.path(d + ' L' + xy([hi, S.y]) + ' Z', { fill: TINT[col], opacity: 0.6, stroke: COLOR.group[col], width: LINE.strong });
    });
    B.images.forEach(function (im) { dot(fig, [scoreX(im.s), S.y], COLOR.group[im.col], DOT.r); });
    if (!f) return;

    /* A new picture: its cell right of the plane with the two probabilities under it, and on the score line a dashed
       line up from its score through both densities, with a short ink tick where it meets each one that rises off the line. */
    fig.text(C.fresh, { x: BFRESH.x, y: BFRESH.label, role: 'slideBody' });
    fresh(fig, f, { x: BFRESH.x - BFRESH.side / 2, y: BFRESH.top }, BFRESH.side);
    var fx = scoreX(fg.s), meets = [densityY(0, fg.s), densityY(1, fg.s)];
    fig.rule(fx, S.y, fx, Math.min(meets[0], meets[1]), { stroke: COLOR.ink, width: LINE.thin, dash: dash });
    dot(fig, [fx, S.y], COLOR.ink, DOT.r);
    meets.forEach(function (my) {
      if (S.y - my > DOT.r) fig.rule(fx - MEET.half, my, fx + MEET.half, my, { stroke: COLOR.ink, width: LINE.strong });
    });
    ['P(\\text{cat}) = ' + fg.p.toFixed(2), 'P(\\text{car}) = ' + (1 - fg.p).toFixed(2)].forEach(function (tex, k) {
      fig.math(tex, { x: BFRESH.x, y: BFRESH.readout + k * ROW.note, size: TEXT.label, align: 'middle' });
    });
  }

  /* The summary slide's plane thumbnails: the plane, axes, and unit circle of the full figures, no text but the vectors' names. */
  function thumbPlane(fig) {
    var P = TPLANE;
    function at(v) { return [P.x + v[0] * P.unit, P.y - v[1] * P.unit]; }
    var o = at([0, 0]), a = at([-P.reach, 0]), b = at([P.reach, 0]), c = at([0, P.reach]), d = at([0, -P.reach]);
    fig.rule(a[0], o[1], b[0], o[1], { stroke: COLOR.edge, width: LINE.thin });
    fig.rule(o[0], c[1], o[0], d[1], { stroke: COLOR.edge, width: LINE.thin });
    return at;
  }

  function drawSearchThumb(fig) {
    var at = thumbPlane(fig), g = SEARCH_GEO(), q = SEARCH.queries[0], o = at([0, 0]);
    fig.path(ring(o, TPLANE.unit), { fill: 'none', stroke: COLOR.edge, width: LINE.thin });
    SEARCH.keys.forEach(function (k, i) { arrow(fig, o, at(g.keys[i]), COLOR.group[k.col], LINE.vector); });
    arrow(fig, o, at(g.queries[0].e), COLOR.ink, LINE.vector);
    var a = q.deg * Math.PI / 180, t = at([1.3 * Math.cos(a), 1.3 * Math.sin(a)]);
    fig.math('\\mathbf{q}', { x: t[0], y: t[1] + TEXT.label * 0.3, size: TEXT.label, align: 'middle' });
  }

  function drawBestThumb(fig) {
    var at = thumbPlane(fig), B = CLASSIFY_GEO().best, o = at([0, 0]), dash = [cm(0.08), cm(0.08)];
    var a = at([-1.15 * B.w[0], -1.15 * B.w[1]]), b = at([1.15 * B.w[0], 1.15 * B.w[1]]);
    fig.rule(a[0], a[1], b[0], b[1], { stroke: COLOR.edge, width: LINE.strong });
    B.images.forEach(function (im) {
      var p = at(im.e), q = at(im.foot);
      fig.rule(p[0], p[1], q[0], q[1], { stroke: COLOR.edge, width: LINE.thin, dash: dash });
    });
    B.images.forEach(function (im) { dot(fig, at(im.e), COLOR.group[im.col], DOT.r); });
    B.images.forEach(function (im) { dot(fig, at(im.foot), COLOR.group[im.col], DOT.foot); });
    arrow(fig, o, at(B.w), COLOR.w, LINE.vector);
    var t = at([TPLANE.w * Math.cos((B.deg - WLABEL.turn) * Math.PI / 180), TPLANE.w * Math.sin((B.deg - WLABEL.turn) * Math.PI / 180)]);
    fig.math('\\mathbf{w}', { x: t[0], y: t[1] + TEXT.label * 0.3, size: TEXT.label, align: 'middle' });
  }

  window.EmbeddingSpaceFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Embedding Space',
    name:      'embedding-space',
    className: 'embedding-space-fig',
    ariaLabel: COPY.ariaLabel,
    steps:     STEP.length,
    draw:      draw
  };

  window.EmbeddingSearchFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Embedding Search',
    name:      'embedding-search',
    className: 'embedding-search-fig',
    ariaLabel: COPY.search.ariaLabel,
    steps:     SEARCH_STEP.length,
    draw:      drawSearch
  };

  window.EmbeddingClassifierFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Embedding Classifier',
    name:      'embedding-classifier',
    className: 'embedding-classifier-fig',
    ariaLabel: COPY.classify.ariaLabel,
    steps:     CLASSIFY_STEP.length,
    autoplay:  PLAY.ms,
    holds:     CLASSIFY_HOLDS,
    draw:      drawClassify
  };

  window.EmbeddingBestWFigure = {
    width:     BPAGE.w,
    height:    BPAGE.h,
    title:     'Embedding Classifier, Best w',
    name:      'embedding-best-w',
    className: 'embedding-best-w-fig',
    ariaLabel: COPY.classify.bestLabel,
    steps:     1 + CLASSIFY.fresh.length,
    draw:      drawBest
  };

  window.SummarySearchFigure = {
    width:     TPAGE.w,
    height:    TPAGE.h,
    title:     'Summary, Search',
    name:      'summary-search',
    className: 'embedding-search-fig',
    ariaLabel: 'A query q and six unit key vectors on the unit circle, the keys coloured by group; the dot product is the cosine of the angle between q and a key.',
    draw:      drawSearchThumb
  };

  window.SummaryClassifierFigure = {
    width:     TPAGE.w,
    height:    TPAGE.h,
    title:     'Summary, Classifier',
    name:      'summary-classifier',
    className: 'embedding-best-w-fig',
    ariaLabel: 'Embeddings of two groups as dots, split along the arrow w; each dot drops to its projection on w.',
    draw:      drawBestThumb
  };
})();
