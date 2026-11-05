/* Shared template set. */
(function () {
  // A hero badge equal to 'TODAY' renders as the current date (DD.MM.YYYY)
  // instead of a fixed one; write a literal date over it to pin the badge.
  function todayLabel() {
    var d = new Date();
    return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function heroBadges(badges) {
    return (badges || []).map(function (b) { return b === 'TODAY' ? todayLabel() : b; });
  }

  // TEMPLATE: full-bleed hero/title slide. `background` names a loaded global
  // whose render(slide) fills the panel; without one the panel is plain.
  // Its CSS also owns where the title block sits.
  function hero(slide, i) {
    var background = '';
    if (slide.background) {
      var backdrop = window[slide.background];
      if (!backdrop || !backdrop.render) {
        throw new Error('hero background "' + slide.background + '" is not loaded with render(slide)');
      }
      background = backdrop.render(slide);
    }
    return ''
      + '<div class="slide hero-slide">'
      +   '<div class="hero-panel">'
      +     background
      +     '<div class="hero-content">'
      +       window.Badge.row(heroBadges(slide.badges), { path: i + '/badges' })
      +       '<h1 data-edit="' + i + '/title">' + slide.title + '</h1>'
      +       '<p data-edit="' + i + '/subtitle">' + slide.subtitle + '</p>'
      +       (slide.byline ? '<p class="hero-byline" data-edit="' + i + '/byline">' + slide.byline + '</p>' : '')
      +     '</div>'
      +   '</div>'
      + '</div>';
  }

  // TEMPLATE: multi-column content slide — the default layout unless another
  // is clearly better. Works for 1..N columns; a single column (or none)
  // yields a plain title-only slide.
  function columns(slide, i) {
    var cols = slide.columns || [];
    var fragments = slide.fragments !== false;
    // `dividers`: true (default) rules every gap, false none. An array rules gaps one
    // by one (`dividers[j]` between column j and j+1), drawn flat for a row on screen
    // all at once.
    var perGap = Array.isArray(slide.dividers);
    var dividers = perGap ? 'custom' : (slide.dividers !== false);
    var gridHalign = slide.halign ? ' data-halign="' + slide.halign + '"' : '';
    var title = slide.title
      ? '<h1 data-edit="' + i + '/title">' + slide.title + '</h1>'
      : '';
    // A column may opt out with `fragment: false`, on screen from the start while the
    // rest step in. No `data-fragment-index`: Reveal steps unindexed fragments in DOM
    // order, and an index would hoist a column ahead of its own fragments.
    var highlight = highlightIndex(cols.map(function (c) {
      return [].concat.apply([], c.blocks || []);   // a column's blocks, groups flattened
    }), slide.highlight, 'slide ' + i);
    var rendered = cols.map(function (c, j) {
      return blocks(c, {
        id: 'deck-col-' + i + '_' + j,
        path: i + '/columns/' + j,
        fragment: fragments && c.fragment !== false,
        divider: perGap && j > 0 && !!slide.dividers[j - 1],
        dim: highlight != null && j !== highlight
      });
    }).join('');

    // The slide's lead-in, over the whole row rather than inside the first
    // column: the framing the columns are an answer to. It carries no fragment
    // — it is on screen with the title, since it sets up the steps rather than
    // being one of them.
    var lead = slide.lead
      ? '<p class="deck-slide-lead" data-edit="' + i + '/lead">' + slide.lead + '</p>'
      : '';

    // A full-width timeline under the row, its entries stepping in one by one
    // after the columns.
    var timeline = slide.timeline
      ? window.Timeline.row(slide.timeline, { path: i + '/timeline', fragment: fragments })
      : '';

    // The slide's closing line, under the whole row rather than inside the last
    // column: a "so what" that answers all the columns belongs to none of them.
    // It steps in last of its own accord — it is after the grid in DOM order.
    var closing = slide.closing
      ? '<p class="deck-slide-closing' + (fragments ? ' fragment fade-up' : '')
        + '" data-edit="' + i + '/closing">' + slide.closing + '</p>'
      : '';

    // `slide.highlight` (a column's title, or its index) costs one press beyond the closing line: this
    // marker is last in DOM order, and once visible it dims every other column.
    var marker = highlight != null
      ? '<span class="deck-fragment-marker fragment" aria-hidden="true"></span>'
      : '';

    return placeFigureSteps(slide, ''
      + '<div class="slide deck-columns-slide">'
      +   title
      +   lead
      +   '<div class="deck-columns-grid"' + gridHalign + ' data-dividers="' + dividers + '" style="--deck-columns-count:' + cols.length + '">'
      +     rendered
      +   '</div>'
      +   timeline
      +   closing
      +   marker
      +   footer(i)
      + '</div>');
  }

  // A `figure` block may set `startAfter` to the group its steps follow:
  // a group's title/subhead text, its 0-based position among the slide's
  // bracketed groups, or "last". Every fragment on the slide is then indexed in
  // DOM order with the figure's steps moved in after that group; slides without
  // `startAfter` are returned untouched and keep Reveal's unindexed order.
  function placeFigureSteps(slide, html) {
    var groups = [], figures = [];
    function collect(b) { if (b && b.type === 'figure') figures.push(b); }
    (slide.columns || []).forEach(function (c) {
      (c.blocks || []).forEach(function (item) {
        if (Array.isArray(item)) { groups.push(item); item.forEach(collect); }
        else collect(item);
      });
    });
    if (!figures.some(function (f) { return f.startAfter != null; })) return html;

    var root = document.createElement('div');
    root.innerHTML = html;
    var groupEls = root.querySelectorAll('.deck-block-group');
    var figureEls = root.querySelectorAll('.figure-import');
    var order = Array.prototype.slice.call(root.querySelectorAll('.fragment'));
    figures.forEach(function (f, k) {
      if (f.startAfter == null) return;
      var at = groupFor(groups, f.startAfter);
      if (at < 0) return console.warn('figure startAfter "' + f.startAfter + '" names no group on this slide');
      var steps = Array.prototype.slice.call(figureEls[k].querySelectorAll('.figure-import-step'));
      order = order.filter(function (el) { return steps.indexOf(el) < 0; });
      var pos = order.indexOf(groupEls[at]) + 1;
      order.splice.apply(order, [pos, 0].concat(steps));
    });
    order.forEach(function (el, n) { el.setAttribute('data-fragment-index', n); });
    return root.innerHTML;
  }

  // The index of the group `ref` names, by the same rules as `column.highlight`
  // (heading text or 0-based position), plus "last"; -1 when nothing matches.
  function groupFor(groups, ref) {
    if (ref === 'last') return groups.length - 1;
    if (typeof ref === 'number') return ref < groups.length ? ref : -1;
    for (var g = 0; g < groups.length; g++) {
      if (groups[g].some(function (b) { return (b.type === 'title' || b.type === 'subhead') && b.text === ref; })) return g;
    }
    return -1;
  }

  // A slide-level `highlight` resolved to an entry's index by groupFor's rules,
  // each entry being the blocks it shows; null when unset or naming nothing.
  function highlightIndex(entries, ref, where) {
    if (ref == null) return null;
    var k = groupFor(entries, ref);
    if (k < 0) console.warn(where + ' highlight "' + ref + '" names nothing');
    return k < 0 ? null : k;
  }

  // TEMPLATE: table of contents, a numbered list of the deck's sections. `highlight`
  // (an item's title or index) accents one entry and quiets the rest, so the slide
  // repeats as a section divider; with `fragments: true` the list adopts it on the
  // first step. The list lives on the overview slide; a divider inherits it and edits
  // through its paths (`tocSource`).
  function toc(slide, i) {
    var source = tocSource(slide, i);
    var items = source.slide.items || [];
    var highlight = highlightIndex(items.map(function (item) {
      return [{ type: 'title', text: item.title }];
    }), slide.highlight, 'toc slide ' + i);
    // Anchor editable paths at whichever slide actually owns the text.
    var owner = source.index;
    // Zero-size marker whose `visible` class drives the highlight (see the
    // `.deck-fragment-marker.visible + .deck-toc-list` rules). As a Reveal fragment it
    // flips on the first step; without `fragments` it ships pre-`visible`, so
    // the highlight is simply always on.
    var marker = highlight == null ? ''
      : '<span class="' + (slide.fragments === true ? 'fragment deck-fragment-marker' : 'deck-fragment-marker visible')
        + '" aria-hidden="true"></span>';
    var title = source.slide.title
      ? '<h1 data-edit="' + owner + '/title">' + source.slide.title + '</h1>'
      : '';
    var rendered = items.map(function (item, j) {
      var path = owner + '/items/' + j;
      var state = highlight == null ? ''
        : ' data-state="' + (j === highlight ? 'active' : 'dim') + '"';
      return ''
        + '<li class="deck-toc-item"' + state + '>'
        +   '<span class="deck-toc-num">' + pad2(j + 1) + '</span>'
        +   '<div>'
        +     '<h2 class="deck-toc-title" data-edit="' + path + '/title">' + item.title + '</h2>'
        +     (item.text
                ? '<p class="deck-toc-desc" data-edit="' + path + '/text">' + item.text + '</p>'
                : '')
        +   '</div>'
        + '</li>';
    }).join('');

    return ''
      + '<div class="slide deck-toc-slide">'
      +   title
      +   marker
      +   '<ol class="deck-toc-list">' + rendered + '</ol>'
      +   footer(i)
      + '</div>';
  }

  // References layout: a printout page, not a projected slide. The title keeps
  // the slide h1; the groups run on as one list flowing down three columns at
  // print size, every entry a salient name saying why it is cited,
  // then the linked source title.
  function references(slide, i) {
    var rendered = (slide.groups || []).map(function (group, g) {
      var path = i + '/groups/' + g;
      var items = (group.items || []).map(function (item, k) {
        var at = path + '/items/' + k;
        return ''
          + '<li class="deck-reference">'
          +   '<p><b data-edit="' + at + '/name">' + item.name + '</b></p>'
          +   '<p><a href="' + item.href + '" target="_blank" rel="noopener" data-edit="' + at + '/title">' + item.title + '</a></p>'
          + '</li>';
      }).join('');
      return ''
        + '<div class="deck-references-group">'
        +   '<h2 data-edit="' + path + '/title">' + group.title + '</h2>'
        +   '<ul class="deck-references-list">' + items + '</ul>'
        + '</div>';
    }).join('');

    return ''
      + '<div class="slide deck-references-slide">'
      +   '<h1 data-edit="' + i + '/title">' + slide.title + '</h1>'
      +   '<div class="deck-references-flow">' + rendered + '</div>'
      +   footer(i)
      + '</div>';
  }

  // Finds the slide a `toc` takes its section list from: itself when it carries
  // `items`, otherwise the deck's first `toc` slide that does. The index is what a
  // divider's data-edit paths are built from, so an edit lands on the one slide that
  // stores the sections.
  function tocSource(slide, i) {
    if (slide.items) return { slide: slide, index: i };
    var slides = window.Deck.config.slides || [];
    for (var j = 0; j < slides.length; j++) {
      if (slides[j] && slides[j].layout === 'toc' && slides[j].items) {
        return { slide: slides[j], index: j };
      }
    }
    throw new Error('toc slide ' + i + ' has no items, and no earlier toc slide defines them');
  }

  function blocks(column, opts) {
    if (!Array.isArray(column.blocks)) {
      throw new Error('column ' + opts.path + ' has no blocks');
    }
    // A `blocks` entry is a block, or an array of them: a bracketed group. A group is
    // what steps: when the column would fade in as one unit (`opts.fragment`), that
    // press goes to each group instead, and the column and its plain blocks render at
    // once.
    var hasGroups = column.blocks.some(function (item) { return Array.isArray(item); });
    var fragment = (opts.fragment && !hasGroups) ? ' fragment fade-up' : '';
    var groupIndex = 0;
    var rendered = column.blocks.map(function (item, k) {
      if (Array.isArray(item)) {
        var html = renderGroupItem(column, item, groupIndex, opts.fragment, {
          id: (opts.id || 'deck-block') + '-' + k,
          path: opts.path ? opts.path + '/blocks/' + k : ''
        });
        groupIndex++;
        return html;
      }
      return renderBlock(column, item, {
        id: (opts.id || 'deck-block') + '-' + k,
        path: opts.path ? opts.path + '/blocks/' + k : '',
        fragment: opts.fragment
      });
    }).join('');
    // `column.highlight` costs one more press beyond however many groups
    // stepped in — a zero-size marker, placed AFTER every group, so Reveal —
    // which steps unindexed fragments in DOM order — always reaches it last.
    var marker = column.highlight != null
      ? '<span class="deck-fragment-marker fragment" aria-hidden="true"></span>'
      : '';

    return '<div class="deck-column-content' + fragment + '"'
      + (opts.divider ? ' data-divider="true"' : '')
      + (opts.dim ? ' data-dim="true"' : '')
      + (column.valign ? ' data-valign="' + column.valign + '"' : '')
      + (column.halign ? ' data-halign="' + column.halign + '"' : '')
      + '>' + rendered + marker + '</div>';
  }

  // A bracketed group. `column.highlight` names the one its trailing marker
  // spotlights: by `title`/`subhead` text, or by 0-based position among the column's
  // groups. `stepGroups` makes the group a step; `column.enter` picks how it looks
  // before its press: `fade`, `none` (full, its video plays only while its press is
  // current), or the default `hidden`.
  function renderGroupItem(column, item, index, stepGroups, opts) {
    var isActive = column.highlight != null && (
      typeof column.highlight === 'number'
        ? column.highlight === index
        : item.some(function (b) { return (b.type === 'title' || b.type === 'subhead') && b.text === column.highlight; })
    );
    var enter = !stepGroups ? ''
      : column.enter === 'none' ? ' fragment custom deck-block-group-enter-none'
      : ' fragment custom deck-block-group-enter-' + (column.enter === 'fade' ? 'fade' : 'hidden');
    var cls = 'deck-block-group'
      + (column.highlight != null && !isActive ? ' deck-block-group-dim' : '')
      + enter;
    var rendered = item.map(function (b, j) {
      return renderBlock(column, b, {
        id: opts.id + '-' + j,
        path: opts.path ? opts.path + '/' + j : ''
      });
    }).join('');
    return '<div class="' + cls + '">' + rendered + '</div>';
  }

  function renderBlock(column, block, opts) {
    block = block || {};
    var type = block.type || 'text';
    if (type === 'title') return textBlock(block, opts.path, 'h2');
    // The h3 tier: a named part inside a column that already has a title. Plain
    // --text by default; `accent: true` opts in, for a subhead that is one part of a
    // set.
    if (type === 'subhead') {
      var hue = block.accent === true ? ' deck-subhead-accent' : '';
      return textBlock(block, opts.path, 'h3', 'deck-column-subhead' + hue);
    }
    if (type === 'subtitle') return textBlock(block, opts.path, 'p', 'deck-column-subtitle');
    if (type === 'text') return textBlock(block, opts.path, 'p');
    // Prose variants: same size as any other `p`, distinguished by presentation.
    // A quote takes its rule from the column's --column-accent; a note is the
    // quiet follow-up line under it.
    if (type === 'quote') return textBlock(block, opts.path, 'p', 'deck-quote');
    if (type === 'note') return textBlock(block, opts.path, 'p', 'deck-note');
    // A citation: the repo, paper, or URL something on the slide came from. The
    // one block written below the slide's size floor, because nobody in the room
    // reads it off the wall — it is there for whoever checks the PDF handout.
    if (type === 'source') return textBlock(block, opts.path, 'p', 'deck-source');
    // A framed code/config snippet — a settings.json excerpt, a CLI flag list.
    // Monospace, its own boxed surface, white-space: pre-wrap in templates.css
    // so authored spaces and <br> line breaks render as written; <b> still
    // works for calling out one key.
    if (type === 'code') return textBlock(block, opts.path, 'pre', 'deck-code');
    // A three-step gauge: `level` (1-3) ascending bars lit in the primary hue,
    // beside a plain-text label. The lit count is the message, so it is a shape,
    // not glyphs in the text, which could not take a colour of their own.
    if (type === 'meter') {
      var bars = [1, 2, 3].map(function (n) {
        return '<span class="deck-meter-bar"' + (n <= block.level ? ' data-on' : '') + '></span>';
      }).join('');
      return '<div class="deck-meter">'
        + '<span class="deck-meter-bars" role="img" aria-label="Level ' + block.level + ' of 3">' + bars + '</span>'
        + textBlock(block, opts.path, 'p')
        + '</div>';
    }
    // A data chart, drawn by the chart kit (core/drawing-kit/charts/), which owns every
    // `kind`.
    if (type === 'chart') {
      if (!window.Charts || !window.Charts.render) {
        throw new Error('chart block requires core/drawing-kit/charts/charts.js');
      }
      var chart = window.Charts.render(block);
      return sizedDrawing(chart.svg, block, chart);
    }
    // A bulleted list. Items stay separate strings rather than one markup blob
    // so each line carries its own edit path and stays editable on its own.
    if (type === 'bullets') {
      var items = (block.items || []).map(function (item, n) {
        return '<li' + window.Deck.editAttr(opts.path && opts.path + '/items/' + n) + '>' + item + '</li>';
      }).join('');
      return '<ul class="deck-column-list">' + items + '</ul>';
    }
    // A table: a header row of `columns`, then `rows` of `{ cells, emphasis }`.
    // `widths` (percent per column) is optional; columns share equally without
    // it. Every header and cell carries its own edit path.
    if (type === 'table') {
      var edit = function (sub) { return window.Deck.editAttr(opts.path && opts.path + '/' + sub); };
      var cols = (block.widths || []).map(function (w) {
        return '<col style="width:' + w + '%">';
      }).join('');
      var head = (block.columns || []).map(function (c, n) {
        return '<th' + edit('columns/' + n) + '>' + c + '</th>';
      }).join('');
      var body = (block.rows || []).map(function (row, r) {
        var cells = (row.cells || []).map(function (c, n) {
          return '<td' + edit('rows/' + r + '/cells/' + n) + '>' + c + '</td>';
        }).join('');
        return '<tr' + (row.emphasis ? ' class="deck-table-emphasis"' : '') + '>' + cells + '</tr>';
      }).join('');
      return '<table class="deck-table">'
        + (cols ? '<colgroup>' + cols + '</colgroup>' : '')
        + '<thead><tr>' + head + '</tr></thead>'
        + '<tbody>' + body + '</tbody>'
        + '</table>';
    }
    // A whole figure imported onto the slide, stepped by Reveal fragments.
    // `module` names the figure module's global, e.g. 'ExampleStepsFigure'.
    if (type === 'figure') {
      if (!window.FigureImport || !window.FigureImport.render) {
        throw new Error('figure block requires core/deck-kit/figure-import.js');
      }
      return window.FigureImport.render(block, opts);
    }
    // One picture or a set of them — photos, illustrations, logos, icons. The
    // block renderer (core/deck-kit/image.js) owns every option.
    if (type === 'image') {
      if (!window.ImageBlock || !window.ImageBlock.render) {
        throw new Error('image block requires core/deck-kit/image.js');
      }
      return window.ImageBlock.render(block, { path: opts.path });
    }
    // A silent looping clip, filling its share of the column. Reveal plays it
    // when its slide opens (`data-autoplay`) and stops it when the slide closes.
    // `maxHeight` (points) caps how tall it stands, as on an image.
    if (type === 'video') {
      var videoCap = block.maxHeight ? ' style="--video-max-height:' + block.maxHeight + 'px"' : '';
      return '<div' + videoCap + '>'
        + '<video class="deck-video" src="' + (block.src || '') + '"'
        + (block.alt ? ' aria-label="' + block.alt + '"' : '')
        + ' muted loop playsinline data-autoplay></video>'
        + window.Deck.caption(block, opts.path)
        + '</div>';
    }
    // A side-by-side pair inside one column: two equal halves, each block in a cell,
    // so a block of fixed size (a portrait) keeps its size inside its half. `valign:
    // 'top'` hangs the cells from the row's top edge instead of centring them. A
    // bracketed cell steps in on its own press; a cell of brackets (`[[a], [b]]`)
    // stacks groups that step in turn.
    if (type === 'row') {
      var rowAlign = block.valign ? ' data-valign="' + block.valign + '"' : '';
      var inner = (block.blocks || []).map(function (item, n) {
        var cellOpts = {
          id: (opts.id || 'deck-block') + '-' + n,
          path: opts.path ? opts.path + '/blocks/' + n : ''
        };
        var groups = !Array.isArray(item) ? null : Array.isArray(item[0]) ? item : [item];
        return '<div class="deck-block-row-cell">' + (groups
          ? groups.map(function (group, k) {
            return renderGroupItem(column, group, null, opts.fragment, groups === item ? {
              id: cellOpts.id + '-' + k,
              path: cellOpts.path ? cellOpts.path + '/' + k : ''
            } : cellOpts);
          }).join('')
          : renderBlock(column, item, cellOpts)) + '</div>';
      }).join('');
      return '<div class="deck-block-row"' + rowAlign + '>' + inner + '</div>';
    }
    return '';
  }

  // Caps a raw drawing SVG string (a chart) to a slide's title-to-footer
  // budget, when the caller states one. `spec` is the block carrying the
  // optional `maxHeight` (points); `meta` is the drawing's intrinsic
  // `{width, height}`. `maxHeight` converts to the width the deck.css import
  // rule sizes by, via that aspect ratio, as figure-import.js does.
  function sizedDrawing(html, spec, meta) {
    var w = spec.maxHeight && meta && meta.width && meta.height
      ? spec.maxHeight * meta.width / meta.height
      : null;
    // `width: 100%` (not just `max-width`) is required here, same as
    // .figure-import in figure-import.css: an unset width shrink-wraps the
    // SVG's own intrinsic size instead of the column's, leaving the inner
    // `min(100%, …)` with no definite percentage base to resolve against —
    // the cap would then silently render as a no-op.
    return w ? '<div style="width:100%;max-width:' + w + 'px;margin:0 auto">' + html + '</div>' : html;
  }

  function textBlock(block, path, tag, cls) {
    var value = block.text == null ? '' : block.text;
    return '<' + tag + (cls ? ' class="' + cls + '"' : '') + window.Deck.editAttr(path && path + '/text') + '>' + value + '</' + tag + '>';
  }

  // Helper: renders the shared footer markup (logo + slide number).
  function footer(i) {
    return '<img src="' + window.Deck.config.logo + '" alt="" class="logo-corner">'
      + '<span class="slide-num">' + pad2(i + 1) + ' / ' + pad2(window.Deck.config.total || 0) + '</span>';
  }

  // Helper: zero-pads a number to two digits for slide counters.
  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  // Public template registry: only these entries are actual slide templates.
  window.Templates = {
    hero: hero,
    columns: columns,
    toc: toc,
    references: references
  };
})();
