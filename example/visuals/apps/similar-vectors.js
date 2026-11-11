/* Similar vectors, a project app: a template w of 9 numbers, a 3 × 3 shape (plus, X, T) or random,
   against 50,000 random unit vectors x of 9 numbers. Right, the histogram of every x · w, with a
   0.1-wide range picked by the slider under it or a click on a bar; left, w and four x from that
   range, drawn as lines over their numbers or as 3 × 3 images, the legend's keys drawn to match.
   Exposes window.SimilarVectors.render(spec), placed with an `app` block. Redraws on input only. */
(function () {
  var COUNT = 50000;
  var SIDE = 3, DIMS = SIDE * SIDE;
  /* The shape templates, X on (+1) and a dot off (−1), and the buttons that pick them. */
  var SHAPES = { plus: ['.X.', 'XXX', '.X.'], x: ['X.X', '.X.', 'X.X'], t: ['XXX', '.X.', '.X.'] };
  var TEMPLATES = [['plus', 'Plus'], ['x', 'X'], ['t', 'T'], ['random', 'Random']];
  var VIEWS = [['lines', 'Lines'], ['image', 'Images']];
  var START = { template: 'random', view: 'lines', centre: 0, seed: 1 };   /* a fixed first seed, so print and thumbnails match */
  var SHOWN = 4;                  /* x vectors drawn beside w, two by two as images */
  var BIN = 0.05;                 /* histogram bar width */
  var HALF = 0.05;                /* half the picked range, which is two bars wide */
  var PLOT = { w: 400, h: 210, left: 30, right: 10, top: 10, bottom: 24 };
  var DOT = 2.5;                  /* radius of a number's dot on its line */
  var IMAGE = { big: 50, small: 22, gap: 2, row: 14 };   /* w's pixel, an x's pixel, between pixels, between the x */

  var apps = {};                  /* each placed app's state, by its data-app id */
  var made = 0;

  function normalise(v, o, n) {
    var sum = 0, i;
    for (i = 0; i < n; i++) sum += v[o + i] * v[o + i];
    var length = Math.sqrt(sum);
    for (i = 0; i < n; i++) v[o + i] /= length;
    return v;
  }

  var SHAPE_W = {};
  Object.keys(SHAPES).forEach(function (name) {
    var v = new Float32Array(DIMS);
    for (var i = 0; i < DIMS; i++) v[i] = SHAPES[name][Math.floor(i / SIDE)].charAt(i % SIDE) === 'X' ? 1 : -1;
    SHAPE_W[name] = normalise(v, 0, DIMS);
  });

  /* Seeded random numbers (mulberry32), so one seed always draws the same vectors. */
  function random(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* `count` random unit vectors, flat: Gaussian numbers, then normalised, which spreads them evenly
     over the sphere, where normalising uniform numbers would favour the corners of the box. */
  function unitVectors(count, rand) {
    var v = new Float32Array(count * DIMS);
    for (var i = 0; i < v.length; i += 2) {   /* Box–Muller: two Gaussian numbers per pair of draws */
      var radius = Math.sqrt(-2 * Math.log(1 - rand())), turn = 2 * Math.PI * rand();
      v[i] = radius * Math.cos(turn);
      if (i + 1 < v.length) v[i + 1] = radius * Math.sin(turn);
    }
    for (var k = 0; k < count; k++) normalise(v, k * DIMS, DIMS);
    return v;
  }

  /* The random vectors for a seed: every x, and the random template. */
  function generate(seed, template, view, centre) {
    var rand = random(seed);
    var s = { seed: seed, view: view, rand: rand, xs: unitVectors(COUNT, rand), random: unitVectors(1, rand) };
    return score(s, template, centre);
  }

  /* Takes a template as w: every x · w, and the histogram's counts. */
  function score(s, template, centre) {
    var w = template === 'random' ? s.random : SHAPE_W[template];
    var dots = new Float32Array(COUNT), bins = new Int32Array(Math.round(2 / BIN));
    for (var k = 0; k < COUNT; k++) {
      var sum = 0, o = k * DIMS;
      for (var i = 0; i < DIMS; i++) sum += s.xs[o + i] * w[i];
      dots[k] = sum;
      bins[Math.min(bins.length - 1, Math.floor((sum + 1) / BIN))]++;
    }
    s.template = template;
    s.w = w;
    s.dots = dots;
    s.bins = bins;
    return pick(s, centre);
  }

  /* Picks the range around `centre`: how many x fall in it, and up to SHOWN of them at random. */
  function pick(s, centre) {
    var inside = [];
    for (var k = 0; k < COUNT; k++) if (Math.abs(s.dots[k] - centre) <= HALF) inside.push(k);
    for (var i = 0; i < Math.min(SHOWN, inside.length); i++) {
      var j = i + Math.floor(s.rand() * (inside.length - i));
      var t = inside[i]; inside[i] = inside[j]; inside[j] = t;
    }
    s.centre = centre;
    s.inside = inside.length;
    s.picked = inside.slice(0, SHOWN);
    return s;
  }

  function r(n) { return Math.round(n * 100) / 100; }
  function fixed(n) { return (Math.abs(n) < 0.005 ? 0 : n).toFixed(2); }
  function text(x, y, words, cls) {
    return '<text class="similar-vectors-text ' + (cls || '') + '" x="' + r(x) + '" y="' + r(y) + '">' + words + '</text>';
  }
  var INNER = { w: PLOT.w - PLOT.left - PLOT.right, h: PLOT.h - PLOT.top - PLOT.bottom };
  /* Where a dot product sits across the histogram, in plot points. */
  function across(t) { return PLOT.left + (t + 1) / 2 * INNER.w; }

  /* Left plot, as lines: each vector a line over its numbers, index i across, value up; w thick,
     the x thin. A unit vector's numbers lie between −1 and 1. */
  function lines(s) {
    function x(i) { return PLOT.left + i / (DIMS - 1) * INNER.w; }
    function y(v) { return PLOT.top + (1 - v) / 2 * INNER.h; }
    function vector(flat, offset, cls) {
      var d = '', dots = '';
      for (var i = 0; i < DIMS; i++) {
        d += (i ? ' L' : 'M') + r(x(i)) + ' ' + r(y(flat[offset + i]));
        dots += '<circle cx="' + r(x(i)) + '" cy="' + r(y(flat[offset + i])) + '" r="' + DOT + '"/>';
      }
      return '<g class="similar-vectors-line ' + cls + '"><path d="' + d + '"/>' + dots + '</g>';
    }
    var bottom = PLOT.h - PLOT.bottom;
    var out = '<line class="similar-vectors-axis" x1="' + PLOT.left + '" y1="' + r(y(0)) + '" x2="' + (PLOT.w - PLOT.right) + '" y2="' + r(y(0)) + '"/>'
      + text(PLOT.left - 6, y(0), '0', 'is-end')
      + text(x(0), bottom + 16, '1') + text(x(DIMS - 1), bottom + 16, String(DIMS))
      + text(PLOT.w / 2, bottom + 16, 'index <tspan font-style="italic">i</tspan>');
    s.picked.forEach(function (k) { out += vector(s.xs, k * DIMS, 'is-x'); });
    return out + vector(s.w, 0, 'is-w');
  }

  /* One vector as a 3 × 3 image at (x, y): each pixel its hue, at full strength for the vector's
     largest number and none for its smallest, over a pale backing. */
  function image(flat, offset, x, y, pixel, cls) {
    var low = Infinity, high = -Infinity, i;
    for (i = 0; i < DIMS; i++) { low = Math.min(low, flat[offset + i]); high = Math.max(high, flat[offset + i]); }
    var out = '<g class="similar-vectors-image ' + cls + '">';
    for (i = 0; i < DIMS; i++) {
      var px = x + (i % SIDE) * pixel, py = y + Math.floor(i / SIDE) * pixel, size = pixel - IMAGE.gap;
      var at = ' x="' + r(px) + '" y="' + r(py) + '" width="' + r(size) + '" height="' + r(size) + '"';
      out += '<rect class="similar-vectors-pixel"' + at + '/>'
        + '<rect class="similar-vectors-ink"' + at + ' opacity="' + r((flat[offset + i] - low) / (high - low)) + '"/>';
    }
    return out + '</g>';
  }

  /* Left plot, as images: w large on the left, the four x two by two beside it. */
  function images(s) {
    var big = IMAGE.big * SIDE, small = IMAGE.small * SIDE;
    var out = image(s.w, 0, PLOT.left, (PLOT.h - big) / 2, IMAGE.big, 'is-w');
    var gridX = PLOT.left + big + 3 * IMAGE.row, gridTop = (PLOT.h - 2 * small - IMAGE.row) / 2;
    s.picked.forEach(function (k, n) {
      var col = n % 2, row = Math.floor(n / 2);
      out += image(s.xs, k * DIMS, gridX + col * (small + IMAGE.row), gridTop + row * (small + IMAGE.row), IMAGE.small, 'is-x');
    });
    return out;
  }

  function vectors(s) {
    var out = s.view === 'image' ? images(s) : lines(s);
    return s.picked.length ? out : out + text(PLOT.w / 2, PLOT.top + 6, 'No vectors in this range');
  }

  /* Right plot: how many x have each value of x · w, the bars in the picked range in x's hue.
     A full-height strip over each bar takes its clicks. */
  function histogram(s) {
    var bottom = PLOT.h - PLOT.bottom, step = INNER.w / s.bins.length, most = 0, k;
    for (k = 0; k < s.bins.length; k++) most = Math.max(most, s.bins[k]);
    var bars = '', strips = '';
    for (k = 0; k < s.bins.length; k++) {
      var middle = -1 + (k + 0.5) * BIN, h = s.bins[k] / most * INNER.h;
      bars += '<rect class="similar-vectors-bar' + (Math.abs(middle - s.centre) < HALF ? ' is-x' : '') + '" x="' + r(PLOT.left + k * step + 0.5)
        + '" y="' + r(bottom - h) + '" width="' + r(step - 1) + '" height="' + r(h) + '"/>';
      strips += '<rect class="similar-vectors-strip" data-bin="' + k + '" x="' + r(PLOT.left + k * step) + '" y="' + PLOT.top
        + '" width="' + r(step) + '" height="' + INNER.h + '"/>';
    }
    var ticks = '';
    [-1, 0, 1].forEach(function (t) {
      ticks += '<line class="similar-vectors-axis" x1="' + r(across(t)) + '" y1="' + bottom + '" x2="' + r(across(t)) + '" y2="' + (bottom + 4) + '"/>'
        + text(across(t), bottom + 16, t < 0 ? '−1' : String(t));
    });
    return bars + '<line class="similar-vectors-axis" x1="' + PLOT.left + '" y1="' + bottom + '" x2="' + (PLOT.w - PLOT.right) + '" y2="' + bottom + '"/>'
      + ticks + strips;
  }

  function counted(s) {
    return s.inside.toLocaleString('en-US') + ' of ' + COUNT.toLocaleString('en-US') + ' between ' + fixed(s.centre - HALF) + ' and ' + fixed(s.centre + HALF);
  }

  /* The slider's track spans the histogram's axis from the first to the last centre it can pick,
     widened by a thumb so the thumb's middle lands on the bars it picks. Only the picked range of
     the track takes x's hue, as fractions of the thumb's travel. */
  var TRACK = { left: across(-1 + HALF) / PLOT.w * 100, span: (across(1 - HALF) - across(-1 + HALF)) / PLOT.w * 100 };
  function sliderStyle(centre) {
    var travel = 2 - 2 * HALF;
    return 'margin-left:calc(' + r(TRACK.left) + '% - var(--s4) / 2);width:calc(' + r(TRACK.span) + '% + var(--s4))'
      + ';--similar-vectors-from:' + r((centre - HALF - (-1 + HALF)) / travel * 1000) / 1000
      + ';--similar-vectors-to:' + r((centre + HALF - (-1 + HALF)) / travel * 1000) / 1000;
  }

  function svg(cls, label, inner) {
    return '<svg class="similar-vectors-plot ' + cls + '" width="' + PLOT.w + '" height="' + PLOT.h + '" viewBox="0 0 ' + PLOT.w + ' ' + PLOT.h + '" role="img" aria-label="' + label + '">' + inner + '</svg>';
  }

  /* A row of buttons, one per [value, label], the current value filled. */
  function choices(key, options, current, label) {
    return '<div class="similar-vectors-choices" role="group" aria-label="' + label + '">' + options.map(function (o) {
      return '<button type="button" data-' + key + '="' + o[0] + '"' + (o[0] === current ? ' class="is-on"' : '') + '>' + o[1] + '</button>';
    }).join('') + '</div>';
  }

  /* The markup with each $…$ drawn by MathJax, as the slide's own formulas are. */
  function typeset(html) {
    var el = document.createElement('div');
    el.innerHTML = html;
    if (window.Tex) Tex.typeset(el);
    return el.innerHTML;
  }

  function render() {
    var id = 'similar-vectors-' + (++made);
    var s = apps[id] = generate(START.seed, START.template, START.view, START.centre);
    return typeset(''
      + '<div class="similar-vectors" data-app="' + id + '">'
      +   '<div class="similar-vectors-panel">'
      +     '<p class="similar-vectors-legend" data-view="' + s.view + '"><span class="similar-vectors-key is-w"></span>$\\mathbf{w}$ and four <span class="similar-vectors-key is-x"></span>$\\mathbf{x}$ from the range</p>'
      +     svg('is-vectors', 'The template w and four vectors x from the picked range', vectors(s))
      +     '<div class="similar-vectors-controls">'
      +       choices('template', TEMPLATES, s.template, 'Template')
      +       choices('view', VIEWS, s.view, 'Show the vectors as')
      +     '</div>'
      +   '</div>'
      +   '<div class="similar-vectors-panel">'
      +     '<p>$\\mathbf{x}\\cdot\\mathbf{w}$ for every $\\mathbf{x}$: <span data-shows="count">' + counted(s) + '</span></p>'
      +     svg('is-histogram', 'Histogram of the dot products of all 50,000 vectors x with w, with the picked range highlighted', histogram(s))
      +     '<input class="similar-vectors-slider is-x" type="range" min="' + (-1 + HALF) + '" max="' + (1 - HALF) + '" step="' + BIN + '"'
      +       ' value="' + s.centre + '" style="' + sliderStyle(s.centre) + '" aria-label="Middle of the dot product range">'
      +   '</div>'
      + '</div>');
  }

  function redraw(el, s) {
    el.querySelector('.is-vectors').innerHTML = vectors(s);
    el.querySelector('.is-histogram').innerHTML = histogram(s);
    el.querySelector('[data-shows="count"]').textContent = counted(s);
    var slider = el.querySelector('.similar-vectors-slider');
    slider.value = s.centre;
    slider.setAttribute('style', sliderStyle(s.centre));
    el.querySelector('.similar-vectors-legend').dataset.view = s.view;
    el.querySelectorAll('[data-template]').forEach(function (b) { b.classList.toggle('is-on', b.dataset.template === s.template); });
    el.querySelectorAll('[data-view]').forEach(function (b) { b.classList.toggle('is-on', b.dataset.view === s.view); });
  }

  function appOf(target) {
    var el = target.closest && target.closest('.similar-vectors');
    return el && apps[el.dataset.app] ? el : null;
  }

  document.addEventListener('input', function (e) {
    var el = appOf(e.target);
    if (el) redraw(el, pick(apps[el.dataset.app], Math.round(Number(e.target.value) * 100) / 100));
  });

  /* A template button scores the same x against that template, a view button redraws them the other
     way, and a bar moves the range to start at that bar. */
  document.addEventListener('click', function (e) {
    var el = appOf(e.target);
    if (!el) return;
    var s = apps[el.dataset.app];
    var template = e.target.closest('[data-template]'), view = e.target.closest('[data-view]'), bin = e.target.closest('[data-bin]');
    if (template) s = score(s, template.dataset.template, s.centre);
    else if (view) s.view = view.dataset.view;
    else if (bin) s = pick(s, Math.min(1 - HALF, Math.round((-1 + Number(bin.dataset.bin) * BIN + HALF) * 100) / 100));
    else return;
    redraw(el, s);
  });

  window.SimilarVectors = { render: render };
})();
