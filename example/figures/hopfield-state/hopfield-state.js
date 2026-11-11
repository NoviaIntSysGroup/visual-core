/* Hopfield State — figure composition module.
   16 × 6.9 cm, 4 steps. A small network built up in four beats: neurons and their
   connections, each neuron as a pixel, each pixel's value, and all the values read
   row by row as the network's state. The diagram draws the grid; fig.text and
   fig.math draw the words beside it, which change per step. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  var PAGE = {
    w:        cm(16),
    h:        cm(6.9),
    gridX:    cm(0.6),   /* left edge of the grid */
    textGap:  cm(0.8),   /* grid right -> text column */
    stripGap: cm(0.9)    /* grid bottom -> vector strip */
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

  /* ---- Content ------------------------------------------------------------ */
  var COPY = {
    /* One string per row; X is on, a dot is off. */
    pattern: ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'],
    hub: { row: 1, col: 1 },   /* the neuron whose connections are drawn */
    reading: 'Read row by row',
    ariaLabel: 'A five by five grid of neurons, all connected to each other, becomes a five by five image of a heart. Each pixel has the value plus one or minus one, and reading the pixels row by row gives the state of the network.'
  };

  /* ---- Step model ---------------------------------------------------------
     One record per step: how the neurons look and the words beside them. */
  var STEP = [
    { form: 'neuron', title: 'A Network of Neurons',
      body: 'Every neuron, or unit, connects to every other through a weight. Here, one neuron shows its connections.' },
    { form: 'pixel', title: 'Each Neuron Is a Pixel',
      body: 'Arrange the neurons in a grid and each one draws a pixel that is either on or off.' },
    { form: 'value', title: 'Each Pixel Has a Value',
      body: 'An on pixel has the value +1 and an off pixel has the value −1.',
      math: 's_i \\in \\{-1, +1\\}' },
    { form: 'state', title: 'The State Is All the Values',
      body: 'The values of all the pixels, taken together, are the state of the network.',
      math: 's = (s_1, s_2, \\dots, s_{25})' }
  ];

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
      gridBottom: gridSize,
      gridCx:   PAGE.gridX + gridSize / 2,
      textX:    PAGE.gridX + gridSize + PAGE.textGap,
      textW:    PAGE.w - (PAGE.gridX + gridSize + PAGE.textGap),
      titleY:   gridSize * 0.3,
      stripX:   (PAGE.w - stripW) / 2,
      stripY:   gridSize + PAGE.stripGap
    };
    return _geo;
  }

  /* ---- Helpers ------------------------------------------------------------ */
  function isOn(row, col) { return COPY.pattern[row][col] === 'X'; }

  function greatestDivisor(a, b) { return b ? greatestDivisor(b, a % b) : a; }

  function neuronId(row, col) { return 'n-' + row + '-' + col; }

  function neuronCentre(row, col) {
    return { x: PAGE.gridX + GRID.pixel / 2 + col * GRID.pitch, y: GRID.pixel / 2 + row * GRID.pitch };
  }

  /* A neuron as a circle, with the hub filled to mark it. */
  function neuronNode(d, row, col) {
    var c = neuronCentre(row, col);
    var isHub = row === COPY.hub.row && col === COPY.hub.col;
    d.node(neuronId(row, col), {
      x: c.x - GRID.neuron / 2, y: c.y - GRID.neuron / 2, w: GRID.neuron, h: GRID.neuron,
      shape: 'circle', frame: true,
      appearance: { fill: isHub ? COLOR.on : COLOR.off, stroke: isHub ? COLOR.on : COLOR.line }
    });
  }

  /* A neuron as a pixel, with its value written in it when `showValue` is set. */
  function pixelNode(d, row, col, showValue) {
    var c = neuronCentre(row, col);
    var on = isOn(row, col);
    d.node(neuronId(row, col), {
      x: c.x - GRID.pixel / 2, y: c.y - GRID.pixel / 2, w: GRID.pixel, h: GRID.pixel,
      frame: true, radius: GRID.radius,
      label: showValue ? (on ? '+1' : '−1') : undefined,
      appearance: { fill: on ? COLOR.on : COLOR.off, stroke: on ? COLOR.on : COLOR.line, label: on ? COLOR.onText : COLOR.offText }
    });
  }

  /* The hub's connections. One that lines up with a neuron on its way bows around it. */
  function hubConnections(d) {
    var g = GEO(), hub = COPY.hub;
    for (var row = 0; row < g.rows; row++) {
      for (var col = 0; col < g.cols; col++) {
        if (row === hub.row && col === hub.col) continue;
        var blocked = greatestDivisor(Math.abs(row - hub.row), Math.abs(col - hub.col)) > 1;
        d.edge(neuronId(hub.row, hub.col), neuronId(row, col), blocked
          ? { route: 'arc', bulge: GRID.bow, appearance: { color: COLOR.line } }
          : { appearance: { color: COLOR.line } });
      }
    }
  }

  /* Every value in one line, with a little extra space between the rows of the grid. */
  function stateStrip(d) {
    var g = GEO();
    for (var row = 0; row < g.rows; row++) {
      for (var col = 0; col < g.cols; col++) {
        var on = isOn(row, col);
        d.node('s-' + row + '-' + col, {
          x: g.stripX + (row * g.cols + col) * STRIP.pitch + row * STRIP.rowGap, y: g.stripY,
          w: STRIP.cell, h: STRIP.cell, frame: true, radius: STRIP.radius,
          appearance: { fill: on ? COLOR.on : COLOR.off, stroke: on ? COLOR.on : COLOR.line }
        });
      }
    }
    d.edge({ x: g.gridCx, y: g.gridBottom + STRIP.arrowGap }, { x: g.gridCx, y: g.stripY - STRIP.arrowGap }, { arrow: true });
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig, step) {
    var g = GEO();
    var s = STEP[step];
    var d = window.Diagram.create(PAGE.w, PAGE.h, {
      className: 'hopfield-state',
      ariaLabel: COPY.ariaLabel + ' Step ' + (step + 1) + ' of ' + STEP.length + '.',
      fontSize: TEXT.label
    });

    for (var row = 0; row < g.rows; row++) {
      for (var col = 0; col < g.cols; col++) {
        if (s.form === 'neuron') neuronNode(d, row, col);
        else pixelNode(d, row, col, s.form !== 'pixel');
      }
    }
    if (s.form === 'neuron') hubConnections(d);
    if (s.form === 'state') stateStrip(d);
    fig.place(d.render('hopfield-state-' + step), { x: 0, y: 0, w: PAGE.w });

    fig.text(s.title, { x: g.textX, y: g.titleY, align: 'start', role: 'slideBody', weight: 700 });
    fig.text(s.body, {
      x: g.textX, y: g.titleY + ROW.title, w: g.textW, align: 'start', role: 'slideBody', wrap: true, lineHeight: ROW.body
    });
    if (s.math) {
      fig.math(s.math, { x: g.textX, y: g.titleY + ROW.title + 2 * ROW.body + ROW.math, align: 'start', size: TEXT.body });
    }
    if (s.form === 'state') {
      fig.text(COPY.reading, {
        x: g.gridCx + STRIP.noteGap, y: g.gridBottom + PAGE.stripGap / 2 + TEXT.body / 3, align: 'start', role: 'slideBody'
      });
    }
  }

  window.HopfieldStateFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Hopfield State',
    name:      'hopfield-state',
    className: 'hopfield-state-fig',
    ariaLabel: COPY.ariaLabel,
    steps:     STEP.length,
    draw:      draw
  };
})();
