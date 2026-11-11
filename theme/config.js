/* Core settings (JS), the counterpart of theme.css: the figure font and per-role type
   scale, which the figure kit needs as values to measure text. The same in every
   project; no brand overrides them. Exposes window.Config. Loaded before the kits. */
(function () {
  var Config = {
    figure: {
      /* Standard, embed-free font so figures look identical everywhere:
         Helvetica is a base-14 PDF font and Arial is metric-compatible. */
      font: 'Arial, Helvetica, "Liberation Sans", sans-serif',

      /* Figure text by role: point size + weight + style. A figure made for slides
         uses `slideBody` and `slideDetail`: at the 1.5x import they read 15.9 and
         12 pt, the slide's --t-base and --t-sm. The other roles are for publication
         figures, where `body` (8 pt) is the default and `fine` small detail.
         fig.text({ role }) reads these; .fig-<role> in figure.css adds only colour. */
      type: {
        label:       { size: 10, weight: 400, style: 'normal' },
        title:       { size: 10, weight: 700, style: 'normal' },
        subtitle:    { size: 10, weight: 400, style: 'italic' },
        slideBody:   { size: 10.6, weight: 400, style: 'normal' },
        slideDetail: { size: 8,  weight: 400, style: 'normal' },
        body:        { size: 8,  weight: 400, style: 'normal' },
        legend:      { size: 6,  weight: 400, style: 'normal' },
        fine:        { size: 6,  weight: 400, style: 'normal' }
      }
    }
  };

  /* Publish the figure font to CSS as a single source of truth, so figure.css
     (var(--f-figure)) and figure.js (text measuring) can't drift apart. */
  if (document.documentElement) {
    document.documentElement.style.setProperty('--f-figure', Config.figure.font);
  }

  window.Config = Config;
})();
