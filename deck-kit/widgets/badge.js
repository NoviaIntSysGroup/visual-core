/* Reusable pill badge. Theme-token styled, no icons. Exposes window.Badge. */
(function () {
  function row(items, opts) {
    items = items || [];
    if (!items.length) return '';
    opts = opts || {};
    var base = opts.path;
    var cells = items.map(function (text, j) {
      return '<span class="badge"' + window.Deck.editAttr(base && base + '/' + j) + '>' + text + '</span>';
    }).join('');
    return '<div class="badge-row">' + cells + '</div>';
  }

  window.Badge = {
    row: row
  };
})();
