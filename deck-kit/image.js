/* Image — the `image` block: one picture or a grid. Exposes window.ImageBlock. An
   item is a `src`, an `icon`, or a `name` standing in for a missing file.
   Picture sizing: natural size, capped by column, `maxHeight`, `widthPercent`.
   Slot sizing (`cellWidth`, `cellHeight`, `width`, `height`): equal slots. */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/"/g, '&quot;');
  }

  /* A tint arrives as a THEME TOKEN NAME ('text', 'graphic-primary'), never as a
     colour: a deck that could write a literal here would be picking a hue out of
     band, which is the one thing the palette exists to prevent. Anything that
     isn't a token name is dropped rather than passed through, so a typo falls
     back to the CSS default instead of injecting into the style attribute. */
  function tint(name) {
    if (!name) return '';
    var token = String(name).replace(/^--/, '');
    if (!/^[a-z0-9-]+$/.test(token)) return '';
    return ';--image-tint:var(--' + token + ')';
  }

  /* block: { src?, icon?, name?, alt?, caption?, columns?, maxHeight?, widthPercent?,
       items?: [{ src?, icon?, name?, alt?, caption?, cover? }],
       cellWidth?, cellHeight?, width?, height?, stretch?, fit?, surface?, padding?,
       tint?, wash?, equalize?, optical?, ariaLabel? }
     opts: { path } — the editor's edit paths. */
  function render(block, opts) {
    opts = opts || {};
    block = block || {};
    var path = opts.path || '';
    var single = !block.items;
    var items = single ? [block] : block.items;
    var columns = block.columns || items.length || 1;

    /* Slot sizing: `cellWidth`/`cellHeight` sizes each slot; `width`/`height` sizes
       the whole grid and wins if both are given. Either pair may give one number, and
       a square aspect-ratio fills in the other. `stretch` instead makes the missing
       width the space available. */
    var boxed = !!(block.width || block.height);
    var fixed = !boxed && !!(block.cellWidth || block.cellHeight);
    var slotted = boxed || fixed;
    var stretch = block.stretch === true && slotted;
    var rows = Math.ceil(items.length / columns) || 1;

    var cells = items.map(function (item, i) {
      var itemPath = !path ? '' : single ? path : path + '/items/' + i;
      var name = item.name || '';
      var inner;
      if (item.src && !slotted) {
        return '<li class="deck-image-item">'
          + '<img class="deck-image-picture" src="' + esc(item.src) + '" alt="' + esc(item.alt || name) + '">'
          + window.Deck.caption(item, itemPath)
          + '</li>';
      }
      if (item.icon) {
        if (!window.Icons || !window.Icons.svg) {
          throw new Error('An `icon` image requires core/drawing-kit/icons/icons.js');
        }
        /* Named only when nothing else on the slide names it: these sit under a
           heading that says the same words, and a duplicate label is noise to a
           screen reader. `name` is the label, its absence the decoration case. */
        inner = window.Icons.svg(item.icon, item.alt || name);
      } else if (item.src) {
        inner = '<img class="deck-image-mark" src="' + esc(item.src) + '" alt="' + esc(item.alt || name) + '"'
          + (item.cover != null ? ' data-cover="' + Number(item.cover) + '"' : '') + '>';
      } else {
        inner = '<span class="deck-caption deck-image-placeholder"'
          + window.Deck.editAttr(itemPath && itemPath + '/name')
          + '>' + name + '</span>';
      }
      return '<li class="deck-image-item"><div class="deck-image-cell">' + inner + '</div>'
        + window.Deck.caption(item, itemPath) + '</li>';
    }).join('');

    var style = ' style="--image-cols:' + columns
      + tint(block.tint)
      + (block.maxHeight ? ';--image-max-height:' + block.maxHeight + 'px' : '')
      + (block.widthPercent ? ';--image-width-percent:' + block.widthPercent + '%' : '')
      + (boxed
          ? ';--image-rows:' + rows
            + (block.width ? ';--image-width:' + block.width + 'px' : '')
            + (block.height ? ';--image-height:' + block.height + 'px' : '')
          : fixed
            ? (block.cellWidth ? ';--image-cell-width:' + block.cellWidth + 'px' : '')
              + (block.cellHeight ? ';--image-cell-height:' + block.cellHeight + 'px' : '')
            : '')
      + '"';

    /* The slot's surface is a closed set, not a colour the deck picks: none
       (default) for a bare picture, `soft` for the filled slot a row of vendor
       artwork needs to read as one set, `portrait` for a round face photo.
       `padding: true` insets the content from the slot's edge. */
    var cls = 'deck-image'
      + (block.surface === 'soft' ? ' deck-image-soft' : block.surface === 'portrait' ? ' deck-image-portrait' : '')
      + (block.padding === true ? ' deck-image-padded' : '')
      + (boxed ? ' deck-image-boxed' : fixed ? ' deck-image-fixed' : '')
      + (stretch ? ' deck-image-stretch' : '')
      + (block.fit === 'cover' ? ' deck-image-cover' : '')
      + (block.widthPercent ? ' deck-image-narrowed' : '');

    /* `true` normalizes this grid on its own; a string names a group, and every
       grid on the slide carrying that name is normalized against the others. */
    var grid = '<ul class="' + cls + '"'
      + (block.equalize
          ? ' data-equalize="' + (block.equalize === true ? '' : esc(block.equalize)) + '"'
          : '')
      + (block.optical != null ? ' data-optical="' + Number(block.optical) + '"' : '')
      + (block.ariaLabel ? ' aria-label="' + esc(block.ariaLabel) + '"' : '')
      + style + '>' + cells + '</ul>';
    return block.wash ? washed(grid, block, slotted && !stretch) : grid;
  }

  /* `wash`: a coloured panel behind the grid (widgets/wash.js). `shrink` keeps it to
     the size of a grid that states its own box; a `stretch` grid spans the column and
     takes the panel with it. */
  function washed(grid, block, shrink) {
    if (!window.Wash || !window.Wash.render) {
      throw new Error('A `wash` on an image requires core/deck-kit/widgets/wash.js');
    }
    return '<div class="deck-wash-host' + (shrink ? ' deck-wash-host-shrink' : '') + '">'
      + window.Wash.render(block.wash)
      + grid
      + '</div>';
  }

  /* ── Equal-area sizing (slotted pictures only) ────────────────────────────
     `equalize: true` scales every mark to the area of the smallest, from the files'
     natural sizes at run time; a name groups every grid on the slide carrying it. A
     mark's `cover` (ink fraction, from tools/mark-coverage.js) weights its area by
     cover^optical; `optical` (default 1) blends box area (0) to ink area (1). */

  /* A grid's slot content box. Reveal scales the whole canvas with a transform,
     so these are unscaled layout px — the deck's points, which is what we want.
     A slide Reveal has not laid out yet measures zero; that is not a failure,
     just "not yet", so report it and let the caller try again later. */
  function slot(grid) {
    var cell = grid.querySelector('.deck-image-cell');
    if (!cell) return null;
    var pad = window.getComputedStyle(cell);
    var w = cell.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
    var h = cell.clientHeight - parseFloat(pad.paddingTop) - parseFloat(pad.paddingBottom);
    return (w > 0 && h > 0) ? { w: w, h: h } : null;
  }

  function ratio(img) {
    return (img.naturalWidth > 0 && img.naturalHeight > 0)
      ? img.naturalWidth / img.naturalHeight
      : 0;
  }

  function fitted(grid) {
    return [].slice.call(grid.querySelectorAll('img.deck-image-mark'));
  }

  function equalize(grids) {
    var marks = [];
    for (var i = 0; i < grids.length; i++) {
      var box = slot(grids[i]);
      if (!box) return false;
      var els = fitted(grids[i]);
      var optical = grids[i].hasAttribute('data-optical') ? Number(grids[i].getAttribute('data-optical')) : 1;
      for (var j = 0; j < els.length; j++) {
        var r = ratio(els[j]);
        if (!r) continue;
        var cover = els[j].hasAttribute('data-cover') ? Number(els[j].getAttribute('data-cover')) : 1;
        var area = r > box.w / box.h ? (box.w * box.w) / r : box.h * box.h * r;
        marks.push({ el: els[j], weight: area * Math.pow(cover, optical) });
      }
    }
    if (marks.length < 2) return true;

    /* The smallest weight is the target, so no mark grows past its slot. */
    var target = marks[0].weight;
    marks.forEach(function (m) { if (m.weight < target) target = m.weight; });
    marks.forEach(function (m) {
      /* Weight scales with the square of a linear scale, hence the root. */
      m.el.style.setProperty('--image-mark-scale', Math.sqrt(target / m.weight).toFixed(4));
    });
    return true;
  }

  /* Marks are still loading when the deck mounts, and a grid cannot be measured
     until its slide has been laid out — so this runs on whatever signal arrives
     and skips the slides it has already settled. */
  function equalizeAll() {
    var scope = document;
    var pending = [].slice.call(
      scope.querySelectorAll('.deck-image[data-equalize]:not([data-equalized])'));

    /* Group by (slide, name). Scoping to the slide keeps two slides' grids from
       weighing against each other even when they share a name; an unnamed grid
       takes its own element as the key, which nothing else can match, so it
       stands alone. A grid outside any slide falls back to its own document. */
    var cohorts = [];
    pending.forEach(function (grid) {
      var slide = grid.closest ? (grid.closest('section') || scope) : scope;
      var name = grid.getAttribute('data-equalize');
      var key = name || grid;
      var found = null;
      cohorts.forEach(function (c) { if (c.slide === slide && c.key === key) found = c; });
      if (!found) cohorts.push({ slide: slide, key: key, grids: [grid] });
      else found.grids.push(grid);
    });

    cohorts.forEach(function (cohort) {
      var imgs = [];
      cohort.grids.forEach(function (grid) { imgs = imgs.concat(fitted(grid)); });
      whenLoaded(imgs, function () {
        if (!equalize(cohort.grids)) return;
        cohort.grids.forEach(function (grid) { grid.setAttribute('data-equalized', ''); });
      });
    });
  }

  function whenLoaded(imgs, done) {
    var pending = imgs.length;
    if (!pending) return done();
    imgs.forEach(function (img) {
      if (img.complete) { if (--pending === 0) done(); return; }
      var settle = function () {
        img.removeEventListener('load', settle);
        img.removeEventListener('error', settle);
        if (--pending === 0) done();
      };
      img.addEventListener('load', settle);
      img.addEventListener('error', settle);
    });
  }

  function init() {
    equalizeAll();
    if (window.Reveal && Reveal.addEventListener) {
      Reveal.addEventListener('ready', function () { equalizeAll(); });
      Reveal.addEventListener('slidechanged', function () { equalizeAll(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ImageBlock = { render: render };
})();
