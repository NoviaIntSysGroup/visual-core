/* AI Vision — figure composition module.
   10.1 cm wide, height from content, 1.5 s played on one press. The vision Dartmouth named:
   Mind Border's abilities of intelligence, all done by a machine. Frame 0: the abilities, in
   no side's colour. The press: each in turn takes the machine's colour; then a bracket draws
   out over them all and names it. */
(function () {
  /* 1 · Imports ------------------------------------------------------------ */
  var cm = window.Units.cm, TYPE = window.Config.figure.type;

  /* 2 · Canvas ------------------------------------------------------------- */
  /* The width of a two-column slide's column. */
  var PAGE = { w: cm(10.1), margin: cm(0.1) };

  /* 3 · Type --------------------------------------------------------------- */
  var TEXT = { body: TYPE.slideBody.size };

  /* 4 · Colour ------------------------------------------------------------- */
  var COLOR = { machine: 'var(--graphic-primary)', idle: 'var(--edges)', bracket: 'var(--edges)' };
  var TINT  = { machine: 'var(--graphic-primary-tint)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  var BOX = { gap: cm(0.2), radius: cm(0.15), pad: cm(0.2), icon: cm(0.8) };   /* pad: box edge -> icon */
  /* The bracket over the boxes: its line `gap` above them, its ends turned down by `tick`,
     inset from the outer box edges by `inset`; its label `labelGap` above its line. */
  var MARK = { gap: cm(0.2), tick: cm(0.15), inset: cm(0.1), labelGap: cm(0.15) };
  var LINE = { bracket: 'var(--line-width-strong)' };

  /* 6 · Content ------------------------------------------------------------ */
  /* Seconds. Box i turns over `turn`, starting `start` + i × `stagger`; then the bracket. */
  var ACT = { start: 0.1, stagger: 0.12, turn: 0.3, bracket: { start: 1.0, dur: 0.5 } };
  var COPY = {
    abilities: [
      { name: 'Moving',      icon: 'moving' },
      { name: 'Sensing',     icon: 'sensing' },
      { name: 'Remembering', icon: 'remembering' },
      { name: 'Learning',    icon: 'learning' },
      { name: 'Reasoning',   icon: 'reasoning' },
      { name: 'Conversing',  icon: 'chat' }
    ],
    label: 'AI: the vision',
    ariaLabel: 'Six abilities of intelligence, from moving to conversing, all imagined done by a '
      + 'machine, grouped under the label AI: the vision.'
  };

  /* 7 · Steps -------------------------------------------------------------- */
  /* One press: the abilities alone play on to the bracket. */
  var PLAY = window.Figure.beats([{}, { dur: ACT.bracket.start + ACT.bracket.dur }]);

  /* 8 · Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var n = COPY.abilities.length;
    var boxW = (PAGE.w - 2 * PAGE.margin - (n - 1) * BOX.gap) / n, boxH = BOX.icon + 2 * BOX.pad;
    var labelY = PAGE.margin + TEXT.body;
    var bracketY = labelY + MARK.labelGap, boxTop = bracketY + MARK.gap;
    _geo = {
      boxW: boxW, boxH: boxH, boxTop: boxTop, labelY: labelY, bracketY: bracketY,
      h: boxTop + boxH + PAGE.margin,
      boxX: function (i) { return PAGE.margin + i * (boxW + BOX.gap); }
    };
    return _geo;
  }

  /* 9 · Helpers → draw → export -------------------------------------------- */
  function r(v) { return Math.round(v * 1000) / 1000; }

  /* Ability i: its icon alone when idle; the machine's icon on a tinted box. */
  function box(fig, i, machine, id) {
    var g = GEO(), x = g.boxX(i), color = machine ? COLOR.machine : COLOR.idle;
    if (machine) fig.rect(x, g.boxTop, g.boxW, g.boxH, { fill: TINT.machine, radius: BOX.radius });
    var d = window.Diagram.create(PAGE.w, g.h, { className: 'ai-vision-icons', ariaLabel: COPY.ariaLabel });
    d.node('ability-' + i, {
      x: x + g.boxW / 2 - BOX.icon / 2, y: g.boxTop + BOX.pad, w: BOX.icon, h: BOX.icon,
      icon: COPY.abilities[i].icon, appearance: window.Diagram.iconApp(color, machine ? { surface: TINT.machine } : null)
    });
    fig.place(d.render(id), { x: 0, y: 0, w: PAGE.w });
  }

  /* The bracket over the boxes, drawn `k` (0 → 1) out from its middle, and its label. */
  function bracket(fig, k) {
    var g = GEO(), y = g.bracketY, mid = PAGE.w / 2;
    var half = (PAGE.w / 2 - PAGE.margin - MARK.inset) * k;
    fig.path('M' + r(mid - half) + ' ' + r(y + MARK.tick) + ' V' + r(y) + ' H' + r(mid + half) + ' V' + r(y + MARK.tick),
      { fill: 'none', stroke: COLOR.bracket, width: LINE.bracket });
    fig.fade(k, function () { fig.text([COPY.label], { x: mid, y: g.labelY, role: 'slideBody' }); });
  }

  function draw(fig, step) {
    var t = PLAY.at(step).t, id = 'ai-vision-' + step;
    COPY.abilities.forEach(function (a, i) {
      var k = window.Figure.ease(t, ACT.start + i * ACT.stagger, ACT.turn);
      fig.fade(1 - k, function () { box(fig, i, false, id + '-idle-' + i); });
      fig.fade(k, function () { box(fig, i, true, id + '-machine-' + i); });
    });
    var k = window.Figure.ease(t, ACT.bracket.start, ACT.bracket.dur);
    if (k > 0) bracket(fig, k);
  }

  window.AiVisionFigure = {
    width: PAGE.w,
    get height() { return GEO().h; },   /* derived from the rows */
    title: 'AI Vision', name: 'ai-vision', className: 'ai-vision-fig', ariaLabel: COPY.ariaLabel,
    steps: PLAY.steps, autoplay: PLAY.autoplay, holds: PLAY.holds,
    draw: draw
  };
})();
