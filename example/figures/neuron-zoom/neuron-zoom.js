/* Neuron Zoom — figure composition module.
   4.0 × 2.35 cm with a 38 pt brain, 6.4 s played on two presses, laid out like Broca and
   Wernicke. A brain seen from the side, a lens on its cortex. The lens opens into a circle
   beside the brain, where separate nerve cells appear one by one, each ending just short of
   the next. Then the first cell fires: a pulse runs down its axon, splits, crosses each gap
   and fires the cells it reaches. Only a cell carrying the pulse is blue; it turns back once
   the pulse has crossed its gaps, so the last frame is quiet.
   The brain is the shared `BrainFigure` (figures/brain/), which must load first. */
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
  /* Primary is the signal, and the cells carrying it at that moment. */
  var COLOR = { line: 'var(--text)', quiet: 'var(--edges)', body: 'var(--graphic-soft)',
                signal: 'var(--graphic-primary)', fired: 'var(--graphic-primary-tint)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  var LINE = { outline: 'var(--line-width-strong)', detail: 'var(--line-width)' };
  /* Lengths are in points for a brain `markedAt` tall (figures/brain/), sized by `B.scaled`,
     or by `K` where a table mixes them with other numbers. The brain's top-left; the lens on
     it, centred on a cortex point in the brain's source units; and the circle it opens into. */
  var K = B.scale;
  var BRAIN = B.scaled({ x: 4, y: 6 });
  var LENS = { cx: 560, cy: 210, r: 3.25 * K };
  var ZOOM = B.scaled({ x: 89.2, y: 25, r: 20.25 });
  var SOMA = B.scaled({ r: 1.6 });
  /* A dendrite: a stem, then a Y of two twigs `spread` degrees apart. */
  var DENDRITE = { stem: 1.05 * K, twig: 1.45 * K, spread: 70 };
  /* An axon's end: three branches fanning `spread` degrees, each ending in a knob, then the
     gap left before the next cell's dendrite. */
  var TERMINAL = { len: 1.2 * K, spread: 30, knob: 0.55 * K, gap: 1.1 * K };
  /* The cells, in the zoom circle's coordinates (× K), in the order they appear and fire.
     `to` names the cells an axon reaches, forking at `split`; `out` ends an axon in open
     tissue. `dendrites` are the extra ones (degrees, 0 = right, clockwise); each incoming axon
     gets one pointing back at it. */
  var CELLS = {
    a: { x: -13.5, y: 0, split: { x: -8.5, y: 0 }, to: ['b', 'c'], dendrites: [180, 128, 232] },
    b: { x: -1.35, y: -9.9, to: ['d'], dendrites: [215, 268] },
    c: { x: -1.35, y: 9.9,  to: ['d'], dendrites: [145, 92] },
    d: { x: 10.8, y: 0,  out: { x: 16.6, y: 0 }, dendrites: [] },
    /* Two cells no pulse reaches: they stay as they were. */
    e: { x: 4.5, y: -15.3, to: ['d'], dendrites: [200, 250] },
    f: { x: 4.5, y: 15.3,  to: ['d'], dendrites: [160, 110] }
  };
  var PULSE = { r: 0.8 * K, glow: 1.7 * K, ring: 2.2 };   /* ring: how far a firing ring grows, × soma */
  /* The first line of text's baseline, under the brain. The page is the drawing's width and
     ends under the second line. */
  var CAPTION = { y: BRAIN.y + B.height + ROW.line };
  var PAGE = { w: cm(4.0) * K, h: CAPTION.y + ROW.line + TEXT.label / 3 };
  var FPS = 25;

  /* 6 · Content ------------------------------------------------------------ */
  /* Seconds. The zoom opens; the cells appear `each` apart, each over `fade`; playback waits
     at `hold`; the first cell fires at `fire`, and a pulse runs at `speed` pt/s, taking `cross`
     to cross a gap. A fired body flashes over `flash`, and its ring spreads over `ring`. */
  var ACT = { zoom: { start: 0.2, dur: 1.2 }, cells: { start: 1.5, each: 0.3, fade: 0.5 },
              hold: 3.6, fire: 3.8, speed: 20 * K, cross: 0.3, flash: 0.5, ring: 0.6, end: 6.4 };
  var COPY = {
    cells:   [{ t: 'Brain' }, { t: ' → separate cells' }],
    signals: [{ t: 'Signals', cls: 'fig-accent-primary' }, { t: ' → cell to cell' }],
    ariaLabel: 'A brain seen from the side, with a lens on its surface. The lens opens into a '
      + 'close-up: separate nerve cells, each ending just short of the next. One cell fires, '
      + 'and an electrical pulse runs along its fibre, splits, and fires the cells it reaches.'
  };

  /* 7 · Steps -------------------------------------------------------------- */
  /* One frame per 1/FPS s. Two presses: frame 0, the brain and its lens, plays to the cells
     in place; that frame plays the signal. */
  var STEP = [];
  for (var f = 0; f <= ACT.end * FPS; f++) STEP.push({ t: f / FPS });

  /* 8 · Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var lens = B.at(LENS);
    var reach = SOMA.r + DENDRITE.stem + DENDRITE.twig * Math.cos(DENDRITE.spread / 2 * Math.PI / 180);
    var keys = Object.keys(CELLS), cells = {};
    keys.forEach(function (k, i) {
      var c = CELLS[k];
      cells[k] = { key: k, x: ZOOM.x + c.x * K, y: ZOOM.y + c.y * K, appear: ACT.cells.start + i * ACT.cells.each,
                   fire: i ? Infinity : ACT.fire, dirs: c.dendrites.map(deg), branches: [] };
    });
    /* Each axon branch: soma edge, the fork if any, then its end short of the target. */
    keys.forEach(function (k) {
      var c = CELLS[k], s = cells[k];
      var fork = c.split && { x: ZOOM.x + c.split.x * K, y: ZOOM.y + c.split.y * K };
      var ends = (c.to || []).map(function (tk) { return { target: cells[tk] }; });
      if (c.out) ends.push({ point: { x: ZOOM.x + c.out.x * K, y: ZOOM.y + c.out.y * K } });
      ends.forEach(function (e) {
        var from = fork || s, aim = e.target || e.point, u = unit(from, aim);
        var end = e.target ? along(aim, u, -(reach + TERMINAL.gap + TERMINAL.len)) : aim;
        var first = unit(s, fork || end), pts = [along(s, first, SOMA.r)];
        if (fork) pts.push(fork);
        pts.push(end);
        var b = { pts: pts, lens: lengths(pts), u: u, target: e.target };
        b.length = b.lens[b.lens.length - 1];
        s.branches.push(b);
        if (e.target) e.target.dirs.push({ x: -u.x, y: -u.y });
      });
    });
    /* Firing times, in order: a cell fires when the first pulse crosses into it, and goes
       quiet once its own pulses have crossed every gap. */
    keys.forEach(function (k) {
      var s = cells[k];
      s.quiet = s.fire;
      s.branches.forEach(function (b) {
        b.arrive = s.fire + b.length / ACT.speed;
        s.quiet = Math.max(s.quiet, b.arrive + ACT.cross);
        if (b.target) b.target.fire = Math.min(b.target.fire, b.arrive + ACT.cross);
      });
    });
    _geo = { lens: { x: BRAIN.x + lens.x, y: BRAIN.y + lens.y }, cells: keys.map(function (k) { return cells[k]; }) };
    return _geo;
  }

  /* 9 · Helpers → draw → export ------------------------------------------- */
  function r(v) { return Math.round(v * 100) / 100; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  /* Progress through [start, start + dur] at t, eased in and out. */
  function ease(start, dur, t) { var p = clamp((t - start) / dur); return p * p * (3 - 2 * p); }
  function deg(a) { a = a * Math.PI / 180; return { x: Math.cos(a), y: Math.sin(a) }; }
  function unit(p, q) { var d = Math.hypot(q.x - p.x, q.y - p.y); return { x: (q.x - p.x) / d, y: (q.y - p.y) / d }; }
  function along(p, u, len) { return { x: p.x + u.x * len, y: p.y + u.y * len }; }
  function turn(u, a) { var v = deg(a); return { x: u.x * v.x - u.y * v.y, y: u.x * v.y + u.y * v.x }; }
  function lengths(pts) {
    var acc = [0];
    for (var i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    return acc;
  }
  function circle(c, rad) {
    return 'M ' + r(c.x - rad) + ',' + r(c.y) + ' A ' + r(rad) + ',' + r(rad) + ' 0 1 0 ' + r(c.x + rad) + ',' + r(c.y)
      + ' A ' + r(rad) + ',' + r(rad) + ' 0 1 0 ' + r(c.x - rad) + ',' + r(c.y) + ' Z';
  }
  function polyline(pts) {
    return pts.map(function (p, i) { return (i ? 'L ' : 'M ') + r(p.x) + ',' + r(p.y); }).join(' ');
  }
  /* The part of a branch from its start to distance d along it. */
  function upTo(b, d) {
    var out = [b.pts[0]];
    for (var i = 1; i < b.pts.length; i++) {
      if (d >= b.lens[i]) { out.push(b.pts[i]); continue; }
      var k = (d - b.lens[i - 1]) / (b.lens[i] - b.lens[i - 1]), p = b.pts[i - 1], q = b.pts[i];
      out.push({ x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k });
      break;
    }
    return out;
  }

  /* The lens and the zoom circle, joined by their outer tangents; `k` takes the circle from
     the lens to its place. */
  function zoom(fig, g, k) {
    var c = { x: g.lens.x + (ZOOM.x - g.lens.x) * k, y: g.lens.y + (ZOOM.y - g.lens.y) * k };
    var rad = LENS.r + (ZOOM.r - LENS.r) * k, d = Math.hypot(c.x - g.lens.x, c.y - g.lens.y);
    if (d > rad - LENS.r + 0.5) {
      var e = unit(g.lens, c), phi = Math.acos((LENS.r - rad) / d) * 180 / Math.PI;
      [phi, -phi].forEach(function (a) {
        var n = turn(e, a);
        fig.path(polyline([along(g.lens, n, LENS.r), along(c, n, rad)]),
          { fill: 'none', stroke: COLOR.quiet, width: LINE.detail });
      });
    }
    fig.path(circle(g.lens, LENS.r), { fill: 'none', stroke: COLOR.line, width: LINE.outline });
    if (k > 0) fig.path(circle(c, rad), { fill: COLOR.body, stroke: COLOR.line, width: LINE.outline });
  }

  /* One cell at time t: its dendrites, axon and body, blue where the pulse has been while
     the cell carries it. */
  function cell(fig, s, t) {
    var fired = t >= s.fire, active = fired && t < s.quiet, hue = active ? COLOR.signal : COLOR.line;
    var line = { fill: 'none', stroke: hue, width: LINE.outline };
    s.dirs.forEach(function (u) {
      var fork = along(s, u, SOMA.r + DENDRITE.stem);
      [-1, 1].forEach(function (side) {
        fig.path(polyline([along(s, u, SOMA.r), fork, along(fork, turn(u, side * DENDRITE.spread / 2), DENDRITE.twig)]), line);
      });
    });
    s.branches.forEach(function (b) {
      var run = (t - s.fire) * ACT.speed, done = active && run >= b.length;
      fig.path(polyline(b.pts), { fill: 'none', stroke: done ? COLOR.signal : COLOR.line, width: LINE.outline });
      if (active && !done) fig.path(polyline(upTo(b, run)), { fill: 'none', stroke: COLOR.signal, width: LINE.outline });
      var end = b.pts[b.pts.length - 1], paint = done ? COLOR.signal : COLOR.line;
      [-1, 0, 1].forEach(function (side) {
        var tip = along(end, turn(b.u, side * TERMINAL.spread), TERMINAL.len);
        fig.path(polyline([end, tip]), { fill: 'none', stroke: paint, width: LINE.outline });
        fig.path(circle(tip, TERMINAL.knob), { fill: paint });
      });
    });
    fig.path(circle(s, SOMA.r), { fill: active ? COLOR.fired : COLOR.body, stroke: hue, width: LINE.outline });
    if (fired) {
      var since = t - s.fire, flash = 1 - clamp(since / ACT.flash), ring = clamp(since / ACT.ring);
      if (flash > 0) fig.path(circle(s, SOMA.r), { fill: COLOR.signal, opacity: r(flash) });
      if (ring < 1) {
        fig.path(circle(s, SOMA.r * (1 + ring * (PULSE.ring - 1))),
          { fill: 'none', stroke: COLOR.signal, width: LINE.outline, opacity: r(1 - ring) });
      }
    }
  }

  /* The pulses running along a cell's axon, fading at the end while they cross the gap. */
  function pulses(fig, s, t) {
    s.branches.forEach(function (b) {
      var run = (t - s.fire) * ACT.speed;
      if (run <= 0) return;
      var fade = run < b.length ? 1 : 1 - clamp((t - b.arrive) / ACT.cross);
      if (fade <= 0) return;
      var pts = upTo(b, Math.min(run, b.length)), at = pts[pts.length - 1];
      fig.path(circle(at, PULSE.glow), { fill: COLOR.signal, opacity: r(0.35 * fade) });
      fig.path(circle(at, PULSE.r), { fill: COLOR.signal, opacity: r(fade) });
    });
  }

  function draw(fig, step) {
    var g = GEO(), t = STEP[step].t;
    fig.nestModule(window.BrainFigure, { x: BRAIN.x, y: BRAIN.y });
    zoom(fig, g, ease(ACT.zoom.start, ACT.zoom.dur, t));
    g.cells.forEach(function (s) {
      var k = ease(s.appear, ACT.cells.fade, t);
      if (k <= 0) return;
      /* A cell grows into place from its body as it fades in. */
      var size = 0.6 + 0.4 * k;
      fig.raw('<g style="opacity:' + r(k) + '">');
      fig.nest({ x: s.x * (1 - size), y: s.y * (1 - size), scale: size }, function (f) { cell(f, s, t); });
      fig.raw('</g>');
    });
    g.cells.forEach(function (s) { pulses(fig, s, t); });
    var last = g.cells[g.cells.length - 1];
    if (t >= last.appear) fig.text([COPY.cells], { x: PAGE.w / 2, y: CAPTION.y, role: 'slideDetail' });
    if (t >= ACT.fire) fig.text([COPY.signals], { x: PAGE.w / 2, y: CAPTION.y + ROW.line, role: 'slideDetail' });
  }

  window.NeuronZoomFigure = {
    width: PAGE.w, height: PAGE.h,
    title: 'Neuron Zoom', name: 'neuron-zoom', className: 'neuron-zoom-fig',
    ariaLabel: COPY.ariaLabel,
    steps: STEP.length, autoplay: 1000 / FPS, holds: [0, Math.round(ACT.hold * FPS)],
    draw: draw
  };
})();
