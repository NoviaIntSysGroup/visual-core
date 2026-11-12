/* Figure compose-and-export kit. Lays out diagram-kit drawings and native SVG text on
   a canvas in points (via window.Units) and renders one native <svg>, with no
   foreignObject, so it stays editable in vector tools. Geometry is JS; appearance is
   figure.css plus each figure's CSS. Used by figure pages and by decks importing a
   figure. Exposes window.Figure. */
(function () {
  var PT_PER_CM = 72 / 2.54;   // points per cm (the base unit is the point)

  /* The figure font + type scale are user settings (config.js), since the kit
     needs them as values for offscreen text measurement and layout — CSS can't
     hand those to build-time code. */
  function cfg() { return (window.Config && window.Config.figure) || {}; }
  function figureFont() { return cfg().font; }
  /* A role's type spec: { size, weight, style } from config.js (or {}). */
  function roleSpec(role) {
    var type = cfg().type || {};
    return (role && type[role]) || {};
  }

  /* config.js is a hard dependency loaded before this file — text sizing and
     offscreen measurement read the type scale from it. Warn once if it is
     absent rather than letting each text() call limp along on a guessed size. */
  if (!(window.Config && window.Config.figure && window.Config.figure.type)) {
    console.error('[figure] config.js must be loaded before figure.js — text sizing will be wrong');
  }

  function r(n) { return Math.round(n * 100) / 100; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Offscreen 2D context, reused, for measuring text so paragraphs can wrap. */
  var _mctx;
  function mctx() {
    if (!_mctx) _mctx = document.createElement('canvas').getContext('2d');
    return _mctx;
  }
  function wrapText(text, maxW, fontPx) {
    var ctx = mctx();
    ctx.font = '400 ' + fontPx + 'px ' + figureFont();
    var words = String(text).split(/\s+/), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + ' ' + words[i] : words[i];
      if (cur && ctx.measureText(test).width > maxW) { lines.push(cur); cur = words[i]; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /* One line is a string, or an array of { t, cls } segments for inline styling
     (e.g. a coloured word). Nested <tspan> keeps segments inline within a line. */
  function lineHtml(line) {
    if (typeof line === 'string') return esc(line);
    return line.map(function (seg) {
      return '<tspan' + (seg.cls ? ' class="' + seg.cls + '"' : '') + '>' + esc(seg.t) + '</tspan>';
    }).join('');
  }

  function create(W, H, opts) {
    opts = opts || {};
    var parts = [];
    var api;
    var framed = false;   // page debug frame appended once, however often render() runs

    /* Fill the canvas (e.g. to replicate a slide background), its corners rounded by radius. */
    function background(fill, radius) {
      var rx = radius ? ' rx="' + r(radius) + '"' : '';
      parts.push('<rect x="0" y="0" width="' + r(W) + '" height="' + r(H) + '"' + rx + ' fill="' + (fill || 'var(--background)') + '"/>');
      return api;
    }

    /* Place a reused component's SVG string at (x, y), scaled to width w (height
       follows the component's aspect unless h is given). Wrapped in a <g> with a
       transform so the component is used verbatim — its own viewBox does the
       internal mapping. */
    function place(svgStr, o) {
      o = o || {};
      var m = /viewBox="([-\d.\s]+)"/.exec(svgStr);
      var vbW = 1, vbH = 1;
      if (m) { var vb = m[1].trim().split(/\s+/).map(Number); vbW = vb[2]; vbH = vb[3]; }
      var w = o.w, h = o.h != null ? o.h : w * vbH / vbW;
      var sx = w / vbW, sy = h / vbH;
      parts.push('<g transform="translate(' + r(o.x) + ' ' + r(o.y) + ') scale(' + r(sx) + ' ' + r(sy) + ')">' + svgStr + '</g>');
      return api;
    }

    /* Native SVG text. `content` is a string (wrapped when o.wrap + o.w) or an array
       of lines, each a string or an array of { t, cls } segments. `role` pulls size,
       weight and style from config.js and adds the .fig-<role> class;
       `size`/`weight`/`style` override it.
       o: { x, y, w, align, role, size, weight, style, lineHeight, cls, wrap } */
    function text(content, o) {
      o = o || {};
      if (o.role && !(cfg().type || {})[o.role]) console.warn('figure.text(): unknown role "' + o.role + '"');
      var spec = roleSpec(o.role);
      var size = o.size != null ? o.size : spec.size != null ? spec.size : roleSpec('body').size;
      var weight = o.weight != null ? o.weight : spec.weight;
      var style = o.style != null ? o.style : spec.style;
      var lh = o.lineHeight || size * 1.3;
      var anchor = o.align === 'start' ? 'start' : o.align === 'end' ? 'end' : 'middle';
      var cls = [o.role ? 'fig-' + o.role : '', o.cls || ''].join(' ').trim();
      var css = 'font-size:' + size + 'px'
        + (weight != null ? ';font-weight:' + weight : '')
        + (style ? ';font-style:' + style : '');
      var lines;
      if (typeof content === 'string') lines = (o.wrap && o.w) ? wrapText(content, o.w, size) : [content];
      else lines = content;
      var t = '<text class="' + cls + '" text-anchor="' + anchor + '" x="' + r(o.x) + '" y="' + r(o.y) + '" style="' + css + '">';
      for (var i = 0; i < lines.length; i++) {
        t += '<tspan x="' + r(o.x) + '" dy="' + (i === 0 ? 0 : r(lh)) + '">' + lineHtml(lines[i]) + '</tspan>';
      }
      return parts.push(t + '</text>'), api;
    }

    /* A LaTeX formula as vector paths. `size` is the em in points; (x, y) is the
       baseline, at the left, centre or right per `align`. Colour follows .fig-math,
       or `cls`. o: { x, y, size, align, cls } */
    function math(tex, o) {
      var size = o.size != null ? o.size : roleSpec('body').size;
      var g = window.Tex.render(tex, { unitsPerEm: size });
      var x = o.align === 'start' ? o.x : o.align === 'end' ? o.x - g.w : o.x - g.w / 2;
      var cls = ('fig-math ' + (o.cls || '')).trim();
      var at = 'class="' + cls + '" x="' + r(x) + '" y="' + r(o.y + g.depth - g.h) + '"';
      return parts.push(g.svg.replace('class="tex-svg"', at)), api;
    }

    /* Inline paint for the primitives below. Everything is optional: with no
       options a rule keeps its .figure-rule styling and a rect its CSS default,
       so appearance stays in CSS unless a figure deliberately overrides it.
       o: { fill, stroke, width, opacity, dash } (dash: number[] or string) */
    /* A class attribute, or nothing at all when there are no classes — so the
       primitives never emit an empty class="" or a trailing space. */
    function clsAttr() {
      var cls = [].slice.call(arguments).filter(Boolean).join(' ').trim();
      return cls ? ' class="' + cls + '"' : '';
    }

    function paint(o) {
      var st = [];
      if (o.fill != null) st.push('fill:' + o.fill);
      if (o.stroke != null) st.push('stroke:' + o.stroke);
      if (o.width != null) st.push('stroke-width:' + o.width);
      if (o.opacity != null) st.push('opacity:' + o.opacity);
      if (o.dash != null) st.push('stroke-dasharray:' + (Array.isArray(o.dash) ? o.dash.map(r).join(' ') : o.dash));
      return st.length ? ' style="' + st.join(';') + '"' : '';
    }

    /* A straight rule (e.g. a column divider). Styled via .figure-rule; `dash`
       and the other paint options override it for one line (a dashed boundary). */
    function rule(x1, y1, x2, y2, o) {
      o = o || {};
      parts.push('<line' + clsAttr('figure-rule', o.cls) + ' x1="' + r(x1) + '" y1="' + r(y1)
        + '" x2="' + r(x2) + '" y2="' + r(y2) + '"' + paint(o) + '/>');
      return api;
    }

    /* A filled rect (a band, a zebra row, a bar, a colour chip).
       o: { fill, opacity, stroke, width, radius, cls } */
    function rect(x, y, w, h, o) {
      o = o || {};
      parts.push('<rect' + clsAttr(o.cls) + ' x="' + r(x) + '" y="' + r(y)
        + '" width="' + r(w) + '" height="' + r(h) + '"'
        + (o.radius != null ? ' rx="' + r(o.radius) + '"' : '') + paint(o) + '/>');
      return api;
    }

    /* A raster at (x, y), sized w x h, as native <image>. The href stays a relative
       path until export inlines it (see images below). `xlink:href` is for older
       vector editors. preserveAspectRatio letterboxes rather than distorts. o: { x,
       y, w, h } */
    function image(href, o) {
      o = o || {};
      parts.push('<image'
        + ' href="' + esc(href) + '" xlink:href="' + esc(href) + '"'
        + ' x="' + r(o.x) + '" y="' + r(o.y) + '" width="' + r(o.w) + '" height="' + r(o.h) + '"'
        + ' preserveAspectRatio="xMidYMid meet"/>');
      return api;
    }

    /* An arbitrary path, for the shapes the primitives above don't cover (a
       milestone diamond). `d` is authored by the caller in figure coordinates. */
    function path(d, o) {
      o = o || {};
      parts.push('<path' + clsAttr(o.cls) + ' d="' + d + '"' + paint(o) + '/>');
      return api;
    }

    /* Outline a bounds rectangle as a debug frame. Always emitted, hidden by
       CSS until the chrome's Debug button sets `.debug-on` — see diagram.css.
       Duplicated from the diagram kit's private emitter on purpose: the figure
       kit must not depend on the diagram kit (gantt loads figure.js alone), and
       the shared contract is the CSS class, not the four lines of markup. */
    function debugFrame(w, h, level) {
      var i = 0.5;   // half a stroke, so the outline isn't clipped by the viewBox
      parts.push('<rect class="debug-frame debug-frame--' + (level || 'page') + '"'
        + ' x="' + r(i) + '" y="' + r(i) + '" width="' + r(w - 2 * i) + '" height="' + r(h - 2 * i) + '"'
        + ' fill="none" vector-effect="non-scaling-stroke"/>');
      return api;
    }

    /* Nest a child composition at (x, y), optionally scaled. `drawFn(fig)` draws in
       local coordinates; its output is wrapped in one flat <g transform>, so the
       result stays a single portable SVG with no nested <svg>. o: { x, y, scale } */
    function nest(o, drawFn) {
      o = o || {};
      var open = parts.length;
      drawFn(api);                       // child appends to the same parts buffer
      var inner = parts.splice(open).join('');
      var s = o.scale != null ? o.scale : 1;
      var tr = 'translate(' + r(o.x || 0) + ' ' + r(o.y || 0) + ')' + (s !== 1 ? ' scale(' + r(s) + ')' : '');
      parts.push('<g transform="' + tr + '">' + inner + '</g>');
      return api;
    }

    /* Nest a whole composition MODULE ({ width, height, draw }) rather than a
       bare drawFn. Because the module carries its bounds, the child's outline
       can be drawn too — which is the one level of the debug cascade that plain
       nest() can't reach, a drawFn having no idea how big it is.
       o: { x, y, scale, step } — `step` fixes a stepped child at one state. */
    function nestModule(M, o) {
      o = o || {};
      return nest({ x: o.x, y: o.y, scale: o.scale }, function (f) {
        if (o.step != null) M.draw(f, o.step); else M.draw(f);
        f.debugFrame(M.width, M.height, 'nest');
      });
    }

    function raw(s) { parts.push(s); return api; }

    function render() {
      var aria = opts.ariaLabel ? ' role="img" aria-label="' + esc(opts.ariaLabel) + '"' : '';
      // The page's own bounds, last so it sits above the content it outlines.
      // Guarded: render() is idempotent, and callers do re-render the same builder.
      if (!framed) { framed = true; debugFrame(W, H, 'page'); }
      // --viewbox-width publishes the authored width the same way the
      // diagram kit does, so one deck rule can scale a placed component and a whole
      // imported figure identically. On a figure page nothing reads it and the
      // width attribute stands, which is why exports keep their cm size.
      return '<svg class="figure' + (opts.className ? ' ' + opts.className : '') + '"'
        + ' xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
        + ' viewBox="0 0 ' + r(W) + ' ' + r(H) + '" width="' + r(W) + '" height="' + r(H) + '"'
        + ' style="--viewbox-width:' + r(W) + 'px'
        + ';max-width:100%;height:auto"' + aria + '>'
        + parts.join('') + '</svg>';
    }

    api = {
      background: background, place: place, text: text, math: math, image: image,
      rule: rule, rect: rect, path: path,
      nest: nest, nestModule: nestModule, debugFrame: debugFrame,
      raw: raw, render: render, width: W, height: H
    };
    return api;
  }

  /* ---- images ----------------------------------------------------------------
     A raster is an ordinary relative path. Its natural size comes from an <img>
     (works on file://), for layout by the real aspect ratio. Its bytes come from
     fetch, to inline on export; file:// forbids fetch, so exporting a figure with
     images needs the dev server. Both are cached by href. */
  var XLINK_NS = 'http://www.w3.org/1999/xlink';
  var IMG = {};

  function loadSize(href) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
      img.onerror = function () { resolve(null); };
      img.src = href;
    });
  }

  function loadBytes(href) {
    if (!window.DEV_SERVER) return Promise.resolve(null);   // file:// forbids fetch
    return fetch(href).then(function (res) {
      if (!res.ok) return null;
      return res.blob().then(function (blob) {
        return new Promise(function (resolve) {
          var fr = new FileReader();
          fr.onload = function () { resolve(fr.result); };
          fr.onerror = function () { resolve(null); };
          fr.readAsDataURL(blob);
        });
      });
    }).catch(function () { return null; });   // unreadable: the export is disabled, the page still renders
  }

  /* Resolve every href once. NEVER rejects: a figure whose bytes didn't come back
     must still render and still say why it can't export, so a failure is recorded
     as a missing `uri` rather than thrown here. */
  function preload(hrefs) {
    var mathReady = window.Tex ? window.Tex.ready : null;   // fig.math needs MathJax started
    return Promise.all([mathReady].concat((hrefs || []).map(function (href) {
      if (IMG[href]) return null;
      return Promise.all([loadSize(href), loadBytes(href)]).then(function (got) {
        IMG[href] = { w: got[0] ? got[0].w : 0, h: got[0] ? got[0].h : 0, uri: got[1] };
      });
    })));
  }

  /* The natural pixel size of a preloaded image, for a module's own layout
     arithmetic (an equal-area grid needs each file's true aspect ratio). Throws
     rather than guessing — a silent zero surfaces as a collapsed box a long way
     from its cause. */
  function imageSize(href) {
    var rec = IMG[href];
    if (!rec || !rec.w) {
      throw new Error('Figure.imageSize: ' + href + ' was not preloaded, or failed to load. '
        + "List it in the composition module's `images` array.");
    }
    return { w: rec.w, h: rec.h };
  }

  /* Whether every <image> in a figure has bytes to embed — i.e. whether an export
     would come out self-contained. */
  function embeddable(svgEl) {
    var imgs = svgEl.querySelectorAll('image');
    for (var i = 0; i < imgs.length; i++) {
      var rec = IMG[imgs[i].getAttribute('href')];
      if (!rec || !rec.uri) return false;
    }
    return true;
  }

  /* ---- export ----------------------------------------------------------------
     Inline computed styles onto a clone (resolving tokens, color-mix() and oklch() to
     concrete values), then serialize and download. Reads getComputedStyle from the
     live element, so the figure must be in the DOM. Fonts stay referenced by family. */
  var INLINE_PROPS = [
    'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity',
    'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'opacity', 'color',
    'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
    'text-anchor', 'letter-spacing', 'dominant-baseline', 'visibility', 'display',
    /* Gradient stops. The inlining below OVERWRITES each node's style attribute,
       and vendor artwork carries its stop colours there (style="stop-color:…"),
       so leaving these out silently exports every gradient as black — the exact
       failure this pass exists to prevent. COLOR_PROPS already lists stop-color. */
    'stop-color', 'stop-opacity'
  ];
  var COLOR_PROPS = { fill: 1, stroke: 1, color: 1, 'stop-color': 1, 'flood-color': 1, 'lighting-color': 1 };

  /* Convert any CSS colour (oklch(), color-mix(), named, hex, rgb) to an sRGB
     hex/rgba string via a 1x1 canvas. PowerPoint and many SVG consumers can't
     parse oklch()/color-mix() and render them BLACK, so the theme's OKLCH palette
     must be down-converted to sRGB on export. */
  var _cctx;
  function cctx() { if (!_cctx) _cctx = document.createElement('canvas').getContext('2d'); return _cctx; }
  function h2(n) { var s = n.toString(16); return s.length < 2 ? '0' + s : s; }
  function toSrgb(c) {
    if (!c) return c;
    c = c.trim();
    if (c === 'none' || c === 'transparent' || c === 'currentColor' || c.indexOf('url(') === 0) return c;
    var ctx = cctx();
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    var d = ctx.getImageData(0, 0, 1, 1).data, a = d[3] / 255;
    return a >= 0.999 ? '#' + h2(d[0]) + h2(d[1]) + h2(d[2])
      : 'rgba(' + d[0] + ',' + d[1] + ',' + d[2] + ',' + (Math.round(a * 1000) / 1000) + ')';
  }

  /* em dy that vertically centres a single line on its y using the alphabetic
     baseline — emulates dominant-baseline:central for consumers (PowerPoint) that
     ignore dominant-baseline. */
  var CENTER_BASELINE_DY = '0.32em';

  function inlineStyles(src, dst) {
    var cs = getComputedStyle(src), style = '', recenter = false;
    for (var i = 0; i < INLINE_PROPS.length; i++) {
      var p = INLINE_PROPS[i], v = cs.getPropertyValue(p);
      if (!v) continue;
      if (COLOR_PROPS[p]) v = toSrgb(v);
      if (p === 'dominant-baseline' && (v === 'central' || v === 'middle')) { recenter = true; v = 'auto'; }
      style += p + ':' + v + ';';
    }
    dst.setAttribute('style', style);
    // Drop presentation attributes we've just inlined — notably fill/stroke that
    // may still carry var()/oklch values a naive consumer reads instead of style.
    dst.removeAttribute('fill');
    dst.removeAttribute('stroke');
    // Re-center vertically with an em dy where the kit relied on
    // dominant-baseline:central (PowerPoint ignores that and the text rides high).
    if (recenter && src.tagName.toLowerCase() === 'text') dst.setAttribute('dy', CENTER_BASELINE_DY);
    var s = src.children, d = dst.children;
    for (var j = 0; j < s.length; j++) inlineStyles(s[j], d[j]);
  }

  function serialize(svgEl, wAttr, hAttr) {
    var clone = svgEl.cloneNode(true);
    inlineStyles(svgEl, clone);
    /* Drop the authoring debug frames so they can never ship in an export,
       whatever state the chrome's Debug button is in. This MUST come after
       inlineStyles: that walk pairs src.children with dst.children by index, so
       removing a node first would hand every later sibling its neighbour's
       computed style. */
    var frames = clone.querySelectorAll('.debug-frame');
    for (var f = 0; f < frames.length; f++) frames[f].parentNode.removeChild(frames[f]);
    /* Swap every <image> path for its data URI, or the PNG and PDF lose the artwork
       and the SVG only works from its own folder. Throws rather than exporting a
       figure with its logos silently missing. */
    var imgs = clone.querySelectorAll('image');
    for (var m = 0; m < imgs.length; m++) {
      var href = imgs[m].getAttribute('href');
      var rec = IMG[href];
      if (!rec || !rec.uri) {
        throw new Error('Cannot embed ' + href + ' — exporting reads the file over HTTP, which '
          + 'file:// forbids. Serve the repo and export from there: bun run core/tools/serve.js');
      }
      imgs[m].setAttribute('href', rec.uri);
      imgs[m].setAttributeNS(XLINK_NS, 'xlink:href', rec.uri);
    }
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    clone.removeAttribute('style');   // strip the on-screen max-width sizing
    // Size the root explicitly. Default to PHYSICAL cm so consumers render at the
    // intended size: a unitless width is read as px@96dpi — 0.75× too small,
    // since our units are points (72dpi). PowerPoint otherwise shows a 24cm
    // figure as 18cm. (PNG passes pixel dims so it rasterizes at full res.)
    var vb = (clone.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
    if (wAttr != null) { clone.setAttribute('width', wAttr); clone.setAttribute('height', hAttr); }
    else if (vb.length === 4) {
      clone.setAttribute('width', (Math.round(vb[2] / PT_PER_CM * 1000) / 1000) + 'cm');
      clone.setAttribute('height', (Math.round(vb[3] / PT_PER_CM * 1000) / 1000) + 'cm');
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
  }

  function triggerDownload(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function download(svgEl, filename) {
    triggerDownload(new Blob([serialize(svgEl)], { type: 'image/svg+xml;charset=utf-8' }), filename || 'figure.svg');
  }

  /* ---- PNG export -----------------------------------------------------------
     Rasterize the self-contained SVG at PNG_DPI (pixels = points × dpi/72). A pHYs
     chunk tags the resolution, so the PNG imports at its true physical size. */
  var PNG_DPI = 600;
  var CRC_TABLE;
  function crc32(bytes) {
    if (!CRC_TABLE) {
      CRC_TABLE = [];
      for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); CRC_TABLE[n] = c >>> 0; }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  /* Insert a pHYs (resolution) chunk right after IHDR so the PNG declares its DPI. */
  function tagPngDpi(png) {
    var ppm = Math.round(PNG_DPI / 0.0254);   // pixels per metre
    var chunk = new Uint8Array(21);       // 4 len + 4 type + 9 data + 4 crc
    var dv = new DataView(chunk.buffer);
    dv.setUint32(0, 9);
    chunk[4] = 0x70; chunk[5] = 0x48; chunk[6] = 0x59; chunk[7] = 0x73;   // 'pHYs'
    dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;           // ppmX, ppmY, unit=metre
    dv.setUint32(17, crc32(chunk.subarray(4, 17)));
    var at = 33;                          // 8-byte signature + 25-byte IHDR chunk
    var out = new Uint8Array(png.length + 21);
    out.set(png.subarray(0, at), 0);
    out.set(chunk, at);
    out.set(png.subarray(at), at + 21);
    return out;
  }
  /* Rasterize the self-contained SVG to a canvas at PNG_DPI. Resolves with the
     canvas plus the figure's point dimensions (uW/uH) for physical sizing. The
     SVG is serialized at the pixel size so it rasterizes crisply (no upscaling). */
  function rasterize(svgEl) {
    var vb = (svgEl.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
    var uW = vb[2] || svgEl.width.baseVal.value, uH = vb[3] || svgEl.height.baseVal.value;
    var scale = PNG_DPI / 72, pxW = Math.round(uW * scale), pxH = Math.round(uH * scale);
    var url = URL.createObjectURL(new Blob([serialize(svgEl, pxW, pxH)], { type: 'image/svg+xml;charset=utf-8' }));
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = pxW; canvas.height = pxH;
        canvas.getContext('2d').drawImage(img, 0, 0, pxW, pxH);
        URL.revokeObjectURL(url);
        resolve({ canvas: canvas, uW: uW, uH: uH });
      };
      img.onerror = function (e) { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }

  function downloadPng(svgEl, filename) {
    rasterize(svgEl).then(function (r) {
      r.canvas.toBlob(function (png) {
        png.arrayBuffer().then(function (buf) {
          triggerDownload(new Blob([tagPngDpi(new Uint8Array(buf))], { type: 'image/png' }), filename || 'figure.png');
        });
      }, 'image/png');
    });
  }

  /* ---- PDF export (vector, via the browser) ---------------------------------
     Open the self-contained SVG at an exact-size @page and print it, for a vector PDF
     with selectable text. Arial/Helvetica is a standard PDF font, so nothing needs
     embedding. */
  function printPdf(svgEl, opts) {
    opts = opts || {};
    var vb = (svgEl.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
    var wcm = Math.round((vb[2] || 0) / PT_PER_CM * 1000) / 1000;
    var hcm = Math.round((vb[3] || 0) / PT_PER_CM * 1000) / 1000;
    var win = window.open('', '_blank');
    if (!win) return;   // popup blocked — user can retry
    win.document.write('<!doctype html><meta charset="utf-8"><title>' + esc(opts.title || 'figure') + '</title>'
      + '<style>@page{size:' + wcm + 'cm ' + hcm + 'cm;margin:0}html,body{margin:0;padding:0}svg{display:block}</style>'
      + serialize(svgEl));
    win.document.close();
    win.focus();
    var go = function () { win.print(); };
    if (win.document.readyState === 'complete') setTimeout(go, 200); else win.onload = go;
  }

  function cmValue(pt) {
    return Math.round(pt / PT_PER_CM * 10) / 10;
  }

  function metadata(fig, opts, name) {
    var cmW = cmValue(fig.width);
    var cmH = cmValue(fig.height);
    return {
      kind: 'figure',
      name: name,
      title: opts.title || name,
      widthCm: cmW,
      heightCm: cmH,
      sizeLabel: cmW + ' × ' + cmH + ' cm'
    };
  }

  /* ---- shared chrome --------------------------------------------------------
     Build the figure-page toolbar (title, physical size, Export SVG / PNG) and
     render the figure, so each figures/<name>/index.html only declares its
     composition — the deck-side equivalent of Deck injecting #deck-chrome.
     opts: { figure, title, name (download basename) } */
  function mount(opts) {
    opts = opts || {};
    var fig = opts.figure, name = opts.name || 'figure';
    var root = document.body;
    var meta = metadata(fig, opts, name);
    // Send the landing-page card its title and size; postMessage also crosses file:// origins.
    if (window.parent !== window) window.parent.postMessage({ landingMeta: meta }, '*');

    /* Step support: opts.steps (total count) + opts.redraw(step) -> fig | string.
       When steps > 1 the chrome grows a Back / Next controller. */
    var totalSteps = (opts.steps && opts.steps > 1) ? opts.steps : 0;
    var currentStep = Math.min(Math.max(opts.step || 0, 0), totalSteps ? totalSteps - 1 : 0);

    /* ?thumb: render only the figure (no toolbar) for the landing-page card
       iframe — mirrors the deck's ?thumb mode. */
    if (new URLSearchParams(location.search).has('thumb')) {
      document.body.classList.add('figure-thumb');
      var ts = document.createElement('div');
      ts.className = 'figure-stage figure-thumb-stage';
      ts.innerHTML = fig.render();
      root.appendChild(ts);
      return { svg: ts.querySelector('svg'), stage: ts };
    }

    document.body.classList.add('figure-page');

    var stepHtml = totalSteps ? (
      '<div class="figure-step">'
      + '<button type="button" class="figure-step-back">&#8592;</button>'
      + '<span class="figure-step-label">Step ' + (currentStep + 1) + ' of ' + totalSteps + '</span>'
      + '<button type="button" class="figure-step-next">&#8594;</button>'
      + '</div>'
    ) : '';

    var chrome = document.createElement('div');
    chrome.className = 'figure-chrome';
    chrome.innerHTML = '<h1>' + esc(meta.title) + '</h1>'
      + '<span class="figure-size">' + meta.sizeLabel + '</span>'
      + '<div class="chrome">'
      + stepHtml
      + '<button type="button" data-export="svg">Export SVG</button>'
      + '<button type="button" data-export="png">Export PNG</button>'
      + '<button type="button" data-export="pdf">Export PDF</button>'
      /* Authoring aid, not a fourth export: reveals the bounds outlines that the
         kits always emit (see diagram.css). Toggling a class on <body> rather
         than re-rendering means the state survives stepping — the stage's <svg>
         is replaced on every step, <body> is not. */
      + '<button type="button" class="figure-debug-toggle" aria-pressed="false">Debug</button>'
      + '</div>';

    var stage = document.createElement('div');
    stage.className = 'figure-stage';
    /* On-screen size = the authored point width at CSS's 96 dpi (px = pt x 96/72),
       so an 8 cm figure previews at 8 cm and an 18 cm one at 18 cm, instead of
       every figure being stretched to one fixed stage width. */
    stage.style.setProperty('--figure-stage-width', r(fig.width * 96 / 72) + 'px');
    stage.innerHTML = fig.render();
    var svg = stage.querySelector('svg');

    root.appendChild(chrome);
    root.appendChild(stage);

    /* A figure whose images have no bytes cached can't produce a self-contained
       export, so it must not offer one that would quietly ship without them.
       Disable the three exports and say why on hover — the page itself renders fine,
       which is exactly why a silent failure here would go unnoticed. */
    if (!embeddable(svg)) {
      ['svg', 'png', 'pdf'].forEach(function (kind) {
        var btn = chrome.querySelector('[data-export="' + kind + '"]');
        btn.disabled = true;
        btn.title = 'Images need the dev server to embed — bun run core/tools/serve.js';
      });
    }

    /* Helpers that always use the current svg reference (updated on step change). */
    chrome.querySelector('[data-export="svg"]').addEventListener('click', function () { download(svg, name + '.svg'); });
    chrome.querySelector('[data-export="png"]').addEventListener('click', function () { downloadPng(svg, name + '.png'); });
    chrome.querySelector('[data-export="pdf"]').addEventListener('click', function () { printPdf(svg, { title: opts.title || name }); });

    if (totalSteps) {
      var btnBack = chrome.querySelector('.figure-step-back');
      var btnNext = chrome.querySelector('.figure-step-next');
      var stepLabel = chrome.querySelector('.figure-step-label');

      function goToStep(step) {
        currentStep = step;
        stepLabel.textContent = 'Step ' + (step + 1) + ' of ' + totalSteps;
        btnBack.disabled = step === 0;
        btnNext.disabled = step === totalSteps - 1;
        var result = opts.redraw(step);
        stage.innerHTML = typeof result === 'string' ? result : result.render();
        svg = stage.querySelector('svg');
      }

      btnBack.addEventListener('click', function () { if (currentStep > 0) goToStep(currentStep - 1); });
      btnNext.addEventListener('click', function () { if (currentStep < totalSteps - 1) goToStep(currentStep + 1); });
      btnBack.disabled = currentStep === 0;
      btnNext.disabled = currentStep === totalSteps - 1;
    }

    /* Debug toggle: one class on <body> reveals every frame at every level at
       once — page, nested child figures, and the viewBox of each placed
       component — because the frames are already in the DOM and only hidden. */
    var btnDebug = chrome.querySelector('.figure-debug-toggle');
    btnDebug.addEventListener('click', function () {
      var on = document.body.classList.toggle('debug-on');
      btnDebug.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    return { svg: svg, chrome: chrome, stage: stage };
  }

  /* ---- mount a composition module -------------------------------------------
     The whole of a figure document's script: builds the canvas, draws the module, and
     mounts the chrome from the module's own size and metadata. Returns a promise,
     since `images` must resolve before draw() can ask their size.
     opts: { step ('last' | index) } */
  function mountModule(M, opts) {
    opts = opts || {};
    var stepped = !!(M.steps && M.steps > 1);
    var start = opts.step === 'last' ? M.steps - 1 : (opts.step || 0);

    function build(step) {
      var fig = create(M.width, M.height, { className: M.className, ariaLabel: M.ariaLabel });
      fig.background(null, M.radius);
      // A stepped module's draw takes the step, so it can't go through nest().
      if (stepped) M.draw(fig, step); else fig.nest({ x: 0, y: 0 }, M.draw);
      return fig;
    }

    return preload(M.images).then(function () {
      return mount({
        figure: build(start),
        title: M.title, name: M.name,
        steps: stepped ? M.steps : 0,
        step: stepped ? start : 0,
        redraw: stepped ? build : null
      });
    });
  }

  window.Figure = {
    create: create,
    preload: preload, imageSize: imageSize, svgText: serialize,
    mount: mount, mountModule: mountModule
  };
})();
