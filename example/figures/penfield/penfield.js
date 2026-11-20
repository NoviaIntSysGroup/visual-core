/* Penfield — figure composition module.
   4.0 × 2.35 cm with a 38 pt brain, 2.9 s played on two presses, laid out like Broca and
   Wernicke. A brain seen from the side, and an electrode wired to a stimulator marked with a
   bolt, held just off the motor cortex. Press 1: it touches there, the current is on (wire and
   bolt turn blue), the spot sparks, and a bubble with a moving figure and its line of text
   fade in. Press 2: it lifts, glides to the temporal lobe and touches; that spot sparks, and a
   thought bubble with music and its line fade in. Each bubble's trail rises from its spot. The
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
  /* Primary marks what happens: the stimulated spots and what each brings about. */
  var COLOR = { line: 'var(--text)', event: 'var(--graphic-primary)', ability: 'var(--graphic-secondary)',
                body: 'var(--graphic-soft)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  var LINE = { outline: 'var(--line-width-strong)', beam: 'var(--line-width-very-strong)' };
  /* Lengths are in points for a brain `markedAt` tall (figures/brain/), sized by `B.scaled`.
     Placed as Broca and Wernicke: the brain's top-left, a bubble in each top corner, and the
     text's baseline under the brain. The stimulated spots are the brain's motor and memory
     landmarks. The electrode points at a spot from below-left along `DIR` (from tip towards
     handle): a needle, then a handle; before it touches, it is `back` further out. Its wire
     runs to the stimulator on the left. */
  var BRAIN = B.scaled({ x: 29.8, y: 6 });
  var SPOT = { motor: B.landmarks.motor, memory: B.landmarks.memory };
  var SPARK = B.scaled({ r: 1.45, inner: 2.5, outer: 4.7 }), RAYS = 6;
  var ELECTRODE = B.scaled({ needle: 5.85, handle: 13, width: 3.25, back: 7.2 });
  var DIR = { x: -0.616, y: 0.788 };
  var STIMULATOR = B.scaled({ x: 5.5, y: 27.6, w: 13, h: 9.5, radius: 2, slack: 7.2 });
  /* The bolt, as fractions of the stimulator box. */
  var BOLT = [[0.58, 0.12], [0.34, 0.56], [0.5, 0.56], [0.42, 0.9], [0.68, 0.44], [0.52, 0.44], [0.62, 0.12]];
  /* Each spot's bubble: its top-left corner, and the bottom corner its trail runs to. */
  var BUBBLE = B.scaled({ w: 23.5, h: 13, icon: 10, motor: { x: 2.3, y: 6 }, memory: { x: 87.5, y: 6 } });
  var SIDE = { motor: 1, memory: -1 };   /* trail to the bottom right; to the bottom left */
  /* A bubble's trail: it starts `gap` past the spark, and ends `inset` in from the bubble's
     corner; each dot's place along it (0 → 1), and its radius. */
  var TRAIL = B.scaled({ gap: 1.45, inset: 4.5, r: [0.7, 1, 1.3] }), TRAIL_AT = [0.15, 0.45, 0.78];
  /* The two beamed notes in the thought bubble: each head's offset from its centre, its
     radii, and the stem's length. */
  var NOTE = B.scaled({ heads: [{ x: -2.9, y: 2.5 }, { x: 2.9, y: 1.8 }], rx: 1.45, ry: 1.1, stem: 5.4 });
  /* The first line of text's baseline, under the brain. The page is the drawing's width and
     ends under the second line. */
  var CAPTION = { y: BRAIN.y + B.height + ROW.line };
  var PAGE = { w: cm(4.0) * B.scale, h: CAPTION.y + ROW.line + TEXT.label / 3 };

  /* 6 · Content ------------------------------------------------------------ */
  /* Seconds. Each touch: the electrode closes in over `dur` from `start`, and the effect fades
     in over `fade` once it touches. Between them it lifts off over `lift`, then glides to the
     next spot over `glide`. Playback holds at `hold`, after the first effect. */
  var ACT = { touch: [{ start: 0.1, dur: 0.4 }, { start: 2.1, dur: 0.4 }], fade: 0.3,
              lift: { start: 1.0, dur: 0.3 }, glide: { start: 1.3, dur: 0.8 }, hold: 0.9, end: 2.9 };
  var COPY = {
    motor:  [{ t: 'Stimulation', cls: 'fig-accent-primary' }, { t: ' → movement' }],
    memory: [{ t: 'Stimulation', cls: 'fig-accent-primary' }, { t: ' → flashback' }],
    ariaLabel: 'A brain seen from the side. An electrode wired to a stimulator touches the motor '
      + 'cortex, a spark flashes there and a bubble shows a moving figure: stimulation causes '
      + 'movement. Then it touches the temporal lobe and a thought bubble with music appears: '
      + 'stimulation evokes an experience.'
  };

  /* 7 · Steps -------------------------------------------------------------- */
  /* Two presses: the electrode off the motor cortex plays to the first effect, then on to the
     second. */
  var PLAY = window.Figure.beats([{}, { dur: ACT.hold }, { dur: ACT.end - ACT.hold }]);

  /* 8 · Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    function at(p) { var q = window.BrainFigure.at(p); return { x: BRAIN.x + q.x, y: BRAIN.y + q.y }; }
    _geo = { spot: { motor: at(SPOT.motor), memory: at(SPOT.memory) } };
    return _geo;
  }

  /* 9 · Helpers → draw → export ------------------------------------------ */
  function r(v) { return Math.round(v * 100) / 100; }

  function ellipse(cx, cy, rx, ry) {
    return 'M ' + r(cx - rx) + ',' + r(cy) + ' A ' + r(rx) + ',' + r(ry) + ' 0 1 0 ' + r(cx + rx) + ',' + r(cy)
      + ' A ' + r(rx) + ',' + r(ry) + ' 0 1 0 ' + r(cx - rx) + ',' + r(cy) + ' Z';
  }

  /* A bubble in its top corner, its trail of dots rising from the spot, so the effect comes
     from there. */
  function bubble(fig, key, spot) {
    var b = BUBBLE[key], corner = SIDE[key] > 0 ? b.x + BUBBLE.w - TRAIL.inset : b.x + TRAIL.inset;
    var to = { x: corner, y: b.y + BUBBLE.h }, clear = SPARK.outer + TRAIL.gap;
    var dx = to.x - spot.x, dy = to.y - spot.y, len = Math.hypot(dx, dy);
    var from = { x: spot.x + dx / len * clear, y: spot.y + dy / len * clear };
    var paint = { fill: COLOR.body, stroke: COLOR.ability, width: LINE.outline };
    TRAIL_AT.forEach(function (at, i) {
      var x = from.x + (to.x - from.x) * at, y = from.y + (to.y - from.y) * at;
      fig.path(ellipse(x, y, TRAIL.r[i], TRAIL.r[i]), paint);
    });
    fig.rect(b.x, b.y, BUBBLE.w, BUBBLE.h, Object.assign({ radius: BUBBLE.h / 2 }, paint));
  }

  /* The moving figure inside the motor bubble: an icon node, placed on a diagram the page's size. */
  function mover(fig, step) {
    var b = BUBBLE.motor, d = window.Diagram.create(PAGE.w, PAGE.h, { className: 'penfield-icons' });
    d.node('mover', { x: b.x + (BUBBLE.w - BUBBLE.icon) / 2, y: b.y + (BUBBLE.h - BUBBLE.icon) / 2,
      w: BUBBLE.icon, h: BUBBLE.icon, icon: 'moving', appearance: window.Diagram.iconApp(COLOR.ability) });
    fig.place(d.render('penfield-icons-' + step), { x: 0, y: 0, w: PAGE.w });
  }

  /* Two beamed eighth notes inside the thought bubble. */
  function note(fig) {
    var cx = BUBBLE.memory.x + BUBBLE.w / 2, cy = BUBBLE.memory.y + BUBBLE.h / 2;
    var heads = NOTE.heads.map(function (o) { return { x: cx + o.x, y: cy + o.y }; });
    heads.forEach(function (h) {
      fig.path(ellipse(h.x, h.y, NOTE.rx, NOTE.ry), { fill: COLOR.ability });
      fig.rule(h.x + NOTE.rx, h.y, h.x + NOTE.rx, h.y - NOTE.stem, { stroke: COLOR.ability, width: LINE.outline });
    });
    fig.path('M ' + r(heads[0].x + NOTE.rx) + ',' + r(heads[0].y - NOTE.stem) + ' L ' + r(heads[1].x + NOTE.rx) + ','
      + r(heads[1].y - NOTE.stem), { fill: 'none', stroke: COLOR.ability, width: LINE.beam });
  }

  /* The stimulated spot: a dot with a ring of short rays flashing out from it. */
  function spark(fig, at) {
    fig.path(ellipse(at.x, at.y, SPARK.r, SPARK.r), { fill: COLOR.event });
    for (var i = 0; i < RAYS; i++) {
      var a = 2 * Math.PI * (i + 0.5) / RAYS, ux = Math.cos(a), uy = Math.sin(a);
      fig.rule(at.x + ux * SPARK.inner, at.y + uy * SPARK.inner, at.x + ux * SPARK.outer, at.y + uy * SPARK.outer,
        { stroke: COLOR.event, width: LINE.outline });
    }
  }

  /* The stimulator, a box with a bolt, and its wire to the handle's end; blue while live. */
  function stimulator(fig, end, out, live) {
    var b = STIMULATOR, from = { x: b.x + b.w, y: b.y + b.h / 2 }, hue = live ? COLOR.event : COLOR.line;
    fig.path('M ' + r(from.x) + ',' + r(from.y) + ' C ' + r(from.x + b.slack) + ',' + r(from.y) + ' '
      + r(end.x + out.x * b.slack) + ',' + r(end.y + out.y * b.slack) + ' ' + r(end.x) + ',' + r(end.y),
      { fill: 'none', stroke: hue, width: LINE.outline });
    fig.rect(b.x, b.y, b.w, b.h, { radius: b.radius, fill: COLOR.body, stroke: COLOR.line, width: LINE.outline });
    fig.path(BOLT.map(function (q, i) {
      return (i ? 'L ' : 'M ') + r(b.x + q[0] * b.w) + ',' + r(b.y + q[1] * b.h);
    }).join(' ') + ' Z', { fill: hue });
  }

  /* The electrode from its tip along `u`: a needle, then a handle; returns the handle's end. */
  function electrode(fig, tip, u) {
    var e = ELECTRODE, n = { x: -u.y * e.width / 2, y: u.x * e.width / 2 };
    var a = { x: tip.x + u.x * e.needle, y: tip.y + u.y * e.needle };
    var z = { x: a.x + u.x * e.handle, y: a.y + u.y * e.handle };
    fig.rule(tip.x, tip.y, a.x, a.y, { stroke: COLOR.line, width: LINE.outline });
    fig.path('M ' + [[a, 1], [z, 1], [z, -1], [a, -1]].map(function (c) {
      return r(c[0].x + n.x * c[1]) + ',' + r(c[0].y + n.y * c[1]);
    }).join(' L ') + ' Z', { fill: COLOR.body, stroke: COLOR.line, width: LINE.outline });
    return z;
  }


  /* Where the electrode's tip is at t, how far off its spot, and the spot it touches, if any. */
  function probe(g, t) {
    var u = DIR, keys = ['motor', 'memory'], a = ACT;
    var glide = window.Figure.ease(t, a.glide.start, a.glide.dur), second = t >= a.glide.start + a.glide.dur;
    var off = second ? 1 - window.Figure.ease(t, a.touch[1].start, a.touch[1].dur)
      : t < a.lift.start ? 1 - window.Figure.ease(t, a.touch[0].start, a.touch[0].dur) : window.Figure.ease(t, a.lift.start, a.lift.dur);
    var spot = window.Figure.mix(g.spot.motor, g.spot.memory, glide), back = off * ELECTRODE.back;
    return { tip: { x: spot.x + u.x * back, y: spot.y + u.y * back },
             touching: off === 0 ? keys[second ? 1 : 0] : null };
  }

  function draw(fig, step) {
    var g = GEO(), t = PLAY.at(step).t, p = probe(g, t);
    fig.nestModule(window.BrainFigure, { x: BRAIN.x, y: BRAIN.y });
    ['motor', 'memory'].forEach(function (key, i) {
      fig.fade(window.Figure.ease(t, ACT.touch[i].start + ACT.touch[i].dur, ACT.fade), function () {
        bubble(fig, key, g.spot[key]);
        if (key === 'motor') mover(fig, step); else note(fig);
        fig.text([COPY[key]], { x: PAGE.w / 2, y: CAPTION.y + i * ROW.line, role: 'slideDetail' });
      });
    });
    var end = electrode(fig, p.tip, DIR);
    stimulator(fig, end, DIR, !!p.touching);
    if (p.touching) spark(fig, g.spot[p.touching]);
  }

  window.PenfieldFigure = {
    width: PAGE.w, height: PAGE.h,
    title: 'Penfield: Stimulation', name: 'penfield', className: 'penfield-fig',
    ariaLabel: COPY.ariaLabel,
    steps: PLAY.steps, autoplay: PLAY.autoplay, holds: PLAY.holds,
    draw: draw
  };
})();
