/* Hopfield Landscape — figure composition module.
   16 × 7.4 cm, 6 steps. Energy over all pixel combinations: flat with nothing stored,
   then carved into a valley per stored image, then a noisy state running downhill until
   it settles on a stored image. The horizontal axis is schematic: it stands for all the
   states, which have no real one-dimensional order. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;

  /* ---- Canvas + placement spacings --------------------------------------- */
  var PAGE = {
    w:     cm(16),
    h:     cm(7.4),
    titleY: cm(0.4),
    bodyGap: cm(0.5)     /* title baseline -> body baseline */
  };

  /* ---- Type --------------------------------------------------------------- */
  var ROW = { body: window.Config.figure.type.slideBody.size * 1.3 };

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = {
    curve: 'var(--text)', axis: 'var(--edges)', land: 'var(--graphic-primary-tint)',
    state: 'var(--accent-strong)', pixelOn: 'var(--accent-strong)', pixelOff: 'var(--graphic-soft)', frame: 'var(--edges)'
  };

  /* ---- Layout knobs ------------------------------------------------------- */
  var PLOT = {
    left:     cm(0.2),
    right:    cm(15.8),
    hillY:    cm(3.1),    /* the top of the landscape */
    valleyY:  cm(5.3),    /* the bottom of the deepest valley */
    axisY:    cm(6.85),
    axisTop:  cm(2.45),   /* the tip of the energy axis */
    energyLabelY: cm(2.7),
    labelGap: cm(0.42),   /* axis -> its label's baseline */
    width:    0.09,       /* valley width, as a fraction of the plot */
    stateR:   cm(0.13),
    lift:     cm(0.3)     /* an arrow's height above the curve */
  };
  var THUMB = {
    cell:     cm(0.17),
    bandY:    cm(1.6),    /* top of a running state's picture */
    storedY:  cm(5.45)    /* top of a stored image's picture */
  };

  /* ---- Content ------------------------------------------------------------ */
  var COPY = {
    /* The stored images, each at the bottom of its valley; X is on, a dot is off. */
    stored: [
      { u: 0.18, depth: 0.92, pattern: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'] },
      { u: 0.50, depth: 1.00, pattern: ['.XXXXX.', 'XXXXXXX', 'XX.X.XX', 'XXXXXXX', 'X.XXX.X', 'XX...XX', '.XXXXX.'] },
      { u: 0.82, depth: 0.86, pattern: ['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', '.XXXXX.', '.XX.XX.', '.XX.XX.'] }
    ],
    blank: ['.......', '.......', '.......', '.......', '.......', '.......', '.......'],
    energy: 'Energy',
    states: 'All pixel combinations (states)',
    ariaLabel: 'A curve of energy over all pixel combinations. Storing three images carves three valleys, one per image. A noisy state starting on a slope runs downhill, its picture getting cleaner, until it settles at the bottom of a valley on a stored image.'
  };

  /* ---- Step model ---------------------------------------------------------
     One record per step. A state sits at `u` along the plot; `image` and `noise` give its
     picture, flipped from a stored image, and `seed` picks which pixels flip. */
  var STEP = [
    { title: 'Every State Has an Energy', stored: false,
      body: 'Each set of pixel values is one state, and each state has an energy. With nothing stored, all states have the same energy.',
      states: [{ u: 0.2, noise: 0.5, seed: 1 }, { u: 0.5, noise: 0.5, seed: 2 }, { u: 0.8, noise: 0.5, seed: 3 }] },
    { title: 'Storing Images Carves Valleys', stored: true,
      body: 'Storing a set of images shapes the energy landscape. Each stored image sits at the bottom of its own valley.',
      states: [] },
    { title: 'Start From a State', stored: true,
      body: 'Running the network starts from the state we give it, here a noisy image up on a slope.',
      states: [{ u: 0.385, image: 1, noise: 0.34, seed: 4, picture: true }], arrows: [{ from: 0.395, to: 0.445 }] },
    { title: 'Each Update Moves Downhill', stored: true,
      body: 'Each update lowers the energy or leaves it unchanged, and the picture gets cleaner.',
      states: [{ u: 0.445, image: 1, noise: 0.14, seed: 4, picture: true }], arrows: [{ from: 0.455, to: 0.49 }] },
    { title: 'The State Settles in a Valley', stored: true,
      body: 'At the bottom nothing changes any more. The network has recalled the stored image.',
      states: [{ u: 0.5, image: 1, noise: 0, seed: 4, picture: true }] },
    { title: 'Any Start Leads to a Valley', stored: true,
      body: 'Wherever it starts, the network runs downhill until it settles in a valley.',
      states: [{ u: 0.03 }, { u: 0.31 }, { u: 0.64 }, { u: 0.97 }],
      arrows: [{ from: 0.045, to: 0.14 }, { from: 0.295, to: 0.22 }, { from: 0.625, to: 0.54 }, { from: 0.955, to: 0.86 }] }
  ];

  /* ---- Derived geometry --------------------------------------------------- */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    _geo = {
      plotW:  PLOT.right - PLOT.left,
      flatY:  (PLOT.hillY + PLOT.valleyY) / 2,
      thumb:  COPY.blank.length * THUMB.cell,
      bodyY:  PAGE.titleY + PAGE.bodyGap
    };
    return _geo;
  }

  /* ---- Helpers ------------------------------------------------------------ */
  function plotX(u) { return PLOT.left + u * GEO().plotW; }

  /* The landscape's height at `u`: flat, or one Gaussian valley per stored image. */
  function energyY(u, carved) {
    if (!carved) return GEO().flatY;
    var dip = 0;
    COPY.stored.forEach(function (s) {
      var r = (u - s.u) / PLOT.width;
      dip += s.depth * Math.exp(-r * r);
    });
    return PLOT.hillY + (PLOT.valleyY - PLOT.hillY) * dip;
  }

  function curvePath(carved, closed) {
    var parts = [];
    for (var i = 0; i <= 160; i++) {
      var u = i / 160;
      parts.push((i ? 'L' : 'M') + plotX(u).toFixed(2) + ' ' + energyY(u, carved).toFixed(2));
    }
    return closed
      ? parts.join(' ') + ' L' + plotX(1) + ' ' + PLOT.axisY + ' L' + plotX(0) + ' ' + PLOT.axisY + ' Z'
      : parts.join(' ');
  }

  /* Whether pixel `i` flips. A fixed hash, so a lower `noise` only ever un-flips pixels. */
  function flips(i, seed, noise) {
    return ((i * i * 31 + i * 17 + seed * 53) % 97) / 97 < noise;
  }

  function picture(d, id, cx, top, pattern, seed, noise) {
    var g = GEO();
    var left = cx - g.thumb / 2;
    d.node(id, {
      x: left, y: top, w: g.thumb, h: g.thumb, frame: true,
      appearance: { fill: COLOR.pixelOff, stroke: COLOR.frame }
    });
    pattern.forEach(function (line, row) {
      line.split('').forEach(function (ch, col) {
        var i = row * line.length + col;
        var on = (ch === 'X') !== flips(i, seed, noise);
        if (!on) return;
        d.node(id + '-' + i, {
          x: left + col * THUMB.cell, y: top + row * THUMB.cell, w: THUMB.cell, h: THUMB.cell, frame: true, radius: 0,
          appearance: { fill: COLOR.pixelOn, stroke: COLOR.pixelOn }
        });
      });
    });
  }

  /* A state: a dot resting on the curve, with a picture above it joined by a line if it has one. */
  function stateMark(d, s, i, carved) {
    var g = GEO();
    var x = plotX(s.u), y = energyY(s.u, carved) - PLOT.stateR;
    d.node('state-' + i, {
      x: x - PLOT.stateR, y: y - PLOT.stateR, w: 2 * PLOT.stateR, h: 2 * PLOT.stateR,
      shape: 'circle', frame: true, appearance: { fill: COLOR.state, stroke: COLOR.state }
    });
    if (s.noise == null) return;
    var pattern = s.image == null ? COPY.blank : COPY.stored[s.image].pattern;
    picture(d, 'state-picture-' + i, x, THUMB.bandY, pattern, s.seed, s.noise);
    d.edge({ x: x, y: THUMB.bandY + g.thumb }, { x: x, y: y - PLOT.stateR }, { appearance: { color: COLOR.axis } });
  }

  /* An arrow following the curve, just above it. */
  function downhill(d, a, carved) {
    var points = [];
    for (var i = 0; i <= 8; i++) {
      var u = a.from + (a.to - a.from) * i / 8;
      points.push({ x: plotX(u), y: energyY(u, carved) - PLOT.lift });
    }
    d.edge(points[0], points[8], {
      via: points.slice(1, 8), corner: 0, arrow: true, appearance: { color: COLOR.state }
    });
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig, step) {
    var g = GEO();
    var s = STEP[step];
    var d = window.Diagram.create(PAGE.w, PAGE.h, {
      className: 'hopfield-landscape',
      ariaLabel: COPY.ariaLabel + ' Step ' + (step + 1) + ' of ' + STEP.length + '.'
    });

    d.edge({ x: PLOT.left, y: PLOT.axisY }, { x: PLOT.left, y: PLOT.axisTop }, { arrow: true, appearance: { color: COLOR.axis } });
    d.edge({ x: PLOT.left, y: PLOT.axisY }, { x: PLOT.right, y: PLOT.axisY }, { arrow: true, appearance: { color: COLOR.axis } });
    if (s.stored) {
      COPY.stored.forEach(function (image, i) {
        picture(d, 'stored-' + i, plotX(image.u), THUMB.storedY, image.pattern, 0, 0);
      });
    }
    s.states.forEach(function (state, i) { stateMark(d, state, i, s.stored); });
    (s.arrows || []).forEach(function (a) { downhill(d, a, s.stored); });

    fig.path(curvePath(s.stored, true), { fill: COLOR.land, stroke: 'none' });
    fig.path(curvePath(s.stored, false), { fill: 'none', stroke: COLOR.curve, width: 1 });
    fig.place(d.render('hopfield-landscape-' + step), { x: 0, y: 0, w: PAGE.w });

    fig.text(s.title, { x: PLOT.left, y: PAGE.titleY, align: 'start', role: 'title' });
    fig.text(s.body, { x: PLOT.left, y: g.bodyY, w: g.plotW, align: 'start', role: 'slideBody', wrap: true, lineHeight: ROW.body });
    fig.text(COPY.energy, { x: PLOT.left + PLOT.stateR, y: PLOT.energyLabelY, align: 'start', role: 'slideBody' });
    fig.text(COPY.states, { x: (PLOT.left + PLOT.right) / 2, y: PLOT.axisY + PLOT.labelGap, role: 'slideBody' });
  }

  window.HopfieldLandscapeFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Hopfield Landscape',
    name:      'hopfield-landscape',
    className: 'hopfield-landscape-fig',
    ariaLabel: COPY.ariaLabel,
    steps:     STEP.length,
    draw:      draw
  };
})();
