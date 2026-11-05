/* Example Steps — figure composition module.
   18 × 6 cm, 3 steps. Three stages in a row light up one per step, with a
   caption under the row naming what the current stage does. The core's own
   worked stepped module: a diagram placed with fig.place, text with fig.text. */
(function () {
  /* ---- Imports ----------------------------------------------------------- */
  var cm   = window.Units.cm;
  var TYPE = window.Config.figure.type;

  /* ---- Canvas + placement spacings --------------------------------------- */
  var PAGE = {
    w:          cm(18),
    h:          cm(6),
    captionGap: cm(0.6)   /* row bottom -> caption top */
  };

  /* ---- Type --------------------------------------------------------------- */
  var TEXT = {
    label:   TYPE.label.size,
    caption: TYPE.slideBody.size
  };

  /* ---- Colour ------------------------------------------------------------- */
  var COLOR = { active: 'var(--graphic-secondary)', idle: 'var(--edges)', text: 'var(--text)' };
  var TINT  = { active: 'var(--graphic-secondary-tint)', idle: 'var(--graphic-soft)' };

  /* ---- Layout knobs ------------------------------------------------------- */
  var BOX = {
    w:        cm(3.6),
    h:        cm(3.2),
    icon:     cm(1.2),
    labelGap: cm(0.25),   /* icon bottom -> stage title top */
    pitch:    cm(5.5)     /* centre-to-centre stage spacing */
  };

  /* ---- Content ------------------------------------------------------------ */
  var COPY = {
    stages: [
      { id: 'draft',   title: 'Draft',   icon: 'doc',    caption: 'Write the first version.' },
      { id: 'review',  title: 'Review',  icon: 'search', caption: 'Check it against the brief.' },
      { id: 'publish', title: 'Publish', icon: 'check',  caption: 'Share the finished result.' }
    ],
    ariaLabel: 'Three stages in a row, draft, review and publish, linked by arrows; one stage is highlighted at a time.'
  };

  /* ---- Step model ---------------------------------------------------------
     One record per step: the stage that is lit. */
  var STEP = [
    { active: 'draft' },
    { active: 'review' },
    { active: 'publish' }
  ];

  /* ---- Derived geometry --------------------------------------------------- */
  var _geo;
  function GEO() {
    if (_geo) return _geo;
    var blockH = BOX.h + PAGE.captionGap + TEXT.caption;
    var rowTop = (PAGE.h - blockH) / 2;
    var rowCy = rowTop + BOX.h / 2;
    var iconTop = rowCy - (BOX.icon + BOX.labelGap + TEXT.label) / 2;
    _geo = {
      rowTop:   rowTop,
      iconTop:  iconTop,
      titleTop: iconTop + BOX.icon + BOX.labelGap,
      captionY: rowTop + BOX.h + PAGE.captionGap + TEXT.caption,
      cx: COPY.stages.map(function (s, i) {
        return PAGE.w / 2 + (i - (COPY.stages.length - 1) / 2) * BOX.pitch;
      })
    };
    return _geo;
  }

  /* ---- Helpers ------------------------------------------------------------ */
  function stage(id) {
    return COPY.stages.filter(function (s) { return s.id === id; })[0];
  }

  function stageNode(d, s, cx, on) {
    var g = GEO();
    var hue = on ? 'active' : 'idle';
    d.node(s.id, {
      x: cx - BOX.w / 2, y: g.rowTop, w: BOX.w, h: BOX.h,
      frame: true, appearance: { stroke: COLOR[hue], fill: TINT[hue] }
    });
    d.node(s.id + '-icon', {
      x: cx - BOX.icon / 2, y: g.iconTop, w: BOX.icon, h: BOX.icon,
      icon: s.icon, appearance: window.Diagram.iconApp(COLOR[hue])
    });
    window.Diagram.label(d, s.id + '-title', cx, g.titleTop, [s.title],
      { color: on ? COLOR.text : COLOR.idle });
  }

  /* ---- Draw --------------------------------------------------------------- */
  function draw(fig, step) {
    var g = GEO();
    var active = STEP[step].active;
    var d = window.Diagram.create(PAGE.w, PAGE.h, {
      className: 'example-steps',
      ariaLabel: COPY.ariaLabel + ' Step ' + (step + 1) + ' of ' + STEP.length + '.',
      fontSize: TEXT.label
    });

    COPY.stages.forEach(function (s, i) {
      stageNode(d, s, g.cx[i], s.id === active);
      if (i) d.edge(COPY.stages[i - 1].id, s.id, { arrow: true });
    });

    fig.place(d.render('example-steps-' + step), { x: 0, y: 0, w: PAGE.w });
    fig.text(stage(active).caption, { x: PAGE.w / 2, y: g.captionY, role: 'slideBody' });
  }

  window.ExampleStepsFigure = {
    width:     PAGE.w,
    height:    PAGE.h,
    title:     'Example Steps',
    name:      'example-steps',
    className: 'example-steps-fig',
    ariaLabel: COPY.ariaLabel,
    steps:     STEP.length,
    draw:      draw
  };
})();
