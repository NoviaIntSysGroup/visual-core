/* Turing Test — figure composition module.
   4.0 × 2.35 cm, 2.6 s played on two presses, laid out like Broca and Wernicke. A judge on the
   left; a wall; behind it a person and a machine. Press 1: typed questions cross the wall to
   both, their answers come back and line up beside the judge, and its line of text fades in.
   Press 2: a question mark rises over the judge, who cannot tell the answers apart, and its
   line fades in. The last frame is that summary. */
(function () {
  /* 1 · Imports ------------------------------------------------------------ */
  var cm = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* 2 · Canvas ------------------------------------------------------------- */
  /* The size of Broca and Wernicke, so the timeline's figures match. */
  var PAGE = { w: cm(4.0), h: cm(2.35) };

  /* 3 · Type --------------------------------------------------------------- */
  var TEXT = { label: TYPE.slideDetail.size, mark: TYPE.slideBody.size };
  var ROW = { line: TEXT.label * 1.25 };   /* between the two lines of text */

  /* 4 · Colour ------------------------------------------------------------- */
  /* Secondary marks the typed exchange, and the judge's doubt about it. */
  var COLOR = { line: 'var(--text)', body: 'var(--graphic-soft)', wall: 'var(--graphic-neutral)',
                talk: 'var(--graphic-secondary)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  var LINE = { outline: 'var(--line-width-strong)' };
  /* Each figure's icon centre: the judge, and behind the wall the person above the machine.
     The wall is centred on the page. A note is a small typed page; questions leave the judge
     at `send` and reach each hidden one's `inbox`, and answers end at the judge's `stack`. */
  var ICON = { size: 15 };
  var JUDGE = { x: 15, y: 25 };
  var HIDDEN = { person: { x: 96, y: 13 }, machine: { x: 96, y: 37 } };
  var WALL = { w: 3.6, y: 4, h: 42, radius: 1 };
  var NOTE = { w: 9, h: 7, radius: 1.5, pad: 1.8, rows: [0.33, 0.67] };
  var SEND = { x: 29, y: 25 };
  var INBOX = { dx: -13 };   /* from a hidden one's centre */
  var STACK = { x: 34, y: [14, 36] };
  var DOUBT = { r: 5.4, rise: 9.5 };   /* the question mark's bubble, and its height over the judge */
  var CAPTION = { y: 54 };
  var FPS = 25;

  /* 6 · Content ------------------------------------------------------------ */
  /* Seconds. Questions cross over `ask`, answers come back over `answer`; playback holds at
     `hold`; the question mark fades in over `doubt`. */
  var ACT = { ask: { start: 0.1, dur: 0.8 }, answer: { start: 1.0, dur: 0.8 }, fade: 0.3, hold: 1.9,
              doubt: { start: 2.1, dur: 0.3 }, end: 2.6 };
  var COPY = {
    asked: [{ t: 'Questions', cls: 'fig-accent-secondary' }, { t: ' → typed answers' }],
    doubt: [{ t: "Can't tell", cls: 'fig-accent-secondary' }, { t: ' → machine thinks' }],
    ariaLabel: 'A judge types questions to a person and a machine hidden behind a wall, and '
      + 'reads their typed answers. If the judge cannot tell which answer came from the machine, '
      + 'the machine counts as thinking.'
  };

  /* 7 · Steps -------------------------------------------------------------- */
  /* One frame per 1/FPS s; frame 0, the scene, holds until the first press, and the frame with
     both answers in until the second. */
  var STEP = [];
  for (var f = 0; f <= ACT.end * FPS; f++) STEP.push({ t: f / FPS });
  var HOLDS = [0, Math.round(ACT.hold * FPS)];

  /* 8 · Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    _geo = {
      wall: { x: (PAGE.w - WALL.w) / 2 },
      inbox: ['person', 'machine'].map(function (k) { return { x: HIDDEN[k].x + INBOX.dx, y: HIDDEN[k].y }; }),
      stack: STACK.y.map(function (y) { return { x: STACK.x, y: y }; }),
      doubt: { x: JUDGE.x, y: JUDGE.y - DOUBT.rise - ICON.size / 2 }
    };
    return _geo;
  }

  /* 9 · Helpers → draw → export ------------------------------------------- */
  function r(v) { return Math.round(v * 100) / 100; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  /* Progress through [start, start + dur] at t, eased in and out. */
  function ease(start, dur, t) { var p = clamp((t - start) / dur); return p * p * (3 - 2 * p); }
  function mix(p, q, k) { return { x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k }; }
  function circle(c, rad) {
    return 'M ' + r(c.x - rad) + ',' + r(c.y) + ' A ' + r(rad) + ',' + r(rad) + ' 0 1 0 ' + r(c.x + rad) + ',' + r(c.y)
      + ' A ' + r(rad) + ',' + r(rad) + ' 0 1 0 ' + r(c.x - rad) + ',' + r(c.y) + ' Z';
  }

  /* A typed note centred at c: a small page with two lines of text. */
  function note(fig, c) {
    var x = c.x - NOTE.w / 2, y = c.y - NOTE.h / 2;
    fig.rect(x, y, NOTE.w, NOTE.h, { radius: NOTE.radius, fill: COLOR.body, stroke: COLOR.talk, width: LINE.outline });
    NOTE.rows.forEach(function (fy, i) {
      fig.rule(x + NOTE.pad, y + NOTE.h * fy, x + NOTE.w - NOTE.pad * (i ? 1.8 : 1), y + NOTE.h * fy,
        { stroke: COLOR.talk, width: LINE.outline });
    });
  }

  /* The judge, the person and the machine: icon nodes, placed on a diagram the page's size. */
  function people(fig, step) {
    var d = window.Diagram.create(PAGE.w, PAGE.h, { className: 'turing-test-icons' });
    [[JUDGE, 'person'], [HIDDEN.person, 'person'], [HIDDEN.machine, 'robot']].forEach(function (p, i) {
      d.node('who' + i, { x: p[0].x - ICON.size / 2, y: p[0].y - ICON.size / 2, w: ICON.size, h: ICON.size,
        icon: p[1], appearance: window.Diagram.iconApp(COLOR.line, { person: true }) });
    });
    fig.place(d.render('turing-test-icons-' + step), { x: 0, y: 0, w: PAGE.w });
  }

  function draw(fig, step) {
    var g = GEO(), t = STEP[step].t;
    fig.rect(g.wall.x, WALL.y, WALL.w, WALL.h, { radius: WALL.radius, fill: COLOR.wall, stroke: COLOR.line, width: LINE.outline });
    people(fig, step);
    var ask = ease(ACT.ask.start, ACT.ask.dur, t), answer = ease(ACT.answer.start, ACT.answer.dur, t);
    g.inbox.forEach(function (inbox, i) {
      if (t < ACT.ask.start) return;
      if (t < ACT.answer.start) note(fig, mix(SEND, inbox, ask));
      else note(fig, mix(inbox, g.stack[i], answer));
    });
    var doubt = ease(ACT.doubt.start, ACT.doubt.dur, t);
    if (doubt > 0) {
      fig.raw('<g style="opacity:' + r(doubt) + '">');
      fig.path(circle(g.doubt, DOUBT.r), { fill: COLOR.body, stroke: COLOR.talk, width: LINE.outline });
      fig.text([[{ t: '?', cls: 'fig-accent-secondary' }]],
        { x: g.doubt.x, y: g.doubt.y + TEXT.mark * 0.36, size: TEXT.mark, role: 'slideBody' });
      fig.raw('</g>');
    }
    [[COPY.asked, ACT.ask.start], [COPY.doubt, ACT.doubt.start]].forEach(function (c, i) {
      var k = clamp((t - c[1]) / ACT.fade);
      if (k <= 0) return;
      fig.raw('<g style="opacity:' + r(k) + '">');
      fig.text([c[0]], { x: PAGE.w / 2, y: CAPTION.y + i * ROW.line, role: 'slideDetail' });
      fig.raw('</g>');
    });
  }

  window.TuringTestFigure = {
    width: PAGE.w, height: PAGE.h,
    title: 'Turing Test', name: 'turing-test', className: 'turing-test-fig',
    ariaLabel: COPY.ariaLabel,
    steps: STEP.length, autoplay: 1000 / FPS, holds: HOLDS,
    draw: draw
  };
})();
