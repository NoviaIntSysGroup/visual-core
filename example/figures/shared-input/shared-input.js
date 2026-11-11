/* Shared Input — figure composition module.
   10.1 × ~7.5 cm, 7 steps. Many neurons look at the same input x. Each of the first steps lights the
   edges into one neuron, the rest staying in the default edge colour, and writes that neuron's
   f(xᵀw) at its output on the right; the outputs stay once written. Then three equations, aligned
   on =, are written under the network: W, xᵀW, and XᵀW, one gap above, between, and below them,
   the = column under the input dots. A short note on the right of the last says what XᵀW is. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  /* A two-column slide's column fits 10.1 cm at the deck's 1.5× import (431.5 pt); its figure budget is 7.7 cm tall (330 pt). */
  var PAGE = { w: cm(10.1) };   /* the height falls out of the equations: see GEO */

  /* ---- Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.slideBody.size, math: TYPE.slideBody.size };
  var ROW  = { note: TYPE.slideBody.size * 1.3 };   /* note lines */

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = {
    input: 'var(--graphic-tertiary)', edge: 'var(--edges)', node: 'var(--graphic-soft)', active: 'var(--graphic-primary)'
  };

  /* ---- Layout knobs ------------------------------------------------------- */
  /* Theme line widths: thin for unlit edges, strong for the lit ones, rings, and arrows. */
  var LINE   = { edge: 'var(--line-width)', active: 'var(--line-width-strong)', node: 'var(--line-width-strong)' };
  var HEAD   = { length: cm(0.2), half: cm(0.08) };
  var INPUT  = { x: cm(2.6), r: cm(0.13), label: cm(0.3), ys: [cm(0.7), cm(1.5), cm(2.8)], dots: cm(2.1) };
  var NEURON = { x: cm(5.9), r: cm(0.32), ys: [cm(0.6), cm(1.5), cm(2.9)], dots: cm(2.2) };
  var OUT    = { arrow: cm(0.75), gap: cm(0.15) };   /* output arrow length; its label's gap */
  var EQ     = { gap: cm(0.3), note: cm(0.3) };   /* space above, between, below; matrix to its note */

  /* ---- Content ------------------------------------------------------------ */
  var COPY = {
    inputs:  ['x_1', 'x_2', 'x_n'],
    neurons: ['1', '2', 'm'],
    out:     ['f(\\mathbf{x}^\\top \\mathbf{w}_1)', 'f(\\mathbf{x}^\\top \\mathbf{w}_2)', 'f(\\mathbf{x}^\\top \\mathbf{w}_m)'],
    note: ['k inputs', 'at once:', 'matrix–matrix', 'product'],
    /* Each equation's left side up to its =, and its right side. */
    rows: [
      ['\\mathbf{W} = {}', '\\begin{bmatrix} \\mathbf{w}_1 & \\mathbf{w}_2 & \\cdots & \\mathbf{w}_m \\end{bmatrix} \\in \\mathbb{R}^{n \\times m}'],
      ['\\mathbf{x}^\\top \\mathbf{W} = {}', '\\begin{bmatrix} \\mathbf{x}^\\top \\mathbf{w}_1 & \\mathbf{x}^\\top \\mathbf{w}_2 & \\cdots & \\mathbf{x}^\\top \\mathbf{w}_m \\end{bmatrix}'],
      ['\\mathbf{X}^\\top \\mathbf{W} = {}', '\\begin{bmatrix} \\mathbf{x}_1^\\top \\mathbf{w}_1 & \\cdots & \\mathbf{x}_1^\\top \\mathbf{w}_m \\\\ \\vdots & \\ddots & \\vdots \\\\ \\mathbf{x}_k^\\top \\mathbf{w}_1 & \\cdots & \\mathbf{x}_k^\\top \\mathbf{w}_m \\end{bmatrix}']
    ],
    ariaLabel: 'Inputs x 1 to x n all feed neurons 1, 2 to m. One neuron at a time has its incoming edges lit and its output f of x transpose w j written beside it. Then W is the matrix with w 1 to w m as columns, x transpose W holds every neuron’s dot product with x, and with k inputs as the rows of X transpose, X transpose W is the matrix of every input’s dot product with every template.'
  };

  /* ---- Steps --------------------------------------------------------------
     One record per step: the neuron whose edges are lit (null: none), how many outputs are written,
     and how many equations are written. */
  var STEP = [
    { lit: null, outputs: 0, rows: 0 },
    { lit: 0,    outputs: 1, rows: 0 },
    { lit: 1,    outputs: 2, rows: 0 },
    { lit: 2,    outputs: 3, rows: 0 },
    { lit: null, outputs: 3, rows: 1 },
    { lit: null, outputs: 3, rows: 2 },
    { lit: null, outputs: 3, rows: 3 }
  ];

  /* ---- Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var bottom = NEURON.ys[NEURON.ys.length - 1] + NEURON.r;   /* the network's lowest edge */
    /* Each equation's parts measured, then stacked: baseline = top + the taller part's rise. */
    var rows = COPY.rows.map(function (row) {
      var a = measure(row[0]), b = measure(row[1]);
      return { lhs: a.w, rhs: b.w, rise: Math.max(a.h - a.depth, b.h - b.depth), drop: Math.max(a.depth, b.depth) };
    });
    var top = bottom + EQ.gap;
    rows.forEach(function (row) {
      row.y = top + row.rise;
      top = row.y + row.drop + EQ.gap;
    });
    /* The split sits after the = and its trailing space; half of " = {}" is how far the = centre lies before it. */
    var eqX = INPUT.x + (measure('a = {}').w - measure('a').w) / 2;
    return (_geo = { rows: rows, eqX: eqX, h: top });
  }

  /* ---- Helpers ------------------------------------------------------------ */
  function measure(tex, size) { return window.Tex.render(tex, { unitsPerEm: size || TEXT.math }); }

  function r(n) { return Math.round(n * 100) / 100; }
  function xy(p) { return r(p[0]) + ' ' + r(p[1]); }

  function ring(c, rr) {
    return 'M' + xy([c[0] - rr, c[1]]) + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] + rr, c[1]])
      + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] - rr, c[1]]);
  }

  /* An arrow from `from` to `to` in `color`: a shaft stopping where the filled head starts. */
  function arrow(fig, from, to, color, width) {
    var dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy);
    var ux = dx / len, uy = dy / len;
    var bx = to[0] - ux * HEAD.length, by = to[1] - uy * HEAD.length;
    fig.rule(from[0], from[1], bx, by, { stroke: color, width: width });
    fig.path('M' + xy(to) + ' L' + xy([bx - uy * HEAD.half, by + ux * HEAD.half])
      + ' L' + xy([bx + uy * HEAD.half, by - ux * HEAD.half]) + ' Z', { fill: color });
  }

  /* A label centred on (x, y), or with its start or end there. */
  function label(fig, tex, x, y, align, cls) {
    fig.math(tex, { x: x, y: y + TEXT.label * 0.3, size: TEXT.label, align: align || 'middle', cls: cls || '' });
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig, step) {
    var s = STEP[step], g = GEO();

    /* Every input feeds every neuron, stopping at its circle; the lit neuron's edges are drawn last, on top. */
    [false, true].forEach(function (lit) {
      NEURON.ys.forEach(function (ny, j) {
        if ((s.lit === j) !== lit) return;
        INPUT.ys.forEach(function (y) {
          var from = [INPUT.x + INPUT.r, y], dx = NEURON.x - from[0], dy = ny - y, len = Math.hypot(dx, dy);
          arrow(fig, from, [NEURON.x - dx / len * NEURON.r, ny - dy / len * NEURON.r],
            lit ? COLOR.active : COLOR.edge, lit ? LINE.active : LINE.edge);
        });
      });
    });
    INPUT.ys.forEach(function (y, i) {
      fig.path(ring([INPUT.x, y], INPUT.r), { fill: COLOR.input });
      label(fig, COPY.inputs[i], INPUT.x - INPUT.label, y, 'end', 'shared-input-x');
    });
    label(fig, '\\vdots', INPUT.x, INPUT.dots);

    /* Each neuron, numbered, with its output arrow and, once its step has come, its written output. */
    NEURON.ys.forEach(function (y, j) {
      var end = NEURON.x + NEURON.r + OUT.arrow;
      fig.path(ring([NEURON.x, y], NEURON.r), { fill: COLOR.node, stroke: COLOR.edge, width: LINE.node });
      label(fig, COPY.neurons[j], NEURON.x, y);
      arrow(fig, [NEURON.x + NEURON.r, y], [end, y], COLOR.edge, LINE.node);
      if (j < s.outputs) label(fig, COPY.out[j], end + OUT.gap, y, 'start');
    });
    label(fig, '\\vdots', NEURON.x, NEURON.dots);

    /* The equations written so far, each split at its = and aligned on it. */
    COPY.rows.slice(0, s.rows).forEach(function (row, k) {
      fig.math(row[0], { x: g.eqX, y: g.rows[k].y, size: TEXT.math, align: 'end' });
      fig.math(row[1], { x: g.eqX, y: g.rows[k].y, size: TEXT.math, align: 'start' });
    });

    /* The note, with the last equation, on its right and centred on the matrix's middle row. */
    if (s.rows === COPY.rows.length) {
      var last = g.rows[s.rows - 1];
      fig.text(COPY.note, { x: g.eqX + last.rhs + EQ.note, y: last.y - ROW.note * (COPY.note.length - 1) / 2 + TEXT.math * 0.35,
        align: 'start', role: 'slideBody', lineHeight: ROW.note });
    }
  }

  window.SharedInputFigure = {
    width:     PAGE.w,
    get height() { return GEO().h; },   /* derived: the equations stacked */
    title:     'Shared Input',
    name:      'shared-input',
    className: 'shared-input-fig',
    ariaLabel: COPY.ariaLabel,
    steps:     STEP.length,
    draw:      draw
  };
})();
