/* Physical-unit helpers for the point base: 1 canvas unit = 1pt, on a 960×540 page.
   Converts cm/mm to points for figure geometry; pt() is identity, for intent. JS
   geometry only: in CSS write px, since CSS px == our point. No dependencies. Exposes
   window.Units. */
(function () {
  window.Units = {
    cm: function (v) { return v * 72 / 2.54; },   // 28.3465 pt per cm
    mm: function (v) { return v * 72 / 25.4; },   // 2.83465 pt per mm
    pt: function (v) { return v; }
  };
})();
