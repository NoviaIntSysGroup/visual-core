/* Shared inline SVG icon geometry. Each icon is drawn in a ~0 0 100 100 box and
   records `box: [x, y, w, h]`, stroke included (see tools/icon-metrics.js); place()
   scales its longer side to FIT and centres it. Stroke widths are theme-absolute
   unless `fixedStroke: false`. flat-icons.js and a project's own extensions extend this registry. */
(function () {
  /* Span of the longer icon side inside the 100-unit placement box. 84 leaves 8
     units of clear space on every side, so no icon touches its node frame. */
  var FIT = 84;

  var ICONS = {
    person: {
      box: [20, 16, 60, 68],
      svg: ''
        + '<g class="icon-person">'
        +   '<circle cx="50" cy="32" r="16"/>'
        +   '<path d="M20 84 C20 43 80 43 80 84 Z"/>'
        + '</g>'
    },

    /* The box is the full ink, antenna included, so the robot's visual mass sits
       centred beside other icons. */
    robot: {
      box: [6, -0.5, 88, 80.5],
      svg: ''
        + '<g class="icon-robot">'
        +   '<line class="icon-robot-ant" x1="50" y1="4" x2="50" y2="17"/>'
        +   '<circle class="icon-robot-accent" cx="50" cy="4" r="4.5"/>'
        +   '<rect class="icon-robot-accent" x="6" y="40" width="8" height="18" rx="4"/>'
        +   '<rect class="icon-robot-accent" x="86" y="40" width="8" height="18" rx="4"/>'
        +   '<rect class="icon-robot-head" x="16" y="16" width="68" height="64" rx="24"/>'
        +   '<rect class="icon-robot-screen" x="26" y="30" width="48" height="40" rx="14"/>'
        +   '<circle class="icon-robot-face" cx="40" cy="47" r="5"/>'
        +   '<circle class="icon-robot-face" cx="60" cy="47" r="5"/>'
        +   '<path class="icon-robot-mouth" d="M40 58 Q50 65 60 58"/>'
        + '</g>'
    },

    globe: {
      box: [14, 14, 72, 72],
      svg: ''
        + '<g class="icon-line icon-round">'
        +   '<circle cx="50" cy="50" r="33"/>'
        +   '<ellipse cx="50" cy="50" rx="14" ry="33"/>'
        +   '<line x1="17" y1="50" x2="83" y2="50"/>'
        +   '<path d="M23 33 Q50 46 77 33"/>'
        +   '<path d="M23 67 Q50 54 77 67"/>'
        + '</g>'
    },

    doc: {
      box: [27, 9, 50, 82],
      svg: ''
        + '<g class="icon-round icon-join">'
        +   '<path class="icon-card" d="M30 12 H58 L74 28 V88 H30 Z"/>'
        +   '<path class="icon-line" d="M58 12 V28 H74"/>'
        +   '<line class="icon-line" x1="40" y1="46" x2="64" y2="46"/>'
        +   '<line class="icon-line" x1="40" y1="58" x2="64" y2="58"/>'
        +   '<line class="icon-line" x1="40" y1="70" x2="56" y2="70"/>'
        + '</g>'
    },

    code: {
      box: [8, 19, 84, 65],
      svg: ''
        + '<g class="icon-code">'
        +   '<rect class="icon-card" x="18" y="22" width="64" height="46" rx="7"/>'
        +   '<path class="icon-fill" d="M8 84 L18 68 H82 L92 84 Z"/>'
        +   '<g class="icon-line icon-round icon-join icon-line-thin">'
        +     '<path d="M45 38 L37 45 L45 52"/>'
        +     '<path d="M55 38 L63 45 L55 52"/>'
        +     '<line x1="52" y1="37" x2="48" y2="53"/>'
        +   '</g>'
        + '</g>'
    },

    calendar: {
      box: [15, 12, 70, 73],
      svg: ''
        + '<g class="icon-calendar">'
        +   '<rect class="icon-card" x="18" y="24" width="64" height="58" rx="7"/>'
        +   '<path class="icon-fill" d="M18 38 V31 Q18 24 25 24 H75 Q82 24 82 31 V38 Z"/>'
        +   '<line class="icon-line icon-round" x1="34" y1="15" x2="34" y2="28"/>'
        +   '<line class="icon-line icon-round" x1="66" y1="15" x2="66" y2="28"/>'
        +   '<g class="icon-fill">'
        +     '<circle cx="34" cy="56" r="4"/>'
        +     '<circle cx="50" cy="56" r="4"/>'
        +     '<circle cx="66" cy="56" r="4"/>'
        +     '<circle cx="34" cy="70" r="4"/>'
        +     '<circle cx="50" cy="70" r="4"/>'
        +   '</g>'
        + '</g>'
    },

    chat: {
      box: [9, 19, 82, 66],
      svg: ''
        + '<g class="icon-round icon-join">'
        +   '<path class="icon-line" d="M24 22 H76 Q88 22 88 34 V58 Q88 70 76 70 H44 L30 82 L32 70 H24 Q12 70 12 58 V34 Q12 22 24 22 Z"/>'
        +   '<g class="icon-fill">'
        +     '<circle cx="34" cy="46" r="5"/>'
        +     '<circle cx="50" cy="46" r="5"/>'
        +     '<circle cx="66" cy="46" r="5"/>'
        +   '</g>'
        + '</g>'
    },

    window: {
      box: [11, 17, 78, 66],
      svg: ''
        + '<g class="icon-round icon-join">'
        +   '<rect class="icon-card" x="14" y="20" width="72" height="60" rx="12"/>'
        +   '<line class="icon-line" x1="14" y1="40" x2="86" y2="40"/>'
        +   '<circle class="icon-fill" cx="26" cy="30" r="3.5"/>'
        +   '<circle class="icon-fill" cx="38" cy="30" r="3.5"/>'
        +   '<rect class="icon-fill" x="28" y="52" width="26" height="16" rx="8"/>'
        + '</g>'
    },

    search: {
      box: [17, 17, 68, 68],
      svg: ''
        + '<g class="icon-line icon-round icon-join">'
        +   '<circle cx="44" cy="44" r="24"/>'
        +   '<line x1="61" y1="61" x2="82" y2="82"/>'
        + '</g>'
    },

    graph: {
      box: [18, 18, 64, 60],
      svg: ''
        + '<g class="icon-round icon-join">'
        +   '<g class="icon-line">'
        +     '<line x1="28" y1="68" x2="72" y2="68"/>'
        +     '<line x1="28" y1="68" x2="50" y2="28"/>'
        +     '<line x1="72" y1="68" x2="50" y2="28"/>'
        +   '</g>'
        +   '<g class="icon-fill">'
        +     '<circle cx="50" cy="28" r="10"/>'
        +     '<circle cx="28" cy="68" r="10"/>'
        +     '<circle cx="72" cy="68" r="10"/>'
        +   '</g>'
        + '</g>'
    },

    check: {
      box: [23, 29, 54, 43],
      svg: ''
        + '<g class="icon-line icon-round icon-join">'
        +   '<path d="M26 52 L43 69 L74 32"/>'
        + '</g>'
    },

    /* A pair: `lock` is fixed, `unlock` swappable. They share body and keyhole, so
       the shackle is the only difference; the open one breaks off high above the
       body. Both record `unlock`'s taller box so the shared body renders at one size,
       which makes `lock` measure DIFF on purpose (see icon-metrics.js). */
    lock: {
      box: [19, 15, 62, 70],
      svg: ''
        + '<g class="icon-round icon-join">'
        +   '<path class="icon-line" d="M34 48 V34 Q34 20 50 20 Q66 20 66 34 V48"/>'
        +   '<rect class="icon-card" x="22" y="48" width="56" height="34" rx="7"/>'
        +   '<circle class="icon-fill" cx="50" cy="65" r="5"/>'
        + '</g>'
    },

    unlock: {
      box: [19, 15, 62, 70],
      svg: ''
        + '<g class="icon-round icon-join">'
        +   '<path class="icon-line" d="M34 48 V32 Q34 18 50 18 Q58 18 62 21.5"/>'
        +   '<rect class="icon-card" x="22" y="48" width="56" height="34" rx="7"/>'
        +   '<circle class="icon-fill" cx="50" cy="65" r="5"/>'
        + '</g>'
    },

    /* Artificial neural network: a 2 → 3 → 2 MLP, fully connected. The
       "learned, not coded" counterpart to the `code` icon. Wires stop at each
       node's ring (shortened by its radius) instead of running center-to-
       center, so an open node reads as a clean ring rather than a line
       drawn straight through it. */
    ann: {
      box: [8, 15, 84, 70],
      svg: ''
        + '<g class="icon-line icon-line-thin icon-round icon-join">'
        +   '<line x1="24.7" y1="32.9" x2="43.3" y2="27.1"/>'
        +   '<line x1="24.3" y1="38.0" x2="43.7" y2="47.0"/>'
        +   '<line x1="22.4" y1="40.5" x2="45.6" y2="69.5"/>'
        +   '<line x1="22.4" y1="59.5" x2="45.6" y2="30.5"/>'
        +   '<line x1="24.3" y1="62.0" x2="43.7" y2="53.0"/>'
        +   '<line x1="24.7" y1="67.1" x2="43.3" y2="72.9"/>'
        +   '<line x1="56.7" y1="27.1" x2="75.3" y2="32.9"/>'
        +   '<line x1="54.4" y1="30.5" x2="77.6" y2="59.5"/>'
        +   '<line x1="56.3" y1="47.0" x2="75.7" y2="38.0"/>'
        +   '<line x1="56.3" y1="53.0" x2="75.7" y2="62.0"/>'
        +   '<line x1="54.4" y1="69.5" x2="77.6" y2="40.5"/>'
        +   '<line x1="56.7" y1="72.9" x2="75.3" y2="67.1"/>'
        + '</g>'
        + '<g class="icon-line icon-round">'
        +   '<circle cx="18" cy="35" r="7"/><circle cx="18" cy="65" r="7"/>'
        +   '<circle cx="50" cy="25" r="7"/><circle cx="50" cy="50" r="7"/><circle cx="50" cy="75" r="7"/>'
        +   '<circle cx="82" cy="35" r="7"/><circle cx="82" cy="65" r="7"/>'
        + '</g>'
    },

    /* Toolbox: a carry handle over a latched case — denotes resources. The
       case is an outline, not a filled card: a tint that recolours the
       stroke but not the fill (the image block's flat white-on-wash icons) would
       otherwise paint the latch the same white as the case body and erase
       it. */
    toolbox: {
      box: [7, 10, 86, 78],
      svg: ''
        + '<g class="icon-round icon-join">'
        +   '<path class="icon-line" d="M35 39 V23 Q35 13 50 13 Q65 13 65 23 V39"/>'
        +   '<rect class="icon-line" x="10" y="39" width="80" height="46" rx="8"/>'
        +   '<line class="icon-line" x1="10" y1="54" x2="90" y2="54"/>'
        +   '<rect class="icon-fill" x="42" y="47" width="16" height="14" rx="3"/>'
        + '</g>'
    },

    key: {
      box: [7, 31, 84, 38],
      svg: ''
        + '<g class="icon-line icon-round icon-join">'
        +   '<circle cx="26" cy="50" r="16"/>'
        +   '<line x1="42" y1="50" x2="88" y2="50"/>'
        +   '<line x1="70" y1="50" x2="70" y2="62"/>'
        +   '<line x1="82" y1="50" x2="82" y2="58"/>'
        + '</g>'
    },

    /* Chip: a hollow package outline (not a filled card — see toolbox's
       comment on why) plus 8 pins — the contour and legs are enough to read
       as a chip on their own. */
    chip: {
      box: [15, 15, 70, 70],
      svg: ''
        + '<g class="icon-round icon-join">'
        +   '<rect class="icon-line" x="26" y="26" width="48" height="48" rx="7"/>'
        +   '<g class="icon-line">'
        +     '<line x1="38" y1="26" x2="38" y2="18"/><line x1="62" y1="26" x2="62" y2="18"/>'
        +     '<line x1="38" y1="74" x2="38" y2="82"/><line x1="62" y1="74" x2="62" y2="82"/>'
        +     '<line x1="26" y1="38" x2="18" y2="38"/><line x1="26" y1="62" x2="18" y2="62"/>'
        +     '<line x1="74" y1="38" x2="82" y2="38"/><line x1="74" y1="62" x2="82" y2="62"/>'
        +   '</g>'
        + '</g>'
    },

    /* Horseshoe magnet: a solid band traced as one path (outer and inner arcs wound
       opposite ways, so the nonzero rule cuts the channel), with outline-only pole
       caps. The bend is a true semicircle. The opening faces left. */
    magnet: {
      box: [17, 23, 71, 54],
      svg: ''
        + '<path class="icon-fill" d="M26 26 L64 26 C77.25 26 88 36.75 88 50'
        +   ' C88 63.25 77.25 74 64 74 L26 74 L26 62 L64 62'
        +   ' C70.63 62 76 56.63 76 50 C76 43.37 70.63 38 64 38 L26 38 Z"/>'
        + '<g class="icon-line">'
        +   '<rect x="20" y="26" width="6" height="12"/>'
        +   '<rect x="20" y="62" width="6" height="12"/>'
        + '</g>'
    },

    /* Compass: the needle sits ~60 deg off north, baked in. Its halves share one
       stroked diamond with a fill over the north half, so both halves are the same
       size. The "N" sits inside the ring, clear of its inner edge. */
    compass: {
      box: [7, 7, 86, 86],
      svg: ''
        + '<g class="icon-line icon-round">'
        +   '<circle cx="50" cy="50" r="40"/>'
        + '</g>'
        + '<g class="icon-line icon-line-thin icon-round icon-join">'
        +   '<path d="M45 32 L45 22 L55 32 L55 22"/>'
        + '</g>'
        + '<g transform="rotate(60 50 50)">'
        +   '<path class="icon-fill" d="M50 18 L54 50 L46 50 Z"/>'
        +   '<path class="icon-line icon-round icon-join" d="M50 18 L54 50 L50 82 L46 50 Z"/>'
        + '</g>'
        + '<circle class="icon-fill" cx="50" cy="50" r="4"/>'
    },

    /* Ship in side view: a solid hull under a two-tier superstructure and a
       funnel, riding on one wave line. The hull is filled so the mark keeps its
       weight at small placement sizes. */
    ship: {
      box: [2.5, 24, 95, 69],
      svg: ''
        + '<g class="icon-round icon-join">'
        +   '<rect class="icon-fill" x="62" y="24" width="10" height="18" rx="2"/>'
        +   '<rect class="icon-card" x="26" y="42" width="48" height="16" rx="3"/>'
        +   '<rect class="icon-card" x="34" y="30" width="24" height="12" rx="3"/>'
        +   '<path class="icon-fill" d="M8 58 H92 L82 78 H20 Z"/>'
        +   '<path class="icon-line icon-line-thin" d="M5 88 Q14 83 23 88 T41 88 T59 88 T77 88 T95 88"/>'
        + '</g>'
    },

    /* A struck-through picture frame: the stand-in for a picture or clip that could
       not load. Placed alone at any size, so its stroke scales with it. */
    'media-missing': {
      box: [9, 11, 82, 78],
      fixedStroke: false,
      svg: ''
        + '<g class="icon-round icon-join">'
        +   '<rect class="icon-card" x="14" y="20" width="72" height="60" rx="10"/>'
        +   '<circle class="icon-fill" cx="34" cy="38" r="6"/>'
        +   '<path class="icon-line icon-line-thin" d="M14 72 L38 52 L52 64 L64 54 L86 72"/>'
        +   '<line class="icon-line" x1="12" y1="86" x2="88" y2="14"/>'
        + '</g>'
    }
  };

  /* '-flat' variants: same geometry, proportional stroke instead of pinned —
     for a large standalone placement (an image slot) rather than a member
     of a diagram's sized-for-hierarchy icon set. Derived so the two can never
     drift apart. */
  ['ann', 'chip', 'key', 'toolbox', 'compass', 'magnet'].forEach(function (name) {
    ICONS[name + '-flat'] = Object.assign({}, ICONS[name], { fixedStroke: false });
  });

  var APPEARANCE_VARS = {
    primary: '--icon-primary',
    secondary: '--icon-secondary',
    surface: '--icon-surface',
    detail: '--icon-detail',
    person: '--icon-person',
    personOpacity: '--icon-person-opacity'
  };

  var STROKE_VARS = [
    ['--icon-stroke-width', '--icon-stroke', '1.4px'],
    ['--icon-stroke-width-thin', '--icon-stroke-thin', '1.15px'],
    ['--icon-detail-stroke-width', '--icon-detail-stroke', '0.95px']
  ];

  function n(v) { return Math.round(v * 10000) / 10000; }

  function cssValue(v) {
    return String(v).replace(/"/g, '&quot;');
  }

  /* Colour overrides, plus, when `fixedStroke` (default true), the theme's absolute
     stroke widths divided by the placement scale. `fixedStroke: false` leaves the
     icons.css fallback, so the stroke scales with the icon. */
  function styleAttr(scale, appearance, fixedStroke) {
    var parts = fixedStroke === false ? [] : STROKE_VARS.map(function (v) {
      return v[0] + ':calc(var(' + v[1] + ', ' + v[2] + ') / ' + n(scale) + ')';
    });
    if (appearance) {
      Object.keys(APPEARANCE_VARS).forEach(function (k) {
        if (appearance[k] != null) parts.push(APPEARANCE_VARS[k] + ':' + cssValue(appearance[k]));
      });
    }
    return ' style="' + parts.join(';') + '"';
  }

  /* Draw `name` into the size x size box at (x, y), fitted and centred by its
     recorded box. Sizes are in the caller's coordinate space. */
  function place(name, x, y, size, className, opts) {
    if (className && typeof className === 'object') {
      opts = className;
      className = '';
    }
    opts = opts || {};
    var icon = ICONS[name];
    if (!icon) return '';
    /* A brand mark records a viewBox where a house icon records an ink box; the fit
       is the same, so a logo lands at the same optical size. It gets no --icon-*
       vars, since a trademark is never recoloured, so `appearance` is a no-op on it. */
    var brand = !!icon.viewBox;
    var b = brand ? icon.viewBox : icon.box;
    var scale = (size / 100) * (FIT / Math.max(b[2], b[3]));
    var tx = x + size / 2 - scale * (b[0] + b[2] / 2);
    var ty = y + size / 2 - scale * (b[1] + b[3] / 2);
    return ''
      + '<g class="' + (brand ? 'deck-brand-icon' : 'icon') + ' ' + (className || '') + '"'
      + ' transform="translate(' + n(tx) + ',' + n(ty) + ') scale(' + n(scale) + ')"'
      + (brand ? '' : styleAttr(scale, opts.appearance, icon.fixedStroke !== false))
      + '>'
      + icon.svg
      + '</g>';
  }

  /* Span of the longer icon side inside the standalone svg()'s own 100-unit
     frame. Unlike FIT above, this reserves no clear space: place() embeds an
     icon inside a parent shape (a diagram node) that needs room around it,
     while svg() is the whole element — its caller (the image block) already
     puts the padding and border on the cell, so the icon may fill it. */
  var SVG_FIT = 100;

  /* A standalone `<svg viewBox="0 0 100 100">`, fitted like place(), for HTML
     contexts such as the image block. `label` names it for assistive tech; without
     one it is hidden as decoration. */
  function svg(name, label, opts) {
    opts = opts || {};
    var icon = ICONS[name];
    if (!icon) return '';
    var brand = !!icon.viewBox;
    var b = brand ? icon.viewBox : icon.box;
    var scale = SVG_FIT / Math.max(b[2], b[3]);
    var tx = 50 - scale * (b[0] + b[2] / 2);
    var ty = 50 - scale * (b[1] + b[3] / 2);
    return '<svg class="' + (brand ? 'deck-brand-icon' : 'icon') + '" viewBox="0 0 100 100"'
      + (label
          ? ' role="img" aria-label="' + cssValue(label) + '"'
          : ' aria-hidden="true"')
      + (brand ? '' : styleAttr(scale, opts.appearance, icon.fixedStroke !== false))
      + '><g transform="translate(' + n(tx) + ',' + n(ty) + ') scale(' + n(scale) + ')">'
      + icon.svg
      + '</g></svg>';
  }

  /* Registers an extension's icons into this registry — what flat-icons.js
     and a project's own extensions do with their own map of entries after this
     file has loaded, so e.g. `icon: 'my-mark'` or `icon: 'domain-knowledge'` works
     exactly like a hand-authored house icon above, with no other code change. */
  function extend(map) {
    Object.keys(map).forEach(function (name) { ICONS[name] = map[name]; });
  }

  window.Icons = {
    FIT: FIT,
    icons: ICONS,
    place: place,
    svg: svg,
    extend: extend
  };
})();
