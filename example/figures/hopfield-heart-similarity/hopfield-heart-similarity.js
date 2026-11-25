/* Hopfield Heart Similarity — figure composition module.
   6.5 × 5.25 cm, 3 steps. The stored heart ξ against three states s, one row per step: the heart
   itself, the heart with every other pixel flipped, and the heart inverted, each with its dot
   product ξ · s (pixels matching minus pixels differing) and what it means. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  /* A three-column slide's column fits 6.5 cm at the deck's 1.5× import (279.5 pt). */
  var PAGE = { w: cm(6.5), h: cm(5.25), gridX: cm(0.15), textGap: cm(0.35) };

  /* ---- Type --------------------------------------------------------------- */
  var TEXT = { body: TYPE.slideBody.size };
  var ROW  = { line: TEXT.body * 1.5 };   /* baseline to baseline of a row's two lines */

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = { on: 'var(--accent-strong)', off: 'var(--graphic-soft)', line: 'var(--edges)' };

  /* ---- Layout knobs ------------------------------------------------------- */
  var LINE = { pixel: 'var(--line-width)' };
  var GRID = { pitch: cm(0.32), pixel: cm(0.26), radius: cm(0.04), rowGap: cm(0.3) };   /* rowGap: between two states' grids */

  /* ---- Content ------------------------------------------------------------ */
  /* One string per row; X is on, a dot is off. The heart is the other heart figures'. */
  var COPY = {
    stored: ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'],
    ariaLabel: 'Three states compared with a stored heart of five by five pixels. The heart itself has dot product 25 with the stored heart, the largest possible. The heart with every other pixel flipped has dot product 1, close to zero. The inverted heart has dot product minus 25, the smallest possible.'
  };
  /* One record per state shown, top to bottom: which pixels of the heart it flips, and its words. */
  var STATES = [
    { flip: function () { return false; },               words: 'the same image' },
    { flip: function (r, c) { return (r + c) % 2 === 1; }, words: 'half the pixels differ' },
    { flip: function () { return true; },                words: 'the image inverted' }
  ];

  /* ---- Steps --------------------------------------------------------------
     One record per step: how many of the states are shown, from the top. */
  var STEP = [{ shown: 1 }, { shown: 2 }, { shown: 3 }];

  /* ---- Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var size = 4 * GRID.pitch + GRID.pixel;
    return (_geo = { size: size, textX: PAGE.gridX + size + PAGE.textGap });
  }

  /* ---- Helpers ------------------------------------------------------------ */
  /* The state's pixels as +1 (on) and −1 (off), and its dot product with the stored heart. */
  function pixels(state) {
    return COPY.stored.map(function (row, r) {
      return row.split('').map(function (ch, c) { return (ch === 'X' ? 1 : -1) * (state.flip(r, c) ? -1 : 1); });
    });
  }
  function dot(values) {
    var sum = 0;
    values.forEach(function (row, r) { row.forEach(function (v, c) { sum += v * (COPY.stored[r].charAt(c) === 'X' ? 1 : -1); }); });
    return sum;
  }

  function grid(fig, values, top) {
    values.forEach(function (row, r) {
      row.forEach(function (v, c) {
        var on = v > 0;
        fig.rect(PAGE.gridX + c * GRID.pitch, top + r * GRID.pitch, GRID.pixel, GRID.pixel,
          { fill: on ? COLOR.on : COLOR.off, stroke: on ? COLOR.on : COLOR.line, width: LINE.pixel, radius: GRID.radius });
      });
    });
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig, step) {
    var g = GEO();
    STATES.slice(0, STEP[step].shown).forEach(function (state, i) {
      var top = i * (g.size + GRID.rowGap), values = pixels(state), sum = dot(values);
      var first = top + g.size / 2 - ROW.line / 2 + TEXT.body * 0.35;
      grid(fig, values, top);
      fig.math('\\xi \\cdot s = ' + (sum < 0 ? '-' : '') + Math.abs(sum), { x: g.textX, y: first, size: TEXT.body, align: 'start' });
      fig.text(state.words, { x: g.textX, y: first + ROW.line, align: 'start', role: 'slideBody' });
    });
  }

  window.HopfieldHeartSimilarityFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Hopfield Heart Similarity',
    name:      'hopfield-heart-similarity',
    className: 'hopfield-heart-similarity-fig',
    ariaLabel: COPY.ariaLabel,
    steps:     STEP.length,
    draw:      draw
  };
})();
