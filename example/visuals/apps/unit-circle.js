/* Unit circle, a project app: the dot-product app's plane cropped to the unit circle.
   ŵ lies along the x-axis while x̂ turns around the circle, so the projection along ŵ, cos θ,
   grows, shrinks, and turns negative as it goes. While the cursor is over the circle, x̂ points
   at it, and turns on from there once it leaves. Needs DotProduct loaded first, for its plane.
   Exposes window.UnitCircle.render(spec), placed two ways:
   - as a hero `background`, on a wash: the wash takes the slide's own `seed`, and a slide's
     `work` (lines) and `question` are written by hand top left;
   - with an `app` block, smaller, its two vectors named a and b, with a · b shown live beside it.
   Runs only while its slide is present and, when fragments step, its press is the current one
   (its start press with `play: "press"`); print shows x̂ still, and reduced motion stops the
   turning but not the cursor. */
(function () {
  var PERIOD = 12;      /* seconds per turn of x̂ */
  var STILL_AT = 60;    /* x̂'s angle in degrees when standing still */
  var REACH = 1.5;      /* units shown each side of the origin */
  var BOX = { cover: 250, block: 150 };   /* the circle's square, in points; the plane is drawn to fill it, never scaled */

  var PRINT = location.search.indexOf('print-pdf') !== -1;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var degrees = STILL_AT, last = 0;
  var cursor = null;    /* the pointer's client position, or null when it is off the page */

  function unit(box) { return box / (2 * REACH); }

  function picture(degrees, box) {
    var P = window.DotProduct, c = P.side(unit(box)) / 2;
    return '<circle class="unit-circle-ring" cx="' + c + '" cy="' + c + '" r="' + unit(box) + '"/>'
      + P.plane({ wLength: 1, wAngle: 0, xLength: 1, xAngle: degrees }, unit(box));
  }

  function svg(box) {
    var corner = window.DotProduct.side(unit(box)) / 2 - box / 2;
    return '<svg class="unit-circle-plane" width="' + box + '" height="' + box + '" viewBox="' + corner + ' ' + corner + ' ' + box + ' ' + box + '"'
      + ' aria-hidden="true">' + picture(STILL_AT, box) + '</svg>';
  }

  /* Both vectors are unit length and ŵ lies along the x-axis, so their dot product is cos θ. */
  function dot(degrees) {
    var d = Math.cos(degrees * Math.PI / 180);
    return (Math.abs(d) < 0.005 ? 0 : d).toFixed(2);
  }

  function note(slide) {
    if (!slide.work && !slide.question) return '';
    return '<div class="unit-circle-note">'
      + (slide.work || []).map(function (line) { return '<p>' + line + '</p>'; }).join('')
      + (slide.question ? '<p class="unit-circle-question">' + slide.question + '</p>' : '')
      + '</div>';
  }

  function render(spec) {
    if (spec.type === 'app') {
      return window.DotProduct.typeset(''
        + '<div class="unit-circle is-block" data-box="' + BOX.block + '">'
        +   svg(BOX.block)
        +   '<div class="unit-circle-readouts">'
        +     '<p class="dot-product-legend"><span class="dot-product-key is-w"></span>$\\mathbf{a}$'
        +       '<span class="dot-product-key is-x"></span>$\\mathbf{b}$</p>'
        +     '<p>$\\mathbf{a}\\cdot\\mathbf{b}$ = <span data-shows="dot">' + dot(STILL_AT) + '</span></p>'
        +   '</div>'
        + '</div>');
    }
    return ''
      + '<div class="unit-circle is-cover" data-box="' + BOX.cover + '">'
      +   window.Wash.render(spec)
      +   svg(BOX.cover)
      +   note(spec)
      + '</div>';
  }

  /* x̂'s angle towards the cursor, measured from the plane's centre with y up, or null when the
     cursor is outside the plane's box. */
  function steer(plane) {
    if (!cursor) return null;
    var box = plane.getBoundingClientRect();
    if (cursor.x < box.left || cursor.x > box.right || cursor.y < box.top || cursor.y > box.bottom) return null;
    var dx = cursor.x - (box.left + box.width / 2), dy = (box.top + box.height / 2) - cursor.y;
    return Math.atan2(dy, dx) * 180 / Math.PI;
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
    var seconds = Math.min((now - last) / 1000, 0.05);
    last = now;
    document.querySelectorAll('.unit-circle').forEach(function (el) {
      if (!running(el)) return;
      var plane = el.querySelector('.unit-circle-plane'), aimed = steer(plane), shows = el.querySelector('[data-shows="dot"]');
      if (aimed !== null) degrees = aimed;
      else if (!REDUCED) degrees = (degrees + seconds / PERIOD * 360) % 360;
      plane.innerHTML = picture(degrees, Number(el.dataset.box));
      if (shows) shows.textContent = dot(degrees);
    });
  }

  if (!PRINT) {
    document.addEventListener('pointermove', function (e) { cursor = { x: e.clientX, y: e.clientY }; });
    document.documentElement.addEventListener('pointerleave', function () { cursor = null; });
    requestAnimationFrame(frame);
  }

  window.UnitCircle = { render: render };
})();
