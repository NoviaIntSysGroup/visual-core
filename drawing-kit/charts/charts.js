/* Data charts as SVG strings, for slides and figures alike. A sibling of the
   diagram kit: marks are placed by scales from data, not by named nodes.
   Works standalone from Charts.defaults; picks up config.js and theme.css
   when they are loaded. Exposes window.Charts. */
(function () {
  /* Kit defaults, in points. config.js, when loaded, supplies font and size. */
  var DEFAULTS = {
    width: 400,          // scatter canvas
    height: 220,
    font: 'Arial, Helvetica, "Liberation Sans", sans-serif',
    fontSize: 10,
    lineHeight: 1.4,     // text row height, as a multiple of fontSize
    tick: 4,             // axis tick length
    gap: 4,              // tick -> tick label, mark -> its label
    titleGap: 8,         // tick labels -> axis title, top row -> plot
    dot: 4,              // scatter dot radius, and legend dots
    dotMax: 8,           // radius of the largest dot when points carry a `size`
    yTicks: 4            // value-axis divisions
  };

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var SERIES_MAX = 3;    // one per category hue; more is a different chart

  function type() {
    var f = window.Config && window.Config.figure;
    return {
      font: (f && f.font) || DEFAULTS.font,
      size: (f && f.type && f.type.slideBody && f.type.slideBody.size) || DEFAULTS.fontSize
    };
  }

  var ctx;
  function textWidth(s, t) {
    ctx = ctx || document.createElement('canvas').getContext('2d');
    ctx.font = t.size + 'px ' + t.font;
    return ctx.measureText(String(s).replace(/<[^>]*>/g, '')).width;
  }

  function n(v) { return Math.round(v * 100) / 100; }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function text(x, y, s, cls, anchor, t) {
    return '<text' + (cls ? ' class="' + cls + '"' : '') + ' x="' + n(x) + '" y="' + n(y) + '" font-size="' + t.size + '"'
      + ' text-anchor="' + (anchor || 'start') + '" dominant-baseline="central">' + s + '</text>';
  }

  function line(x1, y1, x2, y2, cls) {
    return '<line class="' + cls + '" x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) + '"/>';
  }

  function svg(w, h, aria, body) {
    return '<svg class="chart" width="' + n(w) + '" height="' + n(h) + '"'
      + ' viewBox="0 0 ' + n(w) + ' ' + n(h) + '" xmlns="http://www.w3.org/2000/svg"'
      + ' role="img" aria-label="' + esc(aria) + '"'
      + ' style="--viewbox-width:' + n(w) + 'px;width:' + n(w) + 'px;height:auto">'
      + body + '</svg>';
  }

  function axisTitle(axis) {
    return axis.title + (axis.unit ? ' (' + axis.unit + ')' : '');
  }

  /* "YYYY-MM" or "YYYY-MM-DD" -> a month count, so dates space evenly on x. */
  function month(s) {
    var p = String(s).split('-');
    return Number(p[0]) * 12 + Number(p[1]) - 1 + (p[2] ? (Number(p[2]) - 1) / 31 : 0);
  }

  /* The class each series is drawn in: the category hues in order, skipping
     `muted` series, which are drawn in the quiet neutral as context. */
  function seriesClasses(list, kind) {
    var hue = 0;
    var cls = list.map(function (s) { return s.muted ? 'chart-series-muted' : 'chart-series-' + hue++; });
    if (hue > SERIES_MAX) throw new Error('Charts.' + kind + ': at most ' + SERIES_MAX + ' coloured series');
    return cls;
  }

  /* ---- scatter -------------------------------------------------------------
     Dates on x, values on y. `muted` series are grey; `size` sets dot area.
     spec: { x: { title, from, to, ticks }, size: { max },
       y: { title, unit, min, max, ticks, grid },
       series: [{ label, muted, points: [{ label, labelPos, x, y, size }] }] } */
  function scatter(spec) {
    var t = type(), xs = spec.x || {}, ys = spec.y || {}, series = spec.series || [];
    var classes = seriesClasses(series, 'scatter');
    var W = spec.width || DEFAULTS.width, H = spec.height || DEFAULTS.height;
    var row = t.size * DEFAULTS.lineHeight;
    var x0 = month(xs.from), x1 = month(xs.to);
    var y0 = ys.min || 0, y1 = ys.max == null ? 100 : ys.max, unit = ys.unit || '';
    var points = [];
    series.forEach(function (s, k) {
      (s.points || []).forEach(function (p) {
        points.push({ p: p, cls: classes[k], muted: !!s.muted, fx: (month(p.x) - x0) / (x1 - x0) });
      });
    });
    var sizeMax = (spec.size && spec.size.max)
      || Math.max.apply(null, points.map(function (q) { return q.p.size || 0; }));
    points.forEach(function (q) {
      q.r = q.p.size ? DEFAULTS.dotMax * Math.sqrt(q.p.size / sizeMax) : DEFAULTS.dot;
    });

    // y ticks: `y.ticks` lists them, else min..max in DEFAULTS.yTicks steps.
    var yTicks = ys.ticks ? ys.ticks.slice() : [];
    if (!ys.ticks) for (var i = 0; i <= DEFAULTS.yTicks; i++) yTicks.push(y0 + (y1 - y0) * i / DEFAULTS.yTicks);
    // x ticks: every quarter, labelled at the tick; or `ticks: 'year'`, a tick
    // at each new year and the year centred over its stretch of the axis.
    var yearly = xs.ticks === 'year';
    var xTicks = [], xLabels = [];
    for (var m = x0; m <= x1; m++) if (m % (yearly ? 12 : 3) === 0) xTicks.push(m);
    if (yearly) {
      for (var yr = Math.floor(x0 / 12); yr <= Math.floor(x1 / 12); yr++) {
        xLabels.push({ at: (Math.max(x0, yr * 12) + Math.min(x1, yr * 12 + 12)) / 2, text: yr });
      }
    } else {
      xLabels = xTicks.map(function (mo) { return { at: mo, text: MONTHS[mo % 12] + ' ' + Math.floor(mo / 12) }; });
    }

    // Plot box: left clears the y tick labels, the right edge is the widest
    // that still keeps every right-hand point label on the canvas.
    var left = Math.max.apply(null, yTicks.map(function (v) { return textWidth(v + unit, t); }))
      + DEFAULTS.gap + DEFAULTS.tick;
    var top = row + DEFAULTS.titleGap;
    var bottom = H - (DEFAULTS.tick + DEFAULTS.gap + row + (xs.title ? DEFAULTS.titleGap + row : 0));
    var plotW = W - left;
    points.forEach(function (q) {
      if (q.muted || !q.p.label || (q.p.labelPos || 'right') !== 'right' || !q.fx) return;
      var room = W - left - q.r - DEFAULTS.gap - textWidth(q.p.label, t);
      plotW = Math.min(plotW, room / q.fx);
    });
    function px(mo) { return left + plotW * (mo - x0) / (x1 - x0); }
    function py(v) { return bottom - (bottom - top) * (v - y0) / (y1 - y0); }

    // Gridlines at the y ticks, unless `y.grid` is false; the baseline stays.
    var grid = yTicks.map(function (v) {
      var rule = v === y0 ? line(left, py(v), left + plotW, py(v), 'chart-axis')
        : ys.grid === false ? '' : line(left, py(v), left + plotW, py(v), 'chart-grid');
      return rule
        + line(left - DEFAULTS.tick, py(v), left, py(v), 'chart-axis')
        + text(left - DEFAULTS.tick - DEFAULTS.gap, py(v), v + unit, 'chart-tick', 'end', t);
    }).join('') + xTicks.map(function (mo) {
      return line(px(mo), bottom, px(mo), bottom + DEFAULTS.tick, 'chart-axis');
    }).join('') + xLabels.map(function (l) {
      return text(px(l.at), bottom + DEFAULTS.tick + DEFAULTS.gap + row / 2, l.text, 'chart-tick', 'middle', t);
    }).join('') + line(left, top, left, bottom, 'chart-axis');

    var titles = text(0, row / 2, axisTitle(ys), '', 'start', t)
      + (xs.title ? text(left + plotW / 2, H - row / 2, axisTitle(xs), '', 'middle', t) : '');

    // Legend, right-aligned on the top row beside the y axis title. None for a
    // single series (the title around the chart names it), nor with
    // `legend: false`, when one `legend` chart keys several charts at once.
    var legend = '';
    if (series.length > 1 && spec.legend !== false) {
      var key = legendRow(series, row / 2, t);
      legend = '<g transform="translate(' + n(W - key.width) + ' 0)">' + key.body + '</g>';
    }

    var LABEL = {
      right: function (x, y, off) { return [x + off, y, 'start']; },
      left:  function (x, y, off) { return [x - off, y, 'end']; },
      above: function (x, y, off) { return [x, y - off - row / 2, 'middle']; },
      below: function (x, y, off) { return [x, y + off + row / 2, 'middle']; }
    };
    function mark(q) {
      var x = px(month(q.p.x)), y = py(Number(q.p.y));
      var at = (LABEL[q.p.labelPos] || LABEL.right)(x, y, q.r + DEFAULTS.gap);
      return '<circle class="' + q.cls + '" cx="' + n(x) + '" cy="' + n(y) + '" r="' + n(q.r) + '"/>'
        + (q.p.label && !q.muted ? text(at[0], at[1], q.p.label, '', at[2], t) : '');
    }
    var marks = points.filter(function (q) { return q.muted; })
      .concat(points.filter(function (q) { return !q.muted; }))
      .map(mark).join('');

    var aria = spec.ariaLabel || 'Scatter chart of ' + axisTitle(ys) + ' against ' + (xs.title ? axisTitle(xs) : 'date') + '. '
      + series.map(function (s) {
        return s.label + ': ' + (s.points || []).map(function (p) { return (p.label ? p.label + ' ' : '') + p.x + ' ' + p.y + unit; }).join(', ');
      }).join('. ');
    return { svg: svg(W, H, aria, grid + titles + legend + marks), width: W, height: H };
  }

  /* A row of dot + label entries from x = 0, centred on y, hued like the
     series they key. `items` are series, or labels. Returns { body, width }. */
  function legendRow(items, y, t) {
    items = items.map(function (it) { return typeof it === 'string' ? { label: it } : it; });
    var classes = seriesClasses(items, 'legend');
    var x = 0, space = DEFAULTS.titleGap * 2;
    var body = items.map(function (it, k) {
      var entry = '<circle class="' + classes[k] + '" cx="' + n(x + DEFAULTS.dot) + '" cy="' + n(y) + '" r="' + DEFAULTS.dot + '"/>'
        + text(x + 2 * DEFAULTS.dot + DEFAULTS.gap, y, it.label, '', 'start', t);
      x += 2 * DEFAULTS.dot + DEFAULTS.gap + textWidth(it.label, t) + space;
      return entry;
    }).join('');
    return { body: body, width: Math.max(0, x - space) };
  }

  /* ---- legend --------------------------------------------------------------
     The series key on its own, for several charts that share one: their series
     in the same order, each drawn with `legend: false`.
     spec: { items: [label | { label, muted }] } */
  function legend(spec) {
    var t = type(), items = spec.items || [];
    var H = t.size * DEFAULTS.lineHeight;
    var key = legendRow(items, H / 2, t);
    var names = items.map(function (it) { return typeof it === 'string' ? it : it.label; });
    return { svg: svg(key.width, H, spec.ariaLabel || 'Legend: ' + names.join(', '), key.body), width: key.width, height: H };
  }

  /* One entry per chart kind; adding a kind is an entry here and its builder. */
  var KINDS = { scatter: scatter, legend: legend };

  /* Draws `spec` by its `kind`. Returns { svg, width, height } in points. */
  function render(spec) {
    var build = KINDS[spec.kind];
    if (!build) throw new Error('Charts: unknown kind "' + spec.kind + '" (' + Object.keys(KINDS).join(', ') + ')');
    return build(spec);
  }

  window.Charts = { defaults: DEFAULTS, render: render };
})();
