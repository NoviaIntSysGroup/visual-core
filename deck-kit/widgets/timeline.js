/* Timeline: an optional h2 over dated entries evenly spaced on one axis, their
   labels alternating above and below, each on a stem from its circle. The
   track is solid through the past and dashed from halfway to the first future
   entry. Exposes window.Timeline. */
(function () {
  // Default height of an entry's picture, in points.
  var IMAGE_HEIGHT = 64;

  // `timeline` is { title, items }, items in time order being
  // { date, text, milestone, future } (a milestone's circle takes the accent,
  // a future one is hollow), with { src, alt, height } in place of `text` for a
  // picture beyond the date. With `opts.fragment` the section arrives with its
  // title, axis and first entry on one press, and each later entry on its own.
  function row(timeline, opts) {
    opts = opts || {};
    var path = opts.path || '';
    var items = timeline.items || [];
    var last = Math.max(items.length - 1, 1);
    var firstFuture = items.findIndex(function (item) { return item.future; });
    var splitX = firstFuture < 0 ? 1 : Math.max(firstFuture - 0.5, 0) / last;

    var entries = items.map(function (item, k) {
      var itemPath = path ? path + '/items/' + k : '';
      var label = '<p class="timeline-date"' + window.Deck.editAttr(itemPath && itemPath + '/date') + '>' + item.date + '</p>'
        + (item.src
          ? '<img class="timeline-image" src="' + item.src + '" alt="' + (item.alt || '')
            + '" style="height:' + (item.height || IMAGE_HEIGHT) + 'px">'
          : '<p class="timeline-text"' + window.Deck.editAttr(itemPath && itemPath + '/text') + '>' + item.text + '</p>');
      return ''
        + '<li class="timeline-entry ' + (k % 2 === 0 ? 'timeline-above' : 'timeline-below')
        +   (k === 0 ? ' timeline-first' : k === items.length - 1 ? ' timeline-last' : '')
        +   (item.milestone ? ' timeline-milestone' : '')
        +   (item.future ? ' timeline-future' : '')
        +   (opts.fragment && k > 0 ? ' fragment fade-up' : '')
        +   '" style="--x:' + k / last * 100 + '%">'
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
    // Neighbours on one side are two steps apart, so a label may be that wide.
    return '<div class="timeline-section' + (tallest ? ' timeline-with-images' : '')
      + (opts.fragment ? ' fragment fade-up' : '') + '"'
      + (tallest ? ' style="--timeline-image-height:' + tallest + 'px"' : '') + '>'
      + title
      + '<div class="timeline" style="--timeline-label-width:' + 2 / last * 100 + '%">'
      +   '<span class="timeline-track" style="right:' + (1 - splitX) * 100 + '%"></span>'
      +   '<span class="timeline-track timeline-track-future" style="left:' + splitX * 100 + '%"></span>'
      +   '<ol class="timeline-entries">' + entries.join('') + '</ol>'
      + '</div>'
      + '</div>';
  }

  window.Timeline = {
    row: row
  };
})();
