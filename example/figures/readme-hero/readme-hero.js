/* README figures — figure composition modules, all 17.2 cm wide so they show at one scale.
   ReadmeHeroDrawingFigure: 3 × 2 cm, a small three-node diagram: the drawing every figure reuses.
   ReadmeSlideFigure: 5.6 × 3.15 cm, that drawing on a 16:9 slide.
   ReadmeHeroFigure: the drawing framed as a web page, a slide, and a printed page, the core's name
   below; on the slide, a human's and an agent's cursor work on it together.
   ReadmeHowFigure: what decks and figures share, the two kits, and the decks and figures they make.
   ReadmeReuseFigure: one figure module, used on a slide, inside another figure, and as a file.
   ReadmeProjectsFigure: the core repo, and two project repos that hold it as a subtree. */
(function () {
  /* 1 · Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* 2 · Canvas ------------------------------------------------------------ */
  var PAGE = {
    w:        cm(17.2),
    margin:   cm(0.8),   /* page edge -> outermost content */
    radius:   cm(0.35),  /* the page's rounded corners, so each README image reads as a card */
    labelGap: cm(0.65),  /* hero: frame bottom -> label baseline */
    nameGap:  cm(1.45)   /* hero: label baseline -> name baseline */
  };
  var DRAWING = { w: cm(3), h: cm(2), scale: 0.8 };   /* scale: the same in every hero frame, so it reads as one drawing */

  /* 3 · Type -------------------------------------------------------------- */
  var TEXT = {
    label: TYPE.title.size * 1.3, name: TYPE.title.size * 2.8, tag: TYPE.title.size * 1.3,
    title: TYPE.title.size * 1.1, detail: TYPE.label.size * 0.9
  };
  var ROW = {
    tagDrop: TEXT.tag * 0.35,      /* tag's vertical centre -> its text baseline */
    rowDrop: TEXT.detail * 0.35,   /* a list row's vertical centre -> its text baseline */
    detail:  TEXT.detail * 1.4,    /* baseline to baseline: title -> detail, detail -> detail */
    ascent:  0.75,                 /* a line's top -> its baseline, in font sizes */
    descent: 0.25                  /* a line's baseline -> its bottom, in font sizes */
  };

  /* 4 · Colour ------------------------------------------------------------ */
  var COLOR = {
    frame: 'var(--text)', ink: 'var(--text)', bar: 'var(--graphic-neutral)',
    sheet: 'var(--graphic-soft)', edge: 'var(--text)', quiet: 'var(--edges)',
    nodes: ['var(--graphic-primary)', 'var(--graphic-secondary)', 'var(--graphic-tertiary)'],
    human: 'var(--accent-strong)', agent: 'var(--text)', outline: 'var(--background-plain)',
    pull: 'var(--graphic-primary)', push: 'var(--graphic-tertiary)'
  };
  /* A box's hue: its stroke, and its fill. */
  var HUE = {
    loads:   { stroke: 'var(--graphic-tertiary)',  fill: 'var(--graphic-tertiary-tint)' },
    kit:     { stroke: 'var(--graphic-primary)',   fill: 'var(--graphic-primary-tint)' },
    output:  { stroke: 'var(--graphic-secondary)', fill: 'var(--graphic-secondary-tint)' },
    plain:   { stroke: 'var(--edges)',             fill: 'var(--graphic-soft)' },
    core:    { stroke: 'var(--graphic-primary)',   fill: 'var(--graphic-primary-tint)' }
  };

  /* 5 · Layout knobs ------------------------------------------------------ */
  var LINE  = { frame: 'var(--line-width-very-strong)', thin: 'var(--line-width)', strong: 'var(--line-width-strong)' };
  var NODE  = { r: cm(0.36) };
  /* The three nodes' centres inside the drawing, as fractions of its width and height. */
  var SPOTS = [[0.2, 0.5], [0.8, 0.22], [0.8, 0.78]];
  /* The hero's frames, bottom-aligned, one gap apart. */
  var FRAME = {
    web:   { w: cm(4.6), h: cm(3.6) },
    slide: { w: cm(5.6), h: cm(3.15) },
    paper: { w: cm(3.0), h: cm(4.2) },
    radius: cm(0.12),
    inset:  cm(0.3)    /* frame edge -> its content */
  };
  var WEB   = { bar: cm(0.55), dot: cm(0.07), dotPitch: cm(0.22), address: cm(0.24) };
  var SLIDE = { title: { w: cm(2.2), h: cm(0.24) }, progress: cm(0.09) };
  var PAPER = { line: cm(0.09), pitch: cm(0.2), above: 3, below: 5, caption: 0.6, drawGap: cm(0.15) };
  /* A pointer of height h, its tip at (0, 0), as fractions of h. */
  var POINTER = [[0, 0], [0, 0.78], [0.21, 0.6], [0.34, 0.9], [0.45, 0.85], [0.32, 0.56], [0.58, 0.56]];
  var CURSOR = {
    h:    cm(0.8),
    tag:  { dx: cm(0.36), dy: cm(0.5), h: cm(0.62), pad: cm(0.18) },   /* tag's top-left, from the tip */
    /* Where each tip rests, in the drawing's fractions: on the lower-right rim of the blue node
       (human) and of the green one (agent), so neither pointer hides a node. */
    human: [0.304, 0.59], agent: [0.885, 0.35],
    shift: cm(0.45)   /* the hero slide's drawing, moved left so the agent's tag stays inside the frame */
  };
  var BOX = { padX: cm(0.3), padY: cm(0.25), radius: cm(0.12) };   /* every titled box */
  var HOW = {
    bandPad: cm(0.3),   /* band edge -> its heading and boxes */
    headGap: cm(0.2),   /* band heading bottom -> boxes top */
    colGap:  cm(0.5),   /* between the three columns */
    rowGap:  cm(0.9)    /* band -> kits -> outputs */
  };
  var REUSE = {
    cardW:    cm(4.4),
    trunk:    cm(1.8),    /* card right -> target frames left */
    frameW:   cm(3.6),
    rowGap:   cm(0.45),
    textGap:  cm(0.4),    /* target frame right -> its text */
    drawGap:  cm(0.2),    /* card's text bottom -> its drawing */
    nested:   0.4,        /* the drawing's scale inside the other figure */
    chip:     { w: cm(0.95), h: cm(1.2), gap: cm(0.35), fold: cm(0.25) },
    other:    { h: cm(2.0) }
  };
  var PROJ = {
    coreW: cm(4.6), projW: cm(6.4),
    rowH:  cm(0.55),    /* one folder row in a project */
    gap:   cm(0.6),     /* between the two projects */
    split: cm(0.12)     /* a project's pull and push arrows: each this far off its core/ row's centre */
  };

  /* 6 · Content ----------------------------------------------------------- */
  var COPY = {
    frames: [
      { id: 'web',   label: 'Web' },
      { id: 'slide', label: 'Presentations' },
      { id: 'paper', label: 'Publications' }
    ],
    name: 'visual-core',
    cursors: { human: 'you', agent: 'agent' },
    how: {
      band: 'Shared by decks and figures',
      loads: [
        { id: 'theme',   title: 'Theme',       detail: ['theme.css + your brand.css'] },
        { id: 'drawing', title: 'Drawing kit', detail: ['units · icons · diagram · charts'] },
        { id: 'math',    title: 'Math',        detail: ['LaTeX → vector SVG'] }
      ],
      kits: [
        { id: 'deck-kit',   title: 'Deck kit',   detail: ['templates · blocks · editor'] },
        { id: 'figure-kit', title: 'Figure kit', detail: ['cm canvas · nesting · export'] }
      ],
      outputs: [
        { id: 'decks',   title: 'Decks',   detail: ['decks/<name>/index.html', 'present live, or print to PDF'] },
        { id: 'figures', title: 'Figures', detail: ['figures/<name>/<name>.js', 'export SVG, PNG and PDF'] }
      ],
      imported: 'imported unchanged'
    },
    reuse: {
      card: { title: 'One figure module', detail: ['figures/<name>/<name>.js'] },
      targets: [
        { id: 'slide', title: 'On a slide',            detail: ['the deck’s figure block;', 'steps become fragments'] },
        { id: 'other', title: 'Inside another figure', detail: ['fig.nestModule, at its', 'authored size'] },
        { id: 'file',  title: 'As a file',             detail: ['SVG · 600 dpi PNG · vector PDF'] }
      ],
      panels: ['a', 'b'],
      files: ['SVG', 'PNG', 'PDF']
    },
    projects: {
      core: { title: 'visual-core', detail: ['the core repo'],
        folders: ['theme/', 'drawing-kit/', 'math/', 'deck-kit/', 'figure-kit/', 'landing/', 'tools/', 'skills/', 'example/'] },
      repos: [
        { title: 'Project A', detail: ['one repo, one audience'] },
        { title: 'Project B', detail: ['one repo, one audience'] }
      ],
      rows: [
        ['core/', 'the core, as ordinary files'],
        ['decks/', 'slide decks'],
        ['figures/', 'for slides and papers'],
        ['visuals/', 'brand, apps, assets'],
        ['index.html', 'landing page']
      ],
      pull: 'git subtree pull',
      push: 'git subtree push'
    },
    aria: {
      drawing: 'Three coloured nodes joined by arrows.',
      slide: 'A small diagram of three coloured nodes on a slide.',
      hero: 'The same small diagram of three coloured nodes shown three times: in a browser window labelled Web, '
        + 'on a slide labelled Presentations, where two cursors tagged you and agent work on it together, and on a '
        + 'printed page labelled Publications. Below them, the name visual-core.',
      how: 'Theme, drawing kit and math are shared by decks and figures. They feed the deck kit and the figure kit, '
        + 'which make decks and figures. A figure is imported into a deck unchanged.',
      reuse: 'One figure module is used three ways: on a slide through the deck’s figure block, inside '
        + 'another figure through fig.nestModule, and as an SVG, PNG or PDF file.',
      projects: 'The visual-core repo, and two project repos, each for one audience. Each holds the core as '
        + 'ordinary files in core/, beside its decks, its figures for slides and papers, and its visuals. Git '
        + 'subtree pull brings core updates into a project; git subtree push sends an agreed core change back.'
    }
  };

  /* 8 · Derived ----------------------------------------------------------- */
  /* A titled box's height, for a title and n detail lines. */
  function boxH(n) {
    return 2 * BOX.padY + ROW.ascent * TEXT.title + n * ROW.detail + ROW.descent * TEXT.detail;
  }

  var _hero;
  function HERO() {
    if (_hero) return _hero;
    var ids = COPY.frames.map(function (f) { return f.id; });
    var widths = ids.reduce(function (s, id) { return s + FRAME[id].w; }, 0);
    var gap = (PAGE.w - 2 * PAGE.margin - widths) / (ids.length - 1);
    var bottom = PAGE.margin + Math.max.apply(null, ids.map(function (id) { return FRAME[id].h; }));
    var x = PAGE.margin, box = {};
    ids.forEach(function (id) {
      box[id] = { x: x, y: bottom - FRAME[id].h, w: FRAME[id].w, h: FRAME[id].h };
      x += FRAME[id].w + gap;
    });
    var nameY = bottom + PAGE.labelGap + PAGE.nameGap;
    _hero = { box: box, labelY: bottom + PAGE.labelGap, nameY: nameY, h: nameY + PAGE.margin };
    return _hero;
  }

  var _how;
  function HOWGEO() {
    if (_how) return _how;
    var band = { x: PAGE.margin, y: PAGE.margin, w: PAGE.w - 2 * PAGE.margin };
    var colW = (band.w - 2 * HOW.bandPad - 2 * HOW.colGap) / 3;
    var colX = [0, 1, 2].map(function (i) { return band.x + HOW.bandPad + i * (colW + HOW.colGap); });
    var loadsY = band.y + HOW.bandPad + TEXT.detail + HOW.headGap;
    band.h = loadsY + boxH(1) + HOW.bandPad - band.y;
    var kitsY = band.y + band.h + HOW.rowGap;
    var outY = kitsY + boxH(1) + HOW.rowGap;
    _how = { band: band, colW: colW, colX: colX, loadsY: loadsY, kitsY: kitsY, outY: outY, h: outY + boxH(2) + PAGE.margin };
    return _how;
  }

  var _reuse;
  function REUSEGEO() {
    if (_reuse) return _reuse;
    var rowH = [FRAME.slide.h * REUSE.frameW / FRAME.slide.w, REUSE.other.h, REUSE.chip.h];
    var y = PAGE.margin, rows = rowH.map(function (h) { var r = { y: y, h: h }; y += h + REUSE.rowGap; return r; });
    var h = y - REUSE.rowGap + PAGE.margin;
    var cardH = boxH(1) + REUSE.drawGap + DRAWING.h + BOX.padY;
    var frameX = PAGE.margin + REUSE.cardW + REUSE.trunk;
    _reuse = {
      rows: rows, h: h, frameX: frameX, textX: frameX + REUSE.frameW + REUSE.textGap,
      card: { x: PAGE.margin, y: (h - cardH) / 2, w: REUSE.cardW, h: cardH }
    };
    return _reuse;
  }

  var _proj;
  function PROJGEO() {
    if (_proj) return _proj;
    var projH = boxH(1) + COPY.projects.rows.length * PROJ.rowH + BOX.padY;
    var x = PAGE.w - PAGE.margin - PROJ.projW;
    var repos = COPY.projects.repos.map(function (r, i) {
      return { x: x, y: PAGE.margin + i * (projH + PROJ.gap), w: PROJ.projW, h: projH };
    });
    /* The core box reaches just past the last project's core/ row, so every arrow runs straight. */
    var lastRow = repos[repos.length - 1].y + boxH(1) + PROJ.rowH;
    var core = { x: PAGE.margin, y: PAGE.margin, w: PROJ.coreW,
      h: Math.max(boxH(COPY.projects.core.detail.length + 1 + COPY.projects.core.folders.length), lastRow + BOX.padY - PAGE.margin) };
    var last = repos[repos.length - 1];
    _proj = { repos: repos, core: core, h: last.y + last.h + PAGE.margin };
    return _proj;
  }

  /* 9 · Helpers → draw → export ------------------------------------------- */

  /* ---- The shared drawing, and the frames it is shown in ---- */
  function drawDrawing(fig) {
    var d = window.Diagram.create(DRAWING.w, DRAWING.h, { className: 'readme-hero-drawing', ariaLabel: COPY.aria.drawing });
    SPOTS.forEach(function (p, i) {
      d.node('n' + i, {
        x: p[0] * DRAWING.w - NODE.r, y: p[1] * DRAWING.h - NODE.r, w: 2 * NODE.r, h: 2 * NODE.r,
        shape: 'circle', frame: true, appearance: { fill: COLOR.nodes[i], stroke: COLOR.nodes[i] }
      });
    });
    var edge = { arrow: true, appearance: { color: COLOR.edge } };
    d.edge('n0', 'n1', edge).edge('n0', 'n2', edge).edge('n1', 'n2', edge);
    fig.place(d.render('readme-hero-drawing'), { x: 0, y: 0, w: DRAWING.w });
  }

  /* The shared drawing at scale s, centred in the area. Returns a function from the drawing's fractions to the page. */
  function nestDrawing(fig, area, s) {
    s = s || DRAWING.scale;
    var x = area.x + (area.w - DRAWING.w * s) / 2, y = area.y + (area.h - DRAWING.h * s) / 2;
    fig.nestModule(window.ReadmeHeroDrawingFigure, { x: x, y: y, scale: s });
    return function (f) { return [x + f[0] * DRAWING.w * s, y + f[1] * DRAWING.h * s]; };
  }

  var _ctx;
  function textWidth(t, size) {
    _ctx = _ctx || document.createElement('canvas').getContext('2d');
    _ctx.font = '700 ' + size + 'px ' + window.Config.figure.font;
    return _ctx.measureText(t).width;
  }

  /* A collaboration cursor: a pointer with its tip at `tip`, and a tag naming who holds it. */
  function cursor(fig, tip, who) {
    var d = POINTER.map(function (p, i) {
      return (i ? 'L' : 'M') + (tip[0] + p[0] * CURSOR.h) + ' ' + (tip[1] + p[1] * CURSOR.h);
    }).join(' ') + ' Z';
    fig.path(d, { fill: COLOR[who], stroke: COLOR.outline, width: LINE.thin });
    var t = CURSOR.tag, x = tip[0] + t.dx, y = tip[1] + t.dy, label = COPY.cursors[who];
    fig.rect(x, y, textWidth(label, TEXT.tag) + 2 * t.pad, t.h, { fill: COLOR[who], radius: t.h / 2 });
    fig.text(label, { x: x + t.pad, y: y + t.h / 2 + ROW.tagDrop, align: 'start', role: 'title',
      size: TEXT.tag, weight: 700, cls: 'fig-on-fill' });
  }

  function sheet(fig, b) {
    fig.rect(b.x, b.y, b.w, b.h, { fill: COLOR.sheet, stroke: COLOR.frame, width: LINE.frame, radius: FRAME.radius });
  }

  function bar(fig, x, y, w, h, fill) {
    fig.rect(x, y, w, h, { fill: fill || COLOR.bar, radius: h / 2 });
  }

  function dot(fig, cx, cy, r, fill) {
    fig.path('M' + (cx - r) + ' ' + cy + ' a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0'
      + ' a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0 Z', { fill: fill });
  }

  /* A browser window: a top bar with three dots and an address field, the drawing below. */
  function web(fig, b) {
    sheet(fig, b);
    fig.rule(b.x, b.y + WEB.bar, b.x + b.w, b.y + WEB.bar, { stroke: COLOR.frame, width: LINE.thin });
    var cy = b.y + WEB.bar / 2;
    COLOR.nodes.forEach(function (c, i) { dot(fig, b.x + FRAME.inset + i * WEB.dotPitch, cy, WEB.dot, c); });
    var addrX = b.x + FRAME.inset + 3 * WEB.dotPitch;
    bar(fig, addrX, cy - WEB.address / 2, b.x + b.w - FRAME.inset - addrX, WEB.address);
    nestDrawing(fig, { x: b.x + FRAME.inset, y: b.y + WEB.bar + FRAME.inset,
      w: b.w - 2 * FRAME.inset, h: b.h - WEB.bar - 2 * FRAME.inset });
  }

  /* A 16:9 slide: a title, the drawing (moved left by shift), a progress bar along the bottom edge.
     Returns the drawing's `at`. */
  function slide(fig, b, shift) {
    sheet(fig, b);
    var top = b.y + FRAME.inset;
    bar(fig, b.x + FRAME.inset, top, SLIDE.title.w, SLIDE.title.h, COLOR.ink);
    var progressY = b.y + b.h - FRAME.inset - SLIDE.progress;
    bar(fig, b.x + FRAME.inset, progressY, (b.w - 2 * FRAME.inset) * 0.35, SLIDE.progress, COLOR.nodes[0]);
    var areaY = top + SLIDE.title.h + FRAME.inset;
    return nestDrawing(fig, { x: b.x + FRAME.inset - (shift || 0), y: areaY, w: b.w - 2 * FRAME.inset, h: progressY - FRAME.inset - areaY });
  }

  /* A printed page: text lines, the drawing as a figure with a caption line, more text lines. */
  function paper(fig, b) {
    sheet(fig, b);
    var x = b.x + FRAME.inset, w = b.w - 2 * FRAME.inset, y = b.y + FRAME.inset;
    function lines(n, y0) {
      for (var i = 0; i < n; i++) bar(fig, x, y0 + i * PAPER.pitch, i === n - 1 ? w * 0.6 : w, PAPER.line);
      return y0 + (n - 1) * PAPER.pitch + PAPER.line;
    }
    var aboveEnd = lines(PAPER.above, y);
    var belowStart = b.y + b.h - FRAME.inset - (PAPER.below - 1) * PAPER.pitch - PAPER.line;
    lines(PAPER.below, belowStart);
    var captionY = belowStart - PAPER.pitch - PAPER.line;
    bar(fig, x + w * (1 - PAPER.caption) / 2, captionY, w * PAPER.caption, PAPER.line);
    nestDrawing(fig, { x: x, y: aboveEnd + PAPER.drawGap, w: w, h: captionY - PAPER.drawGap - aboveEnd - PAPER.drawGap });
  }

  /* ---- Titled boxes, for the README's explanatory figures ---- */
  /* A framed box in the diagram, for arrows to reach by its id. */
  function boxNode(d, id, b, hue) {
    d.node(id, { x: b.x, y: b.y, w: b.w, h: b.h, frame: !!hue, radius: BOX.radius,
      appearance: hue ? { stroke: hue.stroke, fill: hue.fill } : null });
  }

  /* A bold title and detail lines, from the box's top-left. */
  function titled(fig, b, title, detail) {
    var x = b.x + BOX.padX, y = b.y + BOX.padY + ROW.ascent * TEXT.title;
    fig.text(title, { x: x, y: y, align: 'start', role: 'title', size: TEXT.title });
    detail.forEach(function (line, i) {
      fig.text(line, { x: x, y: y + (i + 1) * ROW.detail, align: 'start', role: 'label', size: TEXT.detail });
    });
  }

  function arrowLabel(fig, text, x, y) {
    fig.text(text, { x: x, y: y, role: 'subtitle', size: TEXT.detail });
  }

  /* ---- Hero ---- */
  function drawHero(fig) {
    var g = HERO();
    web(fig, g.box.web);
    var at = slide(fig, g.box.slide, CURSOR.shift);
    paper(fig, g.box.paper);
    cursor(fig, at(CURSOR.agent), 'agent');
    cursor(fig, at(CURSOR.human), 'human');
    COPY.frames.forEach(function (f) {
      var b = g.box[f.id];
      fig.text(f.label, { x: b.x + b.w / 2, y: g.labelY, role: 'title', size: TEXT.label });
    });
    fig.text(COPY.name, { x: PAGE.w / 2, y: g.nameY, role: 'title', size: TEXT.name });
  }

  /* ---- How it works: a band of what every page loads, the two kits, the two outputs ---- */
  function drawHow(fig) {
    var g = HOWGEO(), c = COPY.how;
    var d = window.Diagram.create(PAGE.w, g.h, { className: 'readme-how', ariaLabel: COPY.aria.how });
    boxNode(d, 'band', g.band, HUE.plain);
    var boxes = [];
    c.loads.forEach(function (it, i) { boxes.push([it, { x: g.colX[i], y: g.loadsY, w: g.colW, h: boxH(1) }, HUE.loads]); });
    /* Decks sit under the first column, figures under the last; the middle column carries the import. */
    [0, 2].forEach(function (col, i) {
      boxes.push([c.kits[i], { x: g.colX[col], y: g.kitsY, w: g.colW, h: boxH(1) }, HUE.kit]);
      boxes.push([c.outputs[i], { x: g.colX[col], y: g.outY, w: g.colW, h: boxH(2) }, HUE.output]);
    });
    boxes.forEach(function (bx) { boxNode(d, bx[0].id, bx[1], bx[2]); });
    var arrow = { arrow: true, appearance: { color: COLOR.edge } };
    var bandBottom = g.band.y + g.band.h;
    c.kits.forEach(function (k, i) {
      var cx = g.colX[i * 2] + g.colW / 2;
      d.edge({ x: cx, y: bandBottom }, k.id, arrow);
      d.edge(k.id, c.outputs[i].id, arrow);
    });
    d.edge('figures', 'decks', arrow);
    fig.place(d.render('readme-how'), { x: 0, y: 0, w: PAGE.w });

    fig.text(c.band, { x: g.band.x + HOW.bandPad, y: g.band.y + HOW.bandPad + ROW.ascent * TEXT.detail,
      align: 'start', role: 'subtitle', size: TEXT.detail });
    boxes.forEach(function (bx) { titled(fig, bx[1], bx[0].title, bx[0].detail); });
    arrowLabel(fig, c.imported, PAGE.w / 2, g.outY + boxH(2) / 2 - ROW.detail / 2);
  }

  /* ---- Reuse: one module card, arrows to a slide, another figure, and files ---- */
  /* Another figure: panel a holds the drawing, panel b a few bars. */
  function otherFigure(fig, b) {
    sheet(fig, b);
    var half = b.w / 2;
    COPY.reuse.panels.forEach(function (p, i) {
      fig.text(p, { x: b.x + i * half + FRAME.inset, y: b.y + FRAME.inset + ROW.ascent * TEXT.detail,
        align: 'start', role: 'title', size: TEXT.detail });
    });
    var top = b.y + FRAME.inset + TEXT.detail;
    nestDrawing(fig, { x: b.x, y: top, w: half, h: b.y + b.h - top }, REUSE.nested);
    var base = b.y + b.h - FRAME.inset, bw = (half - 2 * FRAME.inset) / 6;
    [0.45, 0.8, 0.6].forEach(function (f, i) {
      var h = f * (base - top - FRAME.inset);
      fig.rect(b.x + half + FRAME.inset + (2 * i + 0.5) * bw, base - h, bw, h, { fill: COLOR.nodes[i] });
    });
    fig.rule(b.x + half + FRAME.inset, base, b.x + b.w - FRAME.inset, base, { stroke: COLOR.frame, width: LINE.thin });
  }

  /* Three files, each a page with a folded corner and its format. */
  function files(fig, x, y) {
    var c = REUSE.chip;
    COPY.reuse.files.forEach(function (name, i) {
      var fx = x + i * (c.w + c.gap);
      fig.path('M' + fx + ' ' + y + ' H' + (fx + c.w - c.fold) + ' L' + (fx + c.w) + ' ' + (y + c.fold)
        + ' V' + (y + c.h) + ' H' + fx + ' Z', { fill: COLOR.sheet, stroke: COLOR.frame, width: LINE.strong });
      fig.path('M' + (fx + c.w - c.fold) + ' ' + y + ' V' + (y + c.fold) + ' H' + (fx + c.w),
        { fill: 'none', stroke: COLOR.frame, width: LINE.strong });
      fig.text(name, { x: fx + c.w / 2, y: y + c.h * 0.65, role: 'title', size: TEXT.detail });
    });
  }

  function drawReuse(fig) {
    var g = REUSEGEO(), c = COPY.reuse;
    var d = window.Diagram.create(PAGE.w, g.h, { className: 'readme-reuse', ariaLabel: COPY.aria.reuse });
    boxNode(d, 'card', g.card, HUE.output);
    var mid = g.card.x + g.card.w + REUSE.trunk / 2;
    c.targets.forEach(function (t, i) {
      var r = g.rows[i];
      boxNode(d, t.id, { x: g.frameX, y: r.y, w: REUSE.frameW, h: r.h }, null);
      d.edge('card', t.id, { route: 'hvh', mid: mid, arrow: true, appearance: { color: COLOR.edge } });
    });
    fig.place(d.render('readme-reuse'), { x: 0, y: 0, w: PAGE.w });

    titled(fig, g.card, c.card.title, c.card.detail);
    nestDrawing(fig, { x: g.card.x, y: g.card.y + boxH(1), w: g.card.w, h: REUSE.drawGap * 2 + DRAWING.h }, 1);
    fig.nestModule(window.ReadmeSlideFigure, { x: g.frameX, y: g.rows[0].y, scale: REUSE.frameW / FRAME.slide.w });
    otherFigure(fig, { x: g.frameX, y: g.rows[1].y, w: REUSE.frameW, h: g.rows[1].h });
    files(fig, g.frameX, g.rows[2].y);
    c.targets.forEach(function (t, i) {
      var r = g.rows[i], bh = boxH(t.detail.length) - 2 * BOX.padY;
      titled(fig, { x: g.textX - BOX.padX, y: r.y + (r.h - bh) / 2 - BOX.padY }, t.title, t.detail);
    });
  }

  /* ---- Projects: the core repo, two project repos holding it as core/, subtree arrows ---- */
  function drawProjects(fig) {
    var g = PROJGEO(), c = COPY.projects;
    var d = window.Diagram.create(PAGE.w, g.h, { className: 'readme-projects', ariaLabel: COPY.aria.projects });
    boxNode(d, 'core', g.core, HUE.core);
    g.repos.forEach(function (b, i) { boxNode(d, 'repo' + i, b, HUE.plain); });
    var coreRight = g.core.x + g.core.w;
    var rowCy = function (b) { return b.y + boxH(1) + PROJ.rowH / 2; };   /* the core/ row, the first */
    var line = function (color) { return { arrow: true, appearance: { color: color, width: LINE.frame } }; };
    g.repos.forEach(function (b) {
      var cy = rowCy(b);
      d.edge({ x: coreRight, y: cy - PROJ.split }, { x: b.x, y: cy - PROJ.split }, line(COLOR.pull));
      d.edge({ x: b.x, y: cy + PROJ.split }, { x: coreRight, y: cy + PROJ.split }, line(COLOR.push));
    });
    fig.place(d.render('readme-projects'), { x: 0, y: 0, w: PAGE.w });

    titled(fig, g.core, c.core.title, c.core.detail.concat([''], c.core.folders));
    var midX = (coreRight + g.repos[0].x) / 2;
    g.repos.forEach(function (b, i) {
      titled(fig, b, c.repos[i].title, c.repos[i].detail);
      c.rows.forEach(function (row, j) {
        var top = b.y + boxH(1) + j * PROJ.rowH, base = top + PROJ.rowH / 2 + ROW.rowDrop;
        if (j === 0) fig.rect(b.x + BOX.padX / 2, top, b.w - BOX.padX, PROJ.rowH, { fill: HUE.core.fill, radius: BOX.radius });
        fig.text(row[0], { x: b.x + BOX.padX, y: base, align: 'start', role: j ? 'label' : 'title', size: TEXT.detail });
        fig.text(row[1], { x: b.x + b.w - BOX.padX, y: base, align: 'end', role: 'subtitle', size: TEXT.detail });
      });
      var cy = rowCy(b);
      arrowLabel(fig, c.pull, midX, cy - PROJ.split - ROW.detail / 2);
      arrowLabel(fig, c.push, midX, cy + PROJ.split + ROW.detail);
    });
  }

  window.ReadmeHeroDrawingFigure = {
    width: DRAWING.w, height: DRAWING.h,
    title: 'README Hero Drawing', name: 'readme-hero-drawing', className: 'readme-hero-drawing-fig',
    ariaLabel: COPY.aria.drawing,
    draw: drawDrawing
  };

  window.ReadmeSlideFigure = {
    width: FRAME.slide.w, height: FRAME.slide.h,
    title: 'README Slide', name: 'readme-slide', className: 'readme-slide-fig',
    ariaLabel: COPY.aria.slide,
    draw: function (fig) { slide(fig, { x: 0, y: 0, w: FRAME.slide.w, h: FRAME.slide.h }); }
  };

  window.ReadmeHeroFigure = {
    width: PAGE.w,
    get height() { return HERO().h; },   /* derived from the frames */
    radius: PAGE.radius,
    title: 'README Hero', name: 'readme-hero', className: 'readme-hero-fig',
    ariaLabel: COPY.aria.hero,
    draw: drawHero
  };

  window.ReadmeHowFigure = {
    width: PAGE.w,
    get height() { return HOWGEO().h; },   /* derived from the rows */
    radius: PAGE.radius,
    title: 'README How It Works', name: 'readme-how-it-works', className: 'readme-how-fig',
    ariaLabel: COPY.aria.how,
    draw: drawHow
  };

  window.ReadmeReuseFigure = {
    width: PAGE.w,
    get height() { return REUSEGEO().h; },   /* derived from the target rows */
    radius: PAGE.radius,
    title: 'README Figure Reuse', name: 'readme-reuse', className: 'readme-reuse-fig',
    ariaLabel: COPY.aria.reuse,
    draw: drawReuse
  };

  window.ReadmeProjectsFigure = {
    width: PAGE.w,
    get height() { return PROJGEO().h; },   /* derived from the two projects */
    radius: PAGE.radius,
    title: 'README Projects', name: 'readme-projects', className: 'readme-projects-fig',
    ariaLabel: COPY.aria.projects,
    draw: drawProjects
  };
})();
