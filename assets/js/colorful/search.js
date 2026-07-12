/* ==========================================================================
   Colorful theme - search (vanilla, no jQuery)
   Reuses the existing lunr index data (assets/js/lunr/lunr-store.js) and the
   lunr UMD build, but replaces the legacy jQuery query/render layer with a
   self-contained module that powers the full-screen search overlay and renders
   rich results (teaser image + title + excerpt). Feature parity with the old
   search, plus imagery the old results never showed.

   Public API: window.ColorfulSearch.open() / .close()
   Requires markup: an element .c-search containing #c-search-input and
   #c-search-results, and a trigger with [data-search-open].
   ========================================================================== */
(function () {
  "use strict";

  var idx = null;         // lunr index (built lazily on first open)
  var loading = false;
  var scriptBase = document.currentScript ? getBase(document.currentScript.src) : "/assets/js/colorful/";
  var lunrBase = "/assets/js/lunr/";

  function getBase(src) { return src.replace(/[^/]+$/, ""); }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Build the lunr index from the generated `store`. Mirrors the fields the
  // theme's lunr-store.js emits (title / excerpt / categories / tags).
  function buildIndex() {
    if (idx || loading) return Promise.resolve();
    loading = true;
    var needLunr = typeof window.lunr === "undefined" ? loadScript(lunrBase + "lunr.min.js") : Promise.resolve();
    var needStore = typeof window.store === "undefined" ? loadScript(lunrBase + "lunr-store.js") : Promise.resolve();
    return Promise.all([needLunr, needStore]).then(function () {
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
      loading = false;
    });
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

  function render(results, resultsEl, term) {
    var store = window.store || [];
    if (!term) { resultsEl.innerHTML = '<p class="c-search__hint">Type to search across all writing, projects, and collections.</p>'; return; }
    if (!results.length) { resultsEl.innerHTML = '<p class="c-search__hint">No results for "' + esc(term) + '".</p>'; return; }
    var html = '<p class="c-search__hint">' + results.length + ' result' + (results.length > 1 ? "s" : "") + '</p>';
    results.slice(0, 20).forEach(function (r) {
      var item = store[r.ref];
      if (!item) return;
      var excerpt = (item.excerpt || "").slice(0, 160);
      var thumb = item.teaser ? '<span class="thumb"><img src="' + esc(item.teaser) + '" alt="" loading="lazy"></span>' : "";
      html += '<article>'
        + thumb
        + '<span class="txt">'
        + '<h3><a href="' + esc(item.url) + '">' + esc(item.title) + '</a></h3>'
        + '<p>' + esc(excerpt) + '</p>'
        + '</span>'
        + '</article>';
    });
    resultsEl.innerHTML = html;
  }

  var overlay, input, resultsEl, lastQuery = "";

  function open() {
    if (!overlay) return;
    document.body.classList.add("c-search-open");
    buildIndex().then(function () { if (input) { input.focus(); if (input.value) run(); } });
    setTimeout(function () { if (input) input.focus(); }, 60);
  }
  function close() { document.body.classList.remove("c-search-open"); }

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
    if (!overlay || !input || !resultsEl) return;

    document.querySelectorAll("[data-search-open]").forEach(function (t) {
      t.addEventListener("click", function (e) { e.preventDefault(); open(); });
    });
    document.querySelectorAll(".c-search__close, [data-search-close]").forEach(function (t) {
      t.addEventListener("click", close);
    });
    input.addEventListener("input", run);

    // keyboard: Cmd/Ctrl+K to open, Esc to close, "/" to open when not typing
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
      else if (e.key === "Escape" && document.body.classList.contains("c-search-open")) { close(); }
      else if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
  });

  window.ColorfulSearch = { open: open, close: close };
})();
