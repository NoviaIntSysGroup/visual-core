/* AI Umbrella — figure composition module.
   10.1 cm wide, height from content, about 2.4 s played on one press. How AI also became the
   name of its technology: everything built towards the vision, in the order they came, gathered
   under one name. Frame 0: a time arrow from 1955 to today. The press: each technology in turn
   lands on the arrow, a dot in the machine's colour, solid because it was built, its name
   above it on one of two staggered rows; then a bracket draws out over them all and names it. */
(function () {
  /* 1 · Imports ------------------------------------------------------------ */
  var cm = window.Units.cm, TYPE = window.Config.figure.type;

  /* 2 · Canvas ------------------------------------------------------------- */
  /* The width of a two-column slide's column. */
  var PAGE = { w: cm(10.1), margin: cm(0.1) };

  /* 3 · Type --------------------------------------------------------------- */
  var TEXT = { body: TYPE.slideBody.size, detail: TYPE.slideDetail.size };
  var ROW  = { detail: TEXT.detail * 1.3 };

  /* 4 · Colour ------------------------------------------------------------- */
  var COLOR = { machine: 'var(--graphic-primary)', axis: 'var(--edges)', bracket: 'var(--edges)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  /* The bracket: its label `labelGap` above its line, its ends turned down by `tick`, and the
     names' top row `gap` below it. The two rows of names hang `stemGap` above the arrow; a
     name's centre stays `reach` in from the arrow's ends. */
  var MARK = { labelGap: cm(0.15), tick: cm(0.15), gap: cm(0.2), inset: cm(0.1), stemGap: cm(0.08) };
  var AXIS = { gap: cm(0.25), reach: cm(1.2), head: cm(0.18), dateGap: cm(0.1) };   /* gap: lower row -> arrow */
  var DOT = { r: 2.4 };
  var LINE = { axis: 'var(--line-width-strong)', stem: 'var(--line-width)', bracket: 'var(--line-width-strong)' };

  /* 6 · Content ------------------------------------------------------------ */
  /* Seconds. Technology i lands over `land`, starting `start` + i × `stagger`; then the
     bracket. */
  var ACT = { start: 0.1, stagger: 0.2, land: 0.3 };
  var COPY = {
    technologies: ['Rules', 'Search', 'Expert systems', 'Neural networks', 'Machine learning',
                   'Deep learning', 'Language models'],
    dates: ['1955', 'today'],
    label: 'AI: the technology',
    ariaLabel: 'A time arrow from 1955 to today along which technologies appear in turn: rules, '
      + 'search, expert systems, neural networks, machine learning, deep learning and language '
      + 'models, all grouped under the label AI: the technology.'
  };
  ACT.bracket = { start: ACT.start + COPY.technologies.length * ACT.stagger + ACT.land, dur: 0.5 };

  /* 7 · Steps -------------------------------------------------------------- */
  /* One press: the bare arrow plays on to the bracket. */
  var PLAY = window.Figure.beats([{}, { dur: ACT.bracket.start + ACT.bracket.dur }]);

  /* 8 · Derived ------------------------------------------------------------ */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var n = COPY.technologies.length;
    var labelY = PAGE.margin + TEXT.body, bracketY = labelY + MARK.labelGap;
    var rows = [bracketY + MARK.gap + TEXT.detail];
    rows.push(rows[0] + ROW.detail);
    var axisY = rows[1] + AXIS.gap;
    var x0 = PAGE.margin + AXIS.reach, step = (PAGE.w - 2 * AXIS.reach - 2 * PAGE.margin) / (n - 1);
    _geo = {
      labelY: labelY, bracketY: bracketY, rows: rows, axisY: axisY,
      dateY: axisY + AXIS.dateGap + TEXT.detail,
      h: axisY + AXIS.dateGap + ROW.detail + PAGE.margin,
      x: function (i) { return x0 + i * step; }
    };
    return _geo;
  }

  /* 9 · Helpers → draw → export -------------------------------------------- */
  function r(v) { return Math.round(v * 1000) / 1000; }

  /* The time arrow, with its first and last dates under its ends. */
  function axis(fig) {
    var g = GEO(), x0 = PAGE.margin, x1 = PAGE.w - PAGE.margin, y = g.axisY, hd = AXIS.head;
    fig.rule(x0, y, x1 - hd / 2, y, { stroke: COLOR.axis, width: LINE.axis });
    fig.path('M' + r(x1) + ' ' + r(y) + ' L' + r(x1 - hd) + ' ' + r(y - hd / 2) + ' L' + r(x1 - hd) + ' ' + r(y + hd / 2) + ' Z',
      { fill: COLOR.axis });
    fig.text([COPY.dates[0]], { x: x0, y: g.dateY, align: 'start', role: 'slideDetail' });
    fig.text([COPY.dates[1]], { x: x1, y: g.dateY, align: 'end', role: 'slideDetail' });
  }

  /* Technology i, `k` (0 → 1) landed: its dot grows, its stem rises and its name fades in. */
  function technology(fig, i, k) {
    var g = GEO(), x = g.x(i), row = g.rows[i % 2], top = row + MARK.stemGap;
    fig.rule(x, g.axisY, x, g.axisY - (g.axisY - top) * k, { stroke: COLOR.machine, width: LINE.stem });
    fig.circle(x, g.axisY, DOT.r * k, { fill: COLOR.machine });
    fig.fade(k, function () { fig.text([COPY.technologies[i]], { x: x, y: row, role: 'slideDetail' }); });
  }

  /* The bracket over the names, drawn `k` (0 → 1) out from its middle, and its label. */
  function bracket(fig, k) {
    var g = GEO(), y = g.bracketY, mid = PAGE.w / 2;
    var half = (PAGE.w / 2 - PAGE.margin - MARK.inset) * k;
    fig.path('M' + r(mid - half) + ' ' + r(y + MARK.tick) + ' V' + r(y) + ' H' + r(mid + half) + ' V' + r(y + MARK.tick),
      { fill: 'none', stroke: COLOR.bracket, width: LINE.bracket });
    fig.fade(k, function () { fig.text([COPY.label], { x: mid, y: g.labelY, role: 'slideBody' }); });
  }

  function draw(fig, step) {
    var t = PLAY.at(step).t;
    axis(fig);
    COPY.technologies.forEach(function (name, i) {
      var k = window.Figure.ease(t, ACT.start + i * ACT.stagger, ACT.land);
      if (k > 0) technology(fig, i, k);
    });
    var k = window.Figure.ease(t, ACT.bracket.start, ACT.bracket.dur);
    if (k > 0) bracket(fig, k);
  }

  window.AiUmbrellaFigure = {
    width: PAGE.w,
    get height() { return GEO().h; },   /* derived from the rows */
    title: 'AI Umbrella', name: 'ai-umbrella', className: 'ai-umbrella-fig', ariaLabel: COPY.ariaLabel,
    steps: PLAY.steps, autoplay: PLAY.autoplay, holds: PLAY.holds,
    draw: draw
  };
})();
