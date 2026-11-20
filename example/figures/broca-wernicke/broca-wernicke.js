/* Broca and Wernicke — figure composition module.
   4.0 × 2.35 cm with a 38 pt brain, three steps. A brain seen from the side. Step 1: a lesion
   above the front of the lateral sulcus, an arrow to a bubble of halting dashes, and its line
   of text (Broca). Step 2: one below the sulcus's back end, an arrow to a bubble of scribble,
   and its line (Wernicke). Lesions and arrows are matter's hue, the speech the mind's. The
   brain is the shared `BrainFigure` (figures/brain/), which must load first. */
(function () {
  /* 1 · Imports ------------------------------------------------------------ */
  var cm = window.Units.cm;
  var TYPE = window.Config.figure.type;
  var B = window.BrainFigure;

  /* 2 · Canvas: PAGE follows the brain's size, at the end of 5. */

  /* 3 · Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.slideDetail.size };
  var ROW = { line: TEXT.label * 1.25 };   /* between the two lines of text */

  /* 4 · Colour ------------------------------------------------------------- */
  var COLOR = { line: 'var(--text)', body: 'var(--graphic-soft)',
                damage: 'var(--graphic-primary)', speech: 'var(--graphic-secondary)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  var LINE = { outline: 'var(--line-width-strong)', detail: 'var(--line-width)',
               speech: 'var(--line-width-strong)', link: 'var(--line-width-strong)' };
  /* Lengths are in points for a brain `markedAt` tall (figures/brain/), sized by `B.scaled`. */
  var BRAIN = B.scaled({ x: 29.8, y: 6 });   /* where the brain's top-left lands */
  /* Each region: its landmark, and its size in source units. JAG gives a lesion's ragged
     edge: one radius factor per point around it. */
  var REGION = {
    broca:    Object.assign({ rx: 48, ry: 30 }, B.landmarks.broca),
    wernicke: Object.assign({ rx: 52, ry: 28 }, B.landmarks.wernicke)
  };
  var JAG = [1, 0.7, 1.15, 0.8, 1.05, 0.65, 1.2, 0.85, 1, 0.7, 1.1];
  /* Each bubble's top-left corner; its tail leaves the bottom edge `base` in from a corner,
     `base.w` wide, and its tip sits `tip` in from the side and `tail` below. A patch the
     `patch` size hides the bubble's edge where the tail joins it. */
  var BUBBLE = B.scaled({
    w: 23.5, h: 13, radius: 3.6, pad: 3.6, tail: 2.7, tip: 1.45,
    base: { right: 6.6, left: 2.2, w: 4.3 }, patch: { x: 0.45, w: 3.4, h: 1.2 },
    broca: { x: 2.3, y: 6 }, wernicke: { x: 87.5, y: 6 }
  });
  var SIDE = { broca: 1, wernicke: -1 };   /* the tail's corner: right, towards the brain; left */
  var ARROW = B.scaled({ head: 2.25, standoff: 1.1 });   /* head length, gap left before the tip */
  /* Each bubble's rows of speech, as fractions of it; broken into `halting` dashes, or a
     scribble of `zig` steps `scribble` high. */
  var SPEECH = { rows: [0.27, 0.5, 0.73], lastRow: 0.6, halting: 3, gap: 0.7 };
  var SCRIBBLE = B.scaled({ scribble: 1.3, zig: 1.3 });
  /* The first line of text's baseline, under the brain. The page is the drawing's width (the
     12 pt captions fit well inside it) and ends under the second line. */
  var CAPTION = { y: BRAIN.y + B.height + ROW.line };
  var PAGE = { w: cm(4.0) * B.scale, h: CAPTION.y + ROW.line + TEXT.label / 3 };

  /* 6 · Content ------------------------------------------------------------ */
  var COPY = {
    broca:    [{ t: 'Damage', cls: 'fig-accent-primary' }, { t: ' → halting speech' }],
    wernicke: [{ t: 'Damage', cls: 'fig-accent-primary' }, { t: ' → fluent nonsense' }],
    ariaLabel: 'A brain seen from the side. Damage to a region at the front leaves speech '
      + 'halting; damage to a region further back leaves it fluent but meaningless. An arrow '
      + 'runs from each damaged region to the speech it breaks.'
  };

  /* 7 · Steps -------------------------------------------------------------- */
  /* Which regions are damaged: none, then Broca's, then both. */
  var STEP = [
    { broca: false, wernicke: false },
    { broca: true,  wernicke: false },
    { broca: true,  wernicke: true }
  ];

  /* 8 · Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    function at(p) { var q = window.BrainFigure.at(p); return { x: BRAIN.x + q.x, y: BRAIN.y + q.y }; }
    function bubble(key) {
      var b = BUBBLE[key], side = SIDE[key];
      var tip = { x: side > 0 ? b.x + BUBBLE.w - BUBBLE.tip : b.x + BUBBLE.tip, y: b.y + BUBBLE.h + BUBBLE.tail };
      return { x: b.x, y: b.y, side: side, tip: tip };
    }
    _geo = {
      at: at,
      region: { broca: at(REGION.broca), wernicke: at(REGION.wernicke) },
      bubble: { broca: bubble('broca'), wernicke: bubble('wernicke') }
    };
    return _geo;
  }

  /* 9 · Helpers → draw → export ------------------------------------------- */
  function r(v) { return Math.round(v * 100) / 100; }
  function polyline(pts, close) {
    return pts.map(function (p, i) { return (i ? 'L ' : 'M ') + r(p.x) + ',' + r(p.y); }).join(' ') + (close ? ' Z' : '');
  }

  /* A lesion: a ragged blot over the region, its points placed on the brain. */
  function lesion(fig, key) {
    var q = REGION[key];
    var pts = JAG.map(function (j, i) {
      var a = 2 * Math.PI * i / JAG.length;
      return GEO().at({ cx: q.cx + Math.cos(a) * q.rx * j, cy: q.cy + Math.sin(a) * q.ry * j });
    });
    fig.path(polyline(pts, true), { fill: COLOR.damage, stroke: COLOR.line, width: LINE.detail });
  }


  function brain(fig, s) {
    fig.nestModule(window.BrainFigure, { x: BRAIN.x, y: BRAIN.y });
    if (s.broca) lesion(fig, 'broca');
    if (s.wernicke) lesion(fig, 'wernicke');
  }


  /* One row of speech, from x0 to x1 at y, broken the way that region's damage takes it. */
  function row(fig, key, x0, x1, y) {
    var paint = { fill: 'none', stroke: COLOR.speech, width: LINE.speech };
    if (key === 'broca') {
      /* Halting: the row splits into short dashes with wide gaps. */
      var n = SPEECH.halting, cell = (x1 - x0) / n, dash = cell * (1 - SPEECH.gap);
      for (var i = 0; i < n; i++) fig.rule(x0 + i * cell, y, x0 + i * cell + dash, y, paint);
    } else {
      /* Fluent but meaningless: the row runs on as a zigzag scribble. */
      var pts = [], steps = Math.max(1, Math.round((x1 - x0) / SCRIBBLE.zig));
      for (var j = 0; j <= steps; j++) {
        pts.push({ x: x0 + (x1 - x0) * j / steps, y: y + (j % 2 ? 1 : -1) * SCRIBBLE.scribble * (j % 3 ? 1 : 0.5) });
      }
      fig.path(polyline(pts), paint);
    }
  }

  function bubble(f, key) {
    var b = GEO().bubble[key], hue = COLOR.speech;
    var right = b.x + BUBBLE.w, bottom = b.y + BUBBLE.h;
    var base = b.side > 0 ? right - BUBBLE.base.right : b.x + BUBBLE.base.left, p = BUBBLE.patch;
    f.path('M ' + r(base) + ',' + r(bottom) + ' L ' + r(b.tip.x) + ',' + r(b.tip.y) + ' L ' + r(base + BUBBLE.base.w) + ',' + r(bottom),
      { fill: COLOR.body, stroke: hue, width: LINE.outline });
    f.rect(b.x, b.y, BUBBLE.w, BUBBLE.h, { radius: BUBBLE.radius, fill: COLOR.body, stroke: hue, width: LINE.outline });
    f.rect(base + p.x, bottom - p.h / 2, p.w, p.h, { fill: COLOR.body });
    SPEECH.rows.forEach(function (fy, i) {
      var x0 = b.x + BUBBLE.pad, full = BUBBLE.w - 2 * BUBBLE.pad;
      row(f, key, x0, x0 + full * (i === SPEECH.rows.length - 1 ? SPEECH.lastRow : 1),
        b.y + BUBBLE.h * fy);
    });
  }

  /* The arrow from a lesion to its bubble's tip. */
  function arrow(fig, key) {
    var g = GEO(), a = g.region[key], z = g.bubble[key].tip;
    var dx = z.x - a.x, dy = z.y - a.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    var reach = len - ARROW.standoff, end = { x: a.x + ux * reach, y: a.y + uy * reach };
    var h = ARROW.head, back = { x: end.x - ux * h, y: end.y - uy * h };
    fig.rule(a.x, a.y, back.x, back.y, { stroke: COLOR.damage, width: LINE.link });
    fig.path(polyline([end, { x: back.x - uy * h * 0.6, y: back.y + ux * h * 0.6 },
      { x: back.x + uy * h * 0.6, y: back.y - ux * h * 0.6 }], true), { fill: COLOR.damage });
  }

  function draw(fig, step) {
    var s = STEP[step];
    brain(fig, s);
    ['broca', 'wernicke'].forEach(function (key, i) {
      if (!s[key]) return;
      bubble(fig, key);
      arrow(fig, key);
      fig.text([COPY[key]], { x: PAGE.w / 2, y: CAPTION.y + i * ROW.line, role: 'slideDetail' });
    });
  }

  window.BrocaWernickeFigure = {
    width: PAGE.w, height: PAGE.h,
    title: 'Broca and Wernicke', name: 'broca-wernicke', className: 'broca-wernicke-fig',
    ariaLabel: COPY.ariaLabel,
    steps: STEP.length,
    draw: draw
  };
})();
