/* Figure import — the `figure` block: a whole figure module on a slide. Exposes
   window.FigureImport. A module with `steps` steps on Reveal fragments, one press per
   state. One with `autoplay` (ms per frame) and `holds` (frames where it waits)
   plays: fragments release holds, a timer walks between them. `maxHeight` caps the
   import via the width the deck's import rule sizes by. */
(function () {
  /* The figure module a stage names, or null if it was never loaded. */
  function moduleFor(name) {
    return (name && window[name]) || null;
  }

  /* Frame interval for a played module, or 0 for one that steps. */
  function autoplayMs(mod) {
    return mod && mod.autoplay > 0 ? mod.autoplay : 0;
  }

  /* The width implied by `maxHeight` (via the module's aspect ratio), or null
     if it is not set. */
  function capWidth(block, mod) {
    return block.maxHeight && mod.width && mod.height
      ? block.maxHeight * mod.width / mod.height
      : null;
  }

  /* Slide markup: the host the SVG is drawn into, plus one zero-size fragment
     per forward press. Stepping, that is one per state beyond the initial one
     (n states = n-1 presses); playing, it is one per hold to release. */
  function render(block, opts) {
    var name = (block && block.module) || '';
    var mod = moduleFor(name);
    if (!mod) {
      throw new Error('figure block requires the figure module '
        + (name || '(none named)') + ' to be loaded');
    }
    var presses = autoplayMs(mod)
      ? (mod.holds || []).length
      : (mod.steps || 1) - 1;
    var marks = '';
    for (var i = 0; i < presses; i++) {
      marks += '<span class="fragment deck-fragment-marker figure-import-step" aria-hidden="true"></span>';
    }
    var w = capWidth(block, mod);
    var style = w ? ' style="--figure-import-max-width:' + w + 'px"' : '';
    return '<div class="figure-import" data-module="' + name + '"' + style + '>'
      +    '<div class="figure-import-host"></div>'
      +    marks
      +  '</div>';
  }

  /* Draw one stage. Re-rendering outright keeps the step state in exactly one
     place — the DOM's visible markers — and these figures are small enough that
     rebuilding costs less than tracking per-element visibility. */
  function draw(stage, step) {
    if (String(step) === stage.getAttribute('data-step')) return;
    var mod = moduleFor(stage.getAttribute('data-module'));
    if (!mod) return;
    var fig = window.Figure.create(mod.width, mod.height,
      { className: mod.className, ariaLabel: mod.ariaLabel });
    mod.draw(fig, step);
    stage.querySelector('.figure-import-host').innerHTML = fig.render();
    stage.setAttribute('data-step', step);
  }

  /* Fragments only animate in fullscreen (see deck.js); with them off Reveal
     reports none visible, so fall back to the final, fully built state. */
  function fragmentsOff() {
    var cfg = window.Reveal.getConfig();
    return !!(cfg && cfg.fragments === false);
  }

  /* The frame a stage should be showing, or — when it plays — heading toward.
     Stepping maps one fragment to one state; playing maps one fragment to one
     hold, and the timer walks the frames in between. */
  function targetStep(stage, mod) {
    var last = (mod.steps || 1) - 1;
    if (fragmentsOff()) return last;
    var shown = stage.querySelectorAll('.figure-import-step.visible').length;
    if (!autoplayMs(mod)) return Math.min(shown, last);
    var holds = mod.holds || [];
    return shown < holds.length ? holds[shown] : last;
  }

  /* Walk toward the target frame, one frame per `ms`. The target is re-read
     every tick, so a fragment arriving mid-flight just extends the run and
     stepping backwards lands immediately instead of rewinding word by word.
     One loop per stage, which ends itself as soon as it has arrived. */
  function play(stage, mod, ms) {
    if (stage.autoplaying) return;
    stage.autoplaying = true;
    var due = 0;
    function tick(now) {
      var current = Number(stage.getAttribute('data-step') || 0);
      var target = targetStep(stage, mod);
      if (target < current) draw(stage, target);          // stepped back: land at once
      if (target <= current) { stage.autoplaying = false; return; }
      if (!due) due = now + ms;
      if (now >= due) { due = now + ms; draw(stage, current + 1); }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* A module that draws rasters declares them in `images`, and they must be
     resolved before draw() can ask their size. One preload per image set, shared
     by every stage using it; `DONE` is what gates drawing, since the promise
     exists from the moment the first stage asks for it. */
  var PENDING = {}, DONE = {};
  function imagesKey(mod) {
    return mod.images && mod.images.length ? mod.images.join('|') : null;
  }

  function update(stage) {
    var mod = moduleFor(stage.getAttribute('data-module'));
    if (!mod) return;
    var key = imagesKey(mod);
    if (key && !DONE[key]) {
      if (!PENDING[key]) {
        PENDING[key] = window.Figure.preload(mod.images).then(function () { DONE[key] = true; });
      }
      PENDING[key].then(function () { update(stage); });
      return;
    }
    var ms = autoplayMs(mod);
    /* Nothing animates with fragments off — a normal tab, ?thumb, and
       ?print-pdf all want the finished state, not a frame of the way there. */
    if (!ms || fragmentsOff()) return draw(stage, targetStep(stage, mod));
    if (!stage.hasAttribute('data-step')) draw(stage, 0);   // first paint
    play(stage, mod, ms);
  }

  function updateAll() {
    var stages = document.querySelectorAll('.figure-import');
    for (var i = 0; i < stages.length; i++) update(stages[i]);
  }

  function onFragment(e) {
    if (e.fragment && e.fragment.classList.contains('figure-import-step')) updateAll();
  }

  if (window.Reveal) {
    /* Deck turns fragments off outside fullscreen from its own 'ready' handler,
       which is registered after this one; defer so the first draw reads the
       settled config and lands on the final frame instead of frame 0. Without
       it a ?print-pdf page, which never fires slidechanged, prints frame 0. */
    window.Reveal.addEventListener('ready', function () { setTimeout(updateAll, 0); });
    window.Reveal.addEventListener('fragmentshown', onFragment);
    window.Reveal.addEventListener('fragmenthidden', onFragment);
    window.Reveal.addEventListener('slidechanged', updateAll);
    /* Entering fullscreen re-enables fragments, which resets the current slide
       to its first state; redraw once the class changes have landed. */
    document.addEventListener('fullscreenchange', function () { setTimeout(updateAll, 0); });
    document.addEventListener('webkitfullscreenchange', function () { setTimeout(updateAll, 0); });
  }

  window.FigureImport = { render: render };
})();
