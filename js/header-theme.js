/**
 * header-theme.js
 * ───────────────────────────────────────────────────────────────────────────
 * Automatic header theme switcher for RYZE.
 *
 * Strategy
 * ────────
 * 1. SCROLL DETECTION (primary)
 *    On every scroll tick (throttled to one rAF per frame) we sample the
 *    background colour of the element visually behind the header's midpoint.
 *    This is the main mechanism for pages with dark heroes that transition
 *    to white content sections.
 *
 * 2. MUTATION OBSERVER (secondary)
 *    Watches <body> and <html> for class/style attribute changes.
 *    Covers: theme toggles, SPA navigation, AJAX content loads.
 *
 * 3. RESIZE OBSERVER (tertiary)
 *    Rechecks on viewport resize — layout shifts can change what sits behind
 *    the header.
 *
 * The bootstrap script in header.html already ran applyTheme() synchronously
 * before first paint, so this file only handles *ongoing* changes.
 *
 * API
 * ───
 * window.__ryzeHeaderTheme.check()   — force an immediate recheck
 * window.__ryzeHeaderTheme.destroy() — tear down all observers (SPA cleanup)
 * ───────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Grab shared helpers injected by the inline bootstrap script ── */
  var applyTheme    = window.__headerApplyTheme;
  var isNearWhite   = window.__headerIsNearWhite;
  var resolvedBg    = window.__headerResolvedBg;

  var header = document.getElementById('custom-header');
  var logo   = document.getElementById('header-logo');

  if (!header || !logo || !applyTheme) {
    console.warn('[header-theme] Required elements or bootstrap helpers not found.');
    return;
  }

  /* ── Constants ── */
  var HEADER_HEIGHT  = 80;   /* px: approximate, used for hit-point calculation */
  var SAMPLE_OFFSET  = 4;    /* px: sample this far below the header bottom edge */
  var WHITE_THRESHOLD = 240; /* RGB: channels must all be >= this to count as white */

  /* ── State ── */
  var rafPending = false;
  var lastIsLight = null; /* track last applied state to avoid redundant DOM writes */

  /* ──────────────────────────────────────────────────────────────────────
     CORE DETECTION
     Sample the pixel(s) behind the header using elementFromPoint, then
     walk up that element's ancestor chain for a non-transparent background.
  ────────────────────────────────────────────────────────────────────── */
  function getBackgroundBehindHeader() {
    var x = Math.round(window.innerWidth  / 2);
    var y = HEADER_HEIGHT + SAMPLE_OFFSET + window.scrollY;  /* doc coords */
    /* Convert to viewport coords for elementFromPoint */
    var viewY = HEADER_HEIGHT + SAMPLE_OFFSET;

    /* Temporarily hide the header so elementFromPoint sees through it */
    header.style.visibility = 'hidden';
    var el = document.elementFromPoint(x, viewY);
    header.style.visibility = '';

    if (!el) return null;

    /* Walk ancestors for a non-transparent background */
    return resolvedBg(el);
  }

  function check() {
    var bg = getBackgroundBehindHeader();
    var light = isNearWhite(bg);

    /* Only touch the DOM when state actually changes */
    if (light !== lastIsLight) {
      lastIsLight = light;
      applyTheme(light);
    }
  }

  /* ──────────────────────────────────────────────────────────────────────
     SCROLL HANDLER — throttled to one check per animation frame
  ────────────────────────────────────────────────────────────────────── */
  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      check();
    });
  }

  /* ──────────────────────────────────────────────────────────────────────
     MUTATION OBSERVER
     Watches for class or style changes on <html> and <body>, covering:
       - Dark-mode toggles  (e.g. body.dark-theme)
       - Shopify section swaps
       - Any runtime background change via JS
  ────────────────────────────────────────────────────────────────────── */
  var mutationObs = new MutationObserver(function () {
    /* Debounce: a single rAF is sufficient; mutations fire synchronously */
    requestAnimationFrame(check);
  });

  mutationObs.observe(document.body, {
    attributes     : true,
    attributeFilter: ['class', 'style'],
    subtree        : false,
  });
  mutationObs.observe(document.documentElement, {
    attributes     : true,
    attributeFilter: ['class', 'style'],
    subtree        : false,
  });

  /* Also observe direct children of <body> for background changes on
     section/hero elements (covers most Shopify section injection patterns) */
  mutationObs.observe(document.body, {
    childList: true,
    subtree  : false,
  });

  /* ──────────────────────────────────────────────────────────────────────
     RESIZE OBSERVER
     Layout reflows (e.g. mobile → desktop, font-size change) can shift
     which element is visually behind the header.
  ────────────────────────────────────────────────────────────────────── */
  var resizeObs = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObs = new ResizeObserver(function () {
      requestAnimationFrame(check);
    });
    resizeObs.observe(document.documentElement);
  }

  /* ──────────────────────────────────────────────────────────────────────
     INTERSECTION OBSERVER
     Fires whenever a direct child of <body> enters/leaves the viewport
     area occupied by the header. Catches section colour changes on scroll
     without relying solely on the scroll event (better for passive scroll).
  ────────────────────────────────────────────────────────────────────── */
  var intersectionObs = null;
  if (typeof IntersectionObserver !== 'undefined') {
    /* Root margin: trigger slightly before the element reaches the header */
    intersectionObs = new IntersectionObserver(function () {
      requestAnimationFrame(check);
    }, {
      root      : null,
      /* Top of viewport to just below the header */
      rootMargin: '0px 0px -' + (window.innerHeight - HEADER_HEIGHT - SAMPLE_OFFSET * 2) + 'px 0px',
      threshold : [0, 0.01, 0.1, 0.5, 1],
    });

    /* Observe top-level sections/divs that are likely hero or content blocks */
    document.querySelectorAll('body > *, body > section, body > div, body > main').forEach(function (el) {
      if (el !== header) intersectionObs.observe(el);
    });
  }

  /* ──────────────────────────────────────────────────────────────────────
     SCROLL LISTENER — passive for performance
  ────────────────────────────────────────────────────────────────────── */
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ──────────────────────────────────────────────────────────────────────
     INITIAL CHECK (run once observers are all wired up)
  ────────────────────────────────────────────────────────────────────── */
  check();

  /* ──────────────────────────────────────────────────────────────────────
     PUBLIC API
  ────────────────────────────────────────────────────────────────────── */
  window.__ryzeHeaderTheme = {
    /**
     * Force an immediate recheck.
     * Call this after any programmatic background change that isn't
     * reflected in a class/style attribute (e.g. canvas-drawn backgrounds).
     */
    check: check,

    /**
     * Tear down all observers and event listeners.
     * Useful for SPA frameworks (React Router, Vue Router, etc.) when
     * the header component unmounts.
     */
    destroy: function () {
      window.removeEventListener('scroll', onScroll);
      mutationObs.disconnect();
      if (resizeObs)      resizeObs.disconnect();
      if (intersectionObs) intersectionObs.disconnect();
    },
  };

}());
