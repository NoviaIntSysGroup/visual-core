/* Timeline: an optional h2 over dated entries on one axis, each in an equal slot, labelled
   above or below on a stem, its date over the stem; an outcome ends the axis in a card on
   it. The slots fill the width edge to edge with even gaps. Named branches run above or
   below the axis, as in a git graph, leaving it on a curve or from the left edge, rejoining it
   on a curve or running to the right edge. Tracks are solid through the past, dashed from
   halfway to the first future entry. Exposes window.Timeline. */
(function () {
  // Default height of an entry's picture, in points.
  var IMAGE_HEIGHT = 64;

  // Positions in steps, and each entry's side. A branch runs between the axis
  // entries either side of its own, so the items fall into stretches over which
  // the same branches run; within one, each track's j-th entry takes the stretch's
  // j-th step, lining tracks up whatever their dates. A branch entry's label is on its
  // branch's side; an axis entry's takes the side no branch is on, else the one
  // opposite the previous axis entry's, starting above.
  function layout(items, branches) {
    var first = branches.map(function () { return -1; }), last = first.slice();
    items.forEach(function (item, k) {
      if (branches[item.branch]) { if (first[item.branch] < 0) first[item.branch] = k; last[item.branch] = k; }
    });
    var axis = items.map(function (item, k) { return branches[item.branch] ? -1 : k; })
      .filter(function (k) { return k >= 0; });
    var lo = first.map(function (f, i) {
      return branches[i].from === 'edge' ? 0 : axis.filter(function (k) { return k < f; }).pop() + 1 || 0;
    });
    var hi = last.map(function (l, i) {
      var next = axis.find(function (k) { return k > l; });
      return branches[i].to === 'edge' || next === undefined ? Infinity : next - 1;
    });
    function running(k) {
      return branches.map(function (b, i) { return first[i] >= 0 && k >= lo[i] && k <= hi[i]; });
    }
    var place = [], stretches = [], start = 0, axisAbove = false;
    for (var k = 0; k <= items.length; k++) {
      if (k < items.length && running(k).join() === running(start).join()) continue;
      var tracks = {}, width = 0;
      for (var i = start; i < k; i++) {
        var key = branches[items[i].branch] ? items[i].branch : 'axis';
        (tracks[key] = tracks[key] || []).push(i);
        width = Math.max(width, tracks[key].length);
      }
      var at = stretches.length ? stretches[stretches.length - 1].end + 1 : 0;
      var taken = {}, on = running(start);
      branches.forEach(function (b, i) { if (on[i]) taken[b.side] = true; });
      Object.keys(tracks).forEach(function (key) {
        tracks[key].forEach(function (i, j, own) {
          var b = branches[items[i].branch];
          var above = b ? b.side === 'above'
            : taken.above && !taken.below ? false : taken.below && !taken.above ? true : !axisAbove;
          if (!b) axisAbove = above;
          place[i] = { at: at + j, above: above, branch: b };
        });
      });
      stretches.push({ end: at + width - 1 });
      start = k;
    }
    // A branch leaves the axis halfway into the stretch holding its first entry,
    // and merges back halfway out of the one holding its last. With no stretch
    // beyond, or `from`/`to` set to 'edge', it runs to that edge instead (null).
    function stretchOf(k) {
      return stretches.findIndex(function (st) { return st.end >= place[k].at; });
    }
    var ends = branches.map(function (b, i) {
      if (first[i] < 0) return null;
      var s = stretchOf(first[i]), e = stretchOf(last[i]);
      return {
        from: b.from === 'edge' || s === 0 ? null : stretches[s - 1].end + 0.5,
        to: b.to === 'edge' || e === stretches.length - 1 ? null : stretches[e].end + 0.5
      };
    });
    return { steps: at + width, place: place, ends: ends };
  }

  // The HTML of `timeline`, { title, cards, from, to, branches, items }, its fields as listed under `timeline`
  // in core/skills/slide-decks/blocks.md. With `opts.fragment` the section arrives with its
  // title, tracks and first entry, then each later entry.
  function row(timeline, opts) {
    opts = opts || {};
    var path = opts.path || '';
    var items = timeline.items || [];
    var branches = timeline.branches || [];
    var plan = layout(items, branches);
    // Each step owns an equal slot, the first and last flush with the edges and the gaps
    // between them even (timeline.css). `at(t)` is the middle of step t's slot, as a CSS
    // length; a fractional t falls between slots, and -Infinity and Infinity are the edges.
    // A lone step sits in the middle.
    function at(t) {
      if (plan.steps === 1 && isFinite(t)) t = 0.5;
      return t === -Infinity ? '0px' : t === Infinity ? '100%'
        : '(' + t + ' * var(--timeline-pitch) + var(--timeline-slot) / 2)';
    }
    var x = plan.place.map(function (p) { return p.at; });
    var firstFuture = items.findIndex(function (item) { return item.future; });
    var splitX = firstFuture < 0 ? Infinity : firstFuture === 0 ? -Infinity : (x[firstFuture - 1] + x[firstFuture]) / 2;

    // A track from step a to step b, solid up to splitX and dashed after; the offsets
    // (CSS lengths) move only its outer ends.
    function span(cls, a, b, aOff, bOff) {
      return '<span class="timeline-track ' + cls + '" style="left:calc(' + at(a) + ' + ' + aOff
        + ');right:calc(100% - ' + at(b) + ' - ' + bOff + ')"></span>';
    }
    function track(cls, a, b, aOff, bOff) {
      var s = Math.min(Math.max(splitX, a), b);
      return (s > a ? span(cls, a, s, aOff, s < b ? '0px' : bOff) : '')
        + (s < b ? span(cls + ' timeline-dashed', s, b, s > a ? '0px' : aOff, bOff) : '');
    }

    var meets = [];
    plan.ends.forEach(function (e) {
      if (e) [e.from, e.to].forEach(function (m) { if (m !== null) meets.push(m); });
    });
    // The axis spans its entries and the bends, or runs to an edge where the timeline's
    // `from`/`to` is 'edge'; an end at a bend stops where the curve meets it.
    var half = 'var(--timeline-bend) / 2';
    var axisEntries = x.filter(function (v, k) { return !plan.place[k].branch; });
    var axisX = axisEntries.concat(meets);
    var a0 = timeline.from === 'edge' ? -Infinity : Math.min.apply(null, axisX);
    var a1 = timeline.to === 'edge' ? Infinity : Math.max.apply(null, axisX);
    var tracks = axisX.length ? track('', a0, a1,
      meets.indexOf(a0) >= 0 && axisEntries.indexOf(a0) < 0 ? 'calc(' + half + ')' : '0px',
      meets.indexOf(a1) >= 0 && axisEntries.indexOf(a1) < 0 ? 'calc(-1 * ' + half + ')' : '0px') : '';
    // A bend is an S-curve between the axis and a branch, centred where they meet;
    // it rises towards the branch above, or falls towards the branch below.
    function bend(side, m, leaving) {
      var rise = (side === 'above') === leaving;
      return '<svg class="timeline-bend timeline-bend-' + side + (m > splitX ? ' timeline-dashed' : '')
        + '" style="left:calc(' + at(m) + ')" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">'
        + '<path vector-effect="non-scaling-stroke" d="' + (rise ? 'M0,1 C.5,1 .5,0 1,0' : 'M0,0 C.5,0 .5,1 1,1') + '"/></svg>';
    }
    branches.forEach(function (b, i) {
      var e = plan.ends[i];
      if (!e) return;
      var a = e.from === null ? -Infinity : e.from, z = e.to === null ? Infinity : e.to;
      tracks += track('timeline-branch-' + b.side, a, z,
          e.from === null ? '0px' : 'calc(' + half + ')', e.to === null ? '0px' : 'calc(-1 * ' + half + ')')
        + (e.from === null ? '' : bend(b.side, a, true))
        + (e.to === null ? '' : bend(b.side, z, false))
        + '<p class="timeline-branch-name timeline-branch-name-' + b.side + '" style="left:'
        + 'calc(' + at(a) + (e.from === null ? '' : ' + ' + half) + ')' + '"'
        + window.Deck.editAttr(path && path + '/branches/' + i + '/name') + '>' + b.name + '</p>';
    });

    var entries = items.map(function (item, k) {
      var p = plan.place[k];
      var itemPath = path ? path + '/items/' + k : '';
      var label = '<p class="timeline-date"' + window.Deck.editAttr(itemPath && itemPath + '/date') + '>' + item.date + '</p>'
        + '<div class="timeline-content">'
        +   (item.src
            ? '<img class="timeline-image" src="' + item.src + '" alt="' + (item.alt || '')
              + '" style="height:' + (item.height || IMAGE_HEIGHT) + 'px">'
            : item.module ? window.FigureImport.render({ module: item.module }) : '')
        +   (item.text
            ? '<p class="timeline-text"' + window.Deck.editAttr(itemPath && itemPath + '/text') + '>' + item.text + '</p>'
            : '')
        + '</div>';
      var mark = '<span class="timeline-mark"><span class="timeline-stem"></span><span class="timeline-dot"></span></span>';
      var card = item.outcome || timeline.cards && (item.src || item.module);
      return ''
        + '<li class="timeline-entry ' + (item.outcome ? 'timeline-outcome' : p.above ? 'timeline-above' : 'timeline-below')
        +   (p.branch ? ' timeline-on-' + p.branch.side : '')
        +   (item.milestone ? ' timeline-milestone' : '')
        +   (item.future ? ' timeline-future' : '')
        +   (opts.fragment && k > 0 ? ' fragment fade-up' : '')
        +   '" style="--x:calc(' + at(x[k]) + ')">'
        +   (item.outcome ? '' : mark)
        +   '<div class="timeline-label' + (card ? ' timeline-card' : '') + '">' + label + (item.outcome ? mark : '') + '</div>'
        + '</li>';
    });

    var title = timeline.title
      ? '<h2 class="timeline-title"' + window.Deck.editAttr(path && path + '/title') + '>' + timeline.title + '</h2>'
      : '';
    return '<div class="timeline-section' + (opts.fragment ? ' fragment fade-up' : '') + '">'
      + title
      + '<div class="timeline' + (branches.length ? ' timeline-with-branches' : '') + '" style="--timeline-steps:' + plan.steps + '">'
      +   '<div class="timeline-tracks">' + tracks + '</div>'
      +   '<ol class="timeline-entries">' + entries.join('') + '</ol>'
      + '</div>'
      + '</div>';
  }

  window.Timeline = {
    row: row
  };
})();
