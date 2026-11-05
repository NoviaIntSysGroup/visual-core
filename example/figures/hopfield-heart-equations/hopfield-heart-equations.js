/* Hopfield Heart Equations — figure composition modules.
   Three stepped 6.6 × 3.3 cm figures, one per equation: one heart, the links of one neuron
   (green where it shares a value with the stored heart, yellow where it differs) and a key
   beside it. Each steps from an empty first state through one colour of link at a time, the
   other faded, counting as it goes; the key stays, its rows of the other colour faded. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  var PAGE = {
    w: cm(6.6),
    h: cm(3.3)
  };

  /* ---- Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.label.size };

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = {
    on: 'var(--accent-strong)', onText: 'var(--background-plain)', off: 'var(--graphic-soft)', line: 'var(--edges)', hub: 'var(--text)',
    same: 'var(--graphic-secondary)', differ: 'var(--graphic-tertiary)'
  };
  var FADE = 35;   /* percent of its colour a faded link keeps; the key's faded text in the figure's CSS keeps the same */

  /* ---- Layout knobs ------------------------------------------------------- */
  var GRID   = { x: cm(0.175), pitch: cm(0.55), pixel: cm(0.45), top: cm(0.15), radius: cm(0.04), hubStroke: 2 };
  var LINK   = { width: cm(0.05), bow: cm(0.2) };   /* bow: curve on a link that would run through a pixel */
  /* The count under the grid, written piece by piece because SVG collapses a run of spaces: pieces `gap` apart, then the conclusion. */
  var CAPTION = { y: cm(3.15), gap: cm(1.1), conclusion: cm(2.3), numberGap: cm(0.1), verdictWord: cm(2.4) };   /* verdictWord: room for `neuron turns` before its box */
  /* The key, to the right of the grid: rows `y` (the weight key's two, the others' four, green first), boxes `cell`, then per figure what follows the first box. */
  var KEY = {
    x: cm(3.5), weightY: [cm(1.15), cm(1.85)], y: [cm(0.75), cm(1.25), cm(1.75), cm(2.25)], cell: cm(0.3), link: cm(0.1), swatch: cm(0.5),
    linkGap: cm(0.25), pairGap: cm(0.2), gap: cm(0.15), word: cm(0.95), edge: cm(0.4), equals: cm(0.4)
  };

  /* ---- Content ------------------------------------------------------------ */
  /* One string per row; X is on, a dot is off. The heart is the state figure's. */
  var COPY = {
    stored: ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'],
    hub: { row: 1, col: 1 },
    wrong: [[0, 0], [2, 3], [3, 0], [4, 2]],   /* pixels flipped in the clashing state */
    weight: { title: 'Hopfield Heart Weight', name: 'hopfield-heart-weight', caption: 'one stored image',
      legend: { same: 'w = 1', differ: 'w = −1' },
      ariaLabel: 'A heart of five by five pixels with one neuron marked. Its links to the other pixels are shown one colour at a time: green to the pixels that have its value in the stored heart, then yellow to those that have the other value.' },
    energy: { title: 'Hopfield Heart Energy', name: 'hopfield-heart-energy', conclusions: { stored: 'low energy', damaged: 'high energy' },
      /* A pair is right when its pixels agree with its link: one colour on green, two on yellow. Green rows first;
         a row shows both ways to be equal, or both ways to differ. */
      key: [
        { kind: 'same',   pairs: ['11', '00'], text: '✓ +1' }, { kind: 'same',   pairs: ['10', '01'], text: '× −1' },
        { kind: 'differ', pairs: ['10', '01'], text: '✓ +1' }, { kind: 'differ', pairs: ['11', '00'], text: '× −1' }
      ],
      ariaLabel: 'The heart and then the same heart with some pixels flipped, with the links of one neuron shown one colour at a time. Each pixel is marked with a tick where it agrees with its link and a cross where it does not; the heart is all ticks, the damaged one mostly crosses.' },
    update: { title: 'Hopfield Heart Update', name: 'hopfield-heart-update', word: 'vote', verdict: 'neuron turns',
      /* A neighbour and its link give a vote, the neuron (?) being a blue or white box. Green rows first. */
      key: [
        { kind: 'same',   pixel: '1', vote: '1' }, { kind: 'same',   pixel: '0', vote: '0' },
        { kind: 'differ', pixel: '1', vote: '0' }, { kind: 'differ', pixel: '0', vote: '1' }
      ],
      ariaLabel: 'The marked neuron is off in a damaged heart. The votes of its green links and then of its yellow links are shown, most of them for on, and then the neuron is on.' }
  };

  /* ---- Steps --------------------------------------------------------------
     One record per step, the first empty (`blank`): the state shown, and the links drawn: a colour ('same' is green, 'differ'
     yellow), as 'full' or 'faded' in `looks`. */
  COPY.weight.steps = [
    { blank: true }, { looks: {} }, { looks: { same: 'full' } },
    { looks: { same: 'faded', differ: 'full' } }, { looks: { same: 'faded', differ: 'faded' } }
  ];
  COPY.energy.steps = ['stored', 'damaged'].reduce(function (steps, state) {
    return steps.concat(state === 'damaged' ? [{ state: state, looks: {} }] : [], [
      { state: state, looks: { same: 'full' } },
      { state: state, looks: { same: 'faded', differ: 'full' } },
      { state: state, looks: { same: 'faded', differ: 'faded' }, conclude: true }
    ]);
  }, [{ blank: true }, { state: 'stored', looks: {} }]);   /* then the pixels and the key alone, to explain the key first */
  COPY.update.steps = [
    { blank: true },
    { state: 'damaged', looks: {} },   /* the pixels and the key alone, to explain the voting first */
    { state: 'damaged', looks: { same: 'full' } },
    { state: 'damaged', looks: { same: 'faded', differ: 'full' } },
    { state: 'fixed',   looks: { same: 'faded', differ: 'faded' }, conclude: true }
  ];

  /* ---- Derived geometry --------------------------------------------------- */
  var _geo;
  function GEO() {
    return _geo || (_geo = { size: 4 * GRID.pitch + GRID.pixel });
  }

  /* ---- Helpers ------------------------------------------------------------ */
  function isOn(rows, r, c) { return rows[r].charAt(c) === 'X'; }

  /* The stored heart with the given pixels flipped, as rows. */
  function flipped(rows, pixels) {
    return rows.map(function (row, r) {
      return row.split('').map(function (ch, c) {
        var hit = pixels.some(function (p) { return p[0] === r && p[1] === c; });
        return hit ? (ch === 'X' ? '.' : 'X') : ch;
      }).join('');
    });
  }

  /* The heart of a state: stored, damaged (with the neuron wrong too), or fixed (the neuron right again). */
  function stateRows(state) {
    var hub = [COPY.hub.row, COPY.hub.col];
    if (state === 'stored') return COPY.stored;
    return flipped(COPY.stored, state === 'damaged' ? COPY.wrong.concat([hub]) : COPY.wrong);
  }

  function greatestDivisor(a, b) { return b ? greatestDivisor(b, a % b) : a; }

  /* Whether a pixel agrees with its link: its value matches the neuron's where the link is green, differs where it is yellow. */
  function agrees(rows, r, c) {
    return (isOn(rows, r, c) === isOn(rows, COPY.hub.row, COPY.hub.col)) === (linkKind(r, c) === 'same');
  }

  /* How many pixels agree and how many do not, among those whose link colour is in `looks`. */
  function tally(rows, looks) {
    var right = 0, wrong = 0;
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        if ((r === COPY.hub.row && c === COPY.hub.col) || !looks[linkKind(r, c)]) continue;
        if (agrees(rows, r, c)) right++; else wrong++;
      }
    }
    return { right: right, wrong: wrong };
  }

  /* How many neighbours vote on and how many off through the links in `looks`: a green link passes its pixel's value on, a yellow one flips it. */
  function votes(rows, looks) {
    var on = 0, off = 0;
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        if ((r === COPY.hub.row && c === COPY.hub.col) || !looks[linkKind(r, c)]) continue;
        if (isOn(rows, r, c) === (linkKind(r, c) === 'same')) on++; else off++;
      }
    }
    return { on: on, off: off };
  }

  /* A link colour at full strength, or faded into transparency. */
  function linkColor(kind, look) {
    return look === 'faded' ? 'color-mix(in srgb, ' + COLOR[kind] + ' ' + FADE + '%, transparent)' : COLOR[kind];
  }

  /* A pixel's link colour: green when the stored heart gives it and the neuron one value, yellow when two. */
  function linkKind(r, c) {
    return isOn(COPY.stored, r, c) === isOn(COPY.stored, COPY.hub.row, COPY.hub.col) ? 'same' : 'differ';
  }

  /* The middle of a pixel, so a link runs from centre to centre over the pixels. */
  function centre(r, c) {
    return { x: GRID.x + c * GRID.pitch + GRID.pixel / 2, y: GRID.top + r * GRID.pitch + GRID.pixel / 2 };
  }

  function newDiagram(m) {
    return window.Diagram.create(PAGE.w, PAGE.h, { className: 'hopfield-heart-equations', ariaLabel: m.ariaLabel, fontSize: TEXT.label });
  }

  function box(d, id, x, y, on, label, faded) {
    d.node(id, {
      x: x, y: y - KEY.cell / 2, w: KEY.cell, h: KEY.cell, frame: true, radius: GRID.radius, label: label,
      appearance: { fill: on ? COLOR.on : COLOR.off, stroke: label ? COLOR.hub : (on ? COLOR.on : COLOR.line), label: on ? COLOR.onText : COLOR.hub, opacity: faded ? FADE / 100 : 1 }
    });
  }

  function keyEdge(d, kind, x, y, length, faded) {
    d.edge({ x: x, y: y }, { x: x + length, y: y }, { gap: 0, appearance: { color: linkColor(kind, faded ? 'faded' : 'full'), width: KEY.link } });
  }

  /* Whether a key row is faded: while a colour of link is shown in full, the rows of the other colour are. */
  function rowFaded(kind, looks) {
    var shown = looks.same === 'full' || looks.differ === 'full';
    return shown && looks[kind] !== 'full';
  }

  function keyText(fig, text, x, y, faded) {
    fig.text(text, { x: x, y: y, align: 'start', role: 'label', cls: faded ? 'hopfield-heart-faded' : '' });
  }

  /* One state: the neuron's links as `looks` gives them, then the pixels, each marked when `marked` and its link is drawn. */
  function heart(d, rows, looks, marked) {
    var hub = COPY.hub;
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        if ((r === hub.row && c === hub.col) || !looks[linkKind(r, c)]) continue;
        var look = { gap: 0, appearance: { color: linkColor(linkKind(r, c), looks[linkKind(r, c)]), width: LINK.width } };
        if (greatestDivisor(Math.abs(r - hub.row), Math.abs(c - hub.col)) > 1) { look.route = 'arc'; look.bulge = LINK.bow; }
        d.edge(centre(hub.row, hub.col), centre(r, c), look);
      }
    }
    for (r = 0; r < 5; r++) {
      for (c = 0; c < 5; c++) {
        var on = isOn(rows, r, c), isHub = r === hub.row && c === hub.col;
        var shown = marked && !isHub && looks[linkKind(r, c)];
        var right = agrees(rows, r, c);
        d.node('p-' + r + '-' + c, {
          x: GRID.x + c * GRID.pitch, y: GRID.top + r * GRID.pitch, w: GRID.pixel, h: GRID.pixel, frame: true, radius: GRID.radius,
          label: shown ? (right ? '✓' : '×') : undefined,
          appearance: { label: on ? COLOR.onText : COLOR.hub, fill: on ? COLOR.on : COLOR.off, stroke: isHub ? COLOR.hub : (on ? COLOR.on : COLOR.line), strokeWidth: isHub ? GRID.hubStroke : undefined }
        });
      }
    }
  }

  function caption(fig, text) {
    fig.text(text, { x: GRID.x + GEO().size / 2, y: CAPTION.y, role: 'label' });
  }

  /* ---- Draw --------------------------------------------------------------- */
  function drawWeight(fig, step) {
    var m = COPY.weight, looks = m.steps[step].looks;
    if (!looks) return;
    var d = newDiagram(m);
    var kinds = ['same', 'differ'].filter(function (kind) { return looks[kind]; });
    heart(d, COPY.stored, looks, false);
    kinds.forEach(function (kind, i) { keyEdge(d, kind, KEY.x, KEY.weightY[i], KEY.swatch); });
    fig.place(d.render(m.name + '-' + step), { x: 0, y: 0, w: PAGE.w });
    caption(fig, m.caption);
    kinds.forEach(function (kind, i) {
      fig.text(m.legend[kind], { x: KEY.x + KEY.swatch + KEY.gap, y: KEY.weightY[i] + TEXT.label / 3, align: 'start', role: 'label' });
    });
  }

  function drawEnergy(fig, step) {
    var m = COPY.energy, s = m.steps[step];
    if (s.blank) return;
    var d = newDiagram(m);
    var rows = stateRows(s.state), counts = tally(rows, s.looks);
    heart(d, rows, s.looks, true);
    var pairW = 2 * KEY.cell + KEY.linkGap;
    m.key.forEach(function (row, i) {
      row.pairs.forEach(function (pixels, k) {
        var x = KEY.x + k * (pairW + KEY.pairGap);
        var faded = rowFaded(row.kind, s.looks);
        box(d, 'k' + i + k + 'a', x, KEY.y[i], pixels.charAt(0) === '1', undefined, faded);
        box(d, 'k' + i + k + 'b', x + KEY.cell + KEY.linkGap, KEY.y[i], pixels.charAt(1) === '1', undefined, faded);
        keyEdge(d, row.kind, x + KEY.cell, KEY.y[i], KEY.linkGap, faded);
      });
    });
    fig.place(d.render(m.name + '-' + step), { x: 0, y: 0, w: PAGE.w });
    if (counts.right + counts.wrong) {
      ['✓ ' + counts.right, '× ' + counts.wrong].forEach(function (text, i) {
        fig.text(text, { x: GRID.x + i * CAPTION.gap, y: CAPTION.y, align: 'start', role: 'label' });
      });
    }
    if (s.conclude) fig.text(m.conclusions[s.state], { x: GRID.x + CAPTION.conclusion, y: CAPTION.y, align: 'start', role: 'label' });
    m.key.forEach(function (row, i) {
      keyText(fig, row.text, KEY.x + 2 * pairW + KEY.pairGap + KEY.gap, KEY.y[i] + TEXT.label / 3, rowFaded(row.kind, s.looks));
    });
  }

  /* The key reads: a neighbour box and its edge, `vote`, the neuron ?, `=`, and the vote's box. */
  function drawUpdate(fig, step) {
    var m = COPY.update, s = m.steps[step];
    if (s.blank) return;
    var d = newDiagram(m);
    var counts = votes(stateRows('damaged'), s.looks), countY = CAPTION.y - TEXT.label / 3;
    heart(d, stateRows(s.state), s.looks, false);
    var counted = counts.on + counts.off > 0;
    if (counted) [true, false].forEach(function (on, i) { box(d, 'c' + i, GRID.x + i * CAPTION.gap, countY, on); });
    var verdictX = GRID.x + CAPTION.conclusion;
    if (s.conclude) {
      box(d, 'vr', verdictX + CAPTION.verdictWord, countY, true);
    }
    var wordX = KEY.x + KEY.cell + KEY.edge + KEY.gap, queryX = wordX + KEY.word + KEY.gap;
    m.key.forEach(function (row, i) {
      var faded = rowFaded(row.kind, s.looks);
      box(d, 'n' + i, KEY.x, KEY.y[i], row.pixel === '1', undefined, faded);
      keyEdge(d, row.kind, KEY.x + KEY.cell, KEY.y[i], KEY.edge, faded);
      box(d, 'q' + i, queryX, KEY.y[i], false, '?', faded);
      box(d, 'r' + i, queryX + KEY.cell + KEY.equals, KEY.y[i], row.vote === '1', undefined, faded);
    });
    fig.place(d.render(m.name + '-' + step), { x: 0, y: 0, w: PAGE.w });
    if (counted) [counts.on, counts.off].forEach(function (count, i) {
      fig.text(String(count), { x: GRID.x + i * CAPTION.gap + KEY.cell + CAPTION.numberGap, y: CAPTION.y, align: 'start', role: 'label' });
    });
    if (s.conclude) fig.text(m.verdict, { x: verdictX, y: CAPTION.y, align: 'start', role: 'label' });
    m.key.forEach(function (row, i) {
      var y = KEY.y[i] + TEXT.label / 3;
      var faded = rowFaded(row.kind, s.looks);
      keyText(fig, m.word, wordX, y, faded);
      fig.text('=', { x: queryX + KEY.cell + KEY.equals / 2, y: y, role: 'label', cls: faded ? 'hopfield-heart-faded' : '' });
    });
  }

  function figureModule(m, draw) {
    return {
      width: PAGE.w, height: PAGE.h, title: m.title, name: m.name, className: m.name + '-fig',
      ariaLabel: m.ariaLabel, steps: m.steps.length, draw: draw
    };
  }

  window.HopfieldHeartWeightFigure = figureModule(COPY.weight, drawWeight);
  window.HopfieldHeartEnergyFigure = figureModule(COPY.energy, drawEnergy);
  window.HopfieldHeartUpdateFigure = figureModule(COPY.update, drawUpdate);
})();
