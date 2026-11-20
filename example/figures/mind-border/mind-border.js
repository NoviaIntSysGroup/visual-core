/* Mind Border — figure composition module.
   20.8 cm wide, height from content, 6.4 s played on four presses. A row of mental abilities,
   each an icon over its name, with one border across it: left of it is matter, which a machine
   could be built to do; right of it is a non-physical mind, which nothing can be built to do.
   Press 1: Descartes' border grows down, the colours spread out from it and the brackets draw
   out under each side. Each later press glides the border one box right; the box it crosses
   takes matter's colour where the border has passed, then flashes. Captions fade in turn. */
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
                border: 'var(--text)', bracket: 'var(--edges)' };
  var TINT  = { physical: 'var(--graphic-primary-tint)', mind: 'var(--graphic-secondary-tint)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  var BOX = {
    gap:     cm(0.25),
    radius:  cm(0.15),
    pad:     cm(0.25),   /* box edge -> icon top, and name bottom -> box edge */
    icon:    cm(0.9),
    iconGap: cm(0.15)    /* icon bottom -> name top */
  };
  var MARK = {
    overhang:   cm(0.15),  /* how far the border reaches past the boxes */
    bracketGap: cm(0.25),  /* box bottom -> bracket line */
    tick:       cm(0.15),  /* how far a bracket's ends turn up */
    labelGap:   cm(0.15),  /* bracket line -> its label's first line top */
    inset:      cm(0.1),   /* bracket end -> its side's outer box edge, and either side of the border */
    captionGap: cm(0.5)    /* bracket label bottom -> caption's first line top */
  };
  var LINE = { box: 'var(--line-width-strong)', border: 'var(--line-width-very-strong)',
               bracket: 'var(--line-width-strong)' };
  /* A crossed box's flash: its tint's peak opacity, and how far its ring grows, × the icon. */
  var FLASH = { peak: 0.5, ring: 1.8 };

  /* 6 · Content ------------------------------------------------------------ */
  /* Seconds within a beat; each press plays one beat of `beat`. The old caption fades out over
     `out`, then the new one in over `in`. Press 1: the border `drop`s, the colours `spread`
     and the `brackets` draw. Later presses: the border `glide`s, and the crossed box flashes
     over `flash` and its ring spreads over `ring`. */
  var ACT = { beat: 1.6, out: 0.25, in: 0.25,
              drop: { start: 0.3, dur: 0.5 }, spread: { start: 0.7, dur: 0.8 }, brackets: { start: 0.9, dur: 0.6 },
              glide: { start: 0.25, dur: 0.8 }, flash: 0.5, ring: 0.5 };
  var COPY = {
    abilities: [
      { name: 'Moving',      icon: 'moving' },
      { name: 'Sensing',     icon: 'sensing' },
      { name: 'Remembering', icon: 'remembering' },
      { name: 'Learning',    icon: 'learning' },
      { name: 'Reasoning',   icon: 'reasoning' },
      { name: 'Conversing',  icon: 'chat' },
      { name: 'Being aware', icon: 'being-aware' }
    ],
    sides: { physical: 'Could be built', mind: 'Cannot be built' },
    ariaLabel: 'Seven mental abilities in a row, from moving to being aware, with a border marking which of them are physical.'
  };

  /* 7 · Steps -------------------------------------------------------------- */
  /* One state per hold. `border` is how many abilities, from the left, count as matter; null
     before any answer. Each press plays from one state to the next. */
  var BEAT = [
    { border: null, caption: 'Which of these could a machine do, and which need a mind?' },
    { border: 3, caption: 'Descartes: moving, sensing and remembering are machinery; the rest needs a mind.' },
    { border: 4, caption: 'Others have drawn the border further right: learning could be built too.' },
    { border: 5, caption: 'Further right still: so could reasoning.' },
    { border: 6, caption: 'Far enough right, all we usually call intelligence could be built.' }
  ];
  /* Each press plays one beat. */
  BEAT.slice(1).forEach(function (b) { b.dur = ACT.beat; });
  var PLAY = window.Figure.beats(BEAT);

  /* 8 · Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var n = COPY.abilities.length;
    var boxW = (PAGE.w - 2 * PAGE.margin - (n - 1) * BOX.gap) / n;
    var borderTop = 0;
    var boxTop = borderTop + MARK.overhang;
    var boxH = 2 * BOX.pad + BOX.icon + BOX.iconGap + ROW.body;
    var borderBottom = boxTop + boxH + MARK.overhang;
    var bracketY = boxTop + boxH + MARK.bracketGap;
    var sideY = bracketY + MARK.labelGap + TEXT.body;
    var captionY = sideY - TEXT.body + ROW.body + MARK.captionGap + TEXT.body;
    _geo = {
      boxW: boxW, boxH: boxH, borderTop: borderTop, boxTop: boxTop, borderBottom: borderBottom,
      bracketY: bracketY, sideY: sideY,
      iconTop: boxTop + BOX.pad, nameY: boxTop + BOX.pad + BOX.icon + BOX.iconGap + TEXT.body,
      captionY: captionY,
      h: captionY + ROW.body - TEXT.body + MARK.overhang,
      boxX: function (i) { return PAGE.margin + i * (boxW + BOX.gap); },
      borderX: function (i) { return PAGE.margin + i * (boxW + BOX.gap) - BOX.gap / 2; }
    };
    return _geo;
  }

  /* 9 · Helpers → draw → export -------------------------------------------- */
  function r(v) { return Math.round(v * 1000) / 1000; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  /* Every icon in one side's colour, on its tinted box unless idle, shown only between x0 and x1. */
  function layer(fig, kind, x0, x1, id) {
    var g = GEO();
    if (x1 - x0 <= 0) return;
    var d = window.Diagram.create(PAGE.w, g.h, { className: 'mind-border-icons', ariaLabel: COPY.ariaLabel });
    fig.raw('<clipPath id="' + id + '-clip"><rect x="' + r(x0) + '" y="0" width="' + r(x1 - x0)
      + '" height="' + r(g.h) + '"/></clipPath><g clip-path="url(#' + id + '-clip)">');
    COPY.abilities.forEach(function (a, i) {
      var x = g.boxX(i);
      if (TINT[kind]) fig.rect(x, g.boxTop, g.boxW, g.boxH, { fill: TINT[kind], radius: BOX.radius });
      d.node('ability-' + i, {
        x: x + g.boxW / 2 - BOX.icon / 2, y: g.iconTop, w: BOX.icon, h: BOX.icon, icon: a.icon,
        appearance: window.Diagram.iconApp(COLOR[kind], { surface: TINT[kind] })
      });
    });
    fig.place(d.render(id), { x: 0, y: 0, w: PAGE.w });
    fig.raw('</g>');
  }

  /* A bracket under the boxes from x0 to x1, its ends turned up, its label centred under it. */
  function bracket(fig, x0, x1, label, alpha) {
    var g = GEO(), y = g.bracketY;
    fig.path('M' + r(x0) + ' ' + r(y - MARK.tick) + ' V' + r(y) + ' H' + r(x1) + ' V' + r(y - MARK.tick), {
      fill: 'none', stroke: COLOR.bracket, width: LINE.bracket
    });
    fig.fade(alpha, function () { fig.text([label], { x: (x0 + x1) / 2, y: g.sideY, role: 'slideBody' }); });
  }

  /* Box i's flash once the border has crossed it, `since` seconds ago: its tint, then a ring. */
  function flash(fig, i, since) {
    var g = GEO(), x = g.boxX(i), c = { x: x + g.boxW / 2, y: g.iconTop + BOX.icon / 2 };
    var glow = 1 - clamp(since / ACT.flash), ring = clamp(since / ACT.ring), rad = BOX.icon / 2 * (1 + ring * (FLASH.ring - 1));
    if (glow > 0) fig.rect(x, g.boxTop, g.boxW, g.boxH, { fill: COLOR.physical, opacity: r(FLASH.peak * glow), radius: BOX.radius });
    if (ring < 1) {
      fig.circle(c.x, c.y, rad, { fill: 'none', stroke: COLOR.physical, width: LINE.box, opacity: r(1 - ring) });
    }
  }

  /* The frame falls in the beat from state `from` to `to`, u seconds in. The first beat grows
     the border and spreads the colours out from it; later ones glide it and flash the box. */
  function draw(fig, step) {
    var g = GEO(), id = 'mind-border-' + step;
    var now = PLAY.at(step), u = now.u, from = now.from, to = now.to;
    var first = from.border === null, x, lo, hi, drop = 1, brackets = 1;
    if (first) {
      x = g.borderX(to.border);
      var spread = window.Figure.ease(u, ACT.spread.start, ACT.spread.dur);
      lo = x * (1 - spread); hi = x + (PAGE.w - x) * spread;
      drop = window.Figure.ease(u, ACT.drop.start, ACT.drop.dur);
      brackets = window.Figure.ease(u, ACT.brackets.start, ACT.brackets.dur);
    } else {
      var glide = window.Figure.ease(u, ACT.glide.start, ACT.glide.dur);
      x = g.borderX(from.border) + (g.borderX(to.border) - g.borderX(from.border)) * glide;
      lo = 0; hi = PAGE.w;
    }
    layer(fig, 'idle', 0, lo, id + '-idle-l');
    layer(fig, 'physical', lo, x, id + '-physical');
    layer(fig, 'mind', x, hi, id + '-mind');
    layer(fig, 'idle', hi, PAGE.w, id + '-idle-r');
    COPY.abilities.forEach(function (a, k) {
      fig.text([a.name], { x: g.boxX(k) + g.boxW / 2, y: g.nameY, role: 'slideBody' });
    });
    if (!first) {
      var since = u - ACT.glide.start - ACT.glide.dur;
      if (since >= 0) flash(fig, from.border, since);
    }
    if (drop > 0) fig.rule(x, g.borderTop, x, g.borderTop + (g.borderBottom - g.borderTop) * drop, { stroke: COLOR.border, width: LINE.border });
    if (brackets > 0) {
      var left = PAGE.margin + MARK.inset, right = PAGE.w - PAGE.margin - MARK.inset;
      var inL = x - MARK.inset, inR = x + MARK.inset;
      bracket(fig, inL - (inL - left) * brackets, inL, COPY.sides.physical, brackets);
      bracket(fig, inR, inR + (right - inR) * brackets, COPY.sides.mind, brackets);
    }
    var out = 1 - clamp(u / ACT.out), into = clamp((u - ACT.out) / ACT.in);
    fig.fade(out, function () { fig.text([from.caption], { x: PAGE.w / 2, y: g.captionY, role: 'slideBody' }); });
    fig.fade(into, function () { fig.text([to.caption], { x: PAGE.w / 2, y: g.captionY, role: 'slideBody' }); });
  }

  window.MindBorderFigure = {
    width: PAGE.w,
    get height() { return GEO().h; },   /* derived from the rows */
    title: 'Mind Border', name: 'mind-border', className: 'mind-border-fig', ariaLabel: COPY.ariaLabel,
    steps: PLAY.steps, autoplay: PLAY.autoplay, holds: PLAY.holds,
    draw: draw
  };
})();
