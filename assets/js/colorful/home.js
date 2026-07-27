/* ==========================================================================
   Colorful theme - home interactions
   - Theme toggle (persisted, respects prefers-color-scheme)
   - Mobile overlay menu with morphing burger
   - GSAP masked line-reveal for the hero + hue drift on the colored word
   - IntersectionObserver scroll reveals (no scroll listeners)
   - Drag-to-scroll photo strip
   All motion degrades under prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Theme toggle ---- */
  var root = document.documentElement;
  var toggle = document.querySelector(".c-theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("colorful-theme", next); } catch (e) {}
    });
  }

  /* ---- Mobile overlay menu (click a link, click the backdrop, or Esc closes) ---- */
  var burger = document.querySelector(".c-burger");
  var menu = document.querySelector(".c-menu");
  if (burger) {
    // scroll-lock via the shared, non-shifting lock (window.ColorfulLock): the
    // page freezes in place, no jump, no restore. overscroll-behavior on .c-menu
    // stops iOS touch-scroll chaining. Guard so a missing lock.js never breaks the menu.
    var LOCK = window.ColorfulLock;
    function openMenu() { document.body.classList.add("c-menu-open"); if (LOCK) LOCK.acquire("menu"); }
    function closeMenu() {
      if (!document.body.classList.contains("c-menu-open")) return;
      document.body.classList.remove("c-menu-open");
      if (LOCK) LOCK.release("menu");
    }
    burger.addEventListener("click", function () {
      if (document.body.classList.contains("c-menu-open")) closeMenu();
      else openMenu();
    });
    document.querySelectorAll(".c-menu__link").forEach(function (l) {
      l.addEventListener("click", closeMenu);
    });
    // click on the overlay backdrop (not a link) closes it
    if (menu) menu.addEventListener("click", function (e) { if (e.target === menu) closeMenu(); });
    // Esc closes it
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---- Nav magic slider: a hue pill glides beneath the hovered item ----
     JS owns one job: measure the target link and push its geometry + hue onto
     the slider as custom props; CSS springs it into place. Rests on the active
     link; fades out when the pointer leaves the group. Falls back to the CSS
     underline when JS is absent (the .is-ready gate). ---- */
  var navLinks = document.querySelector(".c-nav__links");
  var slider = navLinks && navLinks.querySelector(".c-nav__slider");
  if (navLinks && slider) {
    var links = [].slice.call(navLinks.querySelectorAll(".c-nav__link"));
    function moveTo(link) {
      if (!link) return;
      slider.style.setProperty("--x", link.offsetLeft + "px");
      slider.style.setProperty("--w", link.offsetWidth + "px");
      var hue = getComputedStyle(link).getPropertyValue("--_hue").trim();
      if (hue) slider.style.setProperty("--_hue", hue);
    }
    function activeLink() { return navLinks.querySelector(".c-nav__link.is-active") || links[0]; }
    function settle() {
      var a = navLinks.querySelector(".c-nav__link.is-active");
      if (a) { moveTo(a); navLinks.classList.add("is-hovering"); }
      else { navLinks.classList.remove("is-hovering"); }
    }
    links.forEach(function (link) {
      link.addEventListener("pointerenter", function () {
        navLinks.classList.add("is-hovering");
        moveTo(link);
      });
    });
    navLinks.addEventListener("pointerleave", settle);
    // position under the active link before revealing, so first paint is correct
    moveTo(activeLink());
    navLinks.classList.add("is-ready");
    settle();
    var navRaf = null;
    window.addEventListener("resize", function () {
      if (navRaf) cancelAnimationFrame(navRaf);
      navRaf = requestAnimationFrame(function () {
        if (!navLinks.classList.contains("is-hovering")) moveTo(activeLink());
      });
    });
  }

  /* ---- Blog card/list view toggle (front-end only, never touches paging) ---- */
  var writing = document.getElementById("c-writing");
  var vt = document.querySelector(".c-viewtoggle");
  if (writing && vt) {
    try {
      var saved = localStorage.getItem("colorful-view");
      if (saved === "list") {
        writing.classList.add("is-list");
        vt.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-active", b.dataset.view === "list"); });
      }
    } catch (e) {}
    vt.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var view = btn.dataset.view;
        // suppress transitions during the layout swap so cards don't flash a
        // border/shadow mid-morph, then re-enable on the next frame.
        writing.classList.add("no-anim");
        writing.classList.toggle("is-list", view === "list");
        vt.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { writing.classList.remove("no-anim"); });
        });
        try { localStorage.setItem("colorful-view", view); } catch (e) {}
      });
    });
  }

  /* ---- About: language toggle (EN default) ---- */
  var langToggle = document.querySelector(".c-lang");
  if (langToggle) {
    langToggle.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var lang = btn.dataset.lang;
        document.querySelectorAll(".c-about__p[data-lang]").forEach(function (p) {
          p.hidden = p.dataset.lang !== lang;
        });
        langToggle.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      });
    });
  }

  /* ---- Scroll reveals via IntersectionObserver ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".c-reveal").forEach(function (el) { io.observe(el); });

  /* ---- Moments: a stack of photos you flip through, like a real pile ----
     Photos start stacked in the centre of the textured container. You drag them
     around to browse (they stay where you drop them, top-of-pile on grab). The
     drag is clamped to the container so nothing ever escapes. Sizes are relative
     to the container, so it works on every device. ---- */
  var pile = document.getElementById("c-moments");
  if (pile) {
    var snaps = Array.prototype.slice.call(pile.querySelectorAll("[data-snap]"));
    var zTop = 10;

    // deterministic pseudo-random (stable across resizes, no Math.random)
    function rnd(seed) { var x = Math.sin(seed * 999.13) * 43758.5453; return x - Math.floor(x); }
    function setPos(s, x, y, rot) { s.style.transform = "translate(" + x + "px," + y + "px) rotate(" + rot + "deg)"; }

    var pw, ph;   // photo box size (kept in scope for clamping)

    function layoutStack() {
      var w = pile.clientWidth;
      // photo width relative to container; big screens -> big photos, capped.
      pw = Math.max(150, Math.min(w * 0.32, 300));
      ph = pw * 1.30;                                   // 4:5 image + caption chrome
      // narrow screens get a tighter pile; wide screens spread out and fill the space
      var narrow = w < 620;
      // container tall enough for the scattered spread without clipping
      var h = narrow ? Math.max(ph * 1.9, 380) : Math.max(ph * 2.2, 460);
      pile.style.height = h + "px";
      var cx = (w - pw) / 2, cy = (h - ph) / 2;
      // usable travel room from centre to the clamped edges, with a little inset
      var roomX = Math.max(0, (w - pw) / 2 - 12);
      var roomY = Math.max(0, (h - ph) / 2 - 12);
      // spread wider on desktop (fills the whitespace); stay a loose pile on mobile
      var spreadX = narrow ? 0.42 : 0.92;
      var spreadY = narrow ? 0.34 : 0.82;

      snaps.forEach(function (s, i) {
        s.style.width = pw + "px";
        // deterministic scatter across the surface; each photo has a stable home
        var ox = (rnd(i + 1) - 0.5) * 2 * roomX * spreadX;
        var oy = (rnd(i + 5) - 0.5) * 2 * roomY * spreadY;
        var rot = (rnd(i + 3) - 0.5) * 12;               // -6..6 deg
        s.style.zIndex = i + 1;
        setPos(s, cx + ox, cy + oy, rot);
        s._rot = rot;
      });
    }
    layoutStack();
    var raf = null;
    window.addEventListener("resize", function () {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(layoutStack);
    });

    if (!reduce) {
      snaps.forEach(function (s, i) {
        var dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
        function curXY() {
          var m = /translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/.exec(s.style.transform) || [0, 0, 0];
          return { x: parseFloat(m[1]) || 0, y: parseFloat(m[2]) || 0 };
        }
        s.addEventListener("pointerdown", function (e) {
          dragging = true;
          var p = curXY(); ox = p.x; oy = p.y; sx = e.clientX; sy = e.clientY;
          s.classList.add("is-dragging");
          s.style.zIndex = ++zTop;                       // dragged photo comes to top
          s.setPointerCapture(e.pointerId);
        });
        s.addEventListener("pointermove", function (e) {
          if (!dragging) return;
          var maxX = pile.clientWidth - pw, maxY = pile.clientHeight - ph;
          var nx = Math.max(0, Math.min(maxX, ox + (e.clientX - sx)));   // clamp inside container
          var ny = Math.max(0, Math.min(maxY, oy + (e.clientY - sy)));
          setPos(s, nx, ny, s._rot);                     // stays where dropped
        });
        function release() {
          if (!dragging) return; dragging = false; s.classList.remove("is-dragging");
        }
        s.addEventListener("pointerup", release);
        s.addEventListener("pointercancel", release);
      });
    }
  }

  /* ---- A colorful world: view toggle (cards / timeline) ---- */
  var world = document.getElementById("c-world");
  var timeline = document.getElementById("c-timeline");
  var wtoggle = document.getElementById("c-world-toggle");
  if (world && timeline && wtoggle) {
    wtoggle.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.dataset.wview;
        var tl = v === "timeline";
        world.classList.toggle("is-timeline", tl);
        timeline.classList.toggle("is-on", tl);
        wtoggle.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      });
    });
  }

  /* ---- A colorful world: collection carousels (flip through latest entries) --
     A plain horizontal carousel. The track holds N full-width cards; JS owns one
     number - `active` (0..N-1) - and sets it as --active on the track. CSS does
     the sliding via translateX. It clamps at the two ends (arrows disable there),
     so there is no wrapping, no clones, no timers, no transitionend juggling.
     One number in, one transform out. ---- */
  document.querySelectorAll("[data-coll]").forEach(function (coll) {
    var deck = coll.querySelector(".c-coll__deck");
    var track = coll.querySelector("[data-track]");
    if (!deck || !track) return;
    var cards = [].slice.call(track.querySelectorAll(".c-coll__card"));
    var posEl = coll.querySelector("[data-pos]");
    var prevBtn = coll.querySelector("[data-prev]");
    var nextBtn = coll.querySelector("[data-next]");
    var n = cards.length;
    if (!n) return;
    var active = 0;

    function render() {
      track.style.setProperty("--active", active);
      cards.forEach(function (card, i) {
        var front = i === active;
        card.classList.toggle("is-front", front);
        var vid = card.classList.contains("c-coll__card--video");
        card.querySelectorAll("[tabindex]").forEach(function (el) {
          el.setAttribute("tabindex", front && vid ? "0" : "-1");
        });
      });
      if (posEl) posEl.textContent = (active + 1);
      if (prevBtn) prevBtn.disabled = active === 0;
      if (nextBtn) nextBtn.disabled = active === n - 1;
    }

    function go(dir) {
      var target = active + dir;
      if (target < 0 || target > n - 1) return;   // clamp at the ends
      resetVideo(cards[active]);                   // stop a playing video first
      active = target;
      render();
    }

    // ---- lazy video (clone the theme-rendered player, autoplay on click) ----
    function playVideo(card) {
      if (card.classList.contains("is-playing")) return;
      var media = card.querySelector(".c-coll__media");
      var tpl = card.querySelector(".c-coll__player");
      if (!media || !tpl) return;
      var frag = tpl.content.cloneNode(true);
      var iframe = frag.querySelector("iframe");
      if (iframe) {
        var join = iframe.src.indexOf("?") > -1 ? "&" : "?";
        if (!/autoplay=1/.test(iframe.src)) iframe.src = iframe.src + join + "autoplay=1";
        iframe.setAttribute("allow", "autoplay; fullscreen; encrypted-media");
      }
      card.classList.add("is-playing");
      media.appendChild(frag);
    }
    function resetVideo(card) {
      if (!card.classList.contains("is-playing")) return;
      card.classList.remove("is-playing");
      var host = card.querySelector(".responsive-video-container");
      if (host) host.remove();
    }

    cards.forEach(function (card) {
      if (!card.classList.contains("c-coll__card--video")) return;
      var media = card.querySelector(".c-coll__media");
      if (!media) return;
      media.addEventListener("click", function () {
        if (card.classList.contains("is-front")) playVideo(card);
      });
      media.addEventListener("keydown", function (e) {
        if ((e.key === "Enter" || e.key === " ") && card.classList.contains("is-front")) {
          e.preventDefault(); playVideo(card);
        }
      });
    });

    // arrows + touch swipe
    if (prevBtn) prevBtn.addEventListener("click", function () { go(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(1); });
    var sx = 0, sy = 0, tracking = false;
    deck.addEventListener("touchstart", function (e) {
      tracking = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    deck.addEventListener("touchend", function (e) {
      if (!tracking) return; tracking = false;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    render();
  });

  /* ---- Hero pointer choreography (live type) ----
     Two live effects CSS can't express on its own: a hue spotlight that tracks the
     cursor across the grid (--mx/--my, 0-1) and a hairline parallax tilt on the
     giant title (--tilt-x/--tilt-y). Both are rAF-throttled, write only custom
     props (CSS springs the visuals), and are fully gated on reduced-motion. The
     title's colour-fill hue drift is CSS-owned (see _home.scss) - not here. ---- */
  var hero = document.getElementById("c-hero");
  var heroTitle = hero && hero.querySelector(".c-hero__title");
  if (hero && !reduce) {
    var hx = 0.3, hy = 0.42, heroRaf = null;
    function paintHero() {
      heroRaf = null;
      hero.style.setProperty("--mx", hx.toFixed(3));
      hero.style.setProperty("--my", hy.toFixed(3));
      if (heroTitle) {
        // small, tasteful: +-3.2deg yaw, +-2deg pitch, centred at rest.
        heroTitle.style.setProperty("--tilt-x", ((hx - 0.5) * 6.4).toFixed(2) + "deg");
        heroTitle.style.setProperty("--tilt-y", ((0.5 - hy) * 4).toFixed(2) + "deg");
      }
    }
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      hy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      if (!heroRaf) heroRaf = requestAnimationFrame(paintHero);
    });
    // ease the tilt back to flat when the pointer leaves the hero.
    hero.addEventListener("pointerleave", function () {
      hx = 0.3; hy = 0.42;
      if (!heroRaf) heroRaf = requestAnimationFrame(paintHero);
    });
  }

  /* ---- GSAP hero choreography ---- */
  if (reduce || typeof gsap === "undefined") return;

  // playful hand wave on the About intro
  var wave = document.getElementById("c-wave");
  if (wave) gsap.to(wave, { rotation: 18, duration: 0.5, yoyo: true, repeat: 5, repeatDelay: 2.4,
    transformOrigin: "70% 70%", ease: "power1.inOut" });

  var lines = gsap.utils.toArray(".c-hero__title .line > span");
  gsap.set(lines, { yPercent: 115 });
  var tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  lines.forEach(function (ln, i) {
    tl.to(ln, { yPercent: 0, duration: 1.0 }, i === 0 ? 0.15 : "-=0.82");
  });

  // eyebrow leads, then the intro copy and actions cascade in just after the last
  // title line lands - the giant type and the intro paragraph read as one gesture.
  var fades = [".c-hero__eyebrow", ".c-hero__intro", ".c-hero__cta", ".c-jump"];
  gsap.set(fades, { opacity: 0, y: 20 });
  tl.to(".c-hero__eyebrow", { opacity: 1, y: 0, duration: 0.7 }, 0.0)
    .to(".c-hero__intro",   { opacity: 1, y: 0, duration: 0.7 }, "-=0.35")
    .to(".c-hero__cta",     { opacity: 1, y: 0, duration: 0.7 }, "-=0.5")
    .to(".c-jump",          { opacity: 1, y: 0, duration: 0.7 }, "-=0.55");
})();
