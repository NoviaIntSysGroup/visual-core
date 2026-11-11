/* Unit circle, a project app: the dot-product app's plane cropped to the unit circle, on a wash.
   ŵ lies along the x-axis while x̂ turns around the circle, so the projection along ŵ, cos θ,
   grows, shrinks, and turns negative as it goes. While the cursor is over the circle, x̂ points
   at it, and turns on from there once it leaves. Needs DotProduct loaded first, for its plane.
   Exposes window.UnitCircle.render(slide), placed as a hero `background`; the wash takes the
   slide's own `seed`, and a slide's `work` (lines) and `question` are written by hand top left.
   Runs only while its slide is present; print shows x̂ still, and reduced
   motion stops the turning but not the cursor. */
(function () {
  var PERIOD = 12;      /* seconds per turn of x̂ */
  var STILL_AT = 60;    /* x̂'s angle in degrees when standing still */
  var REACH = 1.5;      /* units shown each side of the origin */
  var BOX = 250;        /* the circle's square, in points; the plane is drawn to fill it, never scaled */
  var UNIT = BOX / (2 * REACH);

  var PRINT = location.search.indexOf('print-pdf') !== -1;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var degrees = STILL_AT, last = 0;
  var cursor = null;    /* the pointer's client position, or null when it is off the page */

  function picture(degrees) {
    var P = window.DotProduct, c = P.side(UNIT) / 2;
    return '<circle class="unit-circle-ring" cx="' + c + '" cy="' + c + '" r="' + UNIT + '"/>'
      + P.plane({ wLength: 1, wAngle: 0, xLength: 1, xAngle: degrees }, UNIT);
  }

  function note(slide) {
    if (!slide.work && !slide.question) return '';
    return '<div class="unit-circle-note">'
      + (slide.work || []).map(function (line) { return '<p>' + line + '</p>'; }).join('')
      + (slide.question ? '<p class="unit-circle-question">' + slide.question + '</p>' : '')
      + '</div>';
  }

  function render(slide) {
    var corner = window.DotProduct.side(UNIT) / 2 - BOX / 2;
    return ''
      + '<div class="unit-circle">'
      +   window.Wash.render(slide)
      +   '<svg class="unit-circle-plane" width="' + BOX + '" height="' + BOX + '" viewBox="' + corner + ' ' + corner + ' ' + BOX + ' ' + BOX + '"'
      +     ' aria-hidden="true">' + picture(STILL_AT) + '</svg>'
      +   note(slide)
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

  function frame(now) {
    requestAnimationFrame(frame);
    var seconds = Math.min((now - last) / 1000, 0.05);
    last = now;
    document.querySelectorAll('.unit-circle').forEach(function (el) {
      if (!el.closest('section.present')) return;
      var plane = el.querySelector('.unit-circle-plane'), aimed = steer(plane);
      if (aimed !== null) degrees = aimed;
      else if (!REDUCED) degrees = (degrees + seconds / PERIOD * 360) % 360;
      plane.innerHTML = picture(degrees);
    });
  }

  if (!PRINT) {
    document.addEventListener('pointermove', function (e) { cursor = { x: e.clientX, y: e.clientY }; });
    document.documentElement.addEventListener('pointerleave', function () { cursor = null; });
    requestAnimationFrame(frame);
  }

  window.UnitCircle = { render: render };
})();
