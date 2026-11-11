/* MLP MNIST — figure composition module.
   10.1 × ~7.1 cm, 5 steps. A multilayer perceptron with two hidden layers reads a handwritten 7:
   the 28 × 28 image flattened into x, then h₁, h₂, and y, one matrix product per step. The
   layer pair being computed is banded and has its edges lit, the others staying in the default
   edge colour; its equation is written, banded too, stacked under the network with one gap above,
   between, and below them. Each layer fills with its activations once computed; the last step reads
   the prediction off y. The digit
   is drawn, not loaded: pixels shaded by their distance to two pen strokes, in MNIST's grid. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  /* A two-column slide's column fits 10.1 cm at the deck's 1.5× import (431.5 pt); its figure budget is 7.7 cm tall (330 pt). */
  var PAGE = { w: cm(10.1) };   /* the height falls out of the equations: see GEO */

  /* ---- Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.slideBody.size, math: TYPE.slideBody.size };

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = {
    input: 'var(--graphic-tertiary)', edge: 'var(--edges)', node: 'var(--graphic-soft)', ink: 'var(--text)',
    active: 'var(--graphic-primary)', band: 'var(--graphic-primary-tint)', pick: 'var(--accent-strong)'
  };

  /* ---- Layout knobs ------------------------------------------------------- */
  /* Theme line widths: the thin one for the many unlit edges and the frame, the strong one for the rest. */
  var LINE  = { edge: 'var(--line-width)', active: 'var(--line-width-strong)', node: 'var(--line-width-strong)', pick: 'var(--line-width-strong)' };
  var HEAD  = { length: cm(0.2), half: cm(0.08) };
  /* The digit: MNIST's 28-pixel grid, its box, and each pen stroke's half-width and soft edge, in pixels. */
  var DIGIT = { px: 28, x: cm(0.2), y: cm(1.0), size: cm(2.0), pen: 1.3, soft: 1.0 };
  var FLAT  = { from: cm(2.45), to: cm(2.95) };   /* the arrow that flattens the image into x */
  /* Each layer: its column's x, node centres, where its ⋮ sits (null: none), node radius. */
  var LAYER = {
    x:  { x: cm(3.25), ys: [cm(0.6), cm(1.1), cm(1.6), cm(2.9), cm(3.4)], dots: cm(2.25), r: cm(0.1) },
    h1: { x: cm(5.05), ys: [cm(0.75), cm(1.35), cm(1.95), cm(3.25)],      dots: cm(2.6),  r: cm(0.2) },
    h2: { x: cm(6.85), ys: [cm(1.0), cm(1.6), cm(3.0)],                   dots: cm(2.3),  r: cm(0.2) },
    y:  { x: cm(8.65), ys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (d) { return cm(0.3 + d * 0.378); }), dots: null, r: cm(0.13) }
  };
  var DIGITS = { gap: cm(0.2) };                     /* output node to its digit label */
  var BAND   = { pad: cm(0.35), top: cm(0.05), bottom: cm(3.95), radius: cm(0.15) };   /* the lit layer pair */
  var NAMES  = { y: cm(4.45) };                      /* baseline of the row naming layers and weights */
  var EQ     = { x: cm(4.8), gap: cm(0.3), padX: cm(0.3), padY: cm(0.1) };   /* the = column; space above, between, below; a lit equation's band inset */

  /* ---- Content ------------------------------------------------------------ */
  var PAIRS = [['x', 'h1'], ['h1', 'h2'], ['h2', 'y']];   /* layer pairs, in the order they are computed */
  var COPY = {
    image: '28 \\times 28',
    layers:  { x: '\\mathbf{x}', h1: '\\mathbf{h}_1', h2: '\\mathbf{h}_2', y: '\\mathbf{y}' },
    weights: ['\\mathbf{W}_1', '\\mathbf{W}_2', '\\mathbf{W}_3'],
    /* Each equation's left side up to its =, and its right side. */
    rows: [
      ['\\mathbf{h}_1^\\top = {}', 'f(\\mathbf{x}^\\top \\mathbf{W}_1)'],
      ['\\mathbf{h}_2^\\top = {}', 'f(\\mathbf{h}_1^\\top \\mathbf{W}_2)'],
      ['\\mathbf{y}^\\top = {}',   'f(\\mathbf{h}_2^\\top \\mathbf{W}_3)']
    ],
    /* The 7's pen strokes, as [column, row] points on the pixel grid. */
    strokes: [[[7, 7], [14, 6.5], [21, 6]], [[21, 6], [17, 15], [13, 23]]],
    /* Each node's activation once its layer is computed, 0 to 1; y peaks at 7, the prediction. */
    act: {
      h1: [0.85, 0.2, 0.6, 0.4],
      h2: [0.3, 0.9, 0.55],
      y:  [0.02, 0.03, 0.06, 0.04, 0.02, 0.03, 0.01, 0.92, 0.05, 0.08]
    },
    pick: 7,
    ariaLabel: 'A handwritten 7 on a 28 by 28 grid is flattened into the input x. A multilayer perceptron computes h 1 as f of x transpose W 1, h 2 as f of h 1 transpose W 2, and y as f of h 2 transpose W 3, one matrix product per step, each lit in the network and in its equation. The output y peaks at 7, the prediction.'
  };

  /* ---- Steps --------------------------------------------------------------
     One record per step: the layer pair being computed (an index into PAIRS, or null), and how
     many layers have been computed so far. The last step reads off the prediction. */
  var STEP = [
    { pair: null, done: 0 },
    { pair: 0,    done: 1 },
    { pair: 1,    done: 2 },
    { pair: 2,    done: 3 },
    { pair: null, done: 3, pick: true }
  ];

  /* ---- Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    /* Each pixel's ink: how far inside the nearest pen stroke it lies, softened at the edge. */
    var ink = [];
    for (var row = 0; row < DIGIT.px; row++) {
      for (var col = 0; col < DIGIT.px; col++) {
        var d = nearest([col + 0.5, row + 0.5]);
        var v = Math.max(0, Math.min(1, (DIGIT.pen + DIGIT.soft - d) / DIGIT.soft));
        if (v > 0.05) ink.push({ col: col, row: row, v: Math.round(v * 100) / 100 });
      }
    }
    /* The equations stacked under the names row: baseline = top + the taller part's rise. */
    var top = NAMES.y + TEXT.label * 0.3 + Math.max.apply(null, Object.keys(COPY.layers).map(function (k) { return measure(COPY.layers[k], TEXT.label).depth; })) + EQ.gap;
    var rows = COPY.rows.map(function (row) {
      var a = measure(row[0]), b = measure(row[1]);
      var rise = Math.max(a.h - a.depth, b.h - b.depth), drop = Math.max(a.depth, b.depth), y = top + rise;
      top = y + drop + EQ.gap;
      return { y: y, rise: rise, drop: drop, lhs: a.w, rhs: b.w };
    });
    return (_geo = { ink: ink, pixel: DIGIT.size / DIGIT.px, rows: rows, h: top });
  }

  /* ---- Helpers ------------------------------------------------------------ */
  function r(n) { return Math.round(n * 100) / 100; }
  function xy(p) { return r(p[0]) + ' ' + r(p[1]); }

  function ring(c, rr) {
    return 'M' + xy([c[0] - rr, c[1]]) + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] + rr, c[1]])
      + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] - rr, c[1]]);
  }

  /* Distance from point p to the nearest segment of any pen stroke, in pixels. */
  function nearest(p) {
    var best = Infinity;
    COPY.strokes.forEach(function (s) {
      for (var i = 1; i < s.length; i++) {
        var a = s[i - 1], b = s[i], dx = b[0] - a[0], dy = b[1] - a[1];
        var t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
        best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy));
      }
    });
    return best;
  }

  function arrow(fig, from, to) {
    var dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy);
    var ux = dx / len, uy = dy / len;
    var bx = to[0] - ux * HEAD.length, by = to[1] - uy * HEAD.length;
    fig.rule(from[0], from[1], bx, by, { stroke: COLOR.edge, width: LINE.node });
    fig.path('M' + xy(to) + ' L' + xy([bx - uy * HEAD.half, by + ux * HEAD.half])
      + ' L' + xy([bx + uy * HEAD.half, by - ux * HEAD.half]) + ' Z', { fill: COLOR.edge });
  }

  /* A label centred on (x, y), or with its start or end there. */
  function label(fig, tex, x, y, align, cls) {
    fig.math(tex, { x: x, y: y + TEXT.label * 0.3, size: TEXT.label, align: align || 'middle', cls: cls || '' });
  }

  function measure(tex, size) { return window.Tex.render(tex, { unitsPerEm: size || TEXT.math }); }

  /* Every edge from layer a to layer b, centre to centre; the nodes drawn after cover the ends. */
  function edges(fig, a, b, lit) {
    var paint = lit ? { stroke: COLOR.active, width: LINE.active } : { stroke: COLOR.edge, width: LINE.edge };
    b.ys.forEach(function (yb) { a.ys.forEach(function (ya) { fig.rule(a.x, ya, b.x, yb, paint); }); });
  }

  /* A layer's nodes: empty until computed, then filled in the active hue as strong as each activation. */
  function nodes(fig, L, act) {
    L.ys.forEach(function (y, i) {
      fig.path(ring([L.x, y], L.r), { fill: COLOR.node, stroke: COLOR.edge, width: LINE.node });
      if (act) fig.path(ring([L.x, y], L.r), { fill: COLOR.active, opacity: act[i] });
    });
    if (L.dots != null) label(fig, '\\vdots', L.x, L.dots);
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig, step) {
    var s = STEP[step], g = GEO();

    /* The lit layer pair's band, behind everything. */
    if (s.pair != null) {
      var a = LAYER[PAIRS[s.pair][0]], b = LAYER[PAIRS[s.pair][1]];
      fig.rect(a.x - BAND.pad, BAND.top, b.x - a.x + 2 * BAND.pad, BAND.bottom - BAND.top, { fill: COLOR.band, radius: BAND.radius });
    }

    /* The digit: a framed 28 × 28 grid, each inked pixel as dark as its ink. Then flattened into x. */
    fig.rect(DIGIT.x, DIGIT.y, DIGIT.size, DIGIT.size, { fill: COLOR.node, stroke: COLOR.edge, width: LINE.edge });
    g.ink.forEach(function (p) {
      fig.rect(DIGIT.x + p.col * g.pixel, DIGIT.y + p.row * g.pixel, g.pixel, g.pixel, { fill: COLOR.ink, opacity: p.v });
    });
    arrow(fig, [FLAT.from, DIGIT.y + DIGIT.size / 2], [FLAT.to, DIGIT.y + DIGIT.size / 2]);

    PAIRS.forEach(function (p, k) { edges(fig, LAYER[p[0]], LAYER[p[1]], s.pair === k); });
    LAYER.x.ys.forEach(function (y) { fig.path(ring([LAYER.x.x, y], LAYER.x.r), { fill: COLOR.input }); });
    label(fig, '\\vdots', LAYER.x.x, LAYER.x.dots);
    ['h1', 'h2', 'y'].forEach(function (key, k) { nodes(fig, LAYER[key], k < s.done ? COPY.act[key] : null); });

    /* The output's digit labels; the prediction ringed and named in the pick colour on the last step. */
    LAYER.y.ys.forEach(function (y, d) {
      var picked = s.pick && d === COPY.pick;
      if (picked) fig.path(ring([LAYER.y.x, y], LAYER.y.r), { fill: 'none', stroke: COLOR.pick, width: LINE.pick });
      label(fig, String(d), LAYER.y.x + LAYER.y.r + DIGITS.gap, y, 'start', picked ? 'mlp-mnist-pick' : '');
    });

    /* The row naming the image, each layer, and the weights between them, all there from the start. */
    label(fig, COPY.image, DIGIT.x + DIGIT.size / 2, NAMES.y);
    PAIRS.forEach(function (p, k) {
      label(fig, COPY.weights[k], (LAYER[p[0]].x + LAYER[p[1]].x) / 2, NAMES.y);
    });
    Object.keys(COPY.layers).forEach(function (key) { label(fig, COPY.layers[key], LAYER[key].x, NAMES.y); });

    /* One equation per computed layer pair, aligned on =; the lit one banded. */
    COPY.rows.slice(0, s.done).forEach(function (row, k) {
      var q = g.rows[k];
      if (s.pair === k) fig.rect(EQ.x - q.lhs - EQ.padX, q.y - q.rise - EQ.padY, q.lhs + q.rhs + 2 * EQ.padX, q.rise + q.drop + 2 * EQ.padY,
        { fill: COLOR.band, radius: BAND.radius });
      fig.math(row[0], { x: EQ.x, y: q.y, size: TEXT.math, align: 'end' });
      fig.math(row[1], { x: EQ.x, y: q.y, size: TEXT.math, align: 'start' });
    });
  }

  window.MlpMnistFigure = {
    width:     PAGE.w,
    get height() { return GEO().h; },   /* derived: the equations stacked */
    title:     'MLP MNIST',
    name:      'mlp-mnist',
    className: 'mlp-mnist-fig',
    ariaLabel: COPY.ariaLabel,
    steps:     STEP.length,
    draw:      draw
  };
})();
