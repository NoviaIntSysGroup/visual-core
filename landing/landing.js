/* Landing page: tab toggle, deferred thumbnails, and card titles read from each
   thumbnail's DeckMeta / FigureMeta. Load at the end of <body>;
   no framework, works over file://. */
(function () {
  var tabs = document.querySelectorAll('.tab');
  var panels = document.querySelectorAll('.panel');

  /* Thumbnails are full iframe documents — each pulls in the shared kit and
     builds SVG, so creating one is expensive. Defer it: a panel's iframes
     only get a src the first time that panel is shown, not on page load.
     This keeps the initial landing render from spinning up every hidden
     figure preview at once. Pure DOM — works over file://. */
  function hydratePanel(panel) {
    if (!panel) return;
    panel.querySelectorAll('iframe[data-src]').forEach(function (frame) {
      frame.src = frame.getAttribute('data-src');
      frame.removeAttribute('data-src');
    });
  }

  function activate(name) {
    tabs.forEach(function (b) {
      var on = b.getAttribute('data-tab') === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.forEach(function (p) {
      var on = p.getAttribute('data-panel') === name;
      p.classList.toggle('is-active', on);
      if (on) hydratePanel(p);
    });
  }

  function hasTab(name) {
    return [].some.call(tabs, function (b) { return b.getAttribute('data-tab') === name; });
  }

  var STORE_KEY = 'landing-tab';
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var name = btn.getAttribute('data-tab');
      activate(name);
      /* Remember the choice so returning here (Back from an opened deck or
         figure, or a live-reload) restores the same tab instead of snapping
         back to Decks. */
      try { sessionStorage.setItem(STORE_KEY, name); } catch (_) {}
    });
  });

  /* Restore the saved tab on load; fall back to the markup default (Decks).
     This also hydrates that panel's thumbnail iframes. */
  var saved;
  try { saved = sessionStorage.getItem(STORE_KEY); } catch (_) {}
  activate(hasTab(saved) ? saved : 'decks');

  /* Once a card's thumbnail iframe loads, enrich its title + meta line from
     the iframe document's global (DeckMeta / FigureMeta). Same shape for
     both panels; only the global, the meta element, and the text format
     differ. */
  function wireMeta(panel, globalName, metaSel, format) {
    document.querySelectorAll('[data-panel="' + panel + '"] .card').forEach(function (card) {
      var iframe = card.querySelector('iframe');
      var title = card.querySelector('h3');
      var metaText = card.querySelector(metaSel);
      var baseText = metaText ? metaText.textContent : '';
      iframe.addEventListener('load', function () {
        try {
          var meta = iframe.contentWindow && iframe.contentWindow[globalName];
          if (!meta) return;
          if (meta.title) title.textContent = meta.title;
          if (metaText) metaText.textContent = format(meta, baseText);
        } catch (_) {}
      });
    });
  }

  wireMeta('decks', 'DeckMeta', '[data-deck-meta]', function (m, base) {
    return base + ' · ' + m.slideLabel;
  });
  wireMeta('figures', 'FigureMeta', '[data-figure-meta]', function (m) {
    return 'Publication figure · ' + m.sizeLabel;
  });
})();
