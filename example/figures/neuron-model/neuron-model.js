/* Neuron Model — figure composition module.
   10.1 × 2.9 cm. The artificial neuron that stands in for a real one: inputs x weighted by w and
   summed, the dot product w · x, then a nonlinearity f gives the output y. Inputs take x's hue and
   weights w's, as in the deck's dot-product apps. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  /* A two-column slide's column fits 10.1 cm at the deck's 1.5× import (431.5 pt). */
  var PAGE = { w: cm(10.1), h: cm(2.9) };

  /* ---- Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.slideBody.size };

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = { input: 'var(--graphic-tertiary)', edge: 'var(--edges)', curve: 'var(--graphic-primary)', box: 'var(--graphic-soft)' };

  /* ---- Layout knobs ------------------------------------------------------- */
  var LINE  = { edge: 'var(--line-width-strong)', curve: 'var(--line-width-strong)' };
  var HEAD  = { length: cm(0.2), half: cm(0.08) };
  var INPUT = { x: cm(1.05), r: cm(0.13), label: cm(0.3), ys: [cm(0.45), cm(1.15), cm(2.45)], dots: cm(1.85) };
  var SUM   = { x: cm(4.1), y: cm(1.45), r: cm(0.45) };
  var F     = { x: cm(5.3), w: cm(1.2), h: cm(1.0), pad: cm(0.15), gain: 9 };   /* the box; the sigmoid's steepness */
  var OUT   = { arrow: cm(0.7), gap: cm(0.15) };
  var WEIGHT = { at: 0.42, lift: cm(0.28) };   /* a weight's label: how far along its edge, how far above it */

  /* ---- Content ------------------------------------------------------------ */
  var COPY = {
    inputs:  ['x_1', 'x_2', 'x_n'],
    weights: ['w_1', 'w_2', 'w_n'],
    sum: '\\Sigma',
    dot: '\\mathbf{w} \\cdot \\mathbf{x}',
    f: 'f',
    out: 'y = f(\\mathbf{w} \\cdot \\mathbf{x})',
    ariaLabel: 'An artificial neuron: inputs x 1 to x n, each multiplied by its weight w 1 to w n, are summed into the dot product w dot x, which a nonlinearity f turns into the output y.'
  };

  /* ---- Helpers ------------------------------------------------------------ */
  function r(n) { return Math.round(n * 100) / 100; }
  function xy(p) { return r(p[0]) + ' ' + r(p[1]); }

  function ring(c, rr) {
    return 'M' + xy([c[0] - rr, c[1]]) + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] + rr, c[1]])
      + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] - rr, c[1]]);
  }

  /* An arrow from `from` to `to`: a shaft stopping where the filled head starts. */
  function arrow(fig, from, to) {
    var dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy);
    var ux = dx / len, uy = dy / len;
    var bx = to[0] - ux * HEAD.length, by = to[1] - uy * HEAD.length;
    fig.rule(from[0], from[1], bx, by, { stroke: COLOR.edge, width: LINE.edge });
    fig.path('M' + xy(to) + ' L' + xy([bx - uy * HEAD.half, by + ux * HEAD.half])
      + ' L' + xy([bx + uy * HEAD.half, by - ux * HEAD.half]) + ' Z', { fill: COLOR.edge });
  }

  /* A formula centred on (x, y), or starting or ending there. */
  function label(fig, tex, x, y, align, cls) {
    fig.math(tex, { x: x, y: y + TEXT.label * 0.3, size: TEXT.label, align: align || 'middle', cls: cls || '' });
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig) {
    var sum = [SUM.x, SUM.y];
    /* Each input: its node and label, and its weighted edge into the sum, stopping at the circle. */
    INPUT.ys.forEach(function (y, i) {
      var from = [INPUT.x + INPUT.r, y], dx = SUM.x - from[0], dy = SUM.y - y, len = Math.hypot(dx, dy);
      arrow(fig, from, [SUM.x - dx / len * SUM.r, SUM.y - dy / len * SUM.r]);
      fig.path(ring([INPUT.x, y], INPUT.r), { fill: COLOR.input });
      label(fig, COPY.inputs[i], INPUT.x - INPUT.label, y, 'end', 'neuron-model-x');
      var at = [from[0] + dx * WEIGHT.at, y + dy * WEIGHT.at - WEIGHT.lift];
      label(fig, COPY.weights[i], at[0], at[1], 'middle', 'neuron-model-w');
    });
    label(fig, '\\vdots', INPUT.x, INPUT.dots);

    fig.path(ring(sum, SUM.r), { fill: COLOR.box, stroke: COLOR.edge, width: LINE.edge });
    label(fig, COPY.sum, SUM.x, SUM.y);
    label(fig, COPY.dot, SUM.x, SUM.y + SUM.r + TEXT.label);

    /* The nonlinearity: a box holding a sigmoid, f above it. */
    var top = SUM.y - F.h / 2;
    arrow(fig, [SUM.x + SUM.r, SUM.y], [F.x, SUM.y]);
    fig.rect(F.x, top, F.w, F.h, { fill: COLOR.box, stroke: COLOR.edge, width: LINE.edge, radius: cm(0.08) });
    var d = '', inner = { w: F.w - 2 * F.pad, h: F.h - 2 * F.pad };
    for (var k = 0; k <= 24; k++) {
      var u = k / 24, s = 1 / (1 + Math.exp(-F.gain * (u - 0.5)));
      d += (k ? ' L' : 'M') + xy([F.x + F.pad + u * inner.w, top + F.pad + (1 - s) * inner.h]);
    }
    fig.path(d, { fill: 'none', stroke: COLOR.curve, width: LINE.curve });
    label(fig, COPY.f, F.x + F.w / 2, top - TEXT.label * 0.7);

    var end = F.x + F.w + OUT.arrow;
    arrow(fig, [F.x + F.w, SUM.y], [end, SUM.y]);
    label(fig, COPY.out, end + OUT.gap, SUM.y, 'start');
  }

  window.NeuronModelFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Neuron Model',
    name:      'neuron-model',
    className: 'neuron-model-fig',
    ariaLabel: COPY.ariaLabel,
    draw:      draw
  };
})();
