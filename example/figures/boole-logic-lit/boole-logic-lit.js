/* Boole: Truth as a Lamp — figure composition module.
   4.0 × 2.35 cm, three steps, laid out like Broca and Wernicke. Boole: Logic as Algebra with
   its statements lit when true, like the lamps of the 1940s computer on the next card. Two
   statements, "rain" and "cold", joined by "and". Step 1: each becomes a letter and "and"
   becomes times: x · y, and its line of text. Step 2: "rain", true, lights up and "cold",
   false, stays dark; they become 1 and 0, the product gives the answer, 1 · 0 = 0, and its
   line. Each row sits under the one it translates. */
(function () {
  /* 1 · Imports ------------------------------------------------------------ */
  var cm = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* 2 · Canvas ------------------------------------------------------------- */
  /* The size of Broca and Wernicke, so the timeline's figures match. */
  var PAGE = { w: cm(4.0), h: cm(2.35) };

  /* 3 · Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.slideDetail.size };
  var ROW = { line: TEXT.label * 1.25 };   /* between the two lines of text */

  /* 4 · Colour ------------------------------------------------------------- */
  /* Secondary marks the statements, and in the text the logic and truth they carry; a true
     statement is filled with it, lit. */
  var COLOR = { body: 'var(--graphic-soft)', statement: 'var(--graphic-secondary)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  var LINE = { outline: 'var(--line-width-strong)' };
  /* The two statement columns, `apart` either side of the centre; a statement's chip; and the
     baselines of the three rows: words, letters, numbers. */
  var COLUMN = { apart: 28 };
  var CHIP = { w: 23.5, h: 13, radius: 3.6, y: 6 };
  var BASELINE = { words: 15.6, letters: 30.5, numbers: 43 };
  var RESULT = { gap: 9 };   /* from the second column to the "= 0" */
  var CAPTION = { y: 54 };

  /* 6 · Content ------------------------------------------------------------ */
  var COPY = {
    words: ['rain', 'and', 'cold'], truth: [true, null, false], letters: ['x', '·', 'y'], numbers: ['1', '·', '0'], result: '= 0',
    algebra: [{ t: 'Logic', cls: 'fig-accent-secondary' }, { t: ' → algebra' }],
    values:  [{ t: 'True, false', cls: 'fig-accent-secondary' }, { t: ' → 1, 0' }],
    ariaLabel: 'Two statements, rain and cold, joined by and. Each becomes a letter, and "and" '
      + 'becomes multiplication: x times y. True and false become 1 and 0: raining but not cold '
      + 'gives 1 times 0, which is 0, false. The true statement, rain, lights up; cold stays '
      + 'dark.'
  };

  /* 7 · Steps -------------------------------------------------------------- */
  /* Which rows are written: the words, then the letters, then the numbers. */
  var STEP = [
    { letters: false, numbers: false },
    { letters: true,  numbers: false },
    { letters: true,  numbers: true }
  ];

  /* 8 · Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var mid = PAGE.w / 2;
    _geo = { x: [mid - COLUMN.apart, mid, mid + COLUMN.apart], result: mid + COLUMN.apart + RESULT.gap };
    return _geo;
  }

  /* 9 · Helpers → draw → export ------------------------------------------- */
  /* One row of three: the operands at the columns, the operator between them. */
  function row(fig, g, words, y, role) {
    words.forEach(function (w, i) { fig.text([w], { x: g.x[i], y: y, role: role }); });
  }

  function draw(fig, step) {
    var g = GEO(), s = STEP[step];
    [0, 2].forEach(function (i) {
      fig.rect(g.x[i] - CHIP.w / 2, CHIP.y, CHIP.w, CHIP.h,
        { radius: CHIP.radius, fill: s.numbers && COPY.truth[i] ? COLOR.statement : COLOR.body,
          stroke: COLOR.statement, width: LINE.outline });
    });
    row(fig, g, COPY.words, BASELINE.words, 'slideDetail');
    if (s.letters) {
      row(fig, g, COPY.letters, BASELINE.letters, 'slideBody');
      fig.text([COPY.algebra], { x: PAGE.w / 2, y: CAPTION.y, role: 'slideDetail' });
    }
    if (s.numbers) {
      row(fig, g, COPY.numbers, BASELINE.numbers, 'slideBody');
      fig.text([COPY.result],
        { x: g.result, y: BASELINE.numbers, role: 'slideBody', align: 'start' });
      fig.text([COPY.values], { x: PAGE.w / 2, y: CAPTION.y + ROW.line, role: 'slideDetail' });
    }
  }

  window.BooleLogicLitFigure = {
    width: PAGE.w, height: PAGE.h,
    title: 'Boole: Truth as a Lamp', name: 'boole-logic-lit', className: 'boole-logic-lit-fig',
    ariaLabel: COPY.ariaLabel,
    steps: STEP.length,
    draw: draw
  };
})();
