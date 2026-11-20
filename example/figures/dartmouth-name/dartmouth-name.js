/* Dartmouth Name — figure composition module.
   4.0 cm wide, height from content, static: the outcome card of the timeline where the brain
   and computation lines meet. The brain on the left and a 1940s computer on the right, each
   with a line running down and in, like the timeline's two branches merging, into one box
   named AI in the machine's colour. The brain is the shared `BrainFigure` (figures/brain/),
   which must load first. */
(function () {
  /* 1 · Imports ------------------------------------------------------------ */
  var cm = window.Units.cm, TYPE = window.Config.figure.type;
  var B = window.BrainFigure;

  /* 2 · Canvas ------------------------------------------------------------- */
  /* The width of the timeline's other figures, so the cards match. */
  var PAGE = { w: cm(4.0), margin: 4 };

  /* 3 · Type --------------------------------------------------------------- */
  var TEXT = { name: TYPE.slideBody.size, label: TYPE.slideDetail.size };
  var ROW = { line: TEXT.label * 1.25 };   /* between the two lines of text */

  /* 4 · Colour ------------------------------------------------------------- */
  /* Primary is AI, the one thing the two lines become. */
  var COLOR = { line: 'var(--text)', body: 'var(--graphic-soft)', ai: 'var(--graphic-primary)' };
  var TINT = { ai: 'var(--graphic-primary-tint)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  var LINE = { outline: 'var(--line-width-strong)' };
  /* The machine: `n` cabinets of Program Steps' kind, as tall as the brain, flush right, each
     with a grid of lamps from `top` down. */
  var CABINET = { n: 2, w: 12, radius: 1 };
  var LAMP = { cols: 2, rows: 6, pitch: 5, r: 1.3, top: 6 };
  /* The AI box, `gap` under the brain and machine; each merge line leaves `clear` under its
     drawing's middle, turns on a corner of `bend`, and ends in an arrowhead `head` long. */
  var BOX = { w: 22, h: 14, radius: 1.5, gap: 4 };
  var MERGE = { clear: 2, bend: 3, head: 2.6 };
  var CAPTION = { gap: 3 };   /* box bottom -> first line's top */

  /* 6 · Content ------------------------------------------------------------ */
  var COPY = {
    name: 'AI',
    lines: [[{ t: 'Brain' }, { t: ' + ' }, { t: 'machine' }, { t: ' → one goal' }],
            [{ t: 'Dartmouth', cls: 'fig-accent-primary' }, { t: ' → names it AI' }]],
    ariaLabel: 'A brain and a 1940s computer side by side, a line from each running down into '
      + 'one box named AI.'
  };

  /* 8 · Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var top = PAGE.margin, bottom = top + B.height;
    var mw = CABINET.n * CABINET.w, mx = PAGE.w - PAGE.margin - mw;
    var box = { x: PAGE.w / 2 - BOX.w / 2, y: bottom + BOX.gap, w: BOX.w, h: BOX.h };
    var lamps = [], lampsW = (LAMP.cols - 1) * LAMP.pitch;
    for (var c = 0; c < CABINET.n; c++) {
      for (var j = 0; j < LAMP.rows; j++) {
        for (var i = 0; i < LAMP.cols; i++) {
          lamps.push({ x: mx + c * CABINET.w + (CABINET.w - lampsW) / 2 + i * LAMP.pitch, y: top + LAMP.top + j * LAMP.pitch });
        }
      }
    }
    var captionY = box.y + box.h + CAPTION.gap + TEXT.label;
    _geo = {
      top: top, bottom: bottom, mx: mx, box: box, lamps: lamps, captionY: captionY,
      /* Where each merge line leaves: under the brain's and the machine's middles. */
      from: [PAGE.margin + B.width / 2, mx + mw / 2],
      h: captionY + ROW.line + TEXT.label / 3
    };
    return _geo;
  }

  /* 9 · Helpers → draw → export -------------------------------------------- */
  function r(v) { return Math.round(v * 100) / 100; }

  /* The machine: its cabinets and their unlit lamps. */
  function machine(fig, g) {
    for (var c = 0; c < CABINET.n; c++) {
      fig.rect(g.mx + c * CABINET.w, g.top, CABINET.w, B.height,
        { radius: CABINET.radius, fill: COLOR.body, stroke: COLOR.line, width: LINE.outline });
    }
    g.lamps.forEach(function (l) {
      fig.circle(l.x, l.y, LAMP.r, { fill: COLOR.body, stroke: COLOR.line, width: LINE.outline });
    });
  }

  /* A merge line from under x0 down to the box's middle, turning towards the box side at x1,
     with its arrowhead on that side. */
  function merge(fig, g, x0, x1) {
    var y0 = g.bottom + MERGE.clear, y1 = g.box.y + g.box.h / 2;
    var s = x1 > x0 ? 1 : -1, b = MERGE.bend, h = MERGE.head;
    fig.path('M ' + r(x0) + ',' + r(y0) + ' V ' + r(y1 - b) + ' Q ' + r(x0) + ',' + r(y1) + ' '
      + r(x0 + s * b) + ',' + r(y1) + ' H ' + r(x1 - s * h),
      { fill: 'none', stroke: COLOR.line, width: LINE.outline });
    fig.path('M ' + r(x1) + ',' + r(y1) + ' L ' + r(x1 - s * h * 1.4) + ',' + r(y1 - h)
      + ' L ' + r(x1 - s * h * 1.4) + ',' + r(y1 + h) + ' Z', { fill: COLOR.line });
  }

  function draw(fig) {
    var g = GEO(), box = g.box;
    fig.nestModule(B, { x: PAGE.margin, y: g.top });
    machine(fig, g);
    merge(fig, g, g.from[0], box.x);
    merge(fig, g, g.from[1], box.x + box.w);
    fig.rect(box.x, box.y, box.w, box.h, { radius: BOX.radius, fill: TINT.ai, stroke: COLOR.ai, width: LINE.outline });
    fig.text([[{ t: COPY.name, cls: 'fig-accent-primary' }]],
      { x: PAGE.w / 2, y: box.y + box.h / 2 + TEXT.name * 0.35, role: 'slideBody', weight: 600 });
    fig.text(COPY.lines, { x: PAGE.w / 2, y: g.captionY, role: 'slideDetail', lineHeight: ROW.line });
  }

  window.DartmouthNameFigure = {
    width: PAGE.w,
    get height() { return GEO().h; },   /* derived from the brain's height and the captions */
    title: 'Dartmouth Name', name: 'dartmouth-name', className: 'dartmouth-name-fig',
    ariaLabel: COPY.ariaLabel, draw: draw
  };
})();
