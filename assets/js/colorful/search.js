/* ==========================================================================
   Colorful theme - search (vanilla, no jQuery)
   Reuses the lunr index data (assets/js/lunr/lunr-store.js) + lunr UMD build.
   Powers BOTH the global full-screen overlay and the dedicated /search/ page,
   from one lazily-built index. Rich results (teaser + title + excerpt).

   Public API: window.ColorfulSearch.open() / .close()
   ========================================================================== */
(function () {
  "use strict";
  if (window.ColorfulSearch) return;   // single-load guard (script is on 6 layouts)

  var idx = null;              // lunr index (built once, lazily)
  var buildPromise = null;     // in-flight build (shared so callers wait for the real index)
  var lunrBase = "/assets/js/lunr/";

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Build the lunr index from `store` (fields mirror the theme's lunr-store.js).
  // Returns a promise that resolves only once the index truly exists; concurrent
  // callers share the same in-flight promise (no "resolve early with null idx").
  function buildIndex() {
    if (idx) return Promise.resolve();
    if (buildPromise) return buildPromise;
    var needLunr = typeof window.lunr === "undefined" ? loadScript(lunrBase + "lunr.min.js") : Promise.resolve();
    var needStore = typeof window.store === "undefined" ? loadScript(lunrBase + "lunr-store.js") : Promise.resolve();
    buildPromise = Promise.all([needLunr, needStore]).then(function () {
      idx = window.lunr(function () {
        this.field("title", { boost: 10 });
        this.field("excerpt");
        this.field("categories");
        this.field("tags");
        this.ref("id");
        this.pipeline.remove(window.lunr.trimmer);
        var store = window.store;
        for (var i in store) { this.add({ title: store[i].title, excerpt: store[i].excerpt, categories: store[i].categories, tags: store[i].tags, id: i }); }
      });
    });
    return buildPromise;
  }

  function query(q) {
    if (!idx) return [];
    var lunr = window.lunr;
    return idx.query(function (qb) {
      q.toLowerCase().split(lunr.tokenizer.separator).forEach(function (term) {
        qb.term(term, { boost: 100 });
        if (q.lastIndexOf(" ") !== q.length - 1) { qb.term(term, { usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING, boost: 10 }); }
        if (term !== "") { qb.term(term, { usePipeline: false, editDistance: 1, boost: 1 }); }
      });
    });
  }

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  // only allow safe URL schemes into href/src (author content, but be strict)
  function safeUrl(u) { return /^(https?:|\/|\.|#)/.test(u || "") ? u : "#"; }

  // hintClass lets each container use its own hint style
  function render(results, resultsEl, term, hintClass) {
    var store = window.store || [];
    var hc = hintClass || "c-search__hint";
    if (!term) { resultsEl.innerHTML = '<p class="' + hc + '">Type to search across all writing, projects, and collections.</p>'; return; }
    if (!results.length) { resultsEl.innerHTML = '<p class="' + hc + '">No results for "' + esc(term) + '".</p>'; return; }
    var html = '<p class="' + hc + '">' + results.length + ' result' + (results.length > 1 ? "s" : "") + '</p>';
    results.slice(0, 20).forEach(function (r) {
      var item = store[r.ref];
      if (!item) return;
      var excerpt = (item.excerpt || "").slice(0, 160);
      var thumb = item.teaser ? '<span class="c-result__thumb"><img src="' + esc(safeUrl(item.teaser)) + '" alt="" loading="lazy"></span>' : "";
      html += '<a class="c-result" href="' + esc(safeUrl(item.url)) + '">'
        + thumb
        + '<span class="c-result__txt">'
        + '<span class="c-result__title">' + esc(item.title) + '</span>'
        + '<span class="c-result__excerpt">' + esc(excerpt) + '</span>'
        + '</span>'
        + '<svg class="c-result__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'
        + '</a>';
    });
    resultsEl.innerHTML = html;
  }

  var overlay, input, resultsEl, lastQuery = "";

  function open() {
    if (!overlay) return;
    document.body.classList.add("c-search-open");
    // freeze the page behind the full-screen overlay via the shared lock (no shift)
    if (window.ColorfulLock) window.ColorfulLock.acquire("search");
    buildIndex().then(function () { if (input) { input.focus(); if (input.value) run(); } });
    setTimeout(function () { if (input) input.focus(); }, 60);
  }
  function close() {
    document.body.classList.remove("c-search-open");
    if (window.ColorfulLock) window.ColorfulLock.release("search");
  }

  function run() {
    var term = input.value.trim();
    if (term === lastQuery) return;
    lastQuery = term;
    render(term ? query(term) : [], resultsEl, term);
  }

  document.addEventListener("DOMContentLoaded", function () {
    overlay = document.querySelector(".c-search");
    input = document.getElementById("c-search-input");
    resultsEl = document.getElementById("c-search-results");

    var pageInput = document.getElementById("c-searchpage-input");
    var pageResults = document.getElementById("c-searchpage-results");
    var onSearchPage = !!(pageInput && pageResults);

    // --- overlay mode (present on every page) ---
    if (overlay && input && resultsEl) {
      document.querySelectorAll("[data-search-open]").forEach(function (t) {
        t.addEventListener("click", function (e) { e.preventDefault(); open(); });
      });
      document.querySelectorAll(".c-search__close, [data-search-close]").forEach(function (t) {
        t.addEventListener("click", close);
      });
      input.addEventListener("input", run);

      // keyboard: Cmd/Ctrl+K opens, Esc closes, "/" opens when not typing.
      // On the dedicated /search/ page the overlay hotkeys are suppressed so the
      // two search UIs don't collide.
      document.addEventListener("keydown", function (e) {
        var k = e.key; if (!k) return;
        var ae = document.activeElement;
        var typing = ae && (/input|textarea|select/i.test(ae.tagName) || ae.isContentEditable);
        if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === "k") {
          if (onSearchPage) { e.preventDefault(); if (pageInput) pageInput.focus(); }
          else { e.preventDefault(); open(); }
        } else if (k === "Escape" && document.body.classList.contains("c-search-open")) {
          close();
        } else if (k === "/" && !typing && !onSearchPage) {
          e.preventDefault(); open();
        }
      });
    }

    // --- full-page mode (/search/) ---
    if (onSearchPage) {
      var pageHint = document.querySelector("[data-search-hint]");
      var pageClear = document.querySelector("[data-searchpage-clear]");
      var pageLast = null;
      // the ESC/x pill only makes sense once there's something to clear
      function syncClear() { if (pageClear) pageClear.hidden = pageInput.value.length === 0; }
      function runPage() {
        var term = pageInput.value.trim();
        if (pageHint) pageHint.style.display = term ? "none" : "";
        render(term ? query(term) : [], pageResults, term, "c-searchpage__hint");
      }
      function clearPage() {
        pageInput.value = ""; pageLast = ""; syncClear(); runPage(); pageInput.focus();
      }
      // set the value from ?q= BEFORE building, then render once the index exists
      var m = location.search.match(/[?&]q=([^&]*)/);
      if (m) { try { pageInput.value = decodeURIComponent(m[1].replace(/\+/g, " ")); } catch (e) {} }
      syncClear();
      buildIndex().then(runPage);
      pageInput.addEventListener("input", function () {
        syncClear();
        var term = pageInput.value.trim();
        if (term === pageLast) return;
        pageLast = term;
        runPage();
      });
      // ESC key clears (mirrors the pill); the pill click does the same
      pageInput.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && pageInput.value.length) { e.preventDefault(); clearPage(); }
      });
      if (pageClear) pageClear.addEventListener("click", clearPage);
    }
  });

  window.ColorfulSearch = { open: open, close: close };
})();
