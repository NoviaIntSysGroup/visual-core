/* Hopfield background for the hero cover: a live modern Hopfield network on a wash. It settles into one
   of its stored shapes. Moving the cursor erases units, holding Shift draws them, and entering the
   scramble box scrambles it once.
   Exposes window.HopfieldBackground.render(slide), a hero `background`, and starts one loop. */
(function () {
  var COLS = 35;
  var SIZE = COLS * COLS;
  var GAIN = 2.5;                 /* steepness of each unit's response to its field */
  var SHARPNESS = 12;             /* how strongly the energy favours the closest shape */
  var NOISE = 0.25;
  var RATE = 0.007;               /* each step moves a unit this fraction of the way to its target */
  var STEP = 1 / 60;              /* seconds per simulation step */
  var SETTLED = { share: 0.9, overlap: 0.9 };   /* overlap as a fraction of the shape's own steady overlap */
  var DISSOLVE_STEPS = 70;        /* about a second */
  var TILT = { start: 0.3, fade: 0.9982 };
  var CURSOR = { radius: COLS * 0.2, fullSpeed: 0.7, rate: 0.6, held: 0.7 };   /* radius and speed in cells */

  var STILL = location.search.indexOf('print-pdf') !== -1
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The shapes the network remembers, each drawn white on black in a -0.5 to 0.5 box. */
  var SHAPES = [
    function smiley(c) {
      c.beginPath(); c.arc(0, 0, 0.48, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#000';
      c.beginPath(); c.arc(-0.17, -0.14, 0.07, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(0.17, -0.14, 0.07, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#000'; c.lineWidth = 0.08; c.lineCap = 'round';
      c.beginPath(); c.arc(0, 0.02, 0.27, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    },
    function heart(c) {
      c.beginPath();
      c.moveTo(0, 0.46);
      c.bezierCurveTo(-0.62, 0.05, -0.5, -0.46, -0.2, -0.42);
      c.bezierCurveTo(-0.08, -0.4, 0, -0.3, 0, -0.2);
      c.bezierCurveTo(0, -0.3, 0.08, -0.4, 0.2, -0.42);
      c.bezierCurveTo(0.5, -0.46, 0.62, 0.05, 0, 0.46);
      c.fill();
    },
    function star(c) {
      c.beginPath();
      for (var i = 0; i < 10; i++) {
        var radius = i % 2 ? 0.2 : 0.5;
        var angle = -Math.PI / 2 + (i * Math.PI) / 5;
        c.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius + 0.03);
      }
      c.closePath();
      c.fill();
    },
    function robot(c) {
      c.fillRect(-0.03, -0.48, 0.06, 0.14);
      c.beginPath(); c.arc(0, -0.46, 0.05, 0, Math.PI * 2); c.fill();
      c.fillRect(-0.38, -0.32, 0.76, 0.72);
      c.fillRect(-0.47, -0.1, 0.07, 0.24);
      c.fillRect(0.4, -0.1, 0.07, 0.24);
      c.fillStyle = '#000';
      c.fillRect(-0.24, -0.17, 0.15, 0.15);
      c.fillRect(0.09, -0.17, 0.15, 0.15);
      c.fillRect(-0.2, 0.15, 0.4, 0.08);
    },
    function house(c) {
      c.beginPath(); c.moveTo(0, -0.48); c.lineTo(0.5, -0.02); c.lineTo(-0.5, -0.02); c.closePath(); c.fill();
      c.fillRect(-0.34, -0.02, 0.68, 0.48);
      c.fillStyle = '#000';
      c.fillRect(-0.09, 0.16, 0.18, 0.3);
    },
    function moon(c) {
      c.beginPath(); c.arc(0, 0, 0.47, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#000';
      c.beginPath(); c.arc(0.2, -0.1, 0.39, 0, Math.PI * 2); c.fill();
    },
    function lightning(c) {
      c.beginPath();
      c.moveTo(0.14, -0.5); c.lineTo(-0.3, 0.08); c.lineTo(-0.04, 0.08);
      c.lineTo(-0.14, 0.5); c.lineTo(0.3, -0.1); c.lineTo(0.04, -0.1);
      c.closePath();
      c.fill();
    },
    function sailboat(c) {
      c.beginPath(); c.moveTo(-0.46, 0.2); c.lineTo(0.46, 0.2); c.lineTo(0.28, 0.44); c.lineTo(-0.28, 0.44); c.closePath(); c.fill();
      c.fillRect(-0.03, -0.48, 0.06, 0.68);
      c.beginPath(); c.moveTo(0.06, -0.46); c.lineTo(0.4, 0.12); c.lineTo(0.06, 0.12); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-0.06, -0.3); c.lineTo(-0.34, 0.12); c.lineTo(-0.06, 0.12); c.closePath(); c.fill();
    }
  ];

  /* A shape on the grid, centred and scaled so each unit's value averages 0 with a spread of 1. */
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
    var pattern = new Float32Array(SIZE);
    var mean = 0, spread = 0, i;
    for (i = 0; i < SIZE; i++) {
      pattern[i] = pixels[i * 4] > 127 ? 1 : -1;
      mean += pattern[i] / SIZE;
    }
    for (i = 0; i < SIZE; i++) {
      pattern[i] -= mean;
      spread += (pattern[i] * pattern[i]) / SIZE;
    }
    spread = Math.sqrt(spread);
    for (i = 0; i < SIZE; i++) pattern[i] /= spread;
    return pattern;
  }

  /* A still, random field, blurred so neighbouring units differ gently, at low contrast. */
  function softNoise() {
    var raw = new Float32Array(SIZE);
    var soft = new Float32Array(SIZE);
    var i;
    for (i = 0; i < SIZE; i++) raw[i] = Math.random() * 2 - 1;
    for (var y = 0; y < COLS; y++) {
      for (var x = 0; x < COLS; x++) {
        var sum = 0, n = 0;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            var ny = y + dy, nx = x + dx;
            if (ny < 0 || nx < 0 || ny >= COLS || nx >= COLS) continue;
            sum += raw[ny * COLS + nx];
            n++;
          }
        }
        soft[y * COLS + x] = (sum / n) * 2.5;
      }
    }
    return soft;
  }

  /* Modern Hopfield network: energy E = -(1/SHARPNESS) log sum exp(SHARPNESS m), where m is the state's overlap
     with each stored shape. Each unit follows dx/dt = -x + tanh(GAIN * field), the field being the energy's
     gradient, plus noise. */
  function createNet(el) {
    var canvas = el.querySelector('.hopfield-grid');
    var status = el.querySelector('.hopfield-status');
    var box = el.querySelector('.hopfield-scramble');
    var ctx = canvas.getContext('2d');
    var style = getComputedStyle(el);
    var ink = style.getPropertyValue('--text').trim();
    var accent = style.getPropertyValue('--accent-strong').trim();
    var stored = SHAPES.map(storedPattern);
    var steady = stored.map(function (pattern) {
      var sum = 0;
      for (var i = 0; i < SIZE; i++) sum += pattern[i] * Math.tanh(GAIN * pattern[i]);
      return sum / SIZE;
    });
    var state = new Float32Array(SIZE);
    var overlap = new Float32Array(SHAPES.length);
    var share = new Float32Array(SHAPES.length);
    var field = new Float32Array(SIZE);
    var winner = -1, energy = 0;
    var speckle = null, target = 0, tilt = 0, dissolving = 0;
    var drawnSize = 0;

    /* Dissolves into the noise, then settles; a fading energy tilt steers it to a different shape. */
    function scramble(instant) {
      speckle = softNoise();
      target = Math.floor(Math.random() * SHAPES.length);
      if (target === winner) target = (target + 1) % SHAPES.length;
      tilt = TILT.start;
      if (instant) state.set(speckle);
      else dissolving = DISSOLVE_STEPS;
    }

    /* Pushes the units near the cursor towards off, or towards on while Shift is held. */
    function disturb(cursor) {
      var moved = Math.hypot(cursor.dx, cursor.dy);
      var rect = canvas.getBoundingClientRect();
      if ((moved === 0 && !cursor.drawing) || rect.width === 0) return;
      var cell = rect.width / COLS;
      var cx = (cursor.x - rect.left) / cell;
      var cy = (cursor.y - rect.top) / cell;
      var amount = Math.min(1, moved / cell / CURSOR.fullSpeed);
      if (cursor.drawing) amount = Math.max(amount, CURSOR.held);
      var goal = cursor.drawing ? 1 : -1;
      for (var y = 0; y < COLS; y++) {
        for (var x = 0; x < COLS; x++) {
          var dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
          if (dist >= CURSOR.radius) continue;
          var i = y * COLS + x;
          state[i] += (goal - state[i]) * CURSOR.rate * (1 - dist / CURSOR.radius) * amount;
        }
      }
    }

    function step(cursor) {
      disturb(cursor);
      var m, i, top = -Infinity, total = 0;
      if (dissolving > 0) {
        for (i = 0; i < SIZE; i++) state[i] += (speckle[i] - state[i]) * 0.05;
        dissolving--;
        return;
      }
      for (m = 0; m < SHAPES.length; m++) {
        var sum = 0;
        for (i = 0; i < SIZE; i++) sum += stored[m][i] * state[i];
        overlap[m] = sum / SIZE;
        var tilted = overlap[m] + (m === target ? tilt : 0);
        if (tilted > top) { top = tilted; winner = m; }
      }
      for (m = 0; m < SHAPES.length; m++) {
        share[m] = Math.exp(SHARPNESS * (overlap[m] + (m === target ? tilt : 0) - top));
        total += share[m];
      }
      tilt *= TILT.fade;
      energy = -(top + Math.log(total) / SHARPNESS);
      field.fill(0);
      for (m = 0; m < SHAPES.length; m++) {
        share[m] /= total;
        for (i = 0; i < SIZE; i++) field[i] += share[m] * stored[m][i];
      }
      var kick = NOISE * Math.sqrt(RATE) * 3.46;
      for (i = 0; i < SIZE; i++) {
        state[i] += (Math.tanh(GAIN * field[i]) - state[i]) * RATE + (Math.random() - 0.5) * kick;
      }
    }

    function drawCells(cell, gap) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < SIZE; i++) {
        var x = (i % COLS) * cell + gap / 2;
        var y = Math.floor(i / COLS) * cell + gap / 2;
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.06;
        ctx.fillRect(x, y, cell - gap, cell - gap);
        var on = Math.max(0, Math.min(1, (state[i] + 1) / 2));
        ctx.fillStyle = accent;
        ctx.globalAlpha = on * on;
        ctx.fillRect(x, y, cell - gap, cell - gap);
      }
      ctx.globalAlpha = 1;
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
      var settled = dissolving === 0 && winner >= 0 && share[winner] > SETTLED.share && overlap[winner] > SETTLED.overlap * steady[winner];
      status.textContent = STILL
        ? 'Steady state: ' + SHAPES[0].name
        : (settled ? 'Steady state: ' + SHAPES[winner].name : 'Settling') + ' · energy ' + energy.toFixed(2);
    }

    if (STILL) {
      for (var i = 0; i < SIZE; i++) state[i] = stored[0][i] > 0 ? 1 : -1;
    } else {
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
    document.querySelectorAll('.hopfield-background').forEach(function (el) {
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

  function render() {
    return ''
      + '<div class="hopfield-background">'
      +   window.Wash.render({ seed: 'hopfield-networks' })
      +   '<div class="hopfield-net">'
      +     '<div class="hopfield-frame"><canvas class="hopfield-grid" aria-hidden="true"></canvas></div>'
      +     '<p class="hopfield-name">Hopfield Network</p>'
      +     '<p class="hopfield-status"></p>'
      +     '<p class="hopfield-scramble">Move the cursor here to scramble</p>'
      +   '</div>'
      + '</div>';
  }

  window.addEventListener('keydown', function (e) { if (e.key === 'Shift') cursor.drawing = true; });
  window.addEventListener('keyup', function (e) { if (e.key === 'Shift') cursor.drawing = false; });
  window.addEventListener('blur', function () { cursor.drawing = false; });
  document.addEventListener('mousemove', function (e) {
    cursor.drawing = e.shiftKey;
    cursor.dx += e.clientX - cursor.x;
    cursor.dy += e.clientY - cursor.y;
    cursor.x = e.clientX;
    cursor.y = e.clientY;
  });
  requestAnimationFrame(frame);

  window.HopfieldBackground = { render: render };
})();
