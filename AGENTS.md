# AGENTS.md - Colorful

Engineering and design constitution for this repository. Read before any change.

## What this project is

`Colorful` is Archer's personal blog, built on Jekyll. The theme is a hard fork of
minimal-mistakes-jekyll 4.28.0, vendored directly into this repo (`_layouts`,
`_includes`, `_sass`, `assets`, `_data`) with **no theme gem dependency**. We are
the authors of the theme now: every layout, include, DOM structure, and class is
ours to rewrite. The functional Jekyll plugins (sitemap, feed, gist, paginate-v2,
include-cache) are declared explicitly in the Gemfile.

## Language & communication

- Conversation with the maintainer is in **Chinese**.
- **All code, comments, commit messages, identifiers, and UI copy are in English.**
- The site is going multilingual (English default, Chinese switchable). Build the
  theme/UI layer English-first and i18n-ready; full content translation is a
  separate later effort.

## Engineering standard

- **Industrial-grade rigor** even though this is a personal blog. No partial
  features, no TODO stubs, no mock data, no dead code left behind.
- **Never break existing functionality.** Collections (movie/book/events/travel/ca),
  posts, dynamic data rendering, lunr search, giscus comments, paginate-v2,
  sitemap, and feed must all keep working. Verify with a build after every change.
- Prefer editing tokens/partials so one change propagates site-wide (this is a
  theme, not a page). One set of theme CSS should style the whole site.
- Keep the workspace clean: no stray screenshots, logs, or temp files committed.

## Design constitution (READ EVERY TIME BEFORE UI WORK)

1. **UX and information architecture come first, always.** Visual and interaction
   consistency serve UX; never the reverse. Before designing any element ask:
   is the reader's experience good? Is the information hierarchy right? Does this
   element's prominence match its importance? (Example: search is a top-level,
   high-frequency action, so it lives in the nav at the primary level and expands
   from the top into a wide bar - not buried inside the hero.)
2. **No mindless stacking. Think and ask before adding.** Do not race to write
   code. Before every change: (a) read the relevant taste-skill section (every
   time, not from memory); (b) consider whether the new thing should MERGE with an
   existing area rather than become a new block (e.g. a transparent portrait can
   live inside the hero, not a separate About section); (c) design for the user's
   real needs - content replaceability (dynamic data grows/shrinks), every
   interaction edge (click-outside to close, back, keyboard, focus), and truly
   perfect rendering on ALL devices (small screens must be genuinely 100%, not a
   shrunk desktop); (d) when unsure, ASK - do not invent a direction and pile it on.
2. **Consult the taste skills before writing any UI/CSS/interaction.** This is a
   hard rule, not a suggestion:
   - `design-taste-frontend` - anti-slop, Pre-Flight checklist, AI-tell bans
     (zero em-dashes, no decorative dots, no scroll cues, one accent lock, etc.)
   - `high-end-visual-design` - what makes design feel expensive: nested
     double-bezel containers, ultra-soft diffuse shadows, custom cubic-bezier
     motion, giant type, macro-whitespace; and its banned list.
   - `minimalist-ui` - color is a scarce resource, typographic contrast,
     structural whitespace.
   - `brandkit` when working on logo/identity.
3. **Design language** (locked, see the redesign brief memory):
   - Concept: "Colorful = content is the color." Quiet near-white canvas
     (`--c-bg #FCFCFD`); each content type owns one dopamine hue
     (writing coral, projects amber, reading spring-green, travel sky, code&art iris).
     Whitespace leads, color punctuates. No rainbow, no prism, no WebGL fog.
   - Impact comes from giant grotesk type + luxurious whitespace + tasteful GSAP,
     not canvas gimmicks. Works perfectly on every device.
   - Type: General Sans (display+body), JetBrains Mono, CJK system fallback.
   - Dual theme: light default, dark switchable, one token set drives both.
4. **Everything must be correct in BOTH light and dark mode.** Never leave a
   hard-coded color, border, or icon that ignores the theme tokens. No stray
   default-blue icons, no white borders on a dark canvas. Every color, border,
   and shadow reads from CSS variables in `_sass/colorful/_tokens.scss`.
5. **All devices must display perfectly.** Large screens get large media (do not
   shrink images to fit small viewports and call it responsive). Declare the
   mobile collapse explicitly for every multi-column layout. Use `min-h-[100dvh]`
   semantics (never fixed vh that jumps on mobile).
6. **Motion**: GSAP for choreography, custom easing, spring-back physics where it
   delights. Everything degrades under `prefers-reduced-motion`. Animate only
   `transform`/`opacity`.
7. **After any UI change, screenshot both light and dark** with Playwright, catch
   the obvious problems yourself, then hand off.

## Verification workflow

- The maintainer runs `bundle exec jekyll serve` and reviews changes personally.
- **Do not proactively screenshot** just to confirm; only screenshot when asked,
  or when self-checking a UI change before handoff (per rule 7 above).
- Prototypes live on isolated routes (e.g. `/lab/home/`) with real data so the
  running dev server renders them, zero risk to the live site, until approved and
  migrated into the real theme.

## Theme architecture map

- `_sass/colorful/_tokens.scss` - single source of truth for color/type/space/
  radius/shadow/motion; light default + `[data-theme="dark"]` overrides.
- `_sass/colorful/_base.scss` - reset, document type, buttons, section rhythm, grain.
- `_sass/colorful/_nav.scss` - floating glass nav + mobile overlay menu.
- `_sass/colorful/_home.scss` - home sections.
- `assets/css/colorful.scss` - compiled entry.
- `assets/js/colorful/*.js` - vanilla JS (no jQuery in new code); search reuses the
  lunr index data but replaces the jQuery query/render layer.
- `_data/colorful.yml` - content-type to hue mapping consumed by templates.
