/* Node/edge diagram kit (TikZ-flavored): named nodes, and edges between them by name
   with a uniform gap and automatic arrowheads. Pure SVG-string output. Geometry is
   JS, since SVG path coordinates can't read var(); appearance is diagram.css. Depends
   on core/drawing-kit/icons/icons.js. Exposes window.Diagram. */
(function () {
  var Icon = window.Icons;

  /* ---- Tunable defaults --------------------------------------------------
     Exposed as Diagram.defaults. Override order, lowest first: these defaults;
     Diagram.create(w, h, {...}); node({...}) / edge(a, b, {...}). Font size is
     emitted inline; family and colours live in diagram.css. */
  var DEFAULTS = {
    gap: 4,                // standoff between an edge end and a node box (the "border")
    corner: 4,             // rounded-corner radius at orthogonal bends
    radius: 4,             // node frame corner radius
    labelGap: 4,           // gap from the box to an 'above'/'below' label
    padding: 4,            // inner sep between the frame and the text block
    fontSize: 8,           // default node-label size (pt); lineHeight follows it
    arrow: { length: 5, width: 5 } // arrowhead size: along the path / across it
  };
  /* Line advance defaults to the font size unless a diagram sets it. */
  DEFAULTS.lineHeight = DEFAULTS.fontSize;

  /* Internal precision — not normally worth tuning. */
  var PRECISION = 2;       // decimals kept in emitted path coordinates
  var DEDUPE_EPS = 0.01;   // points closer than this count as coincident

  /* Font-specific label calibration in em, so CSS token font sizes scale it. */
  var BELOW_LABEL_DY = '0.8em';
  var CENTER_LABEL_DY = '-0.08em';

  /* Inline emphasis inside a label; never hand-write a <tspan>.
     `dominant-baseline="inherit"` pins it to the label's baseline, which WebKit
     otherwise drops to alphabetic, oversizing the words. o: { weight = 700, style,
     cls }; pass `weight: null` when `cls` carries the weight. */
  function bold(text, o) {
    o = o || {};
    var weight = 'weight' in o ? o.weight : 700;
    return '<tspan'
      + (o.cls ? ' class="' + o.cls + '"' : '')
      + (weight != null ? ' font-weight="' + weight + '"' : '')
      + (o.style ? ' font-style="' + o.style + '"' : '')
      + ' dominant-baseline="inherit">' + text + '</tspan>';
  }

  function pick(v, dflt) { return v == null ? dflt : v; }

  /* ---- debug frames ------------------------------------------------------
     Every diagram outlines its own viewBox; diagram.css hides it until `.debug-on`,
     and figure.js strips it on export. `vector-effect` keeps the stroke at one screen
     pixel at every nesting depth. */
  function debugFrameSvg(w, h, level) {
    var i = 0.5;   // half a stroke, so the outline isn't clipped by the viewBox
    return '<rect class="debug-frame debug-frame--' + (level || 'component') + '"'
      + ' x="' + n(i) + '" y="' + n(i) + '" width="' + n(w - 2 * i) + '" height="' + n(h - 2 * i) + '"'
      + ' fill="none" vector-effect="non-scaling-stroke"/>';
  }

  /* ---- shared label helpers ----------------------------------------------
     A bare text node — a block label with no frame and no padding, placed at
     (x, y). Every composed figure needs this; it lived as a copy-pasted local
     `text()` in three of them before moving here.
       o: { align = 'center', size, lineHeight, color } */
  function label(d, id, x, y, lines, o) {
    o = o || {};
    d.node(id, {
      x: x, y: y, align: o.align || 'center', padding: 0,
      label: [{ lines: lines, fontSize: o.size, lineHeight: o.lineHeight }],
      appearance: o.color ? { label: o.color } : null
    });
    return d;
  }

  /* The standard icon appearance: one hue on both strokes over the soft
     surface. `person: true` also drives the filled person silhouette, which
     otherwise keeps its default grey while line-art icons take the colour. */
  function iconApp(color, o) {
    o = o || {};
    var a = { iconPrimary: color, iconSecondary: color, iconSurface: o.surface || 'var(--graphic-soft)' };
    if (o.person) { a.iconPerson = color; a.iconPersonOpacity = 1; }
    return a;
  }

  function fontSizeCss(value) {
    return typeof value === 'number' || /^[0-9.]+$/.test(String(value)) ? value + 'px' : cssValue(value);
  }
  /* The node-label font-size, inlined. The kit always supplies a default
     (DEFAULTS.fontSize), so this is emitted on every label. */
  function fontSizeStyle(value) {
    return 'font-size:' + fontSizeCss(value);
  }

  var NODE_APPEARANCE_VARS = {
    fill: '--diagram-node-fill',
    stroke: '--diagram-node-stroke',
    strokeWidth: '--diagram-node-stroke-width',
    opacity: '--diagram-node-opacity',
    label: '--diagram-label-color',
    iconPrimary: '--diagram-icon-primary',
    iconSecondary: '--diagram-icon-secondary',
    iconSurface: '--diagram-icon-surface',
    iconDetail: '--diagram-icon-detail',
    iconPerson: '--diagram-icon-person',
    iconPersonOpacity: '--diagram-icon-person-opacity'
  };

  var EDGE_APPEARANCE_VARS = {
    color: '--diagram-edge-color',
    stroke: '--diagram-edge-color',
    width: '--diagram-edge-width',
    strokeWidth: '--diagram-edge-width'
  };

  function cssValue(v) {
    return String(v).replace(/"/g, '&quot;');
  }

  function styleAttr(appearance, map) {
    if (!appearance) return '';
    var parts = [];
    Object.keys(map).forEach(function (k) {
      if (appearance[k] != null) parts.push(map[k] + ':' + cssValue(appearance[k]));
    });
    return parts.length ? ' style="' + parts.join(';') + '"' : '';
  }

  function hasEdgeColor(appearance) {
    return !!(appearance && (appearance.color != null || appearance.stroke != null));
  }

  /* Resolve module defaults + per-diagram opts into one config object. */
  function mergeCfg(opts) {
    var a = opts.arrow || {};
    return {
      gap:              pick(opts.gap, DEFAULTS.gap),
      corner:           pick(opts.corner, DEFAULTS.corner),
      radius:           pick(opts.radius, DEFAULTS.radius),
      fontSize:         pick(opts.fontSize, DEFAULTS.fontSize),
      labelGap:         pick(opts.labelGap, DEFAULTS.labelGap),
      arrow: { length: pick(a.length, DEFAULTS.arrow.length), width: pick(a.width, DEFAULTS.arrow.width) },
      padding: pick(opts.padding, DEFAULTS.padding),
      lineHeight: pick(opts.lineHeight, DEFAULTS.lineHeight),
      className: opts.className || '',
      ariaLabel: opts.ariaLabel || ''
    };
  }

  /* ---- vector helpers ---- */
  function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
  function mul(a, s) { return { x: a.x * s, y: a.y * s }; }
  function len(a) { return Math.hypot(a.x, a.y); }
  function unit(a) { var l = len(a) || 1; return { x: a.x / l, y: a.y / l }; }
  function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
  function n(v) { var p = Math.pow(10, PRECISION); return Math.round(v * p) / p; }
  function center(box) { return { x: box.x + box.w / 2, y: box.y + box.h / 2 }; }

  var NORMALS = {
    n: { x: 0, y: -1 }, s: { x: 0, y: 1 }, e: { x: 1, y: 0 }, w: { x: -1, y: 0 },
    ne: { x: 0.7071, y: -0.7071 }, nw: { x: -0.7071, y: -0.7071 },
    se: { x: 0.7071, y: 0.7071 }, sw: { x: -0.7071, y: 0.7071 }
  };

  function anchorPoint(box, name) {
    var x = box.x, y = box.y, w = box.w, h = box.h;
    switch (name) {
      case 'n':  return { x: x + w / 2, y: y };
      case 's':  return { x: x + w / 2, y: y + h };
      case 'e':  return { x: x + w,     y: y + h / 2 };
      case 'w':  return { x: x,         y: y + h / 2 };
      case 'ne': return { x: x + w,     y: y };
      case 'nw': return { x: x,         y: y };
      case 'se': return { x: x + w,     y: y + h };
      case 'sw': return { x: x,         y: y + h };
      default:   return { x: x + w / 2, y: y + h / 2 }; // center
    }
  }

  /* Where the ray from a node's center toward `toward` exits its border,
     plus the outward unit direction there. */
  function borderPoint(node, toward) {
    var c = center(node.box);
    var dir = unit(sub(toward, c));
    var hw = node.box.w / 2, hh = node.box.h / 2;
    var t;
    if (node.shape === 'circle' || node.shape === 'ellipse') {
      var ex = dir.x / hw, ey = dir.y / hh;
      t = 1 / Math.sqrt(ex * ex + ey * ey);
    } else {
      var tx = dir.x !== 0 ? hw / Math.abs(dir.x) : Infinity;
      var ty = dir.y !== 0 ? hh / Math.abs(dir.y) : Infinity;
      t = Math.min(tx, ty);
    }
    return { point: add(c, mul(dir, t)), dir: dir };
  }

  function pickV(c, refY) { return refY >= c.y ? 's' : 'n'; }
  function pickH(c, refX) { return refX >= c.x ? 'e' : 'w'; }

  /* Drop consecutive coincident points (e.g. a bus between aligned nodes),
     so routing never emits degenerate corner curves. */
  function dedupe(pts) {
    var out = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i], q = out[out.length - 1];
      if (Math.abs(p.x - q.x) > DEDUPE_EPS || Math.abs(p.y - q.y) > DEDUPE_EPS) out.push(p);
    }
    return out;
  }

  /* ---- block labels (multi-line) ----------------------------------------
     A node whose `label` is an array of segments renders a stacked text block, its
     height derived from content. Text never wraps. Line text is inserted raw: callers
     may pass `Diagram.bold` and must escape plain content.
     segment: { lines:[str,…], fontSize?, class?, lineHeight?, gapBefore?, indent? } */
  function normalizePadding(p, dflt) {
    if (p == null) return { x: dflt, top: dflt, bottom: dflt };
    if (typeof p === 'number') return { x: p, top: p, bottom: p };
    return { x: pick(p.x, dflt), top: pick(p.top, dflt), bottom: pick(p.bottom, dflt) };
  }

  /* Segments → a flat list of rows, each with its own font/class/indent and a
     `gapBefore` of extra vertical space inserted ahead of it. One walk feeds
     both measurement and rendering, so the two never disagree. */
  function flattenBlock(segments, base) {
    var rows = [];
    (segments || []).forEach(function (seg) {
      var fontSize = pick(seg.fontSize, base.fontSize);
      var cls = seg['class'] || '';
      var lh = pick(seg.lineHeight, base.lineHeight);
      var indent = seg.indent || 0;
      var segGap = seg.gapBefore || 0;
      var lines = seg.lines || (seg.text != null ? [seg.text] : []);
      lines.forEach(function (ln, li) {
        rows.push({ text: ln, fontSize: fontSize, cls: cls, indent: indent, lh: lh,
          gapBefore: li === 0 ? segGap : 0 });
      });
    });
    return rows;
  }

  function blockContentHeight(rows) {
    return rows.reduce(function (s, r) { return s + r.gapBefore + r.lh; }, 0);
  }

  /* Public: content height of a block, before placing it. Lets a caller size
     and distribute boxes (e.g. a band of cards) ahead of node(). */
  function measureBlock(segments, opts) {
    opts = opts || {};
    var base = { fontSize: pick(opts.fontSize, DEFAULTS.fontSize), lineHeight: pick(opts.lineHeight, DEFAULTS.lineHeight) };
    var pad = normalizePadding(opts.padding, DEFAULTS.padding);
    var rows = flattenBlock(segments, base);
    return Math.max(pad.top + blockContentHeight(rows) + pad.bottom, opts.minHeight || 0);
  }

  function renderBlock(nd) {
    var b = nd.box, blk = nd.block, pad = blk.pad;
    var startY = blk.valign === 'top' ? b.y + pad.top : b.y + (b.h - blk.contentHeight) / 2;
    var leftX = b.x + pad.x;
    var out = '', y = startY;
    var rightX = b.x + b.w - pad.x;
    blk.rows.forEach(function (r) {
      y += r.gapBefore;
      var cy = y + r.lh / 2;
      var anchor, tx;
      // Horizontal padding lands on the side the text is anchored to; centered
      // text needs none.
      if (blk.align === 'start') { tx = leftX + r.indent; anchor = 'start'; }
      else if (blk.align === 'end') { tx = rightX - r.indent; anchor = 'end'; }
      else { tx = b.x + b.w / 2; anchor = 'middle'; }
      out += '<text class="diagram-node-label' + (r.cls ? ' ' + r.cls : '') + '" x="' + n(tx) + '" y="' + n(cy)
        + '" text-anchor="' + anchor + '" dominant-baseline="central" dy="' + CENTER_LABEL_DY
        + '" style="' + fontSizeStyle(r.fontSize) + '">'
        + r.text + '</text>';
      y += r.lh;
    });
    return out;
  }

  function create(W, H, opts) {
    opts = opts || {};
    var nodes = {};
    var edges = [];
    var cfg = mergeCfg(opts);

    function resolveRef(ref) {
      var offset = null;
      if (Array.isArray(ref)) { offset = ref[1] || null; ref = ref[0]; }
      if (ref && typeof ref === 'object') return { coord: { x: ref.x, y: ref.y }, offset: offset };
      var parts = String(ref).split('.');
      return { node: nodes[parts[0]], anchor: parts[1] || null, offset: offset };
    }

    /* Slide a resolved point by the { dx, dy } of a [ref, offset] pair. The
       anchor's outward normal is left alone, so an offset endpoint still exits
       along its face and keeps the gap standoff — TikZ's ([xshift=..]a.south). */
    function shiftBy(p, offset) {
      return offset ? { x: p.x + (offset.dx || 0), y: p.y + (offset.dy || 0) } : p;
    }

    /* A point for a ref: node center, node.anchor, or a literal coord, each
       optionally slid by a trailing { dx, dy } when the ref is a [ref, offset] pair. */
    function refPoint(ref) {
      var r = resolveRef(ref);
      if (r.coord) return shiftBy(r.coord, r.offset);
      if (!r.node) return { x: 0, y: 0 };
      return shiftBy(anchorPoint(r.node.box, r.anchor || 'center'), r.offset);
    }

    function node(name, spec) {
      spec = spec || {};
      var nd = {
        name: name,
        box: { x: spec.x, y: spec.y, w: spec.w, h: spec.h },
        shape: spec.shape || 'rect',
        frame: !!spec.frame,
        radius: pick(spec.radius, cfg.radius),
        icon: spec.icon || null,
        label: spec.label != null ? spec.label : null,
        labelPos: spec.labelPos || 'center',
        labelGap: pick(spec.labelGap, cfg.labelGap),
        fontSize: pick(spec.fontSize, cfg.fontSize),
        cls: spec['class'] || '',
        appearance: spec.appearance || null,
        block: null
      };
      // Block label: a content-sized text block. Compute box.h now so any edge
      // that anchors to this node sees the final box.
      if (Array.isArray(spec.label)) {
        var base = { fontSize: nd.fontSize, lineHeight: pick(spec.lineHeight, cfg.lineHeight) };
        var pad = normalizePadding(spec.padding, cfg.padding);
        var rows = flattenBlock(spec.label, base);
        var contentH = blockContentHeight(rows);
        nd.block = {
          rows: rows, pad: pad, contentHeight: contentH,
          valign: spec.valign || 'center',
          align: spec.align || 'center'
        };
        nd.box.w = spec.w != null ? spec.w : 0;
        nd.box.h = Math.max(pad.top + contentH + pad.bottom, spec.minHeight || 0);
      }
      nodes[name] = nd;
      return api;
    }

    function point(name, ref) {
      var p = refPoint(ref);
      return node(name, { x: p.x, y: p.y, w: 0, h: 0 });
    }

    function edge(from, to, o) {
      o = o || {};
      edges.push({
        from: from, to: to,
        route: o.route || 'straight',
        mid: o.mid,
        via: o.via || null,
        bulge: pick(o.bulge, 0),
        gap: pick(o.gap, cfg.gap),
        corner: pick(o.corner, cfg.corner),
        arrow: !!o.arrow,
        arrowStart: !!o.arrowStart,
        cls: o['class'] || '',
        appearance: o.appearance || null
      });
      return api;
    }

    function between(a, b, t) {
      return lerp(refPoint(a), refPoint(b), t == null ? 0.5 : t);
    }
    function cross(a, b) {
      return { x: refPoint(a).x, y: refPoint(b).y };
    }

    /* Resolve one edge to an ordered list of absolute points + arrow ends. */
    function geometry(e) {
      var fromR = resolveRef(e.from), toR = resolveRef(e.to);
      var fromNode = fromR.node, toNode = toR.node;
      var fromC = fromNode ? center(fromNode.box) : fromR.coord;
      var toC = toNode ? center(toNode.box) : toR.coord;
      var gap = e.gap;
      var startP, startDir, endP, endDir, interior = [];

      function startAnchored(anchor) {
        startP = shiftBy(fromNode ? anchorPoint(fromNode.box, anchor) : fromR.coord, fromR.offset);
        startDir = NORMALS[anchor] || { x: 0, y: 0 };
      }
      function endAnchored(anchor) {
        endP = shiftBy(toNode ? anchorPoint(toNode.box, anchor) : toR.coord, toR.offset);
        endDir = NORMALS[anchor] || { x: 0, y: 0 };
      }

      if (e.route === 'vhv') {
        var my = e.mid != null ? (typeof e.mid === 'object' ? e.mid.y : e.mid) : (fromC.y + toC.y) / 2;
        startAnchored(fromR.anchor || pickV(fromC, my));
        endAnchored(toR.anchor || pickV(toC, my));
        interior = [{ x: startP.x, y: my }, { x: endP.x, y: my }];
      } else if (e.route === 'hvh') {
        var mx = e.mid != null ? (typeof e.mid === 'object' ? e.mid.x : e.mid) : (fromC.x + toC.x) / 2;
        startAnchored(fromR.anchor || pickH(fromC, mx));
        endAnchored(toR.anchor || pickH(toC, mx));
        interior = [{ x: mx, y: startP.y }, { x: mx, y: endP.y }];
      } else if (e.route === 'hv') {
        startAnchored(fromR.anchor || pickH(fromC, toC.x));
        endAnchored(toR.anchor || pickV(toC, startP.y));
        interior = [{ x: endP.x, y: startP.y }];
      } else if (e.route === 'vh') {
        startAnchored(fromR.anchor || pickV(fromC, toC.y));
        endAnchored(toR.anchor || pickH(toC, startP.x));
        interior = [{ x: startP.x, y: endP.y }];
      } else { // straight (with optional via, incl. partial coords)
        var vias = [];
        if (e.via) {
          // resolve partial coords against the previous resolved point (or start guess)
          var guess = fromNode ? fromC : fromR.coord;
          var pv = guess;
          for (var i = 0; i < e.via.length; i++) {
            var w = e.via[i];
            var px = w.x != null ? w.x : pv.x;
            var py = w.y != null ? w.y : pv.y;
            pv = { x: px, y: py };
            vias.push(pv);
          }
        }
        var startToward = vias.length ? vias[0] : toC;
        var endToward = vias.length ? vias[vias.length - 1] : fromC;
        if (fromR.anchor) { startAnchored(fromR.anchor); if (startDir.x === 0 && startDir.y === 0) startDir = unit(sub(startToward, startP)); }
        else if (fromNode) { var b = borderPoint(fromNode, startToward); startP = shiftBy(b.point, fromR.offset); startDir = b.dir; }
        else { startP = shiftBy(fromR.coord, fromR.offset); startDir = unit(sub(startToward, startP)); }
        if (toR.anchor) { endAnchored(toR.anchor); if (endDir.x === 0 && endDir.y === 0) endDir = unit(sub(endToward, endP)); }
        else if (toNode) { var b2 = borderPoint(toNode, endToward); endP = shiftBy(b2.point, toR.offset); endDir = b2.dir; }
        else { endP = shiftBy(toR.coord, toR.offset); endDir = unit(sub(endToward, endP)); }
        interior = vias;
      }

      // gap: push each node endpoint outward along its normal/direction
      var sP = (fromNode ? add(startP, mul(startDir, gap)) : startP);
      var eP = (toNode ? add(endP, mul(endDir, gap)) : endP);
      var pts = [sP].concat(interior, [eP]);
      return dedupe(pts);
    }

    /* Build a path d-string with rounded corners at interior vertices. */
    function pathD(pts, corner) {
      if (pts.length < 2) return '';
      var d = 'M ' + n(pts[0].x) + ' ' + n(pts[0].y);
      if (corner <= 0 || pts.length === 2) {
        for (var i = 1; i < pts.length; i++) d += ' L ' + n(pts[i].x) + ' ' + n(pts[i].y);
        return d;
      }
      for (var j = 1; j < pts.length - 1; j++) {
        var prev = pts[j - 1], V = pts[j], next = pts[j + 1];
        var u = unit(sub(V, prev)), w = unit(sub(next, V));
        var t = Math.min(corner, len(sub(V, prev)) / 2, len(sub(next, V)) / 2);
        var A = sub(V, mul(u, t)), B = add(V, mul(w, t));
        d += ' L ' + n(A.x) + ' ' + n(A.y) + ' Q ' + n(V.x) + ' ' + n(V.y) + ' ' + n(B.x) + ' ' + n(B.y);
      }
      var last = pts[pts.length - 1];
      d += ' L ' + n(last.x) + ' ' + n(last.y);
      return d;
    }

    /* A circular arc from the first point to the last, its apex `bulge` off the
       chord's midpoint (half the chord makes a semicircle). Positive bows to the
       left of travel: up for an edge running left to right, so an edge and its
       return, both with the same positive `bulge`, bow apart like a cycle. */
    function arcD(pts, bulge) {
      if (pts.length < 2) return '';
      var a = pts[0], b = pts[pts.length - 1], c = len(sub(b, a)), h = Math.abs(bulge);
      var start = 'M ' + n(a.x) + ' ' + n(a.y);
      if (!h || !c) return start + ' L ' + n(b.x) + ' ' + n(b.y);
      var r = (c * c / 4 + h * h) / (2 * h);
      return start + ' A ' + n(r) + ' ' + n(r) + ' 0 ' + (h > c / 2 ? 1 : 0) + ' ' + (bulge > 0 ? 1 : 0)
        + ' ' + n(b.x) + ' ' + n(b.y);
    }

    function marker(id, a, appearance) {
      var mw = a.length + 1, mh = a.width + 2, refY = mh / 2;
      return '<marker id="' + id + '" markerWidth="' + n(mw) + '" markerHeight="' + n(mh) + '"'
        + ' refX="' + n(a.length) + '" refY="' + n(refY) + '" orient="auto-start-reverse" markerUnits="userSpaceOnUse"'
        + styleAttr(appearance, EDGE_APPEARANCE_VARS) + '>'
        + '<path class="diagram-arrowhead" d="M0 ' + n(refY - a.width / 2) + ' L' + n(a.length) + ' ' + n(refY)
        + ' L0 ' + n(refY + a.width / 2) + ' Z"/>'
        + '</marker>';
    }

    function renderEdge(e, mk, index) {
      var pts = geometry(e);
      var d = e.route === 'arc' ? arcD(pts, e.bulge) : pathD(pts, e.corner);
      var cls = 'diagram-edge' + (e.cls ? ' ' + e.cls : '');
      var markerId = hasEdgeColor(e.appearance) ? mk + '-' + index : mk;
      var ms = e.arrowStart ? ' marker-start="url(#' + markerId + ')"' : '';
      var me = e.arrow ? ' marker-end="url(#' + markerId + ')"' : '';
      return '<path class="' + cls + '" d="' + d + '"' + styleAttr(e.appearance, EDGE_APPEARANCE_VARS) + ms + me + ' fill="none"/>';
    }

    function renderNode(nd) {
      var b = nd.box, out = '';
      var grpCls = 'diagram-node' + (nd.cls ? ' ' + nd.cls : '');
      if (nd.frame) {
        if (nd.shape === 'circle' || nd.shape === 'ellipse') {
          out += '<ellipse class="diagram-node-frame" cx="' + n(b.x + b.w / 2) + '" cy="' + n(b.y + b.h / 2)
            + '" rx="' + n(b.w / 2) + '" ry="' + n(b.h / 2) + '"/>';
        } else {
          out += '<rect class="diagram-node-frame" x="' + n(b.x) + '" y="' + n(b.y) + '" width="' + n(b.w)
            + '" height="' + n(b.h) + '" rx="' + n(nd.radius) + '"/>';
        }
      }
      if (nd.icon && Icon) {
        var size = Math.min(b.w, b.h);
        out += Icon.place(nd.icon, b.x + (b.w - size) / 2, b.y + (b.h - size) / 2, size, 'diagram-node-icon');
      }
      if (nd.block) {
        out += renderBlock(nd);
      } else if (nd.label != null) {
        var cx = b.x + b.w / 2, ly, baseline, dy = '';
        if (nd.labelPos === 'above') { ly = b.y - nd.labelGap; baseline = 'auto'; }
        else if (nd.labelPos === 'below') { ly = b.y + b.h + nd.labelGap; baseline = 'auto'; dy = BELOW_LABEL_DY; }
        else { ly = b.y + b.h / 2; baseline = 'central'; dy = CENTER_LABEL_DY; }
        var dyAttr = dy ? ' dy="' + dy + '"' : '';
        out += '<text class="diagram-node-label" x="' + n(cx) + '" y="' + n(ly) + '" text-anchor="middle"'
          + ' dominant-baseline="' + baseline + '"' + dyAttr
          + ' style="' + fontSizeStyle(nd.fontSize) + '">' + nd.label + '</text>';
      }
      return '<g class="' + grpCls + '"' + styleAttr(nd.appearance, NODE_APPEARANCE_VARS) + '>' + out + '</g>';
    }

    function render(idPrefix) {
      var mk = (idPrefix || 'diagram') + '-arrow';
      var edgeMarkerSvg = edges.map(function (e, i) {
        return hasEdgeColor(e.appearance) && (e.arrow || e.arrowStart) ? marker(mk + '-' + i, cfg.arrow, e.appearance) : '';
      }).join('');
      var edgeSvg = edges.map(function (e, i) { return renderEdge(e, mk, i); }).join('');
      var nodeSvg = Object.keys(nodes).map(function (k) { return renderNode(nodes[k]); }).join('');
      var aria = cfg.ariaLabel ? ' role="img" aria-label="' + cssValue(cfg.ariaLabel) + '"' : '';
      return '<svg class="diagram' + (cfg.className ? ' ' + cfg.className : '') + '" width="' + W + '" height="' + H
        + '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg"' + aria
        + ' style="--viewbox-width:' + W + 'px;width:' + W + 'px;height:auto">'
        + '<defs>' + marker(mk, cfg.arrow) + edgeMarkerSvg + '</defs>'
        + '<g>' + nodeSvg + '</g>'
        + '<g>' + edgeSvg + '</g>'
        + debugFrameSvg(W, H, 'component')
        + '</svg>';
    }

    var api = {
      node: node, point: point, edge: edge, between: between, cross: cross,
      render: render
    };
    return api;
  }

  window.Diagram = {
    create: create, defaults: DEFAULTS, measureBlock: measureBlock, bold: bold,
    label: label, iconApp: iconApp
  };
})();
