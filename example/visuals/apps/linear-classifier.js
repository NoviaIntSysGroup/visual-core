/* Linear classifier, a project app: two classes of points in a plane, A and B, each an elongated
   cloud, lying side by side and overlapping a little. A unit direction w, turned by a slider, scores
   every point by s = w · x, its projection onto w, drawn as a dashed drop onto w's line. Under the plane, each class's kernel density over
   s, on a fixed height so a better w shows as taller, narrower peaks, and the share they overlap.
   Exposes window.LinearClassifier.render(spec), placed with an `app` block. Redraws on input only. */
(function () {
  var START = { angle: 35, seed: 7 };   /* w starts along the clouds, where the classes mix; a fixed seed, so print and thumbnails match */
  var COUNT = 50;                        /* points per class */
  /* Each class: its mean, then both clouds' direction in degrees and their spread along it and across it. */
  var MEANS = [[0.1, -0.85], [-0.1, 0.85]];
  var CLOUD = { deg: 35, along: 1.0, across: 0.35 };
  var UNIT = 33;                         /* points per unit, in the plane and on the score line alike */
  var PLANE = { w: 220, h: 200 };        /* the plane, its origin in the middle */
  /* The density plot under the plane: its gap, its height, the baseline of its labels below its axis, and the half-length of
     a tick. Gap + height put the axis 257 pt down, level with the score line of the slide's EmbeddingBestWFigure beside it. */
  var SCORES = { gap: 8, h: 49, labelGap: 25, labels: 32, tick: 4 };
  var ENDS = ['lower', 'higher'];
  var KDE = { bandwidth: 0.25, samples: 120 };
  var DOT = { r: 2.6, foot: 1.6, rug: 5 };       /* a point, its foot on w's line, and a score's tick */
  var HEAD = { length: 9, half: 4 };
  var W = 1.6;                           /* w's arrow length, in units */
  var NAMES = ['A', 'B'];

  var HALF = PLANE.w / 2 / UNIT;         /* the score line's reach each way, in units */
  var HEIGHT = PLANE.h + SCORES.gap + SCORES.h + SCORES.labels;

  /* Seeded random numbers (mulberry32), so one seed always draws the same points. */
  function random(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) { return Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand()); }
  function unit(deg) { var a = deg * Math.PI / 180; return [Math.cos(a), Math.sin(a)]; }

  /* The points of both classes: Gaussian along and across the clouds' direction, about each class's mean. */
  var POINTS = (function () {
    var rand = random(START.seed), u = unit(CLOUD.deg), points = [];
    MEANS.forEach(function (m, c) {
      for (var i = 0; i < COUNT; i++) {
        var a = gauss(rand) * CLOUD.along, b = gauss(rand) * CLOUD.across;
        points.push({ c: c, x: [m[0] + a * u[0] - b * u[1], m[1] + a * u[1] + b * u[0]] });
      }
    });
    return points;
  })();

  /* Under w at `deg`: every point's score, and each class's density sampled across the score line. */
  function fit(deg) {
    var w = unit(deg), scores = POINTS.map(function (p) { return p.x[0] * w[0] + p.x[1] * w[1]; });
    var norm = 1 / (COUNT * KDE.bandwidth * Math.sqrt(2 * Math.PI));
    var curves = MEANS.map(function (_, c) {
      var ys = [];
      for (var i = 0; i <= KDE.samples; i++) {
        var v = -HALF + 2 * HALF * i / KDE.samples, sum = 0;
        POINTS.forEach(function (p, k) { if (p.c === c) { var z = (v - scores[k]) / KDE.bandwidth; sum += Math.exp(-z * z / 2); } });
        ys.push(sum * norm);
      }
      return ys;
    });
    var overlap = 0, dv = 2 * HALF / KDE.samples;
    for (var i = 0; i <= KDE.samples; i++) overlap += Math.min(curves[0][i], curves[1][i]) * dv;
    return { deg: deg, w: w, scores: scores, curves: curves, overlap: overlap };
  }

  /* The tallest density over every whole-degree w, which the density plot's height stands for at every angle. */
  var _peak;
  function peak() {
    if (_peak) return _peak;
    _peak = 0;
    for (var d = 0; d < 180; d++) fit(d).curves.forEach(function (ys) { _peak = Math.max(_peak, Math.max.apply(null, ys)); });
    return _peak;
  }

  function r(n) { return Math.round(n * 100) / 100; }
  function pt(v) { return [PLANE.w / 2 + v[0] * UNIT, PLANE.h / 2 - v[1] * UNIT]; }
  function line(a, b, cls) {
    return '<line class="' + cls + '" x1="' + r(a[0]) + '" y1="' + r(a[1]) + '" x2="' + r(b[0]) + '" y2="' + r(b[1]) + '"/>';
  }
  function circle(p, radius, cls) { return '<circle class="' + cls + '" cx="' + r(p[0]) + '" cy="' + r(p[1]) + '" r="' + radius + '"/>'; }
  function text(x, y, words, cls) {
    return '<text class="linear-classifier-text ' + (cls || '') + '" x="' + r(x) + '" y="' + r(y) + '">' + words + '</text>';
  }

  /* The plane: its axes, w's line across it, a dashed drop from every point to its foot on that line, the feet and
     the points in their class's hue, then w. */
  function plane(f) {
    var o = pt([0, 0]), reach = Math.hypot(PLANE.w, PLANE.h) / 2 / UNIT;
    var out = line([0, o[1]], [PLANE.w, o[1]], 'linear-classifier-axis') + line([o[0], 0], [o[0], PLANE.h], 'linear-classifier-axis')
      + line(pt([-reach * f.w[0], -reach * f.w[1]]), pt([reach * f.w[0], reach * f.w[1]]), 'linear-classifier-line');
    POINTS.forEach(function (p, k) { out += line(pt(p.x), pt([f.scores[k] * f.w[0], f.scores[k] * f.w[1]]), 'linear-classifier-drop'); });
    POINTS.forEach(function (p, k) {
      out += circle(pt([f.scores[k] * f.w[0], f.scores[k] * f.w[1]]), DOT.foot, 'linear-classifier-foot is-' + p.c);
    });
    POINTS.forEach(function (p) { out += circle(pt(p.x), DOT.r, 'linear-classifier-point is-' + p.c); });
    var t = pt([W * f.w[0], W * f.w[1]]), ux = (t[0] - o[0]) / (W * UNIT), uy = (t[1] - o[1]) / (W * UNIT);
    var bx = t[0] - ux * HEAD.length, by = t[1] - uy * HEAD.length;
    return out + '<g class="linear-classifier-w is-w">' + line(o, [bx, by], '')
      + '<polygon points="' + [t, [bx - uy * HEAD.half, by + ux * HEAD.half], [bx + uy * HEAD.half, by - ux * HEAD.half]]
        .map(function (p) { return r(p[0]) + ',' + r(p[1]); }).join(' ') + '"/></g>';
  }

  /* Under the plane, the score line on the plane's scale: each class's density over it, every score as a tick, and its three ticks, the ends' meaning and the score's name. */
  function densities(f) {
    var top = PLANE.h + SCORES.gap, base = top + SCORES.h, scale = SCORES.h / peak();
    function x(v) { return PLANE.w / 2 + v * UNIT; }
    var out = '';
    f.curves.forEach(function (ys, c) {
      var d = 'M0 ' + base;
      ys.forEach(function (y, i) { d += ' L' + r(i / KDE.samples * PLANE.w) + ' ' + r(base - y * scale); });
      out += '<path class="linear-classifier-density is-' + c + '" d="' + d + ' L' + PLANE.w + ' ' + base + ' Z"/>';
    });
    POINTS.forEach(function (p, k) { out += line([x(f.scores[k]), base], [x(f.scores[k]), base - DOT.rug], 'linear-classifier-rug is-' + p.c); });
    out += line([0, base], [PLANE.w, base], 'linear-classifier-axis');
    [-HALF, 0, HALF].forEach(function (v) { out += line([x(v), base - SCORES.tick], [x(v), base + SCORES.tick], 'linear-classifier-axis'); });
    var ly = base + SCORES.labelGap;
    return out + text(0, ly, ENDS[0], 'is-start') + text(x(0), ly, '<tspan font-style="italic">s</tspan> = <tspan font-weight="bold">w</tspan> · <tspan font-weight="bold">x</tspan>')
      + text(PLANE.w, ly, ENDS[1], 'is-end');
  }

  function drawing(f) { return plane(f) + densities(f); }

  /* How far along its track the slider sits, which its track paints in w's hue. */
  function fill(deg) { return '--linear-classifier-fill:' + r(deg / 360 * 100) + '%'; }

  /* The markup with each $…$ drawn by MathJax, as the slide's own formulas are. */
  function typeset(html) {
    var el = document.createElement('div');
    el.innerHTML = html;
    if (window.Tex) Tex.typeset(el);
    return el.innerHTML;
  }

  function render() {
    var f = fit(START.angle);
    return typeset(''
      + '<div class="linear-classifier">'
      +   '<svg class="linear-classifier-plot" width="' + PLANE.w + '" height="' + HEIGHT + '" viewBox="0 0 ' + PLANE.w + ' ' + HEIGHT + '" role="img"'
      +     ' aria-label="Two classes of points in a plane, projected onto a direction w, with each class\'s density of scores s = w dot x below">' + drawing(f) + '</svg>'
      +   '<div class="linear-classifier-side">'
      +     NAMES.map(function (n, c) { return '<p class="linear-classifier-legend"><span class="linear-classifier-key is-' + c + '"></span>class ' + n + '</p>'; }).join('')
      +     '<p class="linear-classifier-legend"><span class="linear-classifier-key is-w"></span>$\\mathbf{w}$</p>'
      +     '<p>Overlap: <span data-shows="overlap">' + f.overlap.toFixed(2) + '</span></p>'
      +     '<div class="linear-classifier-control">'
      +       '<p>Angle of $\\mathbf{w}$: <span data-shows="angle">' + START.angle + '°</span></p>'
      +       '<input type="range" min="0" max="360" step="1" value="' + START.angle + '" style="' + fill(START.angle) + '" aria-label="Angle of w">'
      +     '</div>'
      +   '</div>'
      + '</div>');
  }

  document.addEventListener('input', function (e) {
    var app = e.target.closest && e.target.closest('.linear-classifier');
    if (!app) return;
    var deg = Number(e.target.value), f = fit(deg);
    e.target.setAttribute('style', fill(deg));
    app.querySelector('[data-shows="angle"]').textContent = deg + '°';
    app.querySelector('[data-shows="overlap"]').textContent = f.overlap.toFixed(2);
    app.querySelector('.linear-classifier-plot').innerHTML = drawing(f);
  });

  window.LinearClassifier = { render: render };
})();
