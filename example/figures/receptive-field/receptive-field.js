/* Receptive Field — figure composition module.
   10.1 × 3.7 cm, 4 steps. How a neuron's template is learned from data, artificial or real: a
   handwritten 7 runs through a layer to the neuron being studied; the layers before it are
   approximated away by direct weights w, fitted so f(w · x) matches the neuron's response y; w, laid
   back out on the 28 × 28 grid, is the neuron's receptive field; last, the 7 shows under it. The
   field is an oriented edge detector (positive weights in one hue, negative in another), the shape
   first-layer filters and V1 neurons share. The digit is drawn as in the MLP MNIST figure. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  /* A two-column slide's column fits 10.1 cm at the deck's 1.5× import (431.5 pt). */
  var PAGE = { w: cm(10.1), h: cm(3.7) };

  /* ---- Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.slideBody.size };

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = {
    input: 'var(--graphic-tertiary)', edge: 'var(--edges)', node: 'var(--graphic-soft)', ink: 'var(--text)',
    active: 'var(--graphic-primary)', pick: 'var(--accent-strong)',
    plus: 'var(--graphic-primary)', minus: 'var(--graphic-secondary)'
  };
  var DIM = 'var(--opacity-dim)';

  /* ---- Layout knobs ------------------------------------------------------- */
  var LINE  = { edge: 'var(--line-width)', active: 'var(--line-width-strong)', node: 'var(--line-width-strong)' };
  var HEAD  = { length: cm(0.2), half: cm(0.08) };
  /* The digit and the field: MNIST's 28-pixel grid; each pen stroke's half-width and soft edge, in pixels. */
  var DIGIT = { px: 28, x: cm(0.2), y: cm(0.6), size: cm(2.0), pen: 1.3, soft: 1.0 };
  var FLAT  = { from: cm(2.45), to: cm(2.95) };   /* the arrow that flattens the image into x */
  var LAYER = {
    x:  { x: cm(3.25), ys: [cm(0.4), cm(0.9), cm(1.4), cm(2.3), cm(2.8)], dots: cm(1.85), r: cm(0.1) },
    h:  { x: cm(4.95), ys: [cm(0.55), cm(1.15), cm(1.75), cm(2.65)],      dots: cm(2.2),  r: cm(0.18) }
  };
  var NEURON = { x: cm(6.6), y: cm(1.6), r: cm(0.3), label: cm(0.7) };   /* label: centre to its name below */
  var FIELD  = { x: cm(7.9), y: cm(0.6), size: cm(2.0), ghost: 0.2 };   /* the receptive field, on the digit's grid; how strong the 7 shows under it */
  /* The field's Gabor: centre and spread along / across the bar, in pixels; stripe period; cut-off. */
  var GABOR  = { c: [17, 14.5], along: 5, across: 2.2, period: 6, min: 0.06 };
  var RESHAPE = { gap: cm(0.15), lift: cm(0.3) };   /* the neuron → field arrow: clearance at each end; its w label's lift */
  var NAMES  = { y: cm(3.2) };                      /* the row naming the input and the field, with the approximation between */

  /* ---- Content ------------------------------------------------------------ */
  var COPY = {
    x: '\\mathbf{x}',
    w: '\\mathbf{w}',
    neuron: 'neuron',
    field: 'receptive field',
    eq: '\\text{fit } \\mathbf{w}\\!:\\; y \\approx f(\\mathbf{w} \\cdot \\mathbf{x})',
    /* The 7's pen strokes, as [column, row] points on the pixel grid. */
    strokes: [[[7, 7], [14, 6.5], [21, 6]], [[21, 6], [17, 15], [13, 23]]],
    ariaLabel: 'A handwritten 7 is flattened into the input x and passes through a layer to one neuron. The layer is then approximated away: x connects to the neuron directly with weights w, fitted from data so that the neuron\'s response y is about f of w dot x. Laid back out on the 28 by 28 grid, w is the neuron\'s receptive field: an oriented edge detector. Last, the faded 7 shows under it: the field lies over the 7\'s down-stroke.'
  };

  /* ---- Steps --------------------------------------------------------------
     One record per step: whether the layer is approximated away by direct weights, whether w
     is laid out as the receptive field, and whether the faded 7 shows under it. */
  var STEP = [
    { direct: false, field: false, ghost: false },
    { direct: true,  field: false, ghost: false },
    { direct: true,  field: true,  ghost: false },
    { direct: true,  field: true,  ghost: true }
  ];

  /* ---- Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    /* Each pixel's ink: how far inside the nearest pen stroke it lies, softened at the edge. */
    var ink = [], field = [];
    for (var row = 0; row < DIGIT.px; row++) {
      for (var col = 0; col < DIGIT.px; col++) {
        var v = Math.max(0, Math.min(1, (DIGIT.pen + DIGIT.soft - nearest([col + 0.5, row + 0.5])) / DIGIT.soft));
        if (v > 0.05) ink.push({ col: col, row: row, v: Math.round(v * 100) / 100 });
        var g = gabor([col + 0.5, row + 0.5]);
        if (Math.abs(g) > GABOR.min) field.push({ col: col, row: row, v: Math.round(g * 100) / 100 });
      }
    }
    return (_geo = { ink: ink, field: field, pixel: DIGIT.size / DIGIT.px });
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

  /* The field's weight at pixel p: a bar along the 7's down-stroke, flanked by negative stripes. */
  function gabor(p) {
    var s = COPY.strokes[1], dx = s[2][0] - s[0][0], dy = s[2][1] - s[0][1], len = Math.hypot(dx, dy);
    var ux = dx / len, uy = dy / len, px = p[0] - GABOR.c[0], py = p[1] - GABOR.c[1];
    var a = px * ux + py * uy, b = px * uy - py * ux;
    return Math.exp(-a * a / (2 * GABOR.along * GABOR.along) - b * b / (2 * GABOR.across * GABOR.across))
      * Math.cos(2 * Math.PI * b / GABOR.period);
  }

  function arrow(fig, from, to) {
    var dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy);
    var ux = dx / len, uy = dy / len;
    var bx = to[0] - ux * HEAD.length, by = to[1] - uy * HEAD.length;
    fig.rule(from[0], from[1], bx, by, { stroke: COLOR.edge, width: LINE.node });
    fig.path('M' + xy(to) + ' L' + xy([bx - uy * HEAD.half, by + ux * HEAD.half])
      + ' L' + xy([bx + uy * HEAD.half, by - ux * HEAD.half]) + ' Z', { fill: COLOR.edge });
  }

  /* A formula centred on (x, y), or with its start or end there. */
  function label(fig, tex, x, y, align) {
    fig.math(tex, { x: x, y: y + TEXT.label * 0.3, size: TEXT.label, align: align || 'middle' });
  }

  /* A word centred on (x, y). */
  function word(fig, text, x, y) {
    fig.text([text], { x: x, y: y + TEXT.label * 0.3, role: 'slideBody' });
  }

  /* A framed 28 × 28 grid at (x, y), each listed pixel filled in its colour, as strong as |v|; the
     digit faded `ghost` underneath, when given. */
  function grid(fig, x, y, pixels, paint, ghost, size) {
    var g = GEO(), side = size || DIGIT.size, px = side / DIGIT.px;
    fig.rect(x, y, side, side, { fill: COLOR.node, stroke: COLOR.edge, width: LINE.edge });
    if (ghost) g.ink.forEach(function (p) {
      fig.rect(x + p.col * px, y + p.row * px, px, px, { fill: COLOR.ink, opacity: r(p.v * ghost) });
    });
    pixels.forEach(function (p) {
      fig.rect(x + p.col * px, y + p.row * px, px, px, { fill: paint(p.v), opacity: Math.abs(p.v) });
    });
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig, step) {
    var s = STEP[step], g = GEO(), X = LAYER.x, H = LAYER.h, n = [NEURON.x, NEURON.y];
    var fade = s.direct ? DIM : 1;

    /* The digit, flattened into x. */
    grid(fig, DIGIT.x, DIGIT.y, g.ink, function () { return COLOR.ink; });
    arrow(fig, [FLAT.from, DIGIT.y + DIGIT.size / 2], [FLAT.to, DIGIT.y + DIGIT.size / 2]);

    /* The layer between x and the neuron, dimmed once it is approximated away. */
    H.ys.forEach(function (yh) {
      X.ys.forEach(function (yx) { fig.rule(X.x, yx, H.x, yh, { stroke: COLOR.edge, width: LINE.edge, opacity: fade }); });
      fig.rule(H.x, yh, n[0], n[1], s.direct ? { stroke: COLOR.edge, width: LINE.edge, opacity: fade } : { stroke: COLOR.active, width: LINE.active });
    });
    /* The approximation: x wired straight to the neuron. */
    if (s.direct) X.ys.forEach(function (yx) { fig.rule(X.x, yx, n[0], n[1], { stroke: COLOR.active, width: LINE.active }); });
    H.ys.forEach(function (y) { fig.path(ring([H.x, y], H.r), { fill: COLOR.node, stroke: COLOR.edge, width: LINE.node, opacity: fade }); });
    fig.math('\\vdots', { x: H.x, y: H.dots + TEXT.label * 0.3, size: TEXT.label, align: 'middle', cls: s.direct ? 'receptive-field-dim' : '' });
    X.ys.forEach(function (y) { fig.path(ring([X.x, y], X.r), { fill: COLOR.input }); });
    label(fig, '\\vdots', X.x, X.dots);

    /* The neuron being studied, ringed in the pick colour. */
    fig.path(ring(n, NEURON.r), { fill: COLOR.node, stroke: COLOR.pick, width: LINE.node });

    /* w laid back out on the grid: the receptive field, then over the faded 7 it answers part of. */
    if (s.field) {
      var from = [n[0] + NEURON.r + RESHAPE.gap, n[1]], to = [FIELD.x - RESHAPE.gap, n[1]];
      arrow(fig, from, to);
      label(fig, COPY.w, (from[0] + to[0]) / 2, n[1] - RESHAPE.lift);
      grid(fig, FIELD.x, FIELD.y, g.field, function (v) { return v > 0 ? COLOR.plus : COLOR.minus; }, s.ghost && FIELD.ghost);
      fig.text([COPY.field], { x: FIELD.x + DIGIT.size, y: NAMES.y + TEXT.label * 0.3, role: 'slideBody', align: 'end' });
    }

    label(fig, COPY.x, DIGIT.x + DIGIT.size / 2, NAMES.y);
    word(fig, COPY.neuron, NEURON.x, NEURON.y + NEURON.label);
    if (s.direct) label(fig, COPY.eq, (LAYER.x.x + NEURON.x) / 2, NAMES.y);
  }

  /* The summary slide's thumbnail, sized like its two siblings: the receptive field over the faded 7. */
  var THUMB = { w: cm(3.1), h: cm(3.1), side: cm(2.9) };
  function drawThumb(fig) {
    grid(fig, (THUMB.w - THUMB.side) / 2, (THUMB.h - THUMB.side) / 2, GEO().field,
      function (v) { return v > 0 ? COLOR.plus : COLOR.minus; }, FIELD.ghost, THUMB.side);
  }

  window.SummaryFieldsFigure = {
    width:     THUMB.w,
    height:    THUMB.h,
    title:     'Summary, Receptive Fields',
    name:      'summary-fields',
    className: 'receptive-field-fig',
    ariaLabel: 'A neuron\'s receptive field w laid out on the grid of a handwritten 7: an oriented edge detector lying over the faded 7\'s down-stroke.',
    draw:      drawThumb
  };

  window.ReceptiveFieldFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Receptive Field',
    name:      'receptive-field',
    className: 'receptive-field-fig',
    ariaLabel: COPY.ariaLabel,
    steps:     STEP.length,
    draw:      draw
  };
})();
