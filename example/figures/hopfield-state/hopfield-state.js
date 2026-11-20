/* Hopfield State — figure composition module.
   16 × 6.9 cm, played on three presses. A small network built up in four beats: neurons and
   their connections; each neuron becomes a pixel, the connections fading, the circles squaring
   off and the on pixels lighting up in reading order; each pixel gets its value; and a frame
   steps down the grid row by row while a twin steps along a strip below, each row's values
   appearing in it, until the strip holds the network's state. The diagram draws the grid;
   fig.text and fig.math draw the words beside it, which cross-fade per press. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  var PAGE = {
    w:        cm(16),
    h:        cm(6.9),
    gridX:    cm(0.6),   /* left edge of the grid */
    gridY:    cm(0.1),   /* top edge of the grid: room for the reading frame round its first row */
    textGap:  cm(0.8),   /* grid right -> text column */
    stripGap: cm(0.8)    /* grid bottom -> vector strip */
  };

  /* ---- Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.slideBody.size, body: TYPE.slideBody.size };
  var ROW  = { title: TEXT.body * 1.7, body: TEXT.body * 1.3, math: TEXT.body * 2 };

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = { on: 'var(--accent-strong)', off: 'var(--graphic-soft)', line: 'var(--edges)', onText: 'var(--background-plain)', offText: 'var(--text)' };

  /* ---- Layout knobs ------------------------------------------------------- */
  var GRID = {
    pitch:  cm(1.1),    /* centre-to-centre spacing */
    pixel:  cm(1.0),
    neuron: cm(0.7),
    radius: cm(0.08),
    bow:    cm(0.22)    /* curve on a connection that would run through another neuron */
  };
  var STRIP = {
    pitch:    cm(0.56),
    cell:     cm(0.5),
    rowGap:   cm(0.18),  /* extra space between the rows of the grid */
    radius:   cm(0.05),
    arrowGap: cm(0.1),   /* clear space at each end of the arrow */
    noteGap:  cm(0.25)   /* arrow -> its note */
  };
  /* The two reading frames, round a row of the grid and round its stretch of the strip: `pad` outside the boxes. */
  var READ = { pad: cm(0.08), radius: cm(0.1), color: 'var(--text)', width: 'var(--line-width-very-strong)' };

  /* ---- Content ------------------------------------------------------------ */
  var COPY = {
    /* One string per row; X is on, a dot is off. */
    pattern: ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'],
    hub: { row: 1, col: 1 },   /* the neuron whose connections are drawn */
    reading: 'Read row by row',
    ariaLabel: 'A five by five grid of neurons, all connected to each other, becomes a five by five image of a heart. Each pixel has the value plus one or minus one, and reading the pixels row by row gives the state of the network.'
  };

  /* ---- Beats --------------------------------------------------------------
     One record per press, the words beside the grid with it; beat 0 is the network as it opens.
     Seconds into each press, every act { start, dur }; one of `stagger` steps along the reading
     order delays it pixel by pixel, or for `read`, row by row. Text: the old fades out over
     `out`, the new in over `in`. Pixel: the connections fade over `links`, then the circles
     square off over `morph` while the on pixels `light` up. Value: the labels fade in. State:
     the arrow and its note fade in; then two reading frames, round a row of the grid and round
     its stretch of the strip, step together row by row, each move taking `step`, and each
     stretch's values fade in over `read` as its frame arrives; last, the frames `leave`. */
  var ACT = {
    out: 0.25, in: 0.25,
    links: { start: 0, dur: 0.3 }, morph: { start: 0.3, dur: 0.5 }, light: { start: 0.4, dur: 0.3, stagger: 0.02 },
    value: { start: 0.1, dur: 0.25, stagger: 0.02 },
    arrow: { start: 0, dur: 0.3 }, read: { start: 0.3, dur: 0.25, stagger: 0.45 }, step: 0.2, leave: 0.3
  };
  var ROWS = COPY.pattern.length, CELLS = ROWS * COPY.pattern[0].length;
  /* When an act staggered over `count` pieces ends. */
  function last(act, count) { return act.start + (count - 1) * act.stagger + act.dur; }
  var BEAT = [
    { title: 'A Network of Neurons',
      body: 'Every neuron, or unit, connects to every other through a weight. Here, one neuron shows its connections.' },
    { dur: last(ACT.light, CELLS), title: 'Each Neuron Is a Pixel',
      body: 'Arrange the neurons in a grid and each one draws a pixel that is either on or off.' },
    { dur: last(ACT.value, CELLS), title: 'Each Pixel Has a Value',
      body: 'An on pixel has the value +1 and an off pixel has the value −1.',
      math: 's_i \\in \\{-1, +1\\}' },
    { dur: last(ACT.read, ROWS) + ACT.leave, title: 'The State Is All the Values',
      body: 'The values of all the pixels, taken together, are the state of the network.',
      math: 's = (s_1, s_2, \\dots, s_{25})' }
  ];
  var PRESS = { pixel: 1, value: 2, state: 3 };   /* which beat plays each change */
  var PLAY = window.Figure.beats(BEAT);

  /* ---- Derived geometry --------------------------------------------------- */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var rows = COPY.pattern.length;
    var cols = COPY.pattern[0].length;
    var gridSize = (cols - 1) * GRID.pitch + GRID.pixel;
    var stripW = rows * cols * STRIP.pitch + (rows - 1) * STRIP.rowGap;
    _geo = {
      rows:     rows,
      cols:     cols,
      gridBottom: PAGE.gridY + gridSize,
      gridCx:   PAGE.gridX + gridSize / 2,
      textX:    PAGE.gridX + gridSize + PAGE.textGap,
      textW:    PAGE.w - (PAGE.gridX + gridSize + PAGE.textGap),
      titleY:   gridSize * 0.3,
      stripX:   (PAGE.w - stripW) / 2,
      stripY:   PAGE.gridY + gridSize + PAGE.stripGap
    };
    return _geo;
  }

  /* ---- Helpers ------------------------------------------------------------ */
  function isOn(row, col) { return COPY.pattern[row][col] === 'X'; }

  function greatestDivisor(a, b) { return b ? greatestDivisor(b, a % b) : a; }

  function neuronId(row, col) { return 'n-' + row + '-' + col; }

  function neuronCentre(row, col) {
    return { x: PAGE.gridX + GRID.pixel / 2 + col * GRID.pitch, y: PAGE.gridY + GRID.pixel / 2 + row * GRID.pitch };
  }

  /* Seconds into press `b` at this frame: 0 until it is pressed, its whole length once it has played. */
  function into(now, b) {
    return now.i > b ? BEAT[b].dur : now.i === b ? now.u : 0;
  }

  /* How far act `act` of press `b` has got for the pixel `n`-th in reading order, 0 → 1. */
  function progress(now, b, act, n) {
    return window.Figure.ease(into(now, b), act.start + (n || 0) * (act.stagger || 0), act.dur);
  }

  /* A box centred on `c`, `size` wide, with corners rounded by `radius`; at half its size it is a circle, so edges
     meet its rim. */
  function square(d, id, c, size, radius, look) {
    d.node(id, {
      x: c.x - size / 2, y: c.y - size / 2, w: size, h: size, frame: true,
      shape: radius >= size / 2 ? 'circle' : 'rect', radius: radius, appearance: look
    });
  }

  /* The hub's connections at opacity `alpha`. One that lines up with a neuron on its way bows around it. */
  function hubConnections(d, alpha) {
    var g = GEO(), hub = COPY.hub;
    var color = 'color-mix(in srgb, ' + COLOR.line + ' ' + Math.round(alpha * 100) + '%, transparent)';
    for (var row = 0; row < g.rows; row++) {
      for (var col = 0; col < g.cols; col++) {
        if (row === hub.row && col === hub.col) continue;
        var blocked = greatestDivisor(Math.abs(row - hub.row), Math.abs(col - hub.col)) > 1;
        d.edge(neuronId(hub.row, hub.col), neuronId(row, col), blocked
          ? { route: 'arc', bulge: GRID.bow, appearance: { color: color } }
          : { appearance: { color: color } });
      }
    }
  }

  /* Where pixel (row, col) sits in the strip: every value in one line, a little extra space between the grid's rows. */
  function stripCentre(row, col) {
    var g = GEO();
    return {
      x: g.stripX + (row * g.cols + col) * STRIP.pitch + row * STRIP.rowGap + STRIP.cell / 2,
      y: g.stripY + STRIP.cell / 2
    };
  }

  /* The grid as this frame shows it: each neuron squaring off into its pixel, lit, then labelled. */
  function grid(d, now) {
    var g = GEO(), hub = COPY.hub;
    var morph = progress(now, PRESS.pixel, ACT.morph);
    var size = window.Figure.mix(GRID.neuron, GRID.pixel, morph);
    var radius = window.Figure.mix(GRID.neuron / 2, GRID.radius, morph);
    for (var row = 0; row < g.rows; row++) {
      for (var col = 0; col < g.cols; col++) {
        var n = row * g.cols + col, c = neuronCentre(row, col), on = isOn(row, col);
        var isHub = row === hub.row && col === hub.col;
        square(d, neuronId(row, col), c, size, radius, isHub
          ? { fill: COLOR.on, stroke: COLOR.on } : { fill: COLOR.off, stroke: COLOR.line });
        var lit = on && !isHub ? progress(now, PRESS.pixel, ACT.light, n) : 0;
        if (lit > 0) square(d, 'lit-' + n, c, size, radius, { fill: COLOR.on, stroke: COLOR.on, opacity: lit });
        var value = progress(now, PRESS.value, ACT.value, n);
        if (value > 0) {
          d.node('v-' + n, {
            x: c.x - size / 2, y: c.y - size / 2, w: size, h: size, label: on ? '+1' : '−1',
            appearance: { label: on ? COLOR.onText : COLOR.offText, opacity: value }
          });
        }
      }
    }
  }

  /* The strip, each row's stretch fading in as the reading frames reach that row. */
  function readOut(d, now) {
    var g = GEO();
    for (var row = 0; row < g.rows; row++) {
      var k = progress(now, PRESS.state, ACT.read, row);
      if (k <= 0) continue;
      for (var col = 0; col < g.cols; col++) {
        var on = isOn(row, col);
        square(d, 's-' + row + '-' + col, stripCentre(row, col), STRIP.cell, STRIP.radius,
          { fill: on ? COLOR.on : COLOR.off, stroke: on ? COLOR.on : COLOR.line, opacity: k });
      }
    }
  }

  /* The two reading frames, round the row being read and round its stretch of the strip. They fade in on the first
     row, step to each next row as it is read, and fade out after the last. */
  function readingFrames(fig, now) {
    var g = GEO(), act = ACT.read, u = into(now, PRESS.state), ease = window.Figure.ease;
    var at = 0;   /* the row the frames are on, fractional while they step */
    for (var row = 1; row < g.rows; row++) at += ease(u, act.start + row * act.stagger - ACT.step, ACT.step);
    var alpha = ease(u, act.start - ACT.step, ACT.step) * (1 - ease(u, last(act, g.rows), ACT.leave));
    var look = { fill: 'none', stroke: READ.color, width: READ.width, radius: READ.radius };
    fig.fade(alpha, function () {
      fig.rect(PAGE.gridX - READ.pad, PAGE.gridY + at * GRID.pitch - READ.pad,
        (g.cols - 1) * GRID.pitch + GRID.pixel + 2 * READ.pad, GRID.pixel + 2 * READ.pad, look);
      fig.rect(g.stripX + at * (g.cols * STRIP.pitch + STRIP.rowGap) - READ.pad, g.stripY - READ.pad,
        (g.cols - 1) * STRIP.pitch + STRIP.cell + 2 * READ.pad, STRIP.cell + 2 * READ.pad, look);
    });
  }

  /* A press's words: its title, its body, and its formula if it has one. */
  function words(fig, beat) {
    var g = GEO();
    fig.text(beat.title, { x: g.textX, y: g.titleY, align: 'start', role: 'slideBody', weight: 700 });
    fig.text(beat.body, {
      x: g.textX, y: g.titleY + ROW.title, w: g.textW, align: 'start', role: 'slideBody', wrap: true, lineHeight: ROW.body
    });
    if (beat.math) {
      fig.math(beat.math, { x: g.textX, y: g.titleY + ROW.title + 2 * ROW.body + ROW.math, align: 'start', size: TEXT.body });
    }
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig, step) {
    var g = GEO(), now = PLAY.at(step), id = 'hopfield-state-' + step;
    var d = window.Diagram.create(PAGE.w, PAGE.h, { className: 'hopfield-state', ariaLabel: COPY.ariaLabel, fontSize: TEXT.label });
    grid(d, now);
    var links = 1 - progress(now, PRESS.pixel, ACT.links);
    if (links > 0) hubConnections(d, links);
    readOut(d, now);
    fig.place(d.render(id), { x: 0, y: 0, w: PAGE.w });
    readingFrames(fig, now);

    var arrow = progress(now, PRESS.state, ACT.arrow);
    fig.fade(arrow, function () {
      var a = window.Diagram.create(PAGE.w, PAGE.h, { className: 'hopfield-state', ariaLabel: COPY.ariaLabel });
      a.edge({ x: g.gridCx, y: g.gridBottom + STRIP.arrowGap }, { x: g.gridCx, y: g.stripY - STRIP.arrowGap }, { arrow: true });
      fig.place(a.render(id + '-arrow'), { x: 0, y: 0, w: PAGE.w });
      fig.text(COPY.reading, {
        x: g.gridCx + STRIP.noteGap, y: g.gridBottom + PAGE.stripGap / 2 + TEXT.body / 3, align: 'start', role: 'slideBody'
      });
    });

    fig.fade(1 - window.Figure.ease(now.u, 0, ACT.out), function () { words(fig, now.from); });
    fig.fade(window.Figure.ease(now.u, ACT.out, ACT.in), function () { words(fig, now.to); });
  }

  window.HopfieldStateFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Hopfield State',
    name:      'hopfield-state',
    className: 'hopfield-state-fig',
    ariaLabel: COPY.ariaLabel,
    steps:     PLAY.steps,
    autoplay:  PLAY.autoplay,
    holds:     PLAY.holds,
    draw:      draw
  };
})();
