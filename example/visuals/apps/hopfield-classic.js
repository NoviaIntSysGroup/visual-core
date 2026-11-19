/* Hopfield classic, a project app: a live 1982 Hopfield network on a wash, using exactly the deck's
   three equations: ±1 units, Hebbian weights, and asynchronous sign updates. It settles into one
   of its stored shapes, or into a false memory. Moving the cursor or a finger erases units, holding
   Shift draws them, and entering the scramble box damages a different stored shape once.
   Exposes window.HopfieldClassic.render(slide), placed as a hero `background`, and starts one loop;
   a slide's `work` (lines) and `question` are written by hand top left. */
(function () {
  var COLS = 35;
  var SIZE = COLS * COLS;
  var UPDATES = Math.round(SIZE / 80);   /* units updated per step, so a full sweep takes about 1.3 s */
  var STEP = 1 / 60;                     /* seconds per simulation step */
  var DAMAGE = 0.3;                      /* share of a shape's units flipped by a scramble */
  var DISSOLVE_STEPS = 70;               /* about a second */
  var RECALLED = 0.9;                    /* overlap with a stored shape that counts as recalling it */
  var CURSOR = { radius: COLS * 0.2, fullSpeed: 0.7, rate: 0.6, held: 0.7 };   /* radius and speed in cells */

  var STILL = location.search.indexOf('print-pdf') !== -1
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The shapes the network remembers, each drawn white on black in a -0.5 to 0.5 box. The classic
     rule needs shapes about half on that overlap little (here 0.2 at most); pictures that are mostly
     off blend into a false memory deeper than any of them. */
  var SHAPES = [
    function hourglass(c) {
      polygon(c, [[-0.5, -0.5], [0.5, -0.5], [0, 0], [0.5, 0.5], [-0.5, 0.5], [0, 0]]);
    },
    function ring(c) {
      c.beginPath(); c.arc(0, 0, 0.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#000';
      c.beginPath(); c.arc(0, 0, 0.3, 0, Math.PI * 2); c.fill();
    },
    function plus(c) {
      c.fillRect(-0.15, -0.5, 0.3, 1);
      c.fillRect(-0.5, -0.15, 1, 0.3);
    },
    function cross(c) {
      polygon(c, [[-0.5, -0.36], [-0.36, -0.5], [0, -0.14], [0.36, -0.5], [0.5, -0.36], [0.14, 0],
        [0.5, 0.36], [0.36, 0.5], [0, 0.14], [-0.36, 0.5], [-0.5, 0.36], [-0.14, 0]]);
    },
    function mountains(c) {
      polygon(c, [[-0.5, 0.5], [-0.5, 0.1], [-0.2, -0.35], [0.05, 0], [0.25, -0.2], [0.5, 0.15], [0.5, 0.5]]);
    }
  ];

  function polygon(c, points) {
    c.beginPath();
    points.forEach(function (p) { c.lineTo(p[0], p[1]); });
    c.closePath();
    c.fill();
  }

  /* A shape on the grid as ξ: +1 where it is drawn, -1 elsewhere. */
  function storedPattern(shape) {
    var sheet = document.createElement('canvas');
    sheet.width = COLS;
    sheet.height = COLS;
    var c = sheet.getContext('2d', { willReadFrequently: true });
    c.fillStyle = '#000';
    c.fillRect(0, 0, COLS, COLS);
    c.translate(COLS / 2, COLS / 2);
    c.scale(COLS * 0.92, COLS * 0.92);
    c.fillStyle = '#FFF';
    shape(c);
    var pixels = c.getImageData(0, 0, COLS, COLS).data;
    var pattern = new Int8Array(SIZE);
    for (var i = 0; i < SIZE; i++) pattern[i] = pixels[i * 4] > 127 ? 1 : -1;
    return pattern;
  }

  /* Classic Hopfield network: w_ij = Σ_μ ξ_i^μ ξ_j^μ with w_ii = 0, E = -½ Σ_{i≠j} w_ij s_i s_j, and
     s_i = sign(Σ_{j≠i} w_ij s_j) for one unit at a time. The weights are never stored: with the
     overlaps m_μ = Σ_j ξ_j^μ s_j, unit i's sum is Σ_μ ξ_i^μ m_μ − P s_i, and E = -½ (Σ_μ m_μ² − P N). */
  function createNet(el) {
    var canvas = el.querySelector('.hopfield-classic-grid');
    var status = el.querySelector('.hopfield-classic-status');
    var box = el.querySelector('.hopfield-classic-scramble');
    var ctx = canvas.getContext('2d');
    var style = getComputedStyle(el);
    var ink = style.getPropertyValue('--text').trim();
    var accent = style.getPropertyValue('--accent-strong').trim();
    var stored = SHAPES.map(storedPattern);
    var count = stored.length;
    var state = new Int8Array(SIZE);
    var overlap = new Float64Array(count);
    var damaged = new Int8Array(SIZE);
    var shown = 0, dissolving = 0, drawnSize = 0;

    function measure() {
      for (var m = 0; m < count; m++) {
        var sum = 0;
        for (var i = 0; i < SIZE; i++) sum += stored[m][i] * state[i];
        overlap[m] = sum;
      }
    }

    function sumAt(i) {
      var h = -count * state[i];
      for (var m = 0; m < count; m++) h += stored[m][i] * overlap[m];
      return h;
    }

    function set(i, value) {
      if (state[i] === value) return;
      for (var m = 0; m < count; m++) overlap[m] += 2 * value * stored[m][i];
      state[i] = value;
    }

    function energy() {
      var sum = 0;
      for (var m = 0; m < count; m++) sum += overlap[m] * overlap[m];
      return -(sum - count * SIZE) / 2;
    }

    /* Settled when no unit would change: every sum agrees with its unit, or is zero. */
    function settled() {
      for (var i = 0; i < SIZE; i++) if (sumAt(i) * state[i] < 0) return false;
      return true;
    }

    /* Another stored shape with DAMAGE of its units flipped, which the state dissolves into. */
    function scramble(instant) {
      var closest = 0;
      for (var m = 1; m < count; m++) if (overlap[m] > overlap[closest]) closest = m;
      var next = (closest + 1 + Math.floor(Math.random() * (count - 1))) % count;
      for (var i = 0; i < SIZE; i++) damaged[i] = Math.random() < DAMAGE ? -stored[next][i] : stored[next][i];
      if (instant) {
        state.set(damaged);
        measure();
      } else {
        dissolving = DISSOLVE_STEPS;
      }
    }

    /* Turns the units near the cursor off, or on while Shift is held, each with a chance by distance. */
    function disturb(cursor) {
      var moved = Math.hypot(cursor.dx, cursor.dy);
      var rect = canvas.getBoundingClientRect();
      if ((moved === 0 && !cursor.drawing) || rect.width === 0) return;
      var cell = rect.width / COLS;
      var cx = (cursor.x - rect.left) / cell;
      var cy = (cursor.y - rect.top) / cell;
      var amount = Math.min(1, moved / cell / CURSOR.fullSpeed);
      if (cursor.drawing) amount = Math.max(amount, CURSOR.held);
      for (var y = 0; y < COLS; y++) {
        for (var x = 0; x < COLS; x++) {
          var dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
          if (dist >= CURSOR.radius) continue;
          if (Math.random() < CURSOR.rate * (1 - dist / CURSOR.radius) * amount) set(y * COLS + x, cursor.drawing ? 1 : -1);
        }
      }
    }

    function step(cursor) {
      disturb(cursor);
      var i, k;
      if (dissolving > 0) {
        for (k = 0; k < SIZE / DISSOLVE_STEPS * 2; k++) {
          i = Math.floor(Math.random() * SIZE);
          set(i, damaged[i]);
        }
        dissolving--;
        return;
      }
      for (k = 0; k < UPDATES; k++) {
        i = Math.floor(Math.random() * SIZE);
        var h = sumAt(i);
        if (h !== 0) set(i, h > 0 ? 1 : -1);
      }
    }

    function drawCells(cell, gap) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < SIZE; i++) {
        var x = (i % COLS) * cell + gap / 2;
        var y = Math.floor(i / COLS) * cell + gap / 2;
        ctx.fillStyle = state[i] > 0 ? accent : ink;
        ctx.globalAlpha = state[i] > 0 ? 1 : 0.06;
        ctx.fillRect(x, y, cell - gap, cell - gap);
      }
      ctx.globalAlpha = 1;
    }

    function describe() {
      if (dissolving > 0 || !settled()) return 'Settling';
      for (var m = 0; m < count; m++) {
        if (overlap[m] > RECALLED * SIZE) return 'Steady state: ' + SHAPES[m].name;
      }
      return 'Steady state: a false memory';
    }

    /* Sizes the canvas to its real size on screen, which follows Reveal's scaling; skipped while hidden. */
    function draw() {
      var width = Math.round(canvas.getBoundingClientRect().width * (window.devicePixelRatio || 1));
      if (width === 0 || (STILL && width === drawnSize)) return;
      if (canvas.width !== width) {
        canvas.width = width;
        canvas.height = width;
      }
      drawnSize = width;
      drawCells(width / COLS, Math.max(1, (width / COLS) * 0.12));
      shown = energy();
      status.textContent = describe() + (STILL ? '' : ' · energy ' + Math.round(shown).toLocaleString('en-US'));
    }

    if (STILL) {
      state.set(stored[0]);
      measure();
    } else {
      measure();
      scramble(true);
      box.addEventListener('pointerenter', function () {
        scramble();
        box.classList.add('is-hit');
        requestAnimationFrame(function () { box.classList.remove('is-hit'); });
      });
    }
    return { el: el, step: step, draw: draw };
  }

  var nets = [];
  var cursor = { x: 0, y: 0, dx: 0, dy: 0, drawing: false };
  var last = 0, carry = 0;

  function netFor(el) {
    for (var i = 0; i < nets.length; i++) {
      if (nets[i].el === el) return nets[i];
    }
    var net = createNet(el);
    nets.push(net);
    return net;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    carry += Math.min((now - last) / 1000, 0.05);
    last = now;
    var steps = Math.floor(carry / STEP);
    carry -= steps * STEP;
    document.querySelectorAll('.hopfield-classic').forEach(function (el) {
      var net = netFor(el);
      if (!STILL && !el.closest('section.present')) return;
      for (var s = 0; !STILL && s < steps; s++) {
        net.step(cursor);
        cursor.dx = 0;
        cursor.dy = 0;
      }
      net.draw();
    });
  }

  function note(slide) {
    if (!slide.work && !slide.question) return '';
    return '<div class="hopfield-classic-note">'
      + (slide.work || []).map(function (line) { return '<p>' + line + '</p>'; }).join('')
      + (slide.question ? '<p class="hopfield-classic-question">' + slide.question + '</p>' : '')
      + '</div>';
  }

  function render(slide) {
    return ''
      + '<div class="hopfield-classic">'
      +   window.Wash.render({ seed: 'hopfield-networks' })
      +   '<div class="hopfield-classic-net">'
      +     '<div class="hopfield-classic-frame" data-prevent-swipe><canvas class="hopfield-classic-grid" aria-hidden="true"></canvas></div>'
      +     '<p class="hopfield-classic-name">Hopfield Network, 1982</p>'
      +     '<p class="hopfield-classic-status"></p>'
      +     '<p class="hopfield-classic-scramble">Move the cursor here to scramble</p>'
      +   '</div>'
      +   note(slide)
      + '</div>';
  }

  window.addEventListener('keydown', function (e) { if (e.key === 'Shift') cursor.drawing = true; });
  window.addEventListener('keyup', function (e) { if (e.key === 'Shift') cursor.drawing = false; });
  window.addEventListener('blur', function () { cursor.drawing = false; });
  /* A finger has no position between touches, so a touch starts from where it lands. */
  document.addEventListener('pointerdown', function (e) {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
  });
  document.addEventListener('pointermove', function (e) {
    cursor.drawing = e.shiftKey;
    cursor.dx += e.clientX - cursor.x;
    cursor.dy += e.clientY - cursor.y;
    cursor.x = e.clientX;
    cursor.y = e.clientY;
  });
  requestAnimationFrame(frame);

  window.HopfieldClassic = { render: render };
})();
