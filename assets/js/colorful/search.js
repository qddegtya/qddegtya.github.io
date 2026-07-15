/* ==========================================================================
   Colorful theme - search (vanilla, no jQuery)
   Reuses the lunr index data (assets/js/lunr/lunr-store.js) + lunr UMD build.
   Powers BOTH the global full-screen overlay and the dedicated /search/ page,
   from one lazily-built index. Rich results (teaser + title + excerpt).

   lunr returns the FULL result set (no built-in paging), so paging is done here
   over that array: the overlay uses infinite scroll (append a batch near the
   bottom); the /search page uses numbered pagination. Page size is read from the
   container's data-per-page (injected from _config.yml search_per_page).

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

  // Configurable page size, read off the container's data-per-page attribute
  // (injected from _config.yml search_per_page). Positive-integer fallback.
  function perPageOf(el) {
    var n = parseInt(el && el.getAttribute("data-per-page"), 10);
    return n > 0 ? n : 12;
  }

  // one lunr result's store item -> its <a class="c-result"> card (markup unchanged)
  function resultCard(item) {
    if (!item) return "";
    var excerpt = (item.excerpt || "").slice(0, 160);
    var thumb = item.teaser ? '<span class="c-result__thumb"><img src="' + esc(safeUrl(item.teaser)) + '" alt="" loading="lazy"></span>' : "";
    return '<a class="c-result" href="' + esc(safeUrl(item.url)) + '">'
      + thumb
      + '<span class="c-result__txt">'
      + '<span class="c-result__title">' + esc(item.title) + '</span>'
      + '<span class="c-result__excerpt">' + esc(excerpt) + '</span>'
      + '</span>'
      + '<svg class="c-result__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'
      + '</a>';
  }

  function countLine(n, hc) { return '<p class="' + hc + '">' + n + ' result' + (n > 1 ? "s" : "") + '</p>'; }
  function hint(hc, msg) { return '<p class="' + hc + '">' + msg + '</p>'; }

  // render results[from..to) as cards, skipping any missing store item
  function cardsFor(results, store, from, to) {
    var html = "";
    for (var i = from; i < to && i < results.length; i++) html += resultCard(store[results[i].ref]);
    return html;
  }

  // Numbered paginator matching _includes/paginator-v2.html markup so it inherits
  // the existing .pagination styles. cur is 0-based; a[data-page] carries target.
  function paginatorHtml(cur, total) {
    if (total <= 1) return "";
    function link(label, page, cls) {
      var c = cls ? ' class="' + cls + '"' : "";
      var dp = page == null ? "" : ' data-page="' + page + '"';
      return '<li><a href="#"' + c + dp + '>' + label + '</a></li>';
    }
    function disabled(label) { return '<li><a href="#" class="disabled"><span aria-hidden="true">' + label + '</span></a></li>'; }
    var out = '<nav class="pagination" aria-label="Search results pages"><ul>';
    out += cur > 0 ? link("Previous", cur - 1) : disabled("Previous");
    var before = 2, after = 2, seq = [];
    for (var i = 0; i < total; i++) {
      if (i === 0 || i === total - 1 || (i >= cur - before && i <= cur + after)) seq.push(i);
      else if (seq[seq.length - 1] !== -1) seq.push(-1);   // single ellipsis marker
    }
    seq.forEach(function (p) {
      if (p === -1) out += '<li><a href="#" class="disabled">&hellip;</a></li>';
      else out += link(String(p + 1), p, p === cur ? "current" : "");
    });
    out += cur < total - 1 ? link("Next", cur + 1) : disabled("Next");
    return out + '</ul></nav>';
  }

  var overlay, input, resultsEl, lastQuery = "", overlayRun = null;

  function open() {
    if (!overlay) return;
    document.body.classList.add("c-search-open");
    // freeze the page behind the full-screen overlay via the shared lock (no shift)
    if (window.ColorfulLock) window.ColorfulLock.acquire("search");
    buildIndex().then(function () { if (input) { input.focus(); if (input.value && overlayRun) overlayRun(); } });
    setTimeout(function () { if (input) input.focus(); }, 60);
  }
  function close() {
    document.body.classList.remove("c-search-open");
    if (window.ColorfulLock) window.ColorfulLock.release("search");
  }

  document.addEventListener("DOMContentLoaded", function () {
    overlay = document.querySelector(".c-search");
    input = document.getElementById("c-search-input");
    resultsEl = document.getElementById("c-search-results");

    var pageInput = document.getElementById("c-searchpage-input");
    var pageResults = document.getElementById("c-searchpage-results");
    var onSearchPage = !!(pageInput && pageResults);

    // --- overlay mode: infinite scroll (append batches near the bottom) ---
    if (overlay && input && resultsEl) {
      var ovPerPage = perPageOf(resultsEl);
      var ovResults = [], ovRendered = 0, ovHost = null;

      function ovAppend() {
        var store = window.store || [];
        if (!ovHost || ovRendered >= ovResults.length) return;
        var to = Math.min(ovRendered + ovPerPage, ovResults.length);
        ovHost.insertAdjacentHTML("beforeend", cardsFor(ovResults, store, ovRendered, to));
        ovRendered = to;
      }
      var ovTick = false;
      function ovScroll() {
        if (ovTick) return; ovTick = true;
        requestAnimationFrame(function () {
          ovTick = false;
          if (ovRendered >= ovResults.length) return;
          if (resultsEl.scrollTop + resultsEl.clientHeight >= resultsEl.scrollHeight - 240) ovAppend();
        });
      }
      resultsEl.addEventListener("scroll", ovScroll, { passive: true });

      overlayRun = function () {
        var term = input.value.trim();
        if (term === lastQuery) return;
        lastQuery = term;
        ovResults = term ? query(term) : [];
        ovRendered = 0; ovHost = null; resultsEl.scrollTop = 0;
        if (!term) { resultsEl.innerHTML = hint("c-search__hint", "Type to search across all writing, projects, and collections."); return; }
        if (!ovResults.length) { resultsEl.innerHTML = hint("c-search__hint", 'No results for "' + esc(term) + '".'); return; }
        resultsEl.innerHTML = countLine(ovResults.length, "c-search__hint") + '<div class="c-result-list" data-result-list></div>';
        ovHost = resultsEl.querySelector("[data-result-list]");
        ovAppend();
        // keep filling until the batch overflows the viewport (so scroll can trigger more)
        var guard = 0;
        while (ovRendered < ovResults.length && resultsEl.scrollHeight <= resultsEl.clientHeight && guard++ < 200) ovAppend();
      };

      document.querySelectorAll("[data-search-open]").forEach(function (t) {
        t.addEventListener("click", function (e) { e.preventDefault(); open(); });
      });
      document.querySelectorAll(".c-search__close, [data-search-close]").forEach(function (t) {
        t.addEventListener("click", close);
      });
      input.addEventListener("input", overlayRun);

      // keyboard: Cmd/Ctrl+K opens, Esc closes, "/" opens when not typing.
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

    // --- full-page mode (/search/): numbered pagination ---
    if (onSearchPage) {
      var pgPerPage = perPageOf(pageResults);
      var pageHint = document.querySelector("[data-search-hint]");
      var pageClear = document.querySelector("[data-searchpage-clear]");
      var pageLast = null;
      var pgResults = [], pgPage = 0;

      function syncClear() { if (pageClear) pageClear.hidden = pageInput.value.length === 0; }

      function renderPage() {
        var store = window.store || [];
        var total = Math.ceil(pgResults.length / pgPerPage);
        if (pgPage > total - 1) pgPage = Math.max(0, total - 1);
        var from = pgPage * pgPerPage;
        var to = from + pgPerPage;
        pageResults.innerHTML =
          countLine(pgResults.length, "c-searchpage__hint")
          + '<div class="c-result-list">' + cardsFor(pgResults, store, from, to) + '</div>'
          + paginatorHtml(pgPage, total);
      }

      function runPage() {
        var term = pageInput.value.trim();
        if (pageHint) pageHint.style.display = term ? "none" : "";
        pgPage = 0;
        if (!term) { pgResults = []; pageResults.innerHTML = ""; return; }
        pgResults = query(term);
        if (!pgResults.length) { pageResults.innerHTML = hint("c-searchpage__hint", 'No results for "' + esc(term) + '".'); return; }
        renderPage();
      }

      function clearPage() {
        pageInput.value = ""; pageLast = ""; syncClear(); runPage(); pageInput.focus();
      }

      // delegated paginator clicks (Prev / number / Next)
      pageResults.addEventListener("click", function (e) {
        var a = e.target.closest("a[data-page]");
        if (!a || !pageResults.contains(a)) return;
        e.preventDefault();
        var p = parseInt(a.getAttribute("data-page"), 10);
        if (isNaN(p) || p === pgPage) return;
        pgPage = p;
        renderPage();
        // land at the top of the results region on page change
        var top = pageResults.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: top, behavior: "smooth" });
      });

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
