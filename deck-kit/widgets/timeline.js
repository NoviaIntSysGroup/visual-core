/* Timeline: an optional h2 over dated entries on one axis, their labels above or
   below, each on a stem from its circle. Named branches run beside the axis,
   above or below it, as in a git graph: each leaves the axis on a curve, or
   starts at the left edge, and merges back on a curve, or runs to the right edge.
   Every track is solid through the past and dashed from halfway to the first
   future entry. Exposes window.Timeline. */
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

  // `timeline` is { title, branches, items }, items in time order being
  // { date, text, milestone, future, branch } (a milestone's circle takes the
  // accent, a future one is hollow), with { src, alt, height } in place of `text`
  // for a picture beyond the date. `branches` are { name, side: 'above' | 'below',
  // from, to }, `from`/`to` 'edge' or, by default, 'axis'; `branch` is an index.
  // With `opts.fragment` the section arrives with its title, tracks and first
  // entry, then each later entry.
  function row(timeline, opts) {
    opts = opts || {};
    var path = opts.path || '';
    var items = timeline.items || [];
    var branches = timeline.branches || [];
    var plan = layout(items, branches);
    var last = Math.max(plan.steps - 1, 1);
    var x = plan.place.map(function (p) { return p.at / last; });
    var firstFuture = items.findIndex(function (item) { return item.future; });
    var splitX = firstFuture < 0 ? 1 : firstFuture === 0 ? 0 : (x[firstFuture - 1] + x[firstFuture]) / 2;

    // A track from a to b, solid up to splitX and dashed after; the offsets
    // (CSS lengths) move only its outer ends.
    function span(cls, a, b, aOff, bOff) {
      return '<span class="timeline-track ' + cls + '" style="left:calc(' + a * 100 + '% + ' + aOff
        + ');right:calc(' + (1 - b) * 100 + '% - ' + bOff + ')"></span>';
    }
    function track(cls, a, b, aOff, bOff) {
      var s = Math.min(Math.max(splitX, a), b);
      return (s > a ? span(cls, a, s, aOff, s < b ? '0px' : bOff) : '')
        + (s < b ? span(cls + ' timeline-dashed', s, b, s > a ? '0px' : aOff, bOff) : '');
    }

    var meets = [];
    plan.ends.forEach(function (e) {
      if (e) [e.from, e.to].forEach(function (m) { if (m !== null) meets.push(m / last); });
    });
    // The axis spans its entries and the bends; an end at a bend stops where the curve meets it.
    var half = 'var(--timeline-bend) / 2';
    var axisEntries = x.filter(function (v, k) { return !plan.place[k].branch; });
    var axisX = axisEntries.concat(meets);
    var a0 = Math.min.apply(null, axisX), a1 = Math.max.apply(null, axisX);
    var tracks = axisX.length ? track('', a0, a1,
      axisEntries.indexOf(a0) < 0 ? 'calc(' + half + ')' : '0px',
      axisEntries.indexOf(a1) < 0 ? 'calc(-1 * ' + half + ')' : '0px') : '';
    // A bend is an S-curve between the axis and a branch, centred where they meet;
    // it rises towards the branch above, or falls towards the branch below.
    function bend(side, m, leaving) {
      var rise = (side === 'above') === leaving;
      return '<svg class="timeline-bend timeline-bend-' + side + (m > splitX ? ' timeline-dashed' : '')
        + '" style="left:' + m * 100 + '%" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">'
        + '<path vector-effect="non-scaling-stroke" d="' + (rise ? 'M0,1 C.5,1 .5,0 1,0' : 'M0,0 C.5,0 .5,1 1,1') + '"/></svg>';
    }
    branches.forEach(function (b, i) {
      var e = plan.ends[i];
      if (!e) return;
      var a = e.from === null ? 0 : e.from / last, z = e.to === null ? 1 : e.to / last;
      tracks += track('timeline-branch-' + b.side, a, z,
          e.from === null ? '0px' : 'calc(' + half + ')', e.to === null ? '0px' : 'calc(-1 * ' + half + ')')
        + (e.from === null ? '' : bend(b.side, a, true))
        + (e.to === null ? '' : bend(b.side, z, false))
        + '<p class="timeline-branch-name timeline-branch-name-' + b.side + '" style="left:'
        + (e.from === null ? '0px' : 'calc(' + a * 100 + '% + ' + half + ')') + '"'
        + window.Deck.editAttr(path && path + '/branches/' + i + '/name') + '>' + b.name + '</p>';
    });

    var entries = items.map(function (item, k) {
      var p = plan.place[k];
      // A label may reach halfway to its nearest neighbour on the same side, either
      // way; an end label, aligned to its edge, reaches one way only.
      var room = 2 / last;
      plan.place.forEach(function (q, i) {
        if (i !== k && q.above === p.above) room = Math.min(room, Math.abs(x[i] - x[k]));
      });
      if (x[k] === 0 || x[k] === 1) room /= 2;
      var itemPath = path ? path + '/items/' + k : '';
      var label = '<p class="timeline-date"' + window.Deck.editAttr(itemPath && itemPath + '/date') + '>' + item.date + '</p>'
        + (item.src
          ? '<img class="timeline-image" src="' + item.src + '" alt="' + (item.alt || '')
            + '" style="height:' + (item.height || IMAGE_HEIGHT) + 'px">'
          : '<p class="timeline-text"' + window.Deck.editAttr(itemPath && itemPath + '/text') + '>' + item.text + '</p>');
      return ''
        + '<li class="timeline-entry ' + (p.above ? 'timeline-above' : 'timeline-below')
        +   (x[k] === 0 ? ' timeline-first' : x[k] === 1 ? ' timeline-last' : '')
        +   (p.branch ? ' timeline-on-' + p.branch.side : '')
        +   (item.milestone ? ' timeline-milestone' : '')
        +   (item.future ? ' timeline-future' : '')
        +   (opts.fragment && k > 0 ? ' fragment fade-up' : '')
        +   '" style="--x:' + x[k] * 100 + '%;--timeline-label-width:' + room * 100 + '%">'
        +   '<span class="timeline-stem"></span>'
        +   '<span class="timeline-dot"></span>'
        +   '<div class="timeline-label">' + label + '</div>'
        + '</li>';
    });

    var title = timeline.title
      ? '<h2 class="timeline-title"' + window.Deck.editAttr(path && path + '/title') + '>' + timeline.title + '</h2>'
      : '';
    // Both label bands are as tall as the tallest picture, keeping the axis centred.
    var tallest = Math.max.apply(null, [0].concat(items.map(function (item) {
      return item.src ? item.height || IMAGE_HEIGHT : 0;
    })));
    return '<div class="timeline-section' + (tallest ? ' timeline-with-images' : '')
      + (opts.fragment ? ' fragment fade-up' : '') + '"'
      + (tallest ? ' style="--timeline-image-height:' + tallest + 'px"' : '') + '>'
      + title
      + '<div class="timeline' + (branches.length ? ' timeline-with-branches' : '') + '">'
      +   tracks
      +   '<ol class="timeline-entries">' + entries.join('') + '</ol>'
      + '</div>'
      + '</div>';
  }

  window.Timeline = {
    row: row
  };
})();
