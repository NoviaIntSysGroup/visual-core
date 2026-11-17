/* Mind Border — figure composition module.
   20.8 cm wide, height from content, 4 steps. A row of mental abilities with one border across
   it: left of the border is matter, so a machine could in principle do it; right of it is a
   non-physical mind. After Descartes' border, it notes other borders, then moves to all matter. */
(function () {
  /* 1 · Imports ------------------------------------------------------------ */
  var cm = window.Units.cm, TYPE = window.Config.figure.type;

  /* 2 · Canvas ------------------------------------------------------------- */
  var PAGE = { w: cm(20.8), margin: cm(0.3) };

  /* 3 · Type --------------------------------------------------------------- */
  var TEXT = { body: TYPE.slideBody.size };
  var ROW  = { body: TEXT.body * 1.3 };

  /* 4 · Colour ------------------------------------------------------------- */
  var COLOR = { physical: 'var(--graphic-primary)', mind: 'var(--graphic-secondary)', idle: 'var(--edges)',
                border: 'var(--text)' };
  var TINT  = { physical: 'var(--graphic-primary-tint)', mind: 'var(--graphic-secondary-tint)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  var BOX = { h: cm(1.1), gap: cm(0.25), radius: cm(0.15) };
  var MARK = {
    labelGap:   cm(0.2),   /* side label baseline -> border top */
    overhang:   cm(0.15),  /* how far the border reaches past the boxes */
    captionGap: cm(0.5)    /* border bottom -> caption's first line top */
  };
  var LINE = { box: 'var(--line-width-strong)', border: 'var(--line-width-very-strong)' };

  /* 6 · Content ------------------------------------------------------------ */
  var COPY = {
    abilities: ['Moving', 'Sensing', 'Remembering', 'Learning', 'Reasoning', 'Conversing', 'Being aware'],
    sides: { physical: 'Matter', mind: 'Mind' },
    ariaLabel: 'Seven mental abilities in a row, from moving to being aware, with a border marking which of them are physical.'
  };

  /* 7 · Steps -------------------------------------------------------------- */
  /* `border` is how many abilities, from the left, count as matter; null before any answer. */
  var STEP = [
    { border: null, caption: 'Which of these could a machine do, and which need a mind?' },
    { border: 3, caption: 'Descartes: moving, sensing and remembering are machinery; the rest needs a mind.' },
    { border: 3, caption: 'People have drawn the border at various places.' },
    { border: 7, caption: 'Some even made it all matter: then a machine could in principle be intelligent.' }
  ];

  /* 8 · Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var n = COPY.abilities.length;
    var boxW = (PAGE.w - 2 * PAGE.margin - (n - 1) * BOX.gap) / n;
    var labelY = TEXT.body;
    var borderTop = labelY + MARK.labelGap;
    var boxTop = borderTop + MARK.overhang;
    var borderBottom = boxTop + BOX.h + MARK.overhang;
    var captionY = borderBottom + MARK.captionGap + TEXT.body;
    _geo = {
      boxW: boxW, labelY: labelY, borderTop: borderTop, boxTop: boxTop, borderBottom: borderBottom,
      captionY: captionY,
      h: captionY + ROW.body - TEXT.body + MARK.overhang,
      boxX: function (i) { return PAGE.margin + i * (boxW + BOX.gap); },
      borderX: function (i) { return PAGE.margin + i * (boxW + BOX.gap) - BOX.gap / 2; }
    };
    return _geo;
  }

  /* 9 · Helpers → draw → export -------------------------------------------- */
  function ability(fig, i, physical) {
    var g = GEO(), x = g.boxX(i);
    var kind = physical === null ? 'idle' : i < physical ? 'physical' : 'mind';
    fig.rect(x, g.boxTop, g.boxW, BOX.h, {
      fill: TINT[kind] || 'none', stroke: COLOR[kind], width: LINE.box, radius: BOX.radius
    });
    fig.text([COPY.abilities[i]], { x: x + g.boxW / 2, y: g.boxTop + BOX.h / 2 + TEXT.body * 0.35, role: 'slideBody' });
  }

  /* Matter is named over the left end and mind over the right, whenever each has a box. */
  function draw(fig, step) {
    var g = GEO(), at = STEP[step].border, n = COPY.abilities.length;
    COPY.abilities.forEach(function (a, i) { ability(fig, i, at); });
    if (at !== null) {
      var x = g.borderX(at);
      fig.rule(x, g.borderTop, x, g.borderBottom, { stroke: COLOR.border, width: LINE.border });
      if (at > 0) fig.text([COPY.sides.physical], { x: PAGE.margin, y: g.labelY, align: 'start', role: 'slideBody', weight: 700 });
      if (at < n) fig.text([COPY.sides.mind], { x: PAGE.w - PAGE.margin, y: g.labelY, align: 'end', role: 'slideBody', weight: 700 });
    }
    fig.text([STEP[step].caption], { x: PAGE.w / 2, y: g.captionY, role: 'slideBody' });
  }

  window.MindBorderFigure = {
    width: PAGE.w,
    get height() { return GEO().h; },   /* derived from the rows */
    title: 'Mind Border', name: 'mind-border', className: 'mind-border-fig', ariaLabel: COPY.ariaLabel,
    steps: STEP.length,
    draw: draw
  };
})();
