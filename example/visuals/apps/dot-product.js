/* Dot product, a project app: vectors w and x on the plane, set by four sliders, with the
   projection of x onto w drawn as a dotted right triangle and a faded bar along w, the angle θ
   between them marked by an arc, and cos θ, the projection's length, and x · w shown live.
   Exposes window.DotProduct.render(spec), placed with an `app` block, and redraws on slider input;
   also its plane drawing, `plane(state, unit)`: a square of side `side(unit)` points, `unit` points
   per unit length (its own `unit` when left out); strokes, heads, and θ keep their size at any unit. */
(function () {
  var START = { wLength: 1, wAngle: 0, xLength: 1, xAngle: 90 };
  var SIZE = 240;                 /* plane side, in points */
  var UNIT = 56;                  /* points per unit length; a length-2 vector nearly reaches the edge */
  var HEAD = { length: 10, half: 4.5 };
  var CORNER = 7;                 /* side of the right-angle marker */
  var BAR = { offset: 6, slide: 12 };    /* bar's distance beside w's line; how close x comes before it slides across */
  var ARC = { radius: 24, label: 13, fade: 20 };   /* θ arc radius, label distance past it, degrees from 0° or 180° it fades over */

  var CONTROLS = [
    { key: 'wLength', label: 'Length of', vector: 'w', min: 0, max: 2, step: 0.01 },
    { key: 'wAngle', label: 'Angle of', vector: 'w', min: 0, max: 360, step: 1 },
    { key: 'xLength', label: 'Length of', vector: 'x', min: 0, max: 2, step: 0.01 },
    { key: 'xAngle', label: 'Angle of', vector: 'x', min: 0, max: 360, step: 1 }
  ];

  function vector(length, degrees) {
    var a = degrees * Math.PI / 180;
    return { x: length * Math.cos(a), y: length * Math.sin(a) };
  }

  /* The plane's side at `unit` points per unit length, and the geometry every drawing step reads. */
  function sideAt(unit) { return SIZE * unit / UNIT; }
  function geometry(unit) { return { unit: unit, size: sideAt(unit), mid: sideAt(unit) / 2 }; }

  /* Plane coordinates to SVG points: origin in the middle, y up. */
  function pt(g, v) { return [g.mid + v.x * g.unit, g.mid - v.y * g.unit]; }
  function r(n) { return Math.round(n * 100) / 100; }
  function line(a, b, cls) {
    return '<line class="' + cls + '" x1="' + r(a[0]) + '" y1="' + r(a[1]) + '" x2="' + r(b[0]) + '" y2="' + r(b[1]) + '"/>';
  }

  function axes(g) {
    var out = line([4, g.mid], [g.size - 4, g.mid], 'dot-product-axis')
      + line([g.mid, 4], [g.mid, g.size - 4], 'dot-product-axis');
    [-2, -1, 1, 2].forEach(function (u) {
      var p = g.mid + u * g.unit;
      out += line([p, g.mid - 3], [p, g.mid + 3], 'dot-product-axis')
        + line([g.mid - 3, p], [g.mid + 3, p], 'dot-product-axis');
    });
    return out;
  }

  /* An arrow from the origin: a shaft stopping short of the tip, and a filled head. */
  function arrow(g, v, cls) {
    var o = pt(g, { x: 0, y: 0 }), t = pt(g, v);
    var dx = t[0] - o[0], dy = t[1] - o[1], len = Math.hypot(dx, dy);
    if (len < 1) return '';
    var ux = dx / len, uy = dy / len, head = Math.min(HEAD.length, len);
    var bx = t[0] - ux * head, by = t[1] - uy * head;
    return '<g class="dot-product-vector ' + cls + '">'
      + line(o, [bx, by], '')
      + '<polygon points="' + [t, [bx - uy * HEAD.half, by + ux * HEAD.half], [bx + uy * HEAD.half, by - ux * HEAD.half]]
        .map(function (p) { return r(p[0]) + ',' + r(p[1]); }).join(' ') + '"/>'
      + '</g>';
  }

  /* The right triangle: origin to the foot of x on w's line, the foot up to x, and the corner mark.
     Beside w's line, on the side away from x, a bar in x's hue spans the projection itself; as x
     nears the line, the bar slides onto it and across, rather than jumping sides. */
  function projection(g, w, x) {
    var wl = Math.hypot(w.x, w.y);
    if (wl === 0) return '';
    var u = { x: w.x / wl, y: w.y / wl };
    var along = x.x * u.x + x.y * u.y;
    var foot = { x: along * u.x, y: along * u.y };
    var up = { x: x.x - foot.x, y: x.y - foot.y }, upl = Math.hypot(up.x, up.y);
    var out = line(pt(g, { x: 0, y: 0 }), pt(g, foot), 'dot-product-projection')
      + line(pt(g, foot), pt(g, x), 'dot-product-projection');
    if (Math.abs(along) * g.unit >= 1) {
      var across = u.x * x.y - u.y * x.x;   /* x's signed distance from w's line, counterclockwise positive */
      var shift = -BAR.offset * Math.max(-1, Math.min(1, across * g.unit / BAR.slide)) / g.unit;
      var o = { x: -u.y * shift, y: u.x * shift };
      out += line(pt(g, o), pt(g, { x: foot.x + o.x, y: foot.y + o.y }), 'dot-product-shadow is-x');
    }
    var c = CORNER / g.unit;
    if (upl * g.unit > CORNER * 1.5 && Math.abs(along) * g.unit > CORNER * 1.5) {
      var back = { x: -Math.sign(along) * u.x * c, y: -Math.sign(along) * u.y * c };
      var side = { x: up.x / upl * c, y: up.y / upl * c };
      var a = { x: foot.x + back.x, y: foot.y + back.y };
      var b = { x: a.x + side.x, y: a.y + side.y };
      out += line(pt(g, a), pt(g, b), 'dot-product-corner')
        + line(pt(g, b), pt(g, { x: foot.x + side.x, y: foot.y + side.y }), 'dot-product-corner');
    }
    return out;
  }

  /* θ in degrees, 0 to 180, and whether it opens counterclockwise from w; null without two vectors. */
  function angle(s) {
    if (s.wLength === 0 || s.xLength === 0) return null;
    var turn = ((s.xAngle - s.wAngle) % 360 + 360) % 360;
    return turn <= 180 ? { deg: turn, ccw: true } : { deg: 360 - turn, ccw: false };
  }

  /* The arc from w to x through θ, inside the shorter vector, with θ written at its middle. It fades
     out near 0°, where the vectors overlap, and near 180°, where it changes side. */
  function thetaArc(g, s) {
    var t = angle(s);
    var fade = t ? Math.min(1, t.deg / ARC.fade, (180 - t.deg) / ARC.fade) : 0;
    if (fade <= 0.01) return '';
    var R = Math.max(10, Math.min(ARC.radius, 0.6 * Math.min(s.wLength, s.xLength) * g.unit));
    var at = function (deg, rad) {
      var a = deg * Math.PI / 180;
      return [g.mid + rad * Math.cos(a), g.mid - rad * Math.sin(a)];
    };
    var end = s.wAngle + (t.ccw ? t.deg : -t.deg), mid = s.wAngle + (t.ccw ? t.deg : -t.deg) / 2;
    var a = at(s.wAngle, R), b = at(end, R), l = at(mid, R + ARC.label);
    return '<g opacity="' + r(fade) + '">'
      + '<path class="dot-product-arc" d="M' + r(a[0]) + ' ' + r(a[1]) + ' A' + r(R) + ' ' + r(R)
      + ' 0 0 ' + (t.ccw ? 0 : 1) + ' ' + r(b[0]) + ' ' + r(b[1]) + '"/>'
      + '<text class="dot-product-theta" x="' + r(l[0]) + '" y="' + r(l[1]) + '">θ</text>'
      + '</g>';
  }

  function plane(s, unit) {
    var g = geometry(unit || UNIT), w = vector(s.wLength, s.wAngle), x = vector(s.xLength, s.xAngle);
    return axes(g) + projection(g, w, x) + thetaArc(g, s) + arrow(g, w, 'is-w') + arrow(g, x, 'is-x');
  }

  function fixed(n) { return (Math.abs(n) < 0.005 ? 0 : n).toFixed(2); }

  function cosine(s) {
    var t = angle(s);
    return t ? fixed(Math.cos(t.deg * Math.PI / 180)) : '–';
  }
  /* ‖x‖ cos θ: how far x reaches along w, which has no direction while w has no length. */
  function reach(s) {
    var t = angle(s);
    if (s.wLength === 0) return '–';
    return t ? fixed(s.xLength * Math.cos(t.deg * Math.PI / 180)) : fixed(0);
  }

  function dot(s) {
    var w = vector(s.wLength, s.wAngle), x = vector(s.xLength, s.xAngle);
    return fixed(x.x * w.x + x.y * w.y);
  }

  function shown(c, v) { return c.step < 1 ? Number(v).toFixed(2) : v + '°'; }
  /* How far along its track a slider sits, which its track paints in the vector's hue. */
  function fill(c, v) { return '--dot-product-fill:' + r((v - c.min) / (c.max - c.min) * 100) + '%'; }

  /* The markup with each $…$ drawn by MathJax, as the slide's own formulas are. */
  function typeset(html) {
    var el = document.createElement('div');
    el.innerHTML = html;
    if (window.Tex) Tex.typeset(el);
    return el.innerHTML;
  }

  function render() {
    var controls = CONTROLS.map(function (c) {
      return '<div class="dot-product-control is-' + c.vector + '">'
        + '<p>' + c.label + ' $\\mathbf{' + c.vector + '}$: <span data-shows="' + c.key + '">' + shown(c, START[c.key]) + '</span></p>'
        + '<input type="range" data-key="' + c.key + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step
        + '" value="' + START[c.key] + '" style="' + fill(c, START[c.key]) + '"'
        + ' aria-label="' + c.label + ' ' + c.vector + '">'
        + '</div>';
    }).join('');
    return typeset(''
      + '<div class="dot-product">'
      +   '<div class="dot-product-view">'
      +     '<svg class="dot-product-plane" width="' + SIZE + '" height="' + SIZE + '" viewBox="0 0 ' + SIZE + ' ' + SIZE + '" role="img"'
      +       ' aria-label="Vectors w and x on the plane, with the projection of x onto w">' + plane(START) + '</svg>'
      +     '<div class="dot-product-readouts">'
      +       '<p class="dot-product-legend"><span class="dot-product-key is-w"></span>$\\mathbf{w}$'
      +         '<span class="dot-product-key is-x"></span>$\\mathbf{x}$</p>'
      +       '<p class="dot-product-legend"><span class="dot-product-key is-x is-shadow"></span>projection</p>'
      +       '<p>$\\cos\\theta$ = <span data-shows="cosine">' + cosine(START) + '</span></p>'
      +       '<p>$\\lVert\\mathbf{x}\\rVert\\cos\\theta$ = <span data-shows="reach">' + reach(START) + '</span></p>'
      +       '<p>$\\mathbf{x}\\cdot\\mathbf{w}$ = <span data-shows="dot">' + dot(START) + '</span></p>'
      +     '</div>'
      +   '</div>'
      +   '<div class="dot-product-controls">' + controls + '</div>'
      + '</div>');
  }

  document.addEventListener('input', function (e) {
    var app = e.target.closest && e.target.closest('.dot-product');
    if (!app) return;
    var s = {};
    app.querySelectorAll('input[data-key]').forEach(function (el) { s[el.dataset.key] = Number(el.value); });
    CONTROLS.forEach(function (c) {
      app.querySelector('[data-shows="' + c.key + '"]').textContent = shown(c, s[c.key]);
      app.querySelector('input[data-key="' + c.key + '"]').setAttribute('style', fill(c, s[c.key]));
    });
    app.querySelector('[data-shows="cosine"]').textContent = cosine(s);
    app.querySelector('[data-shows="reach"]').textContent = reach(s);
    app.querySelector('[data-shows="dot"]').textContent = dot(s);
    app.querySelector('.dot-product-plane').innerHTML = plane(s);
  });

  window.DotProduct = { render: render, plane: plane, side: sideAt };
})();
