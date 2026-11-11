/* Unit Circle Dot — figure composition module.
   10.1 × 4.4 cm, 5 steps. Two unit vectors as points on the unit circle, their coordinates
   read off the axes as cos and sin of their angles; their dot product as cos(α − β) = cos θ,
   then at full length, divided by both lengths. Equation rows right of the circle grow one per step. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  /* A two-column slide's column fits 10.1 cm at the deck's 1.5× import (431.5 pt). */
  var PAGE = { w: cm(10.1), h: cm(4.4) };

  /* ---- Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.slideBody.size, math: TYPE.slideBody.size };
  var ROW  = { math: cm(0.95) };  /* baseline to baseline between equation rows */

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = { a: 'var(--graphic-tertiary)', b: 'var(--graphic-primary)', axis: 'var(--edges)', guide: 'var(--text)' };
  var FADE = 0.35;   /* opacity of a faded guide; unit-circle-dot.css fades labels the same */

  /* ---- Layout knobs ------------------------------------------------------- */
  var LINE   = { vector: 'var(--line-width-strong)', axis: 'var(--line-width)', guide: 'var(--line-width)', dash: [2.5, 2] };
  var HEAD   = { length: cm(0.28), half: cm(0.11) };
  var LABEL  = { gap: cm(0.22), dot: cm(0.06) };   /* clearance; radius of the unit point in the last step */
  /* Radius, origin, and how far the axes reach behind and ahead of it, in radii. */
  var CIRCLE = { r: cm(1.5), ox: cm(2.15), oy: cm(2.45), axisIn: 1.2, axisOut: 1.4 };
  var ANGLE  = { a: 70, b: 20 };      /* degrees: α for â, β for b̂ */
  var LONG   = { a: 1.35, b: 1.15 };  /* lengths of a and b in the last step, in radii */
  var ARC    = { radius: 0.4, label: cm(0.4) };   /* every angle's arc, in radii; label: past the arc */
  var ROWS   = { x: cm(5.0), y: cm(1.5) };        /* the first equation row's start and baseline */

  /* ---- Content ------------------------------------------------------------ */
  var COPY = {
    unit:  { a: '\\hat{\\mathbf{a}}', b: '\\hat{\\mathbf{b}}' },
    full:  { a: '\\mathbf{a}', b: '\\mathbf{b}' },
    cos:   { a: '\\cos\\alpha', b: '\\cos\\beta' },
    sin:   { a: '\\sin\\alpha', b: '\\sin\\beta' },
    angle: { a: '\\alpha', b: '\\beta', theta: '\\theta' },
    rows: {
      sum: '\\hat{\\mathbf{a}} \\cdot \\hat{\\mathbf{b}} = \\cos\\alpha \\cos\\beta + \\sin\\alpha \\sin\\beta',
      cos: '\\phantom{\\hat{\\mathbf{a}} \\cdot \\hat{\\mathbf{b}}} = \\cos(\\alpha - \\beta) = \\cos\\theta',
      lengths: '\\phantom{\\hat{\\mathbf{a}} \\cdot \\hat{\\mathbf{b}}} = \\dfrac{\\mathbf{a} \\cdot \\mathbf{b}}{\\lVert \\mathbf{a} \\rVert \\, \\lVert \\mathbf{b} \\rVert} = \\cos\\theta'
    },
    ariaLabel: 'Two unit vectors on the unit circle, at angles alpha and beta from the horizontal axis, have the coordinates cosine and sine of their angles. Their dot product is cos alpha cos beta plus sin alpha sin beta, which is the cosine of alpha minus beta, the angle theta between them. For vectors of any length, the dot product divided by both lengths is that same cosine.'
  };

  /* ---- Steps --------------------------------------------------------------
     One record per step: the unit vectors on the circle, the one angle marked (α and β only on
     the step that introduces them), whether the coordinates are faded, the equation rows, and
     a and b at full length. */
  var STEP = [
    { vectors: ['a'],      arc: 'a',     rows: [] },
    { vectors: ['a', 'b'], arc: 'b',     rows: [] },
    { vectors: ['a', 'b'], arc: null,    rows: ['sum'] },
    { vectors: ['a', 'b'], arc: 'theta', rows: ['sum', 'cos'], faded: true },
    { vectors: ['a', 'b'], arc: 'theta', rows: ['sum', 'cos', 'lengths'], faded: true, long: true }
  ];

  /* ---- Helpers ------------------------------------------------------------ */
  function r(n) { return Math.round(n * 100) / 100; }
  function xy(p) { return r(p[0]) + ' ' + r(p[1]); }

  /* A point `radii` out from the origin at `deg`, counterclockwise from the x-axis. */
  function polar(radii, deg) {
    var a = deg * Math.PI / 180;
    return [CIRCLE.ox + radii * CIRCLE.r * Math.cos(a), CIRCLE.oy - radii * CIRCLE.r * Math.sin(a)];
  }

  /* A full circle of radius `rr` around `c`, as two half arcs. */
  function ring(c, rr) {
    return 'M' + xy([c[0] - rr, c[1]]) + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] + rr, c[1]])
      + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] - rr, c[1]]);
  }

  /* An arrow from `from` to `to`: a shaft stopping where the filled head starts. */
  function arrow(fig, from, to, color) {
    var dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy);
    var ux = dx / len, uy = dy / len;
    var bx = to[0] - ux * HEAD.length, by = to[1] - uy * HEAD.length;
    fig.rule(from[0], from[1], bx, by, { stroke: color, width: LINE.vector });
    fig.path('M' + xy(to) + ' L' + xy([bx - uy * HEAD.half, by + ux * HEAD.half])
      + ' L' + xy([bx + uy * HEAD.half, by - ux * HEAD.half]) + ' Z', { fill: color });
  }

  function guide(fig, a, b, faded) {
    fig.rule(a[0], a[1], b[0], b[1], { stroke: COLOR.guide, width: LINE.guide, dash: LINE.dash, opacity: faded ? FADE : null });
  }

  /* A label centred on (x, y), or with its end there for align 'end'. */
  function label(fig, tex, x, y, align, faded) {
    fig.math(tex, { x: x, y: y + TEXT.label * 0.3, size: TEXT.label, align: align || 'middle',
      cls: faded ? 'unit-circle-dot-faded' : '' });
  }

  /* An angle's arc around the origin, counterclockwise from `from` to `to` degrees, labelled past its middle. */
  function angleArc(fig, from, to, tex) {
    var rr = ARC.radius * CIRCLE.r;
    fig.path('M' + xy(polar(ARC.radius, from)) + ' A' + r(rr) + ' ' + r(rr) + ' 0 0 0 ' + xy(polar(ARC.radius, to)),
      { fill: 'none', stroke: COLOR.guide, width: LINE.guide });
    var l = polar(ARC.radius + ARC.label / CIRCLE.r, (from + to) / 2);
    label(fig, tex, l[0], l[1]);
  }

  /* A vector's label just past its tip, along its own direction. */
  function tipLabel(fig, tex, radii, deg) {
    var l = polar(radii + (LABEL.gap + TEXT.label * 0.5) / CIRCLE.r, deg);
    label(fig, tex, l[0], l[1]);
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig, step) {
    var s = STEP[step], o = [CIRCLE.ox, CIRCLE.oy], R = CIRCLE.r;
    var axis = { stroke: COLOR.axis, width: LINE.axis };
    fig.rule(o[0] - CIRCLE.axisIn * R, o[1], o[0] + CIRCLE.axisOut * R, o[1], axis);
    fig.rule(o[0], o[1] + CIRCLE.axisIn * R, o[0], o[1] - CIRCLE.axisOut * R, axis);
    fig.path(ring(o, R), { fill: 'none', stroke: COLOR.axis, width: LINE.axis });

    /* Each unit vector's coordinates: drops to both axes, labelled. Then the one angle marked. */
    s.vectors.forEach(function (v) {
      var tip = polar(1, ANGLE[v]);
      guide(fig, tip, [tip[0], o[1]], s.faded);
      guide(fig, tip, [o[0], tip[1]], s.faded);
      label(fig, COPY.cos[v], tip[0], o[1] + LABEL.gap + TEXT.label * 0.5, 'middle', s.faded);
      label(fig, COPY.sin[v], o[0] - LABEL.gap, tip[1], 'end', s.faded);
    });
    if (s.arc === 'theta') angleArc(fig, ANGLE.b, ANGLE.a, COPY.angle.theta);
    else if (s.arc) angleArc(fig, 0, ANGLE[s.arc], COPY.angle[s.arc]);

    /* The vectors last, over their guides: unit ones, or at full length with a dot where they cross the circle. */
    s.vectors.forEach(function (v) {
      if (s.long) {
        arrow(fig, o, polar(LONG[v], ANGLE[v]), COLOR[v]);
        fig.path(ring(polar(1, ANGLE[v]), LABEL.dot), { fill: 'var(--background)', stroke: COLOR[v], width: LINE.guide });
        tipLabel(fig, COPY.full[v], LONG[v], ANGLE[v]);
      } else {
        arrow(fig, o, polar(1, ANGLE[v]), COLOR[v]);
        tipLabel(fig, COPY.unit[v], 1, ANGLE[v]);
      }
    });

    s.rows.forEach(function (key, i) {
      fig.math(COPY.rows[key], { x: ROWS.x, y: ROWS.y + i * ROW.math, size: TEXT.math, align: 'start' });
    });
  }

  window.UnitCircleDotFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Unit Circle Dot',
    name:      'unit-circle-dot',
    className: 'unit-circle-dot-fig',
    ariaLabel: COPY.ariaLabel,
    steps:     STEP.length,
    draw:      draw
  };
})();
