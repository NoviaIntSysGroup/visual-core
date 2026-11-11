/* Hubel and Wiesel, a project app: how a real neuron's responses are recorded, after their 1959
   experiment. Left to right: a screen with a bar of light; a sitting cat looking at it, an
   electrode in its visual cortex (V1) on one neuron; a speaker clicking on each spike; and an
   oscilloscope scrolling the recording: a nearly flat trace and spikes that all look the same.
   The neuron fires at random, at a rate set by how well the bar matches the one place and
   orientation it is tuned to. On its own the bar wanders the screen, turning as it goes; with the
   cursor over the app, the bar follows it on the screen and the wheel turns it. Sound plays only
   in fullscreen, from the page's first key press or click, as browsers require. It runs while
   its slide is present and, when it steps in, only while its own step is the current one.
   Exposes window.HubelWiesel.render(spec), placed with an `app` block, and starts one loop. */
(function () {
  var VIEW = { w: 430, h: 136 };
  var STEP = 1 / 1000;            /* seconds per simulation step */

  /* The scene, in points. The cat's outline is drawn in its own units from its top-left. */
  var SCREEN  = { x: 8.5, y: 12.8, size: 85 };
  var BAR     = { length: 42.5, width: 6.8 };
  var CAT     = { x: 134, y: 18.7, unit: 26.4 };
  var SIGHT   = { gap: 4.3 };                                      /* the line of sight's clearance from the screen */
  var PROBE   = { top: [174.3, 4.3], tip: [0.78, 0.8], r: 2.1 };   /* the electrode's top; its tip, in cat units; the neuron dot */
  var CABLE   = { pull: 38.3, join: 250.9 };                       /* how far the cable runs straight out of each end; where it levels out */
  var SPEAKER = { x: 265.8, y: 85, body: 8.5, cone: 10.6, h: 12.8, arcs: [5.1, 10.2] };
  var SCOPE   = { x: 335.9, y: 12.8, w: 85, h: 85, pad: 6.4, seconds: 1.5, every: 5 };   /* every: simulation steps per trace sample */
  var NAMES   = { y: 123 };                                        /* the row naming screen, electrode, clicks, and spikes */

  /* The neuron, in spikes per second: `peak` at the preferred bar, falling off with distance
     (points) and tilt (degrees from vertical), and a rare spontaneous spike anywhere. */
  var TUNING   = { tilt: 30, place: 8.5, turn: 15, peak: 15, spontaneous: 0.3, refractory: 0.02 };
  /* The trace, in points: its baseline as a fraction of the scope's inner height from the top;
     noise amplitude; the dip after each spike and how fast it recovers, in seconds. */
  var TRACE_SHAPE = { base: 0.7, noise: 0.4, dip: 5, recover: 0.03 };
  var FOLLOW   = 12;              /* how fast the bar closes on where it is headed, per second */
  var FLASH    = { neuron: 0.3, click: 0.08 };   /* seconds the neuron dot rings and the speaker sounds after a spike */
  var TURN     = 5;               /* degrees the bar turns per wheel notch */

  /* The bar's own wander, looping every `period` seconds: side to side by `x` points, down by up
     to `y` with a `wave` on top, turning half a circle per loop. It crosses the preferred place
     twice a loop, at the preferred tilt and then across it; `start` is where in the loop it begins. */
  var WANDER = { period: 8, x: 34, y: 50, wave: 10, start: 2 };

  /* A sitting cat in profile, facing the screen, in cat units: body, tail, face, and inner ear. */
  var CAT_PATHS = {
    body: 'M0.22 0.42 C0.24 0.3 0.28 0.16 0.33 0.06 C0.4 0.14 0.45 0.24 0.5 0.34 C0.55 0.24 0.62 0.12 0.7 0.03 '
        + 'C0.78 0.16 0.84 0.32 0.85 0.46 C0.9 0.6 0.92 0.85 0.84 0.98 C1.3 1.1 1.8 1.6 1.88 2.35 '
        + 'C1.95 2.8 1.8 3 1.55 3 L0.42 3 C0.32 3 0.32 2.88 0.42 2.86 L0.5 2.86 C0.5 2.3 0.42 1.7 0.36 1.35 '
        + 'C0.3 1.22 0.26 1.08 0.2 1 C0.14 0.98 0.1 0.93 0.1 0.88 C0.06 0.85 0.04 0.8 0.06 0.74 '
        + 'C0.1 0.6 0.14 0.5 0.22 0.42 Z',
    tail: 'M1.85 2.75 C2.35 2.85 2.45 2.3 2.3 1.95 C2.32 2.25 2.25 2.65 1.88 2.6 Z',
    eye: 'M0.24 0.62 Q0.31 0.55 0.38 0.61 Q0.31 0.67 0.24 0.62 Z',
    nose: 'M0.05 0.74 L0.11 0.72 L0.08 0.79 Z',
    mouth: 'M0.08 0.79 Q0.11 0.87 0.17 0.89',
    whiskers: 'M0.2 0.83 L-0.08 0.77 M0.2 0.85 L-0.08 0.87 M0.2 0.87 L-0.06 0.97',
    ear: 'M0.69 0.14 Q0.66 0.26 0.6 0.33'
  };
  var EYE = [0.24, 0.62];

  var STILL = location.search.indexOf('print-pdf') !== -1
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SAMPLES = Math.round(SCOPE.seconds / (STEP * SCOPE.every));

  function r(n) { return Math.round(n * 100) / 100; }
  function xy(p) { return r(p[0]) + ' ' + r(p[1]); }
  function cat(p) { return [CAT.x + p[0] * CAT.unit, CAT.y + p[1] * CAT.unit]; }
  function catPath(d) { return d.replace(/(-?[\d.]+) (-?[\d.]+)/g, function (_, x, y) { return xy(cat([+x, +y])); }); }

  /* The preferred place: the screen's centre column, at the cat's eye height. */
  var HOME = [SCREEN.x + SCREEN.size / 2, cat(EYE)[1]];
  var TRACE = { left: SCOPE.x + SCOPE.pad, right: SCOPE.x + SCOPE.w - SCOPE.pad, top: SCOPE.y + SCOPE.pad, bottom: SCOPE.y + SCOPE.h - SCOPE.pad };

  /* Seeded random numbers (mulberry32), so every first view starts from the same history. */
  function random(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* A tilt difference folded into −90…90°: a bar turned half a circle is the same bar. */
  function fold(d) { return ((d % 180) + 270) % 180 - 90; }

  /* The wandering bar's pose at time t, as an offset from the preferred place, and its tilt. */
  function wander(t) {
    var a = 2 * Math.PI * t / WANDER.period, sin = Math.sin(a);
    return { at: [WANDER.x * sin, WANDER.y * sin * sin + WANDER.wave * Math.sin(3 * a)], tilt: TUNING.tilt + 180 * t / WANDER.period };
  }

  /* The neuron's spikes per second for a bar pose. */
  function rate(pose) {
    var d2 = pose.at[0] * pose.at[0] + pose.at[1] * pose.at[1], turn = fold(pose.tilt - TUNING.tilt);
    return TUNING.spontaneous
      + TUNING.peak * Math.exp(-d2 / (2 * TUNING.place * TUNING.place) - turn * turn / (2 * TUNING.turn * TUNING.turn));
  }
  function text(x, words) {
    return '<text class="hubel-wiesel-text" x="' + r(x) + '" y="' + NAMES.y + '">' + words + '</text>';
  }
  function path(d, cls, extra) { return '<path class="' + cls + '" d="' + d + '"' + (extra || '') + '/>'; }
  function poly(pts) { return 'M' + pts.map(xy).join(' L') + ' Z'; }

  /* Everything that never moves: screen, cat, electrode, cable, speaker, scope, and labels. */
  function scenery() {
    var eye = cat(EYE), tip = cat(PROBE.tip), mid = SCOPE.y + SCOPE.h / 2, s = SPEAKER;
    var neck = s.x + s.body / 2, mouth = neck + s.cone;
    return ''
      + '<clipPath id="hubel-wiesel-screen"><rect x="' + SCREEN.x + '" y="' + SCREEN.y + '" width="' + SCREEN.size + '" height="' + SCREEN.size + '"/></clipPath>'
      + '<rect class="hubel-wiesel-box" x="' + SCREEN.x + '" y="' + SCREEN.y + '" width="' + SCREEN.size + '" height="' + SCREEN.size + '"/>'
      + path('M' + xy([SCREEN.x + SCREEN.size + SIGHT.gap, eye[1]]) + ' L' + xy(eye), 'hubel-wiesel-sight')
      + path(catPath(CAT_PATHS.tail), 'hubel-wiesel-cat') + path(catPath(CAT_PATHS.body), 'hubel-wiesel-cat')
      + path(catPath(CAT_PATHS.whiskers + ' ' + CAT_PATHS.ear), 'hubel-wiesel-line')
      + path(catPath(CAT_PATHS.mouth), 'hubel-wiesel-line is-ink')
      + path(catPath(CAT_PATHS.eye), 'hubel-wiesel-ink') + path(catPath(CAT_PATHS.nose), 'hubel-wiesel-ink')
      + path('M' + xy(PROBE.top) + ' L' + xy(tip), 'hubel-wiesel-probe')
      + '<circle class="hubel-wiesel-neuron" cx="' + r(tip[0]) + '" cy="' + r(tip[1]) + '" r="' + PROBE.r + '"/>'
      + path('M' + xy(PROBE.top) + ' C' + xy([PROBE.top[0] + CABLE.pull, PROBE.top[1]]) + ' ' + xy([CABLE.join - CABLE.pull, mid])
        + ' ' + xy([CABLE.join, mid]) + ' L' + xy([SCOPE.x, mid]) + ' M' + xy([s.x, mid]) + ' L' + xy([s.x, s.y - s.h / 2]), 'hubel-wiesel-cable')
      + '<rect class="hubel-wiesel-part" x="' + r(s.x - s.body / 2) + '" y="' + r(s.y - s.h / 2) + '" width="' + s.body + '" height="' + s.h + '"/>'
      + path(poly([[neck, s.y - s.h / 2], [mouth, s.y - s.h], [mouth, s.y + s.h], [neck, s.y + s.h / 2]]), 'hubel-wiesel-part')
      + '<rect class="hubel-wiesel-box" x="' + SCOPE.x + '" y="' + SCOPE.y + '" width="' + SCOPE.w + '" height="' + SCOPE.h + '"/>'
      + text(SCREEN.x + SCREEN.size / 2, 'bar of light') + text(cat([1.2, 0])[0], 'electrode in V1')
      + text(s.x + s.body, 'clicks') + text(SCOPE.x + SCOPE.w / 2, 'spikes')
      + '<rect class="hubel-wiesel-hit" x="' + SCREEN.x + '" y="' + SCREEN.y + '" width="' + SCREEN.size + '" height="' + SCREEN.size + '"/>';
  }

  /* One recording: the bar's pose and where it is headed, the neuron's spikes, and the trace. */
  function createRecording(el) {
    var s = {
      el: el, rand: random(11), t: 0, wanderT: WANDER.start, manual: false, warming: true,
      pose: wander(WANDER.start), aim: wander(WANDER.start), refractory: 0, steps: 0, spiked: false,
      spikes: [], lastSpike: -Infinity, trace: []
    };
    for (var k = 0; k < SAMPLES * SCOPE.every; k++) step(s);
    s.warming = false;
    el.addEventListener('pointerenter', function () { s.manual = true; s.aim = { at: s.pose.at.slice(), tilt: s.pose.tilt }; });
    el.addEventListener('pointerleave', function () { s.manual = false; });
    el.addEventListener('pointermove', function (e) {
      var box = el.querySelector('svg').getBoundingClientRect();
      var p = [(e.clientX - box.left) / box.width * VIEW.w, (e.clientY - box.top) / box.height * VIEW.h];
      if (p[0] < SCREEN.x || p[0] > SCREEN.x + SCREEN.size || p[1] < SCREEN.y || p[1] > SCREEN.y + SCREEN.size) return;
      s.aim.at = [p[0] - HOME[0], p[1] - HOME[1]];
    });
    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      s.aim.tilt += (e.deltaY > 0 ? 1 : -1) * TURN;
    }, { passive: false });
    return s;
  }

  function step(s) {
    s.t += STEP;
    if (!s.manual && !s.warming) s.wanderT += STEP;
    var target = s.manual ? s.aim : wander(s.wanderT), k = Math.min(1, FOLLOW * STEP);
    s.pose = {
      at: [s.pose.at[0] + (target.at[0] - s.pose.at[0]) * k, s.pose.at[1] + (target.at[1] - s.pose.at[1]) * k],
      tilt: s.pose.tilt + fold(target.tilt - s.pose.tilt) * k
    };
    if (s.refractory > 0) {
      s.refractory -= STEP;
    } else if (s.rand() < rate(s.pose) * STEP) {
      s.refractory = TUNING.refractory;
      s.spiked = true;
      s.spikes.push(s.t);
      s.lastSpike = s.t;
      if (!s.warming) click();
    }
    s.spikes = s.spikes.filter(function (at) { return s.t - at < FLASH.neuron; });
    if (++s.steps % SCOPE.every === 0) {
      /* Each sample: small noise, plus the dip after the last spike, recovering. */
      var v = TRACE_SHAPE.noise * (2 * s.rand() - 1) + TRACE_SHAPE.dip * Math.exp(-(s.t - s.lastSpike) / TRACE_SHAPE.recover);
      s.trace.push({ v: v, spike: s.spiked });
      s.spiked = false;
      if (s.trace.length > SAMPLES) s.trace.shift();
    }
  }

  /* Sound: one context for every recording, made on the page's first key press or click, as
     browsers require; each click is a short burst of noise, fading fast, heard only in fullscreen. */
  var AUDIO = null, CLICK = null;
  function startAudio() {
    if (AUDIO || !(window.AudioContext || window.webkitAudioContext)) return;
    AUDIO = new (window.AudioContext || window.webkitAudioContext)();
    CLICK = AUDIO.createBuffer(1, Math.round(AUDIO.sampleRate * 0.01), AUDIO.sampleRate);
    var data = CLICK.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length / 5));
  }
  function click() {
    if (!AUDIO || AUDIO.state !== 'running' || !(document.fullscreenElement || document.webkitFullscreenElement)) return;
    var src = AUDIO.createBufferSource();
    src.buffer = CLICK;
    src.connect(AUDIO.destination);
    src.start();
  }

  /* Everything that moves: the bar, the neuron's ring, the speaker's sound, and the trace with
     each spike the same stroke, from the baseline to the top and down into its dip. The layer is
     looked up each time: entering fullscreen, the deck swaps every SVG holding text for a fresh copy. */
  function draw(s) {
    var c = [HOME[0] + s.pose.at[0], HOME[1] + s.pose.at[1]], t = s.pose.tilt * Math.PI / 180;
    var along = [Math.sin(t) * BAR.length / 2, -Math.cos(t) * BAR.length / 2], across = [Math.cos(t) * BAR.width / 2, Math.sin(t) * BAR.width / 2];
    var out = path(poly([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (k) {
      return [c[0] + k[0] * along[0] + k[1] * across[0], c[1] + k[0] * along[1] + k[1] * across[1]];
    })), 'hubel-wiesel-bar', ' clip-path="url(#hubel-wiesel-screen)"');

    var tip = cat(PROBE.tip), last = s.spikes.length ? s.t - s.spikes[s.spikes.length - 1] : Infinity;
    s.spikes.forEach(function (at) {
      var age = (s.t - at) / FLASH.neuron;
      out += '<circle class="hubel-wiesel-flash" cx="' + r(tip[0]) + '" cy="' + r(tip[1]) + '" r="' + r(PROBE.r + 5 * age) + '" opacity="' + r(1 - age) + '"/>';
    });
    if (last < FLASH.click) {
      var sp = SPEAKER, mouth = sp.x + sp.body / 2 + sp.cone;
      sp.arcs.forEach(function (a) {
        out += path('M' + xy([mouth + a, sp.y - a * 1.6]) + ' Q' + xy([mouth + a * 2, sp.y]) + ' ' + xy([mouth + a, sp.y + a * 1.6]), 'hubel-wiesel-sound');
      });
    }

    var d = '', width = TRACE.right - TRACE.left, base = TRACE.top + TRACE_SHAPE.base * (TRACE.bottom - TRACE.top);
    s.trace.forEach(function (p, k) {
      var x = r(TRACE.left + k / (SAMPLES - 1) * width);
      d += (k ? ' L' : 'M') + x + ' ' + r(p.spike ? base : base + p.v);
      if (p.spike) d += ' L' + x + ' ' + TRACE.top + ' L' + x + ' ' + r(base + p.v);
    });
    s.el.querySelector('.hubel-wiesel-live').innerHTML = out + path(d, 'hubel-wiesel-trace');
  }

  var recordings = [];
  var lastNow = 0, carry = 0;

  function recordingFor(el) {
    for (var i = 0; i < recordings.length; i++) if (recordings[i].el === el) return recordings[i];
    var s = createRecording(el);
    recordings.push(s);
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
    carry += Math.min((now - lastNow) / 1000, 0.05);
    lastNow = now;
    var steps = Math.floor(carry / STEP);
    carry -= steps * STEP;
    document.querySelectorAll('.hubel-wiesel').forEach(function (el) {
      var s = recordingFor(el);
      if (STILL || !running(el)) return;
      for (var k = 0; k < steps; k++) step(s);
      draw(s);
    });
  }

  function render() {
    return ''
      + '<div class="hubel-wiesel">'
      +   '<svg class="hubel-wiesel-plot" width="' + VIEW.w + '" height="' + VIEW.h + '" viewBox="0 0 ' + VIEW.w + ' ' + VIEW.h + '" role="img"'
      +     ' aria-label="Hubel and Wiesel\'s experiment: a cat looks at a screen showing a bar of light. An electrode in its visual cortex, V1, records one neuron; its spikes click through a speaker and scroll across an oscilloscope. The neuron fires only when the bar is in one place at one orientation.">'
      +     scenery() + '<g class="hubel-wiesel-live"></g>'
      +   '</svg>'
      + '</div>';
  }

  function unlock() {
    startAudio();
    if (AUDIO && AUDIO.state !== 'running') AUDIO.resume();
  }
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);
  requestAnimationFrame(frame);

  window.HubelWiesel = { render: render };
})();
