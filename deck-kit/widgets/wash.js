/* Wash: a quiet coloured backdrop behind an image grid. Exposes window.Wash. The
   deck's seed string is hashed, so one seed gives one wash everywhere. Two forms over
   the same four hues: `blobs` (soft radial fields; the default, needs area) and
   `gradient` (two hues on a seeded angle; for small panels). Plain CSS gradients with
   no filters or animation, so they export to PDF as-is. */
(function () {
  /* Order matters and is load-bearing: it is the order a seed's shuffle draws
     from, so changing it would repaint every existing wash in every deck. */
  var HUES = ['primary', 'secondary', 'tertiary', 'neutral'];

  /* Eight angles rather than a free 0–360: a quantized set keeps two washes from
     differing by an invisible three degrees, and none of the eight lands on a
     flat horizontal or vertical, which reads as a deliberate band rather than as
     a wash. */
  var ANGLES = [20, 65, 110, 155, 200, 245, 290, 335];

  var STRENGTHS = {
    strong: ' deck-wash-strong',
    'very-strong': ' deck-wash-very-strong'
  };

  /* FNV-1a. Stability is the entire requirement: the seed is written in the
     deck, so the wash must never depend on render order, slide position, time,
     or anything else in the page. */
  function hash(str) {
    var h = 2166136261 >>> 0;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  /* mulberry32 — one seeded stream feeding every sub-decision (which hues, which
     angle, where the blobs sit), so a seed picks a whole wash rather than just a
     colour. */
  function rng(seed) {
    var t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rand, arr) {
    return arr[Math.floor(rand() * arr.length)];
  }

  function between(rand, lo, hi) {
    return (lo + rand() * (hi - lo)).toFixed(0);
  }

  /* The hue order this seed draws from. Four hues collide often under hashing, so
     `hue` pins the first and the seed decides the rest. An unrecognised `hue` is
     ignored, leaving the seeded choice. */
  function order(rand, forced) {
    var a = HUES.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    var at = a.indexOf(forced);
    if (at > 0) { a[at] = a[0]; a[0] = forced; }
    return a;
  }

  function hue(name) {
    return 'var(--deck-wash-' + name + ')';
  }

  /* ── The two forms ──────────────────────────────────────────────────────── */

  function gradient(rand, h) {
    return 'background:linear-gradient(' + pick(rand, ANGLES) + 'deg,'
      + hue(h[0]) + ',' + hue(h[1]) + ')';
  }

  /* Three fields, each allowed to sit slightly outside the box so the panel
     looks like a crop of something larger rather than three circles centred in a
     rectangle. The fourth hue becomes the base the others sit on. */
  function blobs(rand, h) {
    var layers = [];
    for (var i = 0; i < 3; i++) {
      layers.push('radial-gradient('
        + between(rand, 55, 105) + '% ' + between(rand, 60, 120) + '% at '
        + between(rand, -5, 105) + '% ' + between(rand, -5, 105) + '%,'
        + hue(h[i]) + ' 0%, transparent 70%)');
    }
    layers.push('linear-gradient(' + hue(h[3]) + ',' + hue(h[3]) + ')');
    return 'background:' + layers.join(',');
  }

  var VARIANTS = { blobs: blobs, gradient: gradient };

  /* spec: { seed, variant, hue, strength } */
  function render(spec) {
    var variant = VARIANTS[spec.variant] ? spec.variant : 'blobs';
    var rand = rng(hash(spec.seed == null ? '' : spec.seed));
    var strength = STRENGTHS[spec.strength] || '';

    return '<div class="deck-wash' + strength + '"'
      + ' aria-hidden="true" style="'
      + VARIANTS[variant](rand, order(rand, spec.hue)) + '"></div>';
  }

  window.Wash = { render: render };
})();
