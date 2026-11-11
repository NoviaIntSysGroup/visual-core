/* Tex: LaTeX to inline SVG through MathJax (tex-svg.js, loaded after this file).
   Glyphs are drawn as paths in currentColor, so slides and exported figures stay
   vector. `Tex.ready` resolves once MathJax can render; rendering is synchronous after.
   The bundle holds only the TeX packages base, ams, newcommand, configmacros and noundefined.
   A command from any other package fails, its file is not shipped: use \pmb, not \boldsymbol. */
(function () {
  var resolveReady;
  var Tex = {
    ready: new Promise(function (r) { resolveReady = r; }),
    render: render,
    typeset: typeset,
    untypeset: untypeset,
  };
  window.Tex = Tex;

  /* MathJax reads this object when its script loads. fontCache 'none' keeps every
     formula self-contained, so a cloned figure needs no shared <defs>. */
  window.MathJax = {
    startup: {
      typeset: false,
      ready: function () { MathJax.startup.defaultReady(); resolveReady(); },
    },
    svg: { fontCache: 'none' },
  };

  /* MathJax's viewBox is 1000 units per em, with y = 0 on the baseline. `unitsPerEm`
     is the drawn size of 1em, in `unit` ('em' on slides, '' for points in figures).
     Returns the <svg> markup plus its size and depth below the baseline. */
  function render(tex, o) {
    var display = !!o.display, k = o.unitsPerEm / 1000, unit = o.unit || '';
    var svg = MathJax.tex2svg(tex, { display: display }).querySelector('svg');
    var vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    var w = vb[2] * k, h = vb[3] * k, depth = (vb[1] + vb[3]) * k;
    var markup = '<svg class="tex-svg" role="img" aria-label="' + tex.replace(/"/g, '&quot;') + '"'
      + ' viewBox="' + vb.join(' ') + '" width="' + w + unit + '" height="' + h + unit + '"'
      + (o.attrs ? ' ' + o.attrs : '') + '>' + svg.innerHTML + '</svg>';
    return { svg: markup, w: w, h: h, depth: depth };
  }

  /* $...$ inline, $$...$$ display. A lone $ next to a space ("$5 and $10") stays text. */
  var MATH = /\$\$([^$]+?)\$\$|\$(?![\s$])([^$]*[^\s$])\$/g;

  /* Replaces each formula in `root`'s text with a span holding its SVG; the original
     source is kept in data-src so untypeset can put it back. */
  function typeset(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walker.nextNode())) if (n.nodeValue.indexOf('$') !== -1) nodes.push(n);
    nodes.forEach(function (node) {
      var text = node.nodeValue, last = 0, frag = document.createDocumentFragment(), m;
      MATH.lastIndex = 0;
      while ((m = MATH.exec(text))) {
        var display = m[1] != null;
        var span = document.createElement('span');
        span.className = display ? 'tex tex-display' : 'tex';
        span.setAttribute('data-src', m[0]);
        var out = render(m[1] != null ? m[1] : m[2], { display: display, unitsPerEm: 1, unit: 'em' });
        span.innerHTML = out.svg;
        // Sit the formula's baseline on the text baseline.
        if (!display) span.firstChild.style.verticalAlign = -out.depth + 'em';
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        frag.appendChild(span);
        last = m.index + m[0].length;
      }
      if (!last) return;
      frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function untypeset(root) {
    root.querySelectorAll('.tex[data-src]').forEach(function (span) {
      span.replaceWith(document.createTextNode(span.getAttribute('data-src')));
    });
  }
})();
