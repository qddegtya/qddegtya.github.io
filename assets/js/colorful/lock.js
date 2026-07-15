/* ==========================================================================
   Colorful theme - shared scroll lock
   One lock, used by every full-screen overlay (mobile menu, search, lightbox)
   so behaviour is identical and the pieces never fight each other.

   Design: freeze the page WITHOUT moving it. We clip overflow on <html>
   (`.is-scroll-locked`) rather than fixing <body> - so the reading position is
   never touched: opening an overlay causes no jump, closing causes no animated
   return. The overlays themselves carry `overscroll-behavior: contain` so touch
   scroll can't chain through to the page behind on iOS.

   Reference-counted: several overlays may be open at once (edge cases), and the
   page only unlocks when the last one releases. Idempotent per owner via a token
   set, so a double lock / double unlock from one owner can't corrupt the count.

   Public API: window.ColorfulLock.acquire(token) / .release(token)
   ========================================================================== */
(function () {
  "use strict";
  if (window.ColorfulLock) return;   // single-load guard (loaded on every layout)

  var owners = Object.create(null);  // token -> true, so each owner counts once
  var count = 0;

  function apply() {
    document.documentElement.classList.toggle("is-scroll-locked", count > 0);
  }
  function acquire(token) {
    if (!token || owners[token]) return;   // already holding -> no-op
    owners[token] = true; count++;
    apply();
  }
  function release(token) {
    if (!token || !owners[token]) return;  // not holding -> no-op
    delete owners[token]; count = Math.max(0, count - 1);
    apply();
  }

  window.ColorfulLock = { acquire: acquire, release: release };
})();
