/* Landing page: tab toggle, deferred thumbnails, and card titles each
   thumbnail posts to this page. Load at the end of <body>;
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

  /* Each thumbnail posts its metadata to this page once it has mounted; the
     card whose iframe sent it takes the title and meta line from it.
     postMessage, not iframe.contentWindow, because file:// gives every
     document its own origin. */
  var FORMAT = {
    deck: function (m, base) { return base + ' · ' + m.slideLabel; },
    figure: function (m) { return 'Publication figure · ' + m.sizeLabel; }
  };

  window.addEventListener('message', function (e) {
    var meta = e.data && e.data.landingMeta;
    if (!meta || !FORMAT[meta.kind]) return;
    document.querySelectorAll('.card').forEach(function (card) {
      var iframe = card.querySelector('iframe');
      if (!iframe || iframe.contentWindow !== e.source) return;
      var metaText = card.querySelector('[data-deck-meta], [data-figure-meta]');
      if (meta.title) card.querySelector('h3').textContent = meta.title;
      if (metaText) metaText.textContent = FORMAT[meta.kind](meta, metaText.textContent);
    });
  });
})();
