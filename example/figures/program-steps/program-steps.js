/* Program Steps — figure composition module.
   4.0 × 2.35 cm, 3.9 s played on two presses, the size of Broca and Wernicke. A program as a
   recipe card the machine follows: the card on the left, three numbered steps, feeding a 1940s
   computer on the right, a row of tall cabinets covered in lamps, with a person beside it for
   scale. Press 1: the steps are written in one by one, and its line of text fades in. Press 2:
   the machine works through the steps alone, each one lit while it runs and ticked when done,
   its lamps flickering, and stops on its answer; its line fades in. The last frame is that
   summary. */
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
  /* Secondary marks the program being followed: the step that runs, its tick, the lit lamps. */
  var COLOR = { line: 'var(--text)', body: 'var(--graphic-soft)', paper: 'var(--background)',
                writing: 'var(--edges)', live: 'var(--graphic-secondary)' };
  var TINT = { live: 'var(--graphic-secondary-tint)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  var LINE = { outline: 'var(--line-width-strong)', tick: 'var(--line-width-very-strong)' };
  /* The card on the left and the machine on the right, both `top` to `top + h`, with an arrow
     across the `gap` between them. On the card, a step every `pitch` from `first`: its number
     `num` in, its writing a bar from `barIn` to `barOut` from the right edge, its tick `tick`
     from the right edge, and the step running on a band `band` in from the card's edge. */
  var BLOCK = { top: 4, h: 40, margin: 6, gap: 12 };
  var CARD = { w: 32, radius: 1.5, first: 10, pitch: 11, num: 5.5, bar: 2.4, barIn: 10,
               barOut: 9.5, tick: 5.5, mark: 2.2, band: 1.5 };
  var ARROW = { head: 2.6, clear: 2 };   /* clear: from the card and the machine */
  /* The machine: `n` cabinets side by side, each with a grid of lamps from `top` down, and a
     person `gap` to the right of them, standing on the same floor. */
  var CABINET = { n: 3, w: 12, radius: 1 };
  var LAMP = { cols: 2, rows: 6, pitch: 5, r: 1.3, top: 6, lit: 0.45 };   /* lit: share lit */
  var PERSON = { size: 14, gap: 1 };
  var CAPTION = { y: 54 };
  var FPS = 25;

  /* 6 · Content ------------------------------------------------------------ */
  /* Seconds. The steps are written in over `write`, one after another; playback holds at
     `hold`; the machine then spends `step` on each. Each line fades in as its act starts. */
  var ACT = { write: { start: 0.1, dur: 1.2 }, hold: 1.5, run: { start: 1.6, step: 0.7 },
              fade: 0.3, end: 3.9 };
  var COPY = {
    steps: ['1', '2', '3'],
    lines: [[{ t: 'Program', cls: 'fig-accent-secondary' }, { t: ' → steps to follow' }],
            [{ t: 'Machine', cls: 'fig-accent-secondary' }, { t: ' → runs the program' }]],
    ariaLabel: 'A program as a recipe card: three numbered steps are written on it. Beside it a '
      + '1940s computer, a row of cabinets taller than the person next to it, then follows the '
      + 'steps on its own, one at a time, ticking each off, its lamps flickering, until it stops '
      + 'with its answer lit.'
  };

  /* 7 · Steps -------------------------------------------------------------- */
  /* One frame per 1/FPS s; frame 0, a blank card, holds until the first press, and the
     written card until the second. */
  var STEP = [];
  for (var f = 0; f <= ACT.end * FPS; f++) STEP.push({ t: f / FPS });
  var HOLDS = [0, Math.round(ACT.hold * FPS)];

  /* 8 · Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var card = { x: BLOCK.margin, y: BLOCK.top, w: CARD.w, h: BLOCK.h };
    var mx = card.x + card.w + BLOCK.gap;
    var rows = COPY.steps.map(function (s, i) { return card.y + CARD.first + i * CARD.pitch; });
    var w = CABINET.n * CABINET.w + PERSON.gap + PERSON.size;
    var x0 = mx + (PAGE.w - BLOCK.margin - mx - w) / 2;
    var cabinets = [], lamps = [];
    for (var c = 0; c < CABINET.n; c++) cabinets.push(x0 + c * CABINET.w);
    var lampsW = (LAMP.cols - 1) * LAMP.pitch;
    cabinets.forEach(function (x) {
      for (var j = 0; j < LAMP.rows; j++) {
        for (var i = 0; i < LAMP.cols; i++) {
          lamps.push({ x: x + (CABINET.w - lampsW) / 2 + i * LAMP.pitch, y: BLOCK.top + LAMP.top + j * LAMP.pitch });
        }
      }
    });
    _geo = {
      card: card, rows: rows, cabinets: cabinets, lamps: lamps,
      person: { x: x0 + CABINET.n * CABINET.w + PERSON.gap, y: BLOCK.top + BLOCK.h - PERSON.size },
      bar: { x0: card.x + CARD.barIn, x1: card.x + card.w - CARD.barOut },
      arrow: { x0: card.x + card.w + ARROW.clear, x1: mx - ARROW.clear, y: card.y + card.h / 2 }
    };
    return _geo;
  }

  /* 9 · Helpers → draw → export ------------------------------------------- */
  function r(v) { return Math.round(v * 100) / 100; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  /* A fixed pseudo-random number in [0, 1) for each integer pair: which lamps are lit. */
  function hash(a, b) { var s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }
  function circle(x, y, rad) {
    return 'M ' + r(x - rad) + ',' + r(y) + ' A ' + r(rad) + ',' + r(rad) + ' 0 1 0 ' + r(x + rad) + ',' + r(y)
      + ' A ' + r(rad) + ',' + r(rad) + ' 0 1 0 ' + r(x - rad) + ',' + r(y) + ' Z';
  }

  /* Where the story is at t: how far each step is written (0 → 1), and the step the machine
     is on (-1 before it starts, the step count once done). */
  function state(t) {
    var n = COPY.steps.length, each = ACT.write.dur / n;
    var written = COPY.steps.map(function (s, i) { return clamp((t - ACT.write.start - i * each) / each); });
    var q = (t - ACT.run.start) / ACT.run.step;
    return { written: written, at: q < 0 ? -1 : Math.min(n, Math.floor(q)) };
  }

  /* The card: each step its number and a bar of writing, drawn in as it is written; the
     step running lit, and each step done ticked. */
  function card(fig, g, s) {
    fig.rect(g.card.x, g.card.y, g.card.w, g.card.h,
      { radius: CARD.radius, fill: COLOR.paper, stroke: COLOR.line, width: LINE.outline });
    g.rows.forEach(function (y, i) {
      var w = s.written[i];
      if (w <= 0) return;
      if (s.at === i) {
        fig.rect(g.card.x + CARD.band, y - CARD.pitch / 2 + CARD.band / 2, g.card.w - 2 * CARD.band,
          CARD.pitch - CARD.band,
          { radius: CARD.radius, fill: TINT.live });
      }
      fig.text([COPY.steps[i]], { x: g.card.x + CARD.num, y: y + TEXT.label * 0.35, role: 'slideDetail' });
      fig.rect(g.bar.x0, y - CARD.bar / 2, (g.bar.x1 - g.bar.x0) * w, CARD.bar,
        { radius: CARD.bar / 2, fill: COLOR.writing });
      if (s.at > i) {
        var x = g.card.x + g.card.w - CARD.tick, m = CARD.mark;
        fig.path('M ' + r(x - m) + ',' + r(y) + ' L ' + r(x - m / 3) + ',' + r(y + m * 0.7)
          + ' L ' + r(x + m) + ',' + r(y - m * 0.8),
          { fill: 'none', stroke: COLOR.live, width: LINE.tick });
      }
    });
  }

  /* The arrow from the card into the machine. */
  function arrow(fig, g) {
    var a = g.arrow, h = ARROW.head;
    fig.rule(a.x0, a.y, a.x1 - h, a.y, { stroke: COLOR.line, width: LINE.outline });
    fig.path('M ' + r(a.x1) + ',' + r(a.y) + ' L ' + r(a.x1 - h * 1.4) + ',' + r(a.y - h)
      + ' L ' + r(a.x1 - h * 1.4) + ',' + r(a.y + h) + ' Z', { fill: COLOR.line });
  }

  /* The machine: its cabinets, their lamps flickering from frame to frame while it runs and
     showing its answer once done, and the person beside it, an icon on a diagram the page's
     size. */
  function machine(fig, g, s, frame) {
    var done = s.at >= COPY.steps.length, running = s.at >= 0 && !done;
    g.cabinets.forEach(function (x) {
      fig.rect(x, BLOCK.top, CABINET.w, BLOCK.h,
        { radius: CABINET.radius, fill: COLOR.body, stroke: COLOR.line, width: LINE.outline });
    });
    g.lamps.forEach(function (l, i) {
      var lit = (running && hash(i, frame) < LAMP.lit) || (done && hash(i, -1) < LAMP.lit);
      fig.path(circle(l.x, l.y, LAMP.r), { fill: lit ? COLOR.live : COLOR.body, stroke: COLOR.line, width: LINE.outline });
    });
    var d = window.Diagram.create(PAGE.w, PAGE.h, { className: 'program-steps-icons' });
    d.node('person', { x: g.person.x, y: g.person.y, w: PERSON.size, h: PERSON.size, icon: 'person',
      appearance: window.Diagram.iconApp(COLOR.line, { person: true }) });
    fig.place(d.render('program-steps-icons-' + frame), { x: 0, y: 0, w: PAGE.w });
  }

  function draw(fig, step) {
    var g = GEO(), t = STEP[step].t, s = state(t);
    card(fig, g, s);
    arrow(fig, g);
    machine(fig, g, s, step);
    [ACT.write.start, ACT.run.start].forEach(function (start, i) {
      var k = clamp((t - start) / ACT.fade);
      if (k <= 0) return;
      fig.raw('<g style="opacity:' + r(k) + '">');
      fig.text([COPY.lines[i]], { x: PAGE.w / 2, y: CAPTION.y + i * ROW.line, role: 'slideDetail' });
      fig.raw('</g>');
    });
  }

  window.ProgramStepsFigure = {
    width: PAGE.w, height: PAGE.h,
    title: 'Program Steps', name: 'program-steps', className: 'program-steps-fig',
    ariaLabel: COPY.ariaLabel,
    steps: STEP.length, autoplay: 1000 / FPS, holds: HOLDS,
    draw: draw
  };
})();
