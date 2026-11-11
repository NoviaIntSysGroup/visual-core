/* Integrate and fire, a project app: four input axons end in synapses on the branching dendrites
   of a myelinated neuron, modelled as a leaky integrate-and-fire unit. Each input spike runs down
   its axon and adds a weighted, decaying current; the membrane potential sums these and leaks back
   to rest, and crossing the threshold fires a spike down the neuron's own axon. A pipette on the
   soma records the potential, its wire writing the trace below. Inputs fire at random, until the
   cursor is over the app: then only a clicked input fires. It runs while its slide is present and,
   when it steps in, only while its own step is the current one.
   Exposes window.IntegrateAndFire.render(spec), placed with an `app` block, and starts one loop. */
(function () {
  var VIEW = { w: 400, h: 196 };
  var STEP = 1 / 240;             /* seconds per simulation step */
  /* Membrane potentials in mV, times in s; slowed far below a real neuron, so it can be watched. */
  var MEMBRANE = { rest: -70, threshold: -55, reset: -75, tau: 1.5, refractory: 0.3 };
  var SYNAPSE = { tau: 0.15, kick: 80 };   /* current decay time; drive per unit weight, 4–8.5 mV at the peak */
  var RATE = 0.3;                 /* random spikes per second, per input */
  var SPEED = 130;                /* how fast a spike runs along an axon, in points per second */
  var FLASH = 0.6;                /* seconds a synapse or terminal flashes when a spike arrives */
  var TRACE = { seconds: 10, every: 4, left: 84, right: 386, top: 152, bottom: 192, low: -78, high: -48 };

  /* The neuron: soma, dendritic tree (each branch to a point, its own branches after it, and the
     input whose synapse sits at its tip), and a myelinated axon ending in terminals. */
  var SOMA = { x: 146, y: 72, r: 16 };
  var TREE = [
    { from: [133, 65], to: [116, 49], kids: [
      { to: [100, 35], kids: [{ to: [80, 25], input: 0 }, { to: [96, 14] }, { to: [112, 24] }] },
      { to: [86, 53], input: 1 }] },
    { from: [133, 79], to: [116, 95], kids: [
      { to: [88, 91], input: 2 },
      { to: [102, 111], kids: [{ to: [80, 120], input: 3 }, { to: [100, 131] }] },
      { to: [126, 117] }] },
    { from: [144, 58], to: [150, 38], kids: [{ to: [138, 19] }, { to: [164, 24], kids: [{ to: [176, 14] }] }] }
  ];
  var WIDTH = [3.5, 2.2, 1.4];    /* a dendrite's stroke, by depth */
  var AXON = { y: SOMA.y, hillock: 168, first: 174, sheath: 28, gap: 6, sheaths: 5, height: 12, branch: 354 };
  var TERMINALS = [[376, 52], [380, 72], [376, 92]];
  /* The inputs: each an axon entering from the left edge at height y, myelinated, then a bare
     stretch to its bouton on a dendrite tip in TREE; the bouton's size is the input's weight. */
  var INPUTS = [{ y: 20, weight: 1.2 }, { y: 52, weight: 0.7 }, { y: 92, weight: 1.0 }, { y: 124, weight: 1.4 }];
  var INPUT = { first: 6, sheath: 20, gap: 5, sheaths: 2, height: 7, hit: 11 };
  var BOUTON = { base: 1.5, perWeight: 2 };
  /* The recording pipette: its tip in the soma, its back end, and its wire's run to the trace. */
  var PIPETTE = { tip: [154, 83], back: [190, 126], tipHalf: 0.8, backHalf: 5, wireY: 136 };
  var LABELS = { soma: [164, 48], axon: [257, 58], dendrites: [184, 27], electrode: [200, 114] };

  var STILL = location.search.indexOf('print-pdf') !== -1
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SAMPLES = Math.round(TRACE.seconds / (STEP * TRACE.every));

  function r(n) { return Math.round(n * 100) / 100; }
  function bouton(input) { return BOUTON.base + BOUTON.perWeight * input.weight; }
  function myelinEnd(a) { return a.first + a.sheaths * (a.sheath + a.gap) - a.gap; }

  /* Seeded random numbers (mulberry32), so every first view starts from the same history. */
  function random(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* A route a spike runs along: its points, and its length up to each. `at` is the point `d` along it. */
  function route(points) {
    var cum = [0];
    for (var i = 1; i < points.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    }
    return { points: points, cum: cum, length: cum[cum.length - 1] };
  }
  function at(rt, d) {
    var i = 1;
    while (i < rt.points.length - 1 && rt.cum[i] < d) i++;
    var a = rt.points[i - 1], b = rt.points[i], t = Math.min(1, (d - rt.cum[i - 1]) / (rt.cum[i] - rt.cum[i - 1]));
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }

  /* Each input's synapse, the tip of its branch in TREE; then its route, from the left edge along
     the myelinated stretch, then a smooth curve to its bouton. */
  var SYNAPSES = [];
  (function walk(branches) {
    branches.forEach(function (b) { if (b.input != null) SYNAPSES[b.input] = b.to; if (b.kids) walk(b.kids); });
  })(TREE);
  var INPUT_ROUTES = INPUTS.map(function (input, i) {
    var tip = SYNAPSES[i], end = myelinEnd(INPUT) + 4, b = [tip[0] - 2 - bouton(input), tip[1]];
    var c = [[end, input.y], [end + 16, input.y], [b[0] - 12, b[1]], b];
    var points = [[0, input.y]];
    for (var k = 0; k <= 16; k++) {
      var t = k / 16, u = 1 - t;
      points.push([0, 1].map(function (j) { return u * u * u * c[0][j] + 3 * u * u * t * c[1][j] + 3 * u * t * t * c[2][j] + t * t * t * c[3][j]; }));
    }
    return route(points);
  });
  /* The neuron's own spike runs down the axon and splits into every terminal branch. */
  var MAIN_ROUTES = TERMINALS.map(function (t) { return route([[AXON.hillock, AXON.y], [AXON.branch, AXON.y], t]); });
  var MAIN_TRAVEL = Math.max.apply(null, MAIN_ROUTES.map(function (rt) { return rt.length; })) / SPEED;

  function y(v) {
    var clamped = Math.max(TRACE.low, Math.min(TRACE.high, v));
    return TRACE.bottom - (clamped - TRACE.low) / (TRACE.high - TRACE.low) * (TRACE.bottom - TRACE.top);
  }
  function text(x, yy, words, cls) {
    return '<text class="integrate-and-fire-text ' + (cls || '') + '" x="' + r(x) + '" y="' + r(yy) + '">' + words + '</text>';
  }
  function circle(c, rr, cls, extra) {
    return '<circle class="' + cls + '" cx="' + r(c[0]) + '" cy="' + r(c[1]) + '" r="' + r(rr) + '"' + (extra || '') + '/>';
  }
  function line(a, b, cls, width) {
    return '<line class="' + cls + '" x1="' + r(a[0]) + '" y1="' + r(a[1]) + '" x2="' + r(b[0]) + '" y2="' + r(b[1]) + '"'
      + (width ? ' stroke-width="' + width + '"' : '') + '/>';
  }
  function polyline(points, cls) {
    return '<path class="' + cls + '" d="' + points.map(function (p, k) { return (k ? 'L' : 'M') + r(p[0]) + ' ' + r(p[1]); }).join(' ') + '"/>';
  }

  /* An axon's myelin sheaths at height y. */
  function myelin(a, yy) {
    var out = '';
    for (var i = 0; i < a.sheaths; i++) {
      out += '<rect class="integrate-and-fire-myelin" x="' + (a.first + i * (a.sheath + a.gap)) + '" y="' + r(yy - a.height / 2)
        + '" width="' + a.sheath + '" height="' + a.height + '" rx="' + r(a.height / 2) + '"/>';
    }
    return out;
  }

  function dendrites(from, branches, depth) {
    return branches.map(function (b) {
      var start = b.from || from;
      return line(start, b.to, 'integrate-and-fire-dendrite', WIDTH[depth]) + (b.kids ? dendrites(b.to, b.kids, depth + 1) : '');
    }).join('');
  }

  /* The pipette: a glass taper from its tip in the soma to its back end, the electrode wire inside,
     and the wire on to the trace's right edge, where the live part takes it down to the pen. */
  function pipette() {
    var p = PIPETTE, dx = p.back[0] - p.tip[0], dy = p.back[1] - p.tip[1], len = Math.hypot(dx, dy);
    var nx = -dy / len, ny = dx / len;
    var glass = 'M' + r(p.tip[0] + nx * p.tipHalf) + ' ' + r(p.tip[1] + ny * p.tipHalf)
      + ' L' + r(p.back[0] + nx * p.backHalf) + ' ' + r(p.back[1] + ny * p.backHalf)
      + ' L' + r(p.back[0] - nx * p.backHalf) + ' ' + r(p.back[1] - ny * p.backHalf)
      + ' L' + r(p.tip[0] - nx * p.tipHalf) + ' ' + r(p.tip[1] - ny * p.tipHalf) + ' Z';
    return '<path class="integrate-and-fire-glass" d="' + glass + '"/>'
      + polyline([p.tip, p.back, [p.back[0], p.wireY], [TRACE.right, p.wireY]], 'integrate-and-fire-wire');
  }

  /* Everything that never moves: the neuron, the inputs, the pipette, labels, and the trace's axis,
     rest and threshold lines, named left of the axis, clear of the trace. */
  function scenery() {
    var out = '<g class="is-main">' + dendrites(null, TREE, 0) + '</g>';
    INPUTS.forEach(function (input, i) {
      var rt = INPUT_ROUTES[i], tip = rt.points[rt.points.length - 1];
      out += '<g class="is-input">' + polyline(rt.points, 'integrate-and-fire-axon') + myelin(INPUT, input.y)
        + circle([tip[0] + bouton(input), tip[1]], bouton(input), 'integrate-and-fire-body')
        + '<rect class="integrate-and-fire-hit" data-input="' + i + '" x="0" y="' + (input.y - INPUT.hit)
        + '" width="' + (myelinEnd(INPUT) + 4) + '" height="' + 2 * INPUT.hit + '"/></g>';
    });
    var k = SOMA.r * 0.55;
    out += '<g class="is-main">' + line([AXON.hillock, AXON.y], [AXON.branch, AXON.y], 'integrate-and-fire-axon');
    TERMINALS.forEach(function (t) {
      out += line([AXON.branch, AXON.y], t, 'integrate-and-fire-axon') + circle(t, 3, 'integrate-and-fire-body');
    });
    out += myelin(AXON, AXON.y)
      + '<path class="integrate-and-fire-body" d="M' + r(SOMA.x + k) + ' ' + r(SOMA.y - k) + ' L' + AXON.hillock + ' ' + (SOMA.y - 1)
      + ' L' + AXON.hillock + ' ' + (SOMA.y + 1) + ' L' + r(SOMA.x + k) + ' ' + r(SOMA.y + k) + ' Z"/>'
      + circle([SOMA.x, SOMA.y], SOMA.r, 'integrate-and-fire-body') + '</g>'
      + pipette();
    Object.keys(LABELS).forEach(function (name) {
      out += text(LABELS[name][0], LABELS[name][1], name, name === 'axon' ? 'is-label is-middle' : 'is-label is-start');
    });

    return out + line([TRACE.left, y(MEMBRANE.rest)], [TRACE.right, y(MEMBRANE.rest)], 'integrate-and-fire-rest')
      + line([TRACE.left, y(MEMBRANE.threshold)], [TRACE.right, y(MEMBRANE.threshold)], 'integrate-and-fire-threshold')
      + line([TRACE.left, TRACE.top], [TRACE.left, TRACE.bottom], 'integrate-and-fire-axis')
      + text(TRACE.left - 5, y(MEMBRANE.rest), '−70', 'is-end')
      + text(TRACE.left - 5, y(MEMBRANE.threshold), '−55', 'is-end')
      + text(TRACE.left - 32, y(MEMBRANE.rest), 'rest', 'is-end is-label')
      + text(TRACE.left - 32, y(MEMBRANE.threshold), 'threshold', 'is-end is-label')
      + text(0, TRACE.top - 9, 'membrane potential (mV)', 'is-start');
  }

  /* One neuron's simulation: membrane potential v, synaptic current, spikes in flight, the trace. */
  function createNeuron(el) {
    var s = {
      el: el,
      rand: random(7), t: 0, v: MEMBRANE.rest, current: 0, refractory: 0, steps: 0, spiked: false, manual: false,
      travelling: [], spikes: [], arrived: INPUTS.map(function () { return -1; }), trace: []
    };
    s.fire = function (i) { s.travelling.push({ input: i, start: s.t }); };
    for (var k = 0; k < SAMPLES * TRACE.every; k++) step(s);
    el.addEventListener('pointerenter', function () { s.manual = true; });
    el.addEventListener('pointerleave', function () { s.manual = false; });
    return s;
  }

  function step(s) {
    s.t += STEP;
    if (!s.manual) INPUTS.forEach(function (input, i) { if (s.rand() < RATE * STEP) s.fire(i); });
    s.travelling = s.travelling.filter(function (p) {
      if ((s.t - p.start) * SPEED < INPUT_ROUTES[p.input].length) return true;
      s.current += SYNAPSE.kick * INPUTS[p.input].weight;
      s.arrived[p.input] = s.t;
      return false;
    });
    s.current -= s.current / SYNAPSE.tau * STEP;
    if (s.refractory > 0) {
      s.refractory -= STEP;
    } else {
      s.v += (MEMBRANE.rest - s.v + s.current) / MEMBRANE.tau * STEP;
      if (s.v >= MEMBRANE.threshold) {
        s.v = MEMBRANE.reset;
        s.refractory = MEMBRANE.refractory;
        s.spiked = true;
        s.spikes.push(s.t);
      }
    }
    s.spikes = s.spikes.filter(function (start) { return s.t - start < MAIN_TRAVEL + FLASH; });
    if (++s.steps % TRACE.every === 0) {
      s.trace.push({ v: s.v, spike: s.spiked });
      s.spiked = false;
      if (s.trace.length > SAMPLES) s.trace.shift();
    }
  }

  /* A ring widening and fading over FLASH seconds since `since`, or nothing. */
  function flash(s, since, c, rr) {
    var age = s.t - since;
    if (since < 0 || age < 0 || age > FLASH) return '';
    return circle(c, rr + 5 * age / FLASH, 'integrate-and-fire-flash', ' opacity="' + r(1 - age / FLASH) + '"');
  }

  /* Everything that moves: spikes gliding along the axons, flashes, the pen wire, and the trace
     with each spike drawn to the top. The layer is looked up each time: entering fullscreen, the
     deck swaps every SVG holding text for a fresh copy. */
  function draw(s) {
    var out = '';
    INPUTS.forEach(function (input, i) {
      var rt = INPUT_ROUTES[i], tip = rt.points[rt.points.length - 1];
      out += flash(s, s.arrived[i], [tip[0] + bouton(input), tip[1]], bouton(input));
    });
    s.travelling.forEach(function (p) {
      out += circle(at(INPUT_ROUTES[p.input], (s.t - p.start) * SPEED), 3.5, 'integrate-and-fire-pulse');
    });
    s.spikes.forEach(function (start) {
      var age = s.t - start;
      out += flash(s, start, [SOMA.x, SOMA.y], SOMA.r);
      MAIN_ROUTES.forEach(function (rt, k) {
        if (age * SPEED < rt.length) out += circle(at(rt, age * SPEED), 4.5, 'integrate-and-fire-pulse');
        else out += flash(s, start + rt.length / SPEED, TERMINALS[k], 3);
      });
    });
    var d = '', width = TRACE.right - TRACE.left, head = TRACE.top;
    s.trace.forEach(function (p, k) {
      var x = r(TRACE.left + k / (SAMPLES - 1) * width);
      head = p.spike ? TRACE.top : y(p.v);
      d += (k ? ' L' : 'M') + x + ' ' + r(p.spike ? y(MEMBRANE.threshold) : y(p.v));
      if (p.spike) d += ' L' + x + ' ' + TRACE.top + ' L' + x + ' ' + r(y(MEMBRANE.reset));
    });
    s.el.querySelector('.integrate-and-fire-live').innerHTML = out + '<path class="integrate-and-fire-trace" d="' + d + '"/>'
      + line([TRACE.right, PIPETTE.wireY], [TRACE.right, head], 'integrate-and-fire-wire')
      + circle([TRACE.right, head], 2.5, 'integrate-and-fire-pen');
  }

  var neurons = [];
  var last = 0, carry = 0;

  function neuronFor(el) {
    for (var i = 0; i < neurons.length; i++) if (neurons[i].el === el) return neurons[i];
    var s = createNeuron(el);
    neurons.push(s);
    draw(s);
    return s;
  }

  /* Running: its slide is present and, when fragments step, its press is the current one: the
     block's start press when placed with `play: "press"`, otherwise its group's. */
  function running(el) {
    if (!el.closest('section.present')) return false;
    if (!window.Reveal.getConfig().fragments) return true;
    var next = el.nextElementSibling;
    var press = next && next.classList.contains('deck-app-start') ? next : el.closest('.fragment');
    return !press || press.classList.contains('current-fragment');
  }

  function frame(now) {
    requestAnimationFrame(frame);
    carry += Math.min((now - last) / 1000, 0.05);
    last = now;
    var steps = Math.floor(carry / STEP);
    carry -= steps * STEP;
    document.querySelectorAll('.integrate-and-fire').forEach(function (el) {
      var s = neuronFor(el);
      if (STILL || !running(el)) return;
      for (var k = 0; k < steps; k++) step(s);
      draw(s);
    });
  }

  function render() {
    return ''
      + '<div class="integrate-and-fire">'
      +   '<svg class="integrate-and-fire-plot" width="' + VIEW.w + '" height="' + VIEW.h + '" viewBox="0 0 ' + VIEW.w + ' ' + VIEW.h + '" role="img"'
      +     ' aria-label="Four input axons end on the dendrites of a myelinated neuron. A pipette on its soma records the membrane potential, which sums the inputs and leaks back to rest; crossing the threshold fires a spike down the axon.">'
      +     scenery() + '<g class="integrate-and-fire-live"></g>'
      +   '</svg>'
      + '</div>';
  }

  /* A click on an input axon fires it, whether or not the inputs also fire at random. */
  document.addEventListener('click', function (e) {
    var hit = e.target.closest && e.target.closest('.integrate-and-fire [data-input]');
    if (!hit || STILL) return;
    neuronFor(hit.closest('.integrate-and-fire')).fire(Number(hit.dataset.input));
  });
  requestAnimationFrame(frame);

  window.IntegrateAndFire = { render: render };
})();
