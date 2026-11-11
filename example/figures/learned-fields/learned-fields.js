/* Learned Fields — figure composition module.
   10.1 × 3.2 cm, 2 steps. A network trained only to classify photos, drawn as a multilayer perceptron for
   the deck's dot-product story though AlexNet is convolutional: a photo of a car is flattened
   into x, runs through h₁ and h₂, and comes out as the class "car". Then h₁ is banded and its incoming
   edges lit, as the MLP MNIST figure lights a layer; the band runs on as a funnel onto one row of
   AlexNet's real first-layer receptive fields: the oriented edges Hubel and Wiesel found in V1. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  /* A two-column slide's column fits 10.1 cm at the deck's 1.5× import (431.5 pt); 3.2 cm is the
     height of the Hubel and Wiesel app beside it. */
  var PAGE = { w: cm(10.1), h: cm(3.2) };

  /* ---- Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.slideBody.size };

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = {
    input: 'var(--graphic-tertiary)', edge: 'var(--edges)', node: 'var(--graphic-soft)', ink: 'var(--text)',
    active: 'var(--graphic-primary)', band: 'var(--graphic-primary-tint)', pick: 'var(--accent-strong)',
    window: 'var(--background)'
  };

  /* ---- Layout knobs ------------------------------------------------------- */
  var LINE  = { edge: 'var(--line-width)', active: 'var(--line-width-strong)', node: 'var(--line-width-strong)' };
  var HEAD  = { length: cm(0.2), half: cm(0.08) };
  var PHOTO = { x: cm(0.2), y: cm(0.15), size: cm(1.7), pad: cm(0.15) };  /* the framed photo; the car's inset from its sides */
  var FLAT  = { from: cm(2.05), to: cm(2.5) };                          /* the arrow that flattens the photo into x */
  /* Each layer: its column's x, node centres, where its ⋮ sits, node radius. */
  var LAYER = {
    x:  { x: cm(2.8), ys: [cm(0.25), cm(0.6), cm(0.95), cm(1.55), cm(1.9)], dots: cm(1.25), r: cm(0.08) },
    h1: { x: cm(4.6), ys: [cm(0.3), cm(0.75), cm(1.2), cm(1.85)],            dots: cm(1.55), r: cm(0.15) },
    h2: { x: cm(6.4), ys: [cm(0.4), cm(0.9), cm(1.75)],                      dots: cm(1.35), r: cm(0.15) },
    y:  { x: cm(8.1), ys: [cm(0.3), cm(0.75), cm(1.2)],                      dots: cm(1.6),  r: cm(0.13) }
  };
  var CLASSES = { gap: cm(0.2) };                                       /* output node to its class name */
  var BAND    = { pad: cm(0.3), top: cm(0.0), bottom: cm(2.2), radius: cm(0.15) };   /* the band round h₁; where the funnel leaves it */
  var STRIP   = { x: cm(0.2), w: cm(9.7) };                              /* the row of receptive fields, full width at the bottom */

  /* ---- Content ------------------------------------------------------------ */
  var COPY = {
    strip: '../../visuals/assets/images/AlexNet-conv1-row.png',
    classes: ['dog', 'car', 'ship'],
    pick: 1,
    /* A car in side view, in car units from its top-left: body, two windows, two wheels. */
    car: 'M0.1 1.2 L0.1 0.85 Q0.1 0.7 0.3 0.68 L0.8 0.62 L1.2 0.25 Q1.3 0.15 1.45 0.15 L2.1 0.15 Q2.25 0.15 2.35 0.28 '
       + 'L2.65 0.62 L2.85 0.66 Q3 0.7 3 0.85 L3 1.2 Z',
    windows: 'M1.3 0.6 L1.5 0.3 L1.85 0.3 L1.85 0.6 Z M2 0.6 L2 0.3 L2.25 0.3 L2.5 0.6 Z',
    wheels: [[0.75, 1.2], [2.35, 1.2]], wheel: 0.28,
    carBox: { w: 3.1, h: 1.48 },   /* the drawing's extent, in car units */
    ariaLabel: 'A photo of a car is flattened into the input x of a neural network trained to classify photos. It runs through hidden layers h 1 and h 2 to the outputs dog, car and ship; car is the prediction. The first hidden layer h 1 is highlighted, and its band opens onto a row of the receptive fields AlexNet\'s first-layer neurons learned: bars and edges at many orientations.'
  };

  /* ---- Steps --------------------------------------------------------------
     One record per step: whether h₁ is highlighted and its receptive fields shown. */
  var STEP = [
    { fields: false },
    { fields: true }
  ];

  /* ---- Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    /* The car, fitted to the photo's width inside its inset and centred in it. */
    var b = COPY.carBox, unit = (PHOTO.size - 2 * PHOTO.pad) / b.w;
    var car = { x: PHOTO.x + PHOTO.pad, y: PHOTO.y + (PHOTO.size - b.h * unit) / 2, unit: unit };
    var size = window.Figure.imageSize(COPY.strip);
    var strip = { x: STRIP.x, w: STRIP.w, h: STRIP.w * size.h / size.w };
    strip.y = PAGE.h - strip.h;
    return (_geo = { car: car, strip: strip });
  }

  /* ---- Helpers ------------------------------------------------------------ */
  function r(n) { return Math.round(n * 100) / 100; }
  function xy(p) { return r(p[0]) + ' ' + r(p[1]); }

  function ring(c, rr) {
    return 'M' + xy([c[0] - rr, c[1]]) + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] + rr, c[1]])
      + ' A' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + xy([c[0] - rr, c[1]]);
  }

  /* A point in car units, in figure coordinates. */
  function car(p) { var c = GEO().car; return [c.x + p[0] * c.unit, c.y + p[1] * c.unit]; }

  /* A path written in car units, in figure coordinates: every number pair is a point. */
  function carPath(d) {
    return d.replace(/(-?[\d.]+) (-?[\d.]+)/g, function (_, x, y) { return xy(car([+x, +y])); });
  }

  function arrow(fig, from, to) {
    var dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy);
    var ux = dx / len, uy = dy / len;
    var bx = to[0] - ux * HEAD.length, by = to[1] - uy * HEAD.length;
    fig.rule(from[0], from[1], bx, by, { stroke: COLOR.edge, width: LINE.node });
    fig.path('M' + xy(to) + ' L' + xy([bx - uy * HEAD.half, by + ux * HEAD.half])
      + ' L' + xy([bx + uy * HEAD.half, by - ux * HEAD.half]) + ' Z', { fill: COLOR.edge });
  }

  function dots(fig, x, y) {
    fig.math('\\vdots', { x: x, y: y + TEXT.label * 0.3, size: TEXT.label, align: 'middle' });
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig, step) {
    var g = GEO(), X = LAYER.x, H1 = LAYER.h1, s = g.strip, lit = STEP[step].fields;

    /* h₁'s band, running on as a funnel onto its receptive fields, behind everything. */
    if (lit) fig.rect(H1.x - BAND.pad, BAND.top, 2 * BAND.pad, BAND.bottom - BAND.top, { fill: COLOR.band, radius: BAND.radius });
    if (lit) fig.path('M' + xy([H1.x - BAND.pad, BAND.bottom - BAND.radius]) + ' L' + xy([H1.x + BAND.pad, BAND.bottom - BAND.radius])
      + ' L' + xy([s.x + s.w, s.y]) + ' L' + xy([s.x, s.y]) + ' Z', { fill: COLOR.band });

    /* The photo, flattened into x. */
    fig.rect(PHOTO.x, PHOTO.y, PHOTO.size, PHOTO.size, { fill: COLOR.node, stroke: COLOR.edge, width: LINE.edge });
    fig.path(carPath(COPY.car), { fill: COLOR.input, stroke: COLOR.edge, width: LINE.node });
    fig.path(carPath(COPY.windows), { fill: COLOR.window });
    COPY.wheels.forEach(function (w) {
      fig.path(ring(car(w), COPY.wheel * GEO().car.unit), { fill: COLOR.ink });
      fig.path(ring(car(w), COPY.wheel * GEO().car.unit * 0.4), { fill: COLOR.node });
    });
    arrow(fig, [FLAT.from, PHOTO.y + PHOTO.size / 2], [FLAT.to, PHOTO.y + PHOTO.size / 2]);

    /* The network, every layer fully connected to the next; the edges into h₁ lit with it. */
    [['x', 'h1'], ['h1', 'h2'], ['h2', 'y']].forEach(function (p) {
      var a = LAYER[p[0]], b = LAYER[p[1]], paint = lit && p[1] === 'h1' ? { stroke: COLOR.active, width: LINE.active } : { stroke: COLOR.edge, width: LINE.edge };
      b.ys.forEach(function (yb) { a.ys.forEach(function (ya) { fig.rule(a.x, ya, b.x, yb, paint); }); });
    });
    X.ys.forEach(function (y) { fig.path(ring([X.x, y], X.r), { fill: COLOR.input }); });
    ['h1', 'h2', 'y'].forEach(function (key) {
      LAYER[key].ys.forEach(function (y) {
        fig.path(ring([LAYER[key].x, y], LAYER[key].r), { fill: COLOR.node, stroke: COLOR.edge, width: LINE.node });
      });
    });
    Object.keys(LAYER).forEach(function (key) { dots(fig, LAYER[key].x, LAYER[key].dots); });

    /* The classes; the prediction ringed and named in the pick colour. */
    LAYER.y.ys.forEach(function (y, k) {
      var picked = k === COPY.pick;
      if (picked) fig.path(ring([LAYER.y.x, y], LAYER.y.r), { fill: 'none', stroke: COLOR.pick, width: LINE.node });
      fig.text([COPY.classes[k]], { x: LAYER.y.x + LAYER.y.r + CLASSES.gap, y: y + TEXT.label * 0.3, role: 'slideBody', align: 'start', cls: picked ? 'learned-fields-pick' : '' });
    });

    /* h₁'s receptive fields: one row of AlexNet's first layer. */
    if (lit) fig.image(COPY.strip, { x: s.x, y: s.y, w: s.w, h: s.h });
  }

  window.LearnedFieldsFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Learned Fields',
    name:      'learned-fields',
    className: 'learned-fields-fig',
    ariaLabel: COPY.ariaLabel,
    steps:     STEP.length,
    images:    [COPY.strip],
    draw:      draw
  };
})();
