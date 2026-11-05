/* Deck: shared Reveal renderer, thumbnail/print support, and inline editor. */
(function () {
  /* Values a deck maintainer might reasonably tune. */
  const DEFAULTS = {
    reveal: {
      width: 960,
      height: 540,
      transition: 'fade',
    },
    chromeLabels: {
      edit: 'Edit',
      done: 'Done',
      exportPDF: 'Export PDF',
    },
  };

  const SLIDES_START_MARK = '/* === SLIDES:START';
  const SLIDES_END_MARK = '/* === SLIDES:END === */';
  const PRINT_DELAY_MS = 800, FULLSCREEN_REFRESH_DELAYS_MS = [80, 360, 720];
  const HANDLE_DB = 'deck-editor', HANDLE_STORE = 'kv';

  const Deck = {
    config: { logo: null, total: 0 },
    mount: mount,
    editAttr: editAttr,
    caption: caption,
  };
  window.Deck = Deck;

  // The attribute that makes an element editable at `path`, or nothing without one.
  function editAttr(path) {
    return path ? ' data-edit="' + path + '"' : '';
  }

  // The optional label under a visual: the name of a face, the title of a mark. It
  // rides on the block, so a label cannot drift from its picture when a row is reordered.
  function caption(block, path) {
    if (block.caption == null) return '';
    return '<p class="deck-caption"' + editAttr(path && path + '/caption') + '>' + block.caption + '</p>';
  }

  function exportPDF() {
    window.open(location.pathname + '?print-pdf');
  }

  // Publish deck title + slide count for the landing-page card, mirroring
  // Figure.mount's window.FigureMeta. Title comes from the first slide that
  // carries one (the hero), falling back to the document <title>.
  function metadata(ctx) {
    const titled = ctx.slides.find(s => s && s.title);
    const count = ctx.slides.length;
    return {
      kind: 'deck',
      title: (titled && titled.title) || document.title,
      slideCount: count,
      slideLabel: count + (count === 1 ? ' slide' : ' slides'),
    };
  }

  function mount(opts) {
    const ctx = createContext(opts || {});
    Deck.config.logo = ctx.logo;
    // Drives `.logo-corner`'s height (see deck.css). Set only when the deck asks
    // for it, so the CSS fallback stays the one place the default lives. Runs
    // after createContext so the inline style never lands in the editor's
    // `originalHTML` baseline.
    if (ctx.logoHeight) {
      document.documentElement.style.setProperty('--logo-height', ctx.logoHeight + 'px');
    }
    Deck.config.total = ctx.slides.length;
    // Templates that read across slides rather than only their own — `toc`
    // dividers inherit the deck's section list from the one slide that carries
    // it — resolve it through here, the same channel as `logo` and `total`.
    Deck.config.slides = ctx.slides;
    window.DeckMeta = metadata(ctx);   // set before the thumb branch so the landing-page card can read it
    // Formulas can only be drawn once MathJax has started, so rendering waits for it.
    (window.Tex ? Tex.ready : Promise.resolve()).then(() => {
      if (!ctx.isThumb) initChrome();
      if (!ctx.isThumb) applyLocalEdits(ctx);
      initMediaFallback();
      renderSlides(ctx);
      initReveal(ctx);
      if (!ctx.isThumb) initPresentationMode();
      if (ctx.isPrintPDF) initPrintMode();
      if (!ctx.isThumb) initEditor(ctx);
    });
  }

  // The page for the editor to save: without the font config.js sets on <html>
  // or the menu styles MathJax adds to <head> while the page loads.
  function authoredHTML() {
    const page = document.documentElement.cloneNode(true);
    page.style.removeProperty('--f-figure');
    if (!page.getAttribute('style')) page.removeAttribute('style');
    page.querySelectorAll('head > style').forEach(style => {
      if (style.textContent.startsWith('.CtxtMenu_')) style.remove();
    });
    return '<!DOCTYPE html>\n' + page.outerHTML;
  }

  function createContext(opts) {
    if (!opts.slides || !opts.templates || !opts.logo) {
      throw new Error('Deck.mount needs { slides, templates, logo }');
    }
    const storageKey = opts.storageKey || location.pathname;
    return {
      slides: opts.slides,
      templates: opts.templates,
      logo: opts.logo,
      logoHeight: opts.logoHeight || null,   // points; falls back to deck.css's --s8
      originalHTML: authoredHTML(),
      draftKey: 'deck-draft:' + storageKey + ':v1',
      draftRestored: false,
      handleKey: 'fileHandle:' + storageKey,
      isPrintPDF: window.location.search.indexOf('print-pdf') !== -1,
      isThumb: new URLSearchParams(location.search).has('thumb'),
    };
  }

  // Swaps a slide's picture or clip that fails to load for a stand-in. Media `error`
  // events do not bubble, so this listens in the capture phase. The corner logo is
  // decorative and is left alone.
  function initMediaFallback() {
    document.addEventListener('error', event => {
      if (event.target.matches?.('.reveal video, .reveal img:not(.logo-corner)')) {
        showMissingMedia(event.target);
      }
    }, true);
  }

  // The stand-in keeps the failed element's classes and style, so its size rules apply.
  function showMissingMedia(media) {
    const label = media.getAttribute('alt') || media.getAttribute('aria-label') || '';
    const missing = document.createElement('div');
    missing.className = media.className + ' deck-media-missing';
    missing.style.cssText = media.style.cssText;
    missing.setAttribute('role', 'img');
    missing.setAttribute('aria-label', label);
    missing.innerHTML = Icons.svg('media-missing');
    if (label) {
      const text = document.createElement('p');
      text.className = 'deck-caption';
      text.textContent = label;
      missing.appendChild(text);
    }
    media.replaceWith(missing);
  }

  function renderSlides(ctx) {
    const root = document.getElementById('slides-root');
    ctx.slides.forEach((slide, i) => {
      const section = document.createElement('section');
      section.setAttribute('data-transition', 'fade');
      section.innerHTML = ctx.templates[slide.layout](slide, i);
      root.appendChild(section);
    });
    if (window.Tex) editableElements().forEach(el => Tex.typeset(el));
  }

  function initReveal(ctx) {
    const revealDefaults = Object.assign({
      margin: 0,
      minScale: 0.1,
      maxScale: 2.0,
      controls: true,
      controlsTutorial: false,
      progress: true,
      hash: true,
      center: false,
      transitionSpeed: 'default',
      pdfSeparateFragments: false,
    }, DEFAULTS.reveal);
    const thumbOverrides = ctx.isThumb
      ? { controls: false, progress: false, keyboard: false, hash: false, fragments: false, transition: 'none' }
      : {};
    Reveal.initialize(Object.assign({}, revealDefaults, thumbOverrides));
  }

  function initChrome() {
    const labels = DEFAULTS.chromeLabels;
    document.body.insertAdjacentHTML('beforeend',
      '<div id="deck-chrome" class="chrome">' +
        '<span id="edit-status" class="chrome-status"></span>' +
        '<button id="edit-toggle">' + labels.edit + '</button>' +
        '<button id="export-btn">' + labels.exportPDF + '</button>' +
      '</div>');
    document.getElementById('export-btn').addEventListener('click', exportPDF);
  }

  function initPresentationMode() {
    injectLaserPointer();

    // Fullscreen can promote Reveal's scaled slide layer before SVG text is
    // repainted at the final size. Re-layout, force cheap text measurements,
    // and repaint static SVG text so stale glyph rasters don't survive until
    // the cursor moves.
    let fullscreenRefreshId = 0;
    const refreshFullscreenLayout = () => {
      const refreshId = ++fullscreenRefreshId;
      const isCurrent = () => refreshId === fullscreenRefreshId;
      const refresh = () => {
        if (!isCurrent()) return;
        if (window.Reveal && Reveal.sync) Reveal.sync();
        if (window.Reveal && Reveal.layout) Reveal.layout();
        refreshSvgText(isFullscreen());
      };
      const queue = () => {
        requestAnimationFrame(() => {
          refresh();
          requestAnimationFrame(refresh);
        });
      };

      refresh();
      queue();
      FULLSCREEN_REFRESH_DELAYS_MS.forEach(delay => setTimeout(queue, delay));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
    };

    // Reveal starts a clip once any fragment around it shows, and re-enabling
    // fragments hides them without pausing a clip already playing. Hold a clip
    // until every fragment around it shows; Reveal then plays it from 0.
    const holdHidden = video => {
      if (video.closest('.fragment:not(.visible)')) video.pause();
    };
    document.addEventListener('play', e => holdHidden(e.target), true);
    // A clip in an `enter: "none"` group plays only while its press is the
    // current one; stepping back onto it makes Reveal play it from 0 again.
    const pausePassedClips = () => {
      document.querySelectorAll('.reveal .deck-block-group-enter-none:not(.current-fragment) video')
        .forEach(video => video.pause());
    };
    Reveal.addEventListener('fragmentshown', pausePassedClips);
    Reveal.addEventListener('fragmenthidden', pausePassedClips);

    const syncFragments = () => {
      const fs = isFullscreen();
      Reveal.configure({ fragments: fs });
      if (fs) {
        const i = Reveal.getIndices();
        Reveal.slide(i.h, i.v, -1);
        document.querySelectorAll('.reveal video').forEach(holdHidden);
      }
      refreshFullscreenLayout();
    };
    Reveal.addEventListener('ready', syncFragments);
    document.addEventListener('fullscreenchange', syncFragments);
    document.addEventListener('webkitfullscreenchange', syncFragments);
    window.addEventListener('resize', refreshFullscreenLayout);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', refreshFullscreenLayout);
  }

  function injectLaserPointer() {
    document.body.insertAdjacentHTML('beforeend', '<div id="laser-pointer" aria-hidden="true"></div>');
    const pointer = document.getElementById('laser-pointer');
    const syncParent = () => {
      const parent = document.fullscreenElement || document.webkitFullscreenElement || document.body;
      if (pointer.parentNode !== parent) parent.appendChild(pointer);
    };
    document.addEventListener('pointermove', (event) => {
      pointer.style.left = event.clientX + 'px';
      pointer.style.top = event.clientY + 'px';
    });
    document.addEventListener('fullscreenchange', syncParent);
    document.addEventListener('webkitfullscreenchange', syncParent);
  }

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function svgTextElements() {
    return Array.prototype.filter.call(document.querySelectorAll('svg'), svg => svg.querySelector('text'));
  }

  function refreshSvgText(repaint) {
    svgTextElements().forEach(svg => {
      svg.getBoundingClientRect();
      svg.querySelectorAll('text').forEach(text => text.getBoundingClientRect());
      if (!repaint) return;
      const clone = svg.cloneNode(true);
      svg.replaceWith(clone);
      clone.getBoundingClientRect();
    });
  }

  function initPrintMode() {
    Reveal.addEventListener('ready', () => {
      document.fonts.ready.then(() => setTimeout(() => window.print(), PRINT_DELAY_MS));
    });
  }

  function applyLocalEdits(ctx) {
    try {
      const raw = localStorage.getItem(ctx.draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft || !Array.isArray(draft.slides)) return;
      if (draft.version !== 2) {
        localStorage.removeItem(ctx.draftKey);
        return;
      }
      if (JSON.stringify(draft.slides) === JSON.stringify(ctx.slides)) {
        localStorage.removeItem(ctx.draftKey);
        return;
      }
      draft.slides.forEach((slide, i) => { if (ctx.slides[i]) ctx.slides[i] = slide; });
      ctx.draftRestored = true;
    } catch (e) {
      console.warn('Local edits restore failed', e);
    }
  }

  function buildUpdatedHTML(ctx) {
    const source = ctx.originalHTML;
    const startIdx = source.indexOf(SLIDES_START_MARK);
    const endIdx = source.indexOf(SLIDES_END_MARK);
    if (startIdx === -1 || endIdx === -1) {
      throw new Error('SLIDES:START / SLIDES:END markers not found in the page source');
    }
    const afterStartLine = source.indexOf('\n', startIdx) + 1;
    const block = 'const SLIDES = ' + JSON.stringify(ctx.slides, null, 2) + ';\n';
    return source.slice(0, afterStartLine) + block + source.slice(endIdx);
  }

  function initEditor(ctx) {
    const toggle = document.getElementById('edit-toggle');
    const status = document.getElementById('edit-status');
    const supportsFS = ('showOpenFilePicker' in window);
    const labels = DEFAULTS.chromeLabels;
    const handleStore = supportsFS ? createFileHandleStore(ctx.handleKey) : null;
    let editing = false;
    let dirty = false;
    let fileHandle = null;
    const setStatus = msg => { status.textContent = msg; };
    const stopRevealKeys = e => e.stopPropagation();

    function onInput(e) {
      const el = e.currentTarget;
      setByPath(ctx.slides, el.getAttribute('data-edit'), el.innerHTML);
      dirty = true;
      persistDraft();
    }

    function syncEditable(enabled) {
      const listener = enabled ? 'addEventListener' : 'removeEventListener';
      editableElements().forEach(el => {
        // Editing shows each formula's $source$; leaving edit mode draws it again.
        if (window.Tex) { if (enabled) Tex.untypeset(el); else Tex.typeset(el); }
        if (enabled) el.setAttribute('contenteditable', 'true');
        else el.removeAttribute('contenteditable');
        el[listener]('input', onInput);
        el[listener]('keydown', stopRevealKeys);
      });
    }

    function enable() {
      editing = true;
      document.body.classList.add('editing');
      toggle.textContent = labels.done;
      syncEditable(true);
      Reveal.configure({ keyboard: false });
      setStatus(window.DEV_SERVER || supportsFS
        ? 'Click any text to edit. Press Done to save to the deck file.'
        : "Click any text to edit. Press Done to download an updated .html (this browser can't write files directly).");
    }

    function disable() {
      editing = false;
      document.body.classList.remove('editing');
      toggle.textContent = labels.edit;
      syncEditable(false);
      Reveal.configure({ keyboard: true });
    }

    function persistDraft() {
      try {
        localStorage.setItem(ctx.draftKey, JSON.stringify({ version: 2, savedAt: new Date().toISOString(), slides: ctx.slides }));
      } catch (e) {}
    }

    function clearDraft() { try { localStorage.removeItem(ctx.draftKey); } catch (e) {} }

    async function getHandle() {
      if (fileHandle) return fileHandle;
      try { fileHandle = await handleStore.get(); } catch (e) {}
      if (!fileHandle) {
        [fileHandle] = await window.showOpenFilePicker({
          id: 'deck-index-html',
          types: [{ description: 'HTML', accept: { 'text/html': ['.html', '.htm'] } }],
        });
        try { await handleStore.put(fileHandle); } catch (e) {}
      }
      return fileHandle;
    }

    async function ensureWritable(handle) {
      const opts = { mode: 'readwrite' };
      if ((await handle.queryPermission(opts)) === 'granted') return true;
      return (await handle.requestPermission(opts)) === 'granted';
    }

    function downloadUpdated() {
      const blob = new Blob([buildUpdatedHTML(ctx)], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    }

    async function save() {
      setStatus('Saving...');
      try {
        const updated = buildUpdatedHTML(ctx);
        // Only reached on the dev server, so file:// never calls fetch.
        if (window.DEV_SERVER) {
          const response = await fetch(location.pathname, { method: 'PUT', body: updated });
          if (!response.ok) throw new Error('the dev server answered ' + response.status);
          dirty = false;
          clearDraft();
          setStatus('Saved at ' + new Date().toLocaleTimeString() + '. Commit & push to publish.');
          return true;
        }
        if (!supportsFS) {
          downloadUpdated();
          dirty = false;
          clearDraft();
          setStatus('Downloaded index.html — replace the file in your repo, then push.');
          return true;
        }
        const handle = await getHandle();
        if (!(await ensureWritable(handle))) {
          setStatus('Write permission denied — press Done again to retry.');
          return false;
        }
        let writable;
        try {
          writable = await handle.createWritable();
        } catch (e) {
          fileHandle = null;
          try { await handleStore.put(null); } catch (_) {}
          throw new Error("Couldn't open the saved file — press Done to pick it again.");
        }

        await writable.write(updated);
        await writable.close();
        dirty = false;
        clearDraft();
        setStatus('Saved to ' + handle.name + ' at ' + new Date().toLocaleTimeString() + '. Commit & push to publish.');
        return true;
      } catch (e) {
        if (e && e.name === 'AbortError') {
          setStatus('Save cancelled — your edits are still here.');
          return false;
        }
        console.error(e);
        setStatus('Save failed: ' + e.message);
        return false;
      }
    }

    if (supportsFS) handleStore.get().then(h => { if (h) fileHandle = h; }).catch(() => {});

    toggle.addEventListener('click', async () => {
      if (!editing) { enable(); return; }
      if (dirty) {
        toggle.disabled = true;
        const ok = await save();
        toggle.disabled = false;
        if (!ok) return;
      } else {
        setStatus('');
      }
      disable();
    });

    if (ctx.draftRestored) {
      dirty = true;
      setStatus('Showing edits saved in this browser. Press Edit, then Done to save.');
    }
  }

  function editableElements() {
    return document.querySelectorAll('[data-edit]');
  }

  function setByPath(obj, path, value) {
    const keys = path.split('/');
    const last = keys.pop();
    const target = keys.reduce((o, k) => o[k], obj);
    target[last] = value;
  }

  function createFileHandleStore(key) {
    function request(method, value) {
      return new Promise((resolve, reject) => {
        const open = indexedDB.open(HANDLE_DB, 1);
        open.onupgradeneeded = () => open.result.createObjectStore(HANDLE_STORE);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          try {
            const db = open.result;
            const txMode = method === 'get' ? 'readonly' : 'readwrite';
            const store = db.transaction(HANDLE_STORE, txMode).objectStore(HANDLE_STORE);
            const req = method === 'get' ? store.get(key) : store.put(value, key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          } catch (e) {
            reject(e);
          }
        };
      });
    }

    return {
      get: () => request('get'),
      put: value => request('put', value),
    };
  }

})();
