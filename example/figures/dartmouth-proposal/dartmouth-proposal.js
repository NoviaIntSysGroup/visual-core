/* Dartmouth Proposal — figure composition module.
   10.1 cm wide, height from content, about 6 s played on two presses. The 1955 proposal being
   typed: a sheet in a typewriter, drawn flat like Program Steps' computer. Frame 0: the blank
   sheet just fed in. Press 1: the title and byline are typed, keys striking, the sheet feeding
   up a line at a time. Press 2: the quote is typed, then a marker pen highlights its two
   halves, the feature of intelligence in the mind's colour and the machine that simulates it
   in the machine's. The type is monospace, so a character is 0.6 × its size wide, and lines,
   the print point and highlights are placed by character count. */
(function () {
  /* 1 · Imports ------------------------------------------------------------ */
  var cm = window.Units.cm, TYPE = window.Config.figure.type;

  /* 2 · Canvas ------------------------------------------------------------- */
  /* The width of a two-column slide's column. */
  var PAGE = { w: cm(10.1), margin: cm(0.1) };

  /* 3 · Type --------------------------------------------------------------- */
  var TEXT = { head: TYPE.slideDetail.size, body: TYPE.slideBody.size };
  var ROW  = { head: TEXT.head * 1.3, body: TEXT.body * 1.3 };
  var ADVANCE = 0.6;   /* a monospace character's width, × its size */

  /* 4 · Colour ------------------------------------------------------------- */
  var COLOR = { line: 'var(--text)', paper: 'var(--graphic-soft)', metal: 'var(--graphic-neutral)',
                mind: 'var(--graphic-secondary-tint)', machine: 'var(--graphic-primary-tint)' };

  /* 5 · Layout knobs ------------------------------------------------------- */
  var LINE = { outline: 'var(--line-width-strong)' };
  /* The sheet, centred, `w` wide; its text `pad` in from its edges. */
  var SHEET = { w: cm(8.2), pad: cm(0.4), radius: 1.5 };
  var GAP = { byline: cm(0.15), text: cm(0.35) };   /* above the byline, and above the quote */
  /* The typewriter under the sheet: the platen, a roller `clear` below the line being typed,
     with a knob at each end; the body below it, `slant` narrower at its top; three staggered
     rows of keys and a space bar, each a cap on a side `depth` deep that a struck key's cap
     sinks onto. The print point is a small mark on the platen. */
  var PLATEN = { w: cm(8.8), h: cm(0.4), clear: 3.5, knob: cm(0.17) };
  var BODY = { w: cm(9.6), h: cm(1.55), slant: cm(0.35), radius: 1.5 };
  var KEYS = { rows: [9, 8, 7], pitch: cm(0.62), row: cm(0.27), top: cm(0.25), r: 2.6, depth: 1.6 };
  var SPACE = { w: cm(2.6), h: 3.2, gap: cm(0.12) };   /* gap: below the last key row */
  var MARK = { w: 3.2, h: 2.4 };
  /* A marker stroke behind a line's text, from `rise` × size above its baseline, `h` × size
     tall, overhanging the text by `over` at each end. */
  var MARKER = { rise: 0.8, h: 1.05, over: 1.5, radius: 1.5 };

  /* 6 · Content ------------------------------------------------------------ */
  /* Seconds. Typing runs at `cps` characters a second from `start`; once the head is typed,
     playback waits `rest` and holds, and the quote starts `rest` after the hold. A new line
     feeds up over `feed`; once the quote is typed, each highlight draws over `mark`, in turn. */
  var ACT = { cps: 62, start: 0.1, rest: 0.2, feed: 0.12, mark: 0.6 };
  var COPY = {
    title: 'A PROPOSAL FOR THE DARTMOUTH SUMMER RESEARCH PROJECT ON ARTIFICIAL INTELLIGENCE',
    byline: ['McCarthy, Minsky, Rochester, Shannon', 'August 31, 1955'],
    text: '… on the basis of the conjecture that every aspect of learning or any other feature '
      + 'of intelligence can in principle be so precisely described that a machine can be made to '
      + 'simulate it. …',
    highlights: [
      { phrase: 'every aspect of learning or any other feature of intelligence', color: 'mind' },
      { phrase: 'a machine can be made to simulate it', color: 'machine' }
    ],
    ariaLabel: 'A typewriter types the 1955 proposal for the Dartmouth summer research project '
      + 'on artificial intelligence, by McCarthy, Minsky, Rochester and Shannon: on the basis of '
      + 'the conjecture that every aspect of learning or any other feature of intelligence can in '
      + 'principle be so precisely described that a machine can be made to simulate it.'
  };

  /* 7 · Steps -------------------------------------------------------------- */
  /* Two presses: the blank sheet plays to the typed title and byline, then on through the
     text and its highlights. The times fall out of the typing's length. */
  var TIME = {};
  TIME.hold = ACT.start + GEO().head / ACT.cps + ACT.rest;
  TIME.text = TIME.hold + ACT.rest;
  TIME.typed = TIME.text + (GEO().total - GEO().head) / ACT.cps;
  TIME.end = TIME.typed + COPY.highlights.length * ACT.mark;
  var PLAY = window.Figure.beats([{}, { dur: TIME.hold }, { dur: TIME.end - TIME.hold }]);

  /* 8 · Derived ------------------------------------------------------------ */
  /* Laid out as the last frame shows it, the sheet's top at the margin and, once the quote is
     typed, the sheet fed up one more line, to an empty one at the print point. Each line: its text and size, where it starts in its block's text
     (`from`) and in the typing order (`at`), and its baseline start. `head` is the length of
     the title and byline. */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var cx = PAGE.w / 2, sheet = { x: cx - SHEET.w / 2, y: PAGE.margin, w: SHEET.w };
    var inner = SHEET.w - 2 * SHEET.pad, lines = [], at = 0;
    function block(kind, text, size, rowH, top) {
      var rows = wrap(text, Math.floor(inner / (size * ADVANCE)));
      rows.forEach(function (l, i) {
        var w = l.text.length * size * ADVANCE;
        var x = kind === 'text' ? sheet.x + SHEET.pad : cx - w / 2;
        lines.push({ kind: kind, text: l.text, size: size, from: l.from, at: at, x: x, y: top + i * rowH });
        at += l.text.length;
      });
      return top + (rows.length - 1) * rowH;
    }
    var y = block('title', COPY.title, TEXT.head, ROW.head, sheet.y + SHEET.pad + TEXT.head);
    y = block('byline', COPY.byline[0], TEXT.head, ROW.head, y + GAP.byline + ROW.head);
    y = block('byline', COPY.byline[1], TEXT.head, ROW.head, y + ROW.head);
    var head = at;
    y = block('text', COPY.text, TEXT.body, ROW.body, y + GAP.text + ROW.body) + ROW.body;
    lines.push({ kind: 'text', text: '', size: TEXT.body, from: COPY.text.length, at: at, x: sheet.x + SHEET.pad, y: y });
    var platen = { x: cx - PLATEN.w / 2, y: y + PLATEN.clear, w: PLATEN.w, h: PLATEN.h };
    var body = { x: cx - BODY.w / 2, y: platen.y + platen.h / 2, w: BODY.w, h: BODY.h };
    var keys = [];
    KEYS.rows.forEach(function (n, j) {
      for (var i = 0; i < n; i++) {
        keys.push({ x: cx + (i - (n - 1) / 2) * KEYS.pitch, y: body.y + platen.h / 2 + KEYS.top + j * KEYS.row });
      }
    });
    _geo = {
      sheet: sheet, lines: lines, head: head, total: at, print: y, platen: platen, body: body, keys: keys,
      space: { x: cx, y: keys[keys.length - 1].y + KEYS.r + KEYS.depth + SPACE.gap + SPACE.h / 2 },
      h: body.y + body.h + PAGE.margin
    };
    return _geo;
  }

  /* 9 · Helpers → draw → export -------------------------------------------- */
  function r(v) { return Math.round(v * 1000) / 1000; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  /* A fixed pseudo-random number in [0, 1) for each integer: which key strikes. */
  function hash(a) { var s = Math.sin(a * 127.1) * 43758.5453; return s - Math.floor(s); }

  /* Words of `text` greedily filled into lines of at most `cols` characters, each line with
     the index in `text` where it starts. */
  function wrap(text, cols) {
    var out = [], cur = '', from = 0, pos = 0;
    text.split(' ').forEach(function (w) {
      if (cur && (cur + ' ' + w).length > cols) { out.push({ text: cur, from: from }); cur = w; from = pos; }
      else cur = cur ? cur + ' ' + w : w;
      pos += w.length + 1;
    });
    out.push({ text: cur, from: from });
    return out;
  }

  /* The time character `i` of the typing order is struck. */
  function strikeAt(i) {
    var g = GEO();
    return i < g.head ? ACT.start + i / ACT.cps : TIME.text + (i - g.head) / ACT.cps;
  }
  /* Characters typed at t. */
  function typed(t) {
    var g = GEO();
    if (t < TIME.text) return Math.max(0, Math.min(g.head, Math.floor((t - ACT.start) * ACT.cps)));
    return Math.min(g.total, g.head + Math.floor((t - TIME.text) * ACT.cps));
  }

  /* The character struck to bring the count to `n`. */
  function struckChar(n) {
    var l = GEO().lines.filter(function (l) { return l.at < n; }).pop();
    return l.text.charAt(n - 1 - l.at);
  }

  /* How far the sheet sits below its last-frame place: the line being typed is on the print
     point, and a new line feeds up over `feed` from the one before. */
  function feed(t, n) {
    var g = GEO(), i = 0;
    while (i < g.lines.length - 1 && n >= g.lines[i + 1].at) i++;
    var down = g.print - g.lines[i].y;
    if (i === 0) return down;
    var before = g.print - g.lines[i - 1].y;
    return before + (down - before) * window.Figure.ease(t, strikeAt(g.lines[i].at), ACT.feed);
  }

  /* One highlight, drawn `k` (0 → 1) of the way along its phrase, line by line. */
  function highlight(fig, h, k) {
    var g = GEO(), start = COPY.text.indexOf(h.phrase), end = start + h.phrase.length;
    var left = Math.round(h.phrase.length * k);
    g.lines.forEach(function (l) {
      if (l.kind !== 'text' || left <= 0) return;
      var a = Math.max(start, l.from), b = Math.min(end, l.from + l.text.length, a + left);
      if (b <= a) return;
      left -= b - a;
      var c = l.size * ADVANCE, x = l.x + (a - l.from) * c - MARKER.over;
      fig.rect(x, l.y - MARKER.rise * l.size, (b - a) * c + 2 * MARKER.over, MARKER.h * l.size,
        { radius: MARKER.radius, fill: COLOR[h.color] });
    });
  }

  /* The sheet, `dy` below its last-frame place, shown only above the platen's middle. */
  function sheet(fig, n, dy, t, id) {
    var g = GEO(), s = g.sheet;
    fig.raw('<clipPath id="' + id + '"><rect x="0" y="0" width="' + r(PAGE.w) + '" height="' + r(g.body.y)
      + '"/></clipPath><g clip-path="url(#' + id + ')"><g transform="translate(0 ' + r(dy) + ')">');
    fig.rect(s.x, s.y, s.w, g.h, { radius: SHEET.radius, fill: COLOR.paper, stroke: COLOR.line, width: LINE.outline });
    COPY.highlights.forEach(function (h, i) {
      highlight(fig, h, clamp((t - TIME.typed - i * ACT.mark) / ACT.mark));
    });
    g.lines.forEach(function (l) {
      var k = Math.min(l.text.length, n - l.at);
      if (k > 0) {
        fig.text([l.text.slice(0, k)], { x: l.x, y: l.y, align: 'start', size: l.size,
          role: l.kind === 'text' ? 'slideBody' : 'slideDetail', weight: l.kind === 'title' ? 700 : 400,
          cls: 'dartmouth-proposal-type' });
      }
    });
    fig.raw('</g></g>');
  }

  /* The typewriter: body, keys and space bar (the one struck this frame pressed), the platen
     with its knobs, and the print-point mark under the next character. */
  function typewriter(fig, n, struck) {
    var g = GEO(), b = g.body, p = g.platen;
    fig.path('M ' + r(b.x + BODY.slant) + ',' + r(b.y) + ' H ' + r(b.x + b.w - BODY.slant)
      + ' L ' + r(b.x + b.w) + ',' + r(b.y + b.h) + ' H ' + r(b.x) + ' Z',
      { fill: COLOR.paper, stroke: COLOR.line, width: LINE.outline, cls: 'dartmouth-proposal-round' });
    var hit = !struck ? -1 : struckChar(n) === ' ' ? g.keys.length : Math.floor(hash(n) * g.keys.length);
    g.keys.forEach(function (k, i) { key(fig, k.x, k.y, 2 * KEYS.r, 2 * KEYS.r, i === hit); });
    key(fig, g.space.x, g.space.y, SPACE.w, SPACE.h, hit === g.keys.length);
    [p.x, p.x + p.w].forEach(function (x) {
      fig.circle(x, p.y + p.h / 2, PLATEN.knob, { fill: COLOR.metal, stroke: COLOR.line, width: LINE.outline });
    });
    fig.rect(p.x, p.y, p.w, p.h, { radius: p.h / 2, fill: COLOR.metal, stroke: COLOR.line, width: LINE.outline });
    var at = g.lines.filter(function (l) { return l.at <= n && n <= l.at + l.text.length; }).pop() || g.lines[0];
    var x = at.x + (n - at.at + 0.5) * at.size * ADVANCE;
    fig.path('M ' + r(x) + ',' + r(p.y) + ' l ' + r(MARK.w / 2) + ',' + r(MARK.h) + ' h ' + r(-MARK.w) + ' Z', { fill: COLOR.line });
  }

  /* A key centred on (x, y), `w` wide and `h` tall: its side, then its cap, sunk if pressed. */
  function key(fig, x, y, w, h, pressed) {
    fig.rect(x - w / 2, y - h / 2, w, h + KEYS.depth,
      { radius: h / 2, fill: COLOR.metal, stroke: COLOR.line, width: LINE.outline });
    fig.rect(x - w / 2, y - h / 2 + (pressed ? KEYS.depth : 0), w, h,
      { radius: h / 2, fill: COLOR.paper, stroke: COLOR.line, width: LINE.outline });
  }

  function draw(fig, step) {
    var t = PLAY.at(step).t, n = typed(t);
    var struck = step > 0 && n > typed(PLAY.at(step - 1).t);
    sheet(fig, n, feed(t, n), t, 'dartmouth-proposal-' + step);
    typewriter(fig, n, struck);
  }

  window.DartmouthProposalFigure = {
    width: PAGE.w,
    get height() { return GEO().h; },   /* derived from the typed lines */
    title: 'Dartmouth Proposal', name: 'dartmouth-proposal', className: 'dartmouth-proposal-fig',
    ariaLabel: COPY.ariaLabel,
    steps: PLAY.steps, autoplay: PLAY.autoplay, holds: PLAY.holds,
    draw: draw
  };
})();
