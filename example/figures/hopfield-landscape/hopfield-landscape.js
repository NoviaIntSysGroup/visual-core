/* Hopfield Landscape — figure composition module.
   16 × 7.4 cm, played on six presses. Energy over all pixel combinations: flat with nothing
   stored, then carved into a valley per stored image, then a noisy state hopping downhill, one
   pixel fixed per update, until it settles on a stored image; last, four states roll from
   across the landscape into their valleys, each leaving an arrow behind it. The horizontal axis
   is schematic: it stands for all the states, which have no real one-dimensional order. */
(function () {
  /* 1 · Imports ------------------------------------------------------------ */
  var cm   = window.Units.cm;

  /* 2 · Canvas ------------------------------------------------------------- */
  var PAGE = {
    w:     cm(16),
    h:     cm(7.4),
    titleY: cm(0.4),
    bodyGap: cm(0.5)     /* title baseline -> body baseline */
  };

  /* 3 · Type --------------------------------------------------------------- */
  var ROW = { body: window.Config.figure.type.slideBody.size * 1.3 };

  /* 4 · Colour ------------------------------------------------------------- */
  var COLOR = {
    curve: 'var(--text)', axis: 'var(--edges)', land: 'var(--graphic-primary-tint)',
    state: 'var(--accent-strong)', pixelOn: 'var(--accent-strong)', pixelOff: 'var(--graphic-soft)', frame: 'var(--edges)'
  };

  /* 5 · Layout knobs ------------------------------------------------------- */
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
    lift:     cm(0.3),    /* an arrow's height above the curve */
    trailGap: 0.012,      /* clear space, as a fraction of the plot, between an arrow and a state's start and dot */
    trailMin: 0.02        /* the shortest arrow drawn, as a fraction of the plot */
  };
  var THUMB = {
    cell:     cm(0.17),
    bandY:    cm(1.6),    /* top of a running state's picture */
    storedY:  cm(5.45)    /* top of a stored image's picture */
  };

  /* 6 · Content ------------------------------------------------------------ */
  /* Seconds. The old text fades out over `out`, then the new in over `in`. Carving: the probe
     states fade out over `probesOut`, the curve sinks over `carve`, the stored images fade in
     over `stored`. A state fades in over `appear` and out over `vanish`. A roll waits `lead`, then makes one
     update per `hop`, its dot sliding over `slide`, and ends after `tail`. The final roll
     takes `spread`. */
  var ACT = {
    out: 0.25, in: 0.25,
    probesOut: { start: 0, dur: 0.3 }, carve: { start: 0.3, dur: 1.2 }, stored: { start: 1.2, dur: 0.5 },
    appear: { start: 0.25, dur: 0.4 }, vanish: { start: 0, dur: 0.3 },
    lead: 0.3, hop: 0.15, slide: 0.12, tail: 0.3,
    spread: { start: 0.2, dur: 1.4 }
  };
  var COPY = {
    /* The stored images, each at the bottom of its valley; X is on, a dot is off. */
    stored: [
      { u: 0.18, depth: 0.92, pattern: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'] },
      { u: 0.50, depth: 1.00, pattern: ['.XXXXX.', 'XXXXXXX', 'XX.X.XX', 'XXXXXXX', 'X.XXX.X', 'XX...XX', '.XXXXX.'] },
      { u: 0.82, depth: 0.86, pattern: ['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', '.XXXXX.', '.XX.XX.', '.XX.XX.'] }
    ],
    blank: ['.......', '.......', '.......', '.......', '.......', '.......', '.......'],
    /* Random states on the flat landscape, each a blank picture with `noise` of its pixels on. */
    probes: [{ u: 0.2, seed: 1 }, { u: 0.5, seed: 2 }, { u: 0.8, seed: 3 }], probeNoise: 0.5,
    /* The running state: stored image `image` with `noise` of its pixels flipped, starting at `u`. */
    run: { image: 1, seed: 4, u: 0.385, noise: 0.34, midNoise: 0.14 },
    /* The final roll: four states, each from `from` into the valley at `to`. */
    spread: [{ from: 0.03, to: 0.18 }, { from: 0.31, to: 0.18 }, { from: 0.64, to: 0.5 }, { from: 0.97, to: 0.82 }],
    energy: 'Energy',
    states: 'All pixel combinations (states)',
    ariaLabel: 'A curve of energy over all pixel combinations. Storing three images carves three valleys, one per image. A noisy state starting on a slope runs downhill, its picture getting cleaner, until it settles at the bottom of a valley on a stored image. States starting anywhere roll into a valley.'
  };

  /* 7 · Steps -------------------------------------------------------------- */
  /* Whether pixel `i` flips. A fixed hash, so a lower `noise` only ever un-flips pixels. */
  function flipHash(i, seed) { return ((i * i * 31 + i * 17 + seed * 53) % 97) / 97; }

  /* The running state's flipped pixels, the last to un-flip first: k wrong pixels are the first k. */
  var WRONG = [];
  for (var i = 0; i < 49; i++) if (flipHash(i, COPY.run.seed) < COPY.run.noise) WRONG.push(i);
  WRONG.sort(function (a, b) { return flipHash(a, COPY.run.seed) - flipHash(b, COPY.run.seed); });
  var MID = WRONG.filter(function (i) { return flipHash(i, COPY.run.seed) < COPY.run.midNoise; }).length;

  /* One record per press: the text it ends on, and how it plays (`play`) from the state before.
     A roll fixes the running state's pixels from `from` wrong down to `to`. */
  var BEAT = [
    { title: 'Every State Has an Energy',
      body: 'Each set of pixel values is one state, and each state has an energy. With nothing stored, all states have the same energy.' },
    { play: 'carve', dur: 1.8, title: 'Storing Images Carves Valleys',
      body: 'Storing a set of images shapes the energy landscape. Each stored image sits at the bottom of its own valley.' },
    { play: 'appear', dur: 0.8, title: 'Start From a State',
      body: 'Running the network starts from the state we give it, here a noisy image up on a slope.' },
    { play: 'roll', from: WRONG.length, to: MID, title: 'Each Update Moves Downhill',
      body: 'Each update lowers the energy or leaves it unchanged, and the picture gets cleaner.' },
    { play: 'roll', from: MID, to: 0, title: 'The State Settles in a Valley',
      body: 'At the bottom nothing changes any more. The network has recalled the stored image.' },
    { play: 'swap', dur: 0.8, title: 'Any Start Leads to a Valley',
      body: 'Wherever it starts, the network runs downhill until it settles in a valley.' },
    { play: 'spread', dur: 1.8, title: 'Any Start Leads to a Valley',
      body: 'Wherever it starts, the network runs downhill until it settles in a valley.' }
  ];
  BEAT.forEach(function (b) {
    if (b.play === 'roll') b.dur = ACT.lead + (b.from - b.to) * ACT.hop + ACT.tail;
  });

  var PLAY = window.Figure.beats(BEAT);

  /* 8 · Derived ------------------------------------------------------------ */
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

  /* 9 · Helpers → draw → export -------------------------------------------- */
  function r(v) { return Math.round(v * 1000) / 1000; }

  function plotX(u) { return PLOT.left + u * GEO().plotW; }

  /* The landscape's height at `u`: flat, carved into one Gaussian valley per stored image, or
     `carved` of the way between them. */
  function energyY(u, carved) {
    var dip = 0;
    COPY.stored.forEach(function (s) {
      var d = (u - s.u) / PLOT.width;
      dip += s.depth * Math.exp(-d * d);
    });
    var deep = PLOT.hillY + (PLOT.valleyY - PLOT.hillY) * dip;
    return GEO().flatY + (deep - GEO().flatY) * carved;
  }

  function curvePath(carved, closed) {
    var parts = [];
    for (var i = 0; i <= 160; i++) {
      var u = i / 160;
      parts.push((i ? 'L' : 'M') + r(plotX(u)) + ' ' + r(energyY(u, carved)));
    }
    return closed
      ? parts.join(' ') + ' L' + plotX(1) + ' ' + PLOT.axisY + ' L' + plotX(0) + ' ' + PLOT.axisY + ' Z'
      : parts.join(' ');
  }

  /* Where the running state sits with `wrong` pixels still wrong: its start at all of them, the
     bottom of its valley at none. Fractional while it slides between two updates. */
  function runU(wrong) {
    var bottom = COPY.stored[COPY.run.image].u;
    return bottom - (bottom - COPY.run.u) * wrong / WRONG.length;
  }

  /* A picture of `pattern` with the pixels `flipped(i)` gives turned over. */
  function picture(d, id, cx, top, pattern, flipped) {
    var g = GEO();
    var left = cx - g.thumb / 2;
    d.node(id, {
      x: left, y: top, w: g.thumb, h: g.thumb, frame: true,
      appearance: { fill: COLOR.pixelOff, stroke: COLOR.frame }
    });
    pattern.forEach(function (line, row) {
      line.split('').forEach(function (ch, col) {
        var i = row * line.length + col;
        if ((ch === 'X') === flipped(i)) return;
        d.node(id + '-' + i, {
          x: left + col * THUMB.cell, y: top + row * THUMB.cell, w: THUMB.cell, h: THUMB.cell, frame: true, radius: 0,
          appearance: { fill: COLOR.pixelOn, stroke: COLOR.pixelOn }
        });
      });
    });
  }

  /* A state: a dot resting on the curve at `u`, and if `pattern` is given, its picture above
     it joined by a line. */
  function stateMark(d, id, u, carved, pattern, flipped) {
    var g = GEO();
    var x = plotX(u), y = energyY(u, carved) - PLOT.stateR;
    d.node(id, {
      x: x - PLOT.stateR, y: y - PLOT.stateR, w: 2 * PLOT.stateR, h: 2 * PLOT.stateR,
      shape: 'circle', frame: true, appearance: { fill: COLOR.state, stroke: COLOR.state }
    });
    if (!pattern) return;
    picture(d, id + '-picture', x, THUMB.bandY, pattern, flipped);
    d.edge({ x: x, y: THUMB.bandY + g.thumb }, { x: x, y: y - PLOT.stateR }, { appearance: { color: COLOR.axis } });
  }

  /* The arrow a state leaves behind, following the curve just above it from where it started
     to where its dot is now; none until it is long enough to read. */
  function trail(d, from, at) {
    var dir = at > from ? 1 : -1, a = from + dir * PLOT.trailGap, b = at - dir * PLOT.trailGap;
    if ((b - a) * dir < PLOT.trailMin) return;
    var points = [];
    for (var i = 0; i <= 8; i++) {
      var u = a + (b - a) * i / 8;
      points.push({ x: plotX(u), y: energyY(u, 1) - PLOT.lift });
    }
    d.edge(points[0], points[8], {
      via: points.slice(1, 8), corner: 0, arrow: true, appearance: { color: COLOR.state }
    });
  }

  /* A layer of the drawing at opacity `alpha`, drawn by `build(d)` on a diagram of its own. */
  function layer(fig, id, alpha, build) {
    fig.fade(alpha, function () {
      var d = window.Diagram.create(PAGE.w, PAGE.h, { className: 'hopfield-landscape', ariaLabel: COPY.ariaLabel });
      build(d);
      fig.place(d.render(id), { x: 0, y: 0, w: PAGE.w });
    });
  }

  /* The running state `t` seconds into a roll: where its dot is, and how many pixels are still
     wrong. Each update fixes one pixel at once, then its dot slides down to the new energy. */
  function rolling(beat, t) {
    var e = t - ACT.lead, hops = beat.from - beat.to;
    if (e < 0) return { at: beat.from, wrong: beat.from };
    var n = Math.floor(e / ACT.hop);
    if (n >= hops) return { at: beat.to, wrong: beat.to };
    return { at: beat.from - n - window.Figure.ease(e, n * ACT.hop, ACT.slide), wrong: beat.from - n - 1 };
  }

  /* What the frame shows, from the press it falls in and `t` seconds into it. */
  function scene(beat, t) {
    var s = { carved: 1, stored: 1, probes: 0, run: 0, runAt: WRONG.length, wrong: WRONG.length, spread: 0, spreadAt: 0 };
    if (beat.play === 'carve') {
      s.probes = 1 - window.Figure.ease(t, ACT.probesOut.start, ACT.probesOut.dur);
      s.carved = window.Figure.ease(t, ACT.carve.start, ACT.carve.dur);
      s.stored = window.Figure.ease(t, ACT.stored.start, ACT.stored.dur);
    } else if (beat.play === 'appear') {
      s.run = window.Figure.ease(t, ACT.appear.start, ACT.appear.dur);
    } else if (beat.play === 'roll') {
      var now = rolling(beat, t);
      s.run = 1; s.runAt = now.at; s.wrong = now.wrong;
    } else if (beat.play === 'swap') {
      s.run = 1 - window.Figure.ease(t, ACT.vanish.start, ACT.vanish.dur); s.runAt = 0; s.wrong = 0;
      s.spread = window.Figure.ease(t, ACT.appear.start, ACT.appear.dur);
    } else if (beat.play === 'spread') {
      s.spread = 1; s.spreadAt = window.Figure.ease(t, ACT.spread.start, ACT.spread.dur);
    }
    return s;
  }

  function draw(fig, step) {
    var g = GEO(), id = 'hopfield-landscape-' + step;
    var now = PLAY.at(step), u = now.u, from = now.from, to = now.to;
    var s = scene(to, u);

    fig.path(curvePath(s.carved, true), { fill: COLOR.land, stroke: 'none' });
    fig.path(curvePath(s.carved, false), { fill: 'none', stroke: COLOR.curve, width: 1 });
    layer(fig, id + '-axes', 1, function (d) {
      d.edge({ x: PLOT.left, y: PLOT.axisY }, { x: PLOT.left, y: PLOT.axisTop }, { arrow: true, appearance: { color: COLOR.axis } });
      d.edge({ x: PLOT.left, y: PLOT.axisY }, { x: PLOT.right, y: PLOT.axisY }, { arrow: true, appearance: { color: COLOR.axis } });
    });
    layer(fig, id + '-stored', s.stored, function (d) {
      COPY.stored.forEach(function (image, k) {
        picture(d, 'stored-' + k, plotX(image.u), THUMB.storedY, image.pattern, function () { return false; });
      });
    });
    layer(fig, id + '-probes', s.probes, function (d) {
      COPY.probes.forEach(function (p, k) {
        stateMark(d, 'probe-' + k, p.u, s.carved, COPY.blank, function (n) { return flipHash(n, p.seed) < COPY.probeNoise; });
      });
    });
    layer(fig, id + '-run', s.run, function (d) {
      var wrong = WRONG.slice(0, s.wrong);
      trail(d, COPY.run.u, runU(s.runAt));
      stateMark(d, 'run', runU(s.runAt), 1, COPY.stored[COPY.run.image].pattern, function (n) { return wrong.indexOf(n) >= 0; });
    });
    layer(fig, id + '-spread', s.spread, function (d) {
      COPY.spread.forEach(function (p, k) {
        var at = window.Figure.mix(p.from, p.to, s.spreadAt);
        trail(d, p.from, at);
        stateMark(d, 'spread-' + k, at, 1);
      });
    });

    var same = from.title === to.title;
    var textOut = same ? 0 : 1 - window.Figure.ease(u, 0, ACT.out);
    var textIn = same ? 1 : window.Figure.ease(u, ACT.out, ACT.in);
    [[from, textOut], [to, textIn]].forEach(function (pair) {
      fig.fade(pair[1], function () {
        fig.text(pair[0].title, { x: PLOT.left, y: PAGE.titleY, align: 'start', role: 'slideBody', weight: 700 });
        fig.text(pair[0].body, { x: PLOT.left, y: g.bodyY, w: g.plotW, align: 'start', role: 'slideBody', wrap: true, lineHeight: ROW.body });
      });
    });
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
    steps:     PLAY.steps,
    autoplay:  PLAY.autoplay,
    holds:     PLAY.holds,
    draw:      draw
  };
})();
