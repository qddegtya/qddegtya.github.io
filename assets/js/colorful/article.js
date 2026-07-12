/* ==========================================================================
   Colorful - article page behaviours
   - Code blocks: mac-window chrome (traffic lights + language + copy)
   - Notices: semantic icon chip
   - Tables: scrollable card frame
   - TOC scrollspy: highlight the topmost section in view + smooth scroll
   - Image lightbox for minimal-mistakes `.image-popup` links (no dependency)
   - Giscus: keep the comment widget's theme in sync with the site theme toggle
   All motion degrades under prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__cArticle) return;   // guard against double-init (duplicate include)
  window.__cArticle = true;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // small helper: build an element with attrs + children (no innerHTML on data)
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  // build an inline SVG from a viewBox + inner path markup (static, trusted)
  function svg(paths, size) {
    var s = size || 16;
    var wrap = document.createElement("span");
    wrap.innerHTML = '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
      paths + '</svg>';
    return wrap.firstChild;
  }

  /* ---- Code blocks: mac-window chrome ---------------------------------- *
   * Rouge emits two shapes; the OUTERMOST element is always figure.highlight
   * or div.highlight (never a bare pre). Selecting those two element types is
   * exact - no over-match, no post-filter.
   *   fenced (```)            -> div.highlight > pre.highlight > code
   *   {% highlight linenos %}  -> figure.highlight > pre > code > table */
  document.querySelectorAll(".c-prose figure.highlight, .c-prose div.highlight").forEach(function (hl) {
    if (hl.querySelector(".c-code__bar")) return;
    var codeEl = hl.querySelector("code[class*='language-']");
    var lang = "";
    if (codeEl) { var m = /language-([\w+#-]+)/.exec(codeEl.className); if (m) lang = m[1]; }

    // dots
    var dots = el("span", { "class": "c-code__dots" }, [el("i"), el("i"), el("i")]);
    // language label - textContent, never innerHTML (author-controlled string)
    var label = el("span", { "class": "c-code__lang" }, [lang || "code"]);
    // copy button with a dedicated label span selected explicitly later
    var copyLabel = el("span", { "class": "c-code__copy-label" }, ["Copy"]);
    var copyIco = svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', 14);
    var copy = el("button", { type: "button", "class": "c-code__copy", "aria-label": "Copy code" }, [copyIco, copyLabel]);
    var bar = el("div", { "class": "c-code__bar" }, [dots, label, copy]);
    hl.insertBefore(bar, hl.firstChild);

    copy.addEventListener("click", function () {
      var cell = hl.querySelector("td.code") || hl.querySelector("pre");
      var text = cell ? cell.innerText : "";
      if (!text) return;
      function ok() {
        copy.classList.add("is-done"); copyLabel.textContent = "Copied";
        setTimeout(function () { copy.classList.remove("is-done"); copyLabel.textContent = "Copy"; }, 1600);
      }
      function fail() {
        copy.classList.add("is-fail"); copyLabel.textContent = "Failed";
        setTimeout(function () { copy.classList.remove("is-fail"); copyLabel.textContent = "Copy"; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok).catch(fail);
      } else {
        // legacy fallback for non-secure contexts / older browsers
        try {
          var ta = document.createElement("textarea");
          ta.value = text; ta.setAttribute("readonly", "");
          ta.style.cssText = "position:absolute;left:-9999px";
          document.body.appendChild(ta); ta.select();
          document.execCommand("copy") ? ok() : fail();
          document.body.removeChild(ta);
        } catch (e) { fail(); }
      }
    });
  });

  /* ---- Notices: semantic icon chip ------------------------------------- */
  var NOTICE_ICON = {
    info:    '<path d="M12 16v-4M12 8h.01"/><circle cx="12" cy="12" r="9"/>',
    success: '<path d="M20 6 9 17l-5-5"/>',
    warning: '<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    danger:  '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
    primary: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>',
    note:    '<path d="M12 16v-4M12 8h.01"/><circle cx="12" cy="12" r="9"/>'
  };
  document.querySelectorAll(".c-prose .notice, .c-prose [class*='notice--']").forEach(function (n) {
    if (n.classList.contains("has-ico")) return;
    var type = "note";
    ["info", "success", "warning", "danger", "primary"].forEach(function (t) {
      if (n.classList.contains("notice--" + t)) type = t;
    });
    // move the notice's original content into a body wrapper, then lay out the
    // notice as [icon | body]. Any floated image (.align-left) now floats INSIDE
    // the body, fully isolated from the icon - no overlap, no padding trick.
    var body = el("div", { "class": "c-notice__body" });
    while (n.firstChild) body.appendChild(n.firstChild);
    var ico = el("span", { "class": "c-notice__ico" }, [svg(NOTICE_ICON[type] || NOTICE_ICON.note, 17)]);
    n.appendChild(ico);
    n.appendChild(body);
    n.classList.add("has-ico");
  });

  /* ---- Tables: wrap each in a scrollable card frame -------------------- */
  document.querySelectorAll(".c-prose > table").forEach(function (t) {
    if (t.parentElement.classList.contains("c-table")) return;
    var wrap = el("div", { "class": "c-table" });
    t.parentNode.insertBefore(wrap, t);
    wrap.appendChild(t);
  });

  /* ---- TOC scrollspy + smooth scroll ----------------------------------- */
  var toc = document.querySelector(".c-toc__list");
  if (toc) {
    var links = [].slice.call(toc.querySelectorAll('a[href^="#"]'));
    var map = {}, targets = [];
    links.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute("href").slice(1));
      var elm = document.getElementById(id);
      if (elm) { map[id] = a; targets.push({ id: id, el: elm }); }
    });
    // a single hue marker that slides to the active link.
    var marker = el("span", { "class": "c-toc__marker" });
    toc.appendChild(marker);
    var activeId = null;

    function moveMarker(a) {
      marker.style.height = a.offsetHeight + "px";
      marker.style.transform = "translateY(" + a.offsetTop + "px)";
      marker.classList.add("is-on");
    }
    function setActive(id) {
      if (id === activeId || !map[id]) return;   // never clear; only move to a real target
      activeId = id;
      links.forEach(function (a) { a.classList.remove("is-active"); });
      map[id].classList.add("is-active");
      moveMarker(map[id]);
    }

    // Scroll-position driven: the active section is the LAST heading whose top has
    // passed the anchor line (nav height). This always resolves to exactly one
    // section - it never blanks out between headings, so the marker stays put
    // until a new heading is genuinely crossed. rAF-throttled: at most one
    // computation per frame no matter how fast you scroll -> no flicker.
    var ANCHOR = 96;   // px below the top where "current" flips
    var raf = 0;
    function compute() {
      raf = 0;
      var currentId = targets.length ? targets[0].id : null;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].el.getBoundingClientRect().top - ANCHOR <= 1) currentId = targets[i].id;
        else break;   // targets are in document order; stop at the first not-yet-passed
      }
      if (currentId) setActive(currentId);
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(compute); }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      if (activeId && map[activeId]) moveMarker(map[activeId]);
      onScroll();
    }, { passive: true });
    compute();   // set the initial active section
    links.forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = decodeURIComponent(a.getAttribute("href").slice(1));
        var elm = document.getElementById(id);
        if (!elm) return;
        e.preventDefault();
        var y = elm.getBoundingClientRect().top + window.pageYOffset - 96;
        window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
        history.replaceState(null, "", "#" + id);
      });
    });
  }

  /* ---- Image lightbox (minimal-mistakes .image-popup) ------------------ *
   * MM ships these as anchor links to the full image (old theme used a jQuery
   * magnific-popup). This is a tiny dependency-free, accessible replacement. */
  var popups = document.querySelectorAll(".c-prose a.image-popup");
  if (popups.length) {
    var box = null, boxImg = null, closeBtn = null, lastFocus = null;
    function close() {
      if (!box || !box.classList.contains("is-open")) return;
      box.classList.remove("is-open");
      document.body.classList.remove("c-scroll-lock");
      var done = function () { if (box) box.setAttribute("hidden", ""); };
      if (reduce) done(); else setTimeout(done, 250);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function trap(e) {
      if (e.key !== "Tab") return;
      // only the close button is focusable inside - keep focus on it
      e.preventDefault(); closeBtn.focus();
    }
    function open(src, alt, trigger) {
      lastFocus = trigger || document.activeElement;
      if (!box) {
        closeBtn = el("button", { "class": "c-lightbox__close", "aria-label": "Close" },
          [svg('<path d="M6 6l12 12M18 6L6 18"/>', 18)]);
        boxImg = el("img", { alt: "" });
        box = el("div", { "class": "c-lightbox", role: "dialog", "aria-modal": "true", "aria-label": "Image", hidden: "" },
          [closeBtn, boxImg]);
        document.body.appendChild(box);
        box.addEventListener("click", function (e) { if (e.target === box || e.target.closest(".c-lightbox__close")) close(); });
        box.addEventListener("keydown", trap);
      }
      boxImg.setAttribute("src", src); boxImg.setAttribute("alt", alt || "");
      box.removeAttribute("hidden");
      document.body.classList.add("c-scroll-lock");
      requestAnimationFrame(function () { box.classList.add("is-open"); closeBtn.focus(); });
    }
    popups.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var img = a.querySelector("img");
        open(a.getAttribute("href"), img ? img.alt : "", a);
      });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* ---- Giscus theme sync ----------------------------------------------- */
  function sendGiscusTheme() {
    var frame = document.querySelector("iframe.giscus-frame");
    if (!frame || !frame.contentWindow) return;
    var theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    frame.contentWindow.postMessage({ giscus: { setConfig: { theme: theme } } }, "https://giscus.app");
  }
  if (document.querySelector("#giscus-comments, .giscus")) {
    window.addEventListener("message", function (e) {
      if (e.origin === "https://giscus.app" && e.data && e.data.giscus) sendGiscusTheme();
    });
    new MutationObserver(sendGiscusTheme).observe(document.documentElement, {
      attributes: true, attributeFilter: ["data-theme"]
    });
  }

  /* ---- scroll reveals (in case home.js's observer isn't on this page) --- */
  if (!window.__cReveals) {
    window.__cReveals = true;
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io2.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".c-reveal").forEach(function (elm) { io2.observe(elm); });
  }
})();
