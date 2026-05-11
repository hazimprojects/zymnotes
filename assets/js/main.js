document.documentElement.classList.add("js-enhanced");

// Nyahaktifkan mod bahasa Cina tersimpan pada halaman tanpa kandungan zh (main.js dimuat di semua halaman utama)
(function () {
  var LANG_KEY = "hzedu-lang-mode";
  function hzZymnotesIsZhContentNotePathname(p) {
    if (!p || typeof p !== "string") return false;
    return (
      /\/notes\/bab-[1-8](?:\.html)?(?:\/)?$/i.test(p) ||
      /\/notes\/bab-\d+-\d+(?:\.html)?(?:\/)?$/i.test(p)
    );
  }
  function hzZymnotesClearStoredZhModeIfNeeded() {
    var p = (window.location.pathname || "").split("?")[0];
    if (hzZymnotesIsZhContentNotePathname(p)) return;
    try {
      localStorage.removeItem(LANG_KEY);
    } catch (e) {}
    document.documentElement.removeAttribute("data-lang-mode");
  }
  hzZymnotesClearStoredZhModeIfNeeded();
})();

// =========================
// ZYMSTORE — Pengurusan data tersimpan (5 kunci bersih menggantikan kunci berserak lama)
// =========================
window.ZymStore = (function () {
  var KEYS = {
    prefs:     'zym.prefs',
    quiz:      'zym.quiz',
    feedback:  'zym.feedback',
    dismissed: 'zym.dismissed',
    app:       'zym.app'
  };

  function _read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  function _write(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }

  function _defaultPrefs() { return { theme: null, fabCorner: 'br' }; }
  function getPrefs() { return Object.assign(_defaultPrefs(), _read(KEYS.prefs) || {}); }
  function getPref(k) { return getPrefs()[k]; }
  function hasPref(k) { return Object.prototype.hasOwnProperty.call(_read(KEYS.prefs) || {}, k); }
  function setPref(k, v) { var p = getPrefs(); p[k] = v; _write(KEYS.prefs, p); }

  function getQuizScore(id) { return (_read(KEYS.quiz) || {})[id] || 0; }
  function saveQuizScore(id, score) {
    var q = _read(KEYS.quiz) || {};
    if (score > (q[id] || 0)) { q[id] = score; _write(KEYS.quiz, q); }
  }
  function clearQuizScores() { try { localStorage.removeItem(KEYS.quiz); } catch (e) {} }
  function getQuizCount() { return Object.keys(_read(KEYS.quiz) || {}).length; }
  function getAllQuizScores() { return Object.assign({}, _read(KEYS.quiz) || {}); }
  function deleteQuizScore(id) {
    var q = _read(KEYS.quiz) || {}; delete q[id];
    if (Object.keys(q).length) _write(KEYS.quiz, q); else try { localStorage.removeItem(KEYS.quiz); } catch (e) {}
  }

  // Format baru: { s: rowId|'p'|null, o: {key,id}|null }
  // Legacy: string 'mudah' atau {r,id} — diubah ke format baru secara automatik
  function _fbNorm(v) {
    if (!v) return { s: null, o: null };
    if (typeof v === 'string') return { s: null, o: { key: v, id: null } };
    if (v.r !== undefined) return { s: null, o: { key: v.r, id: v.id || null } };
    return { s: v.s != null ? v.s : null, o: v.o || null };
  }
  function getFeedback(path) {
    var e = _fbNorm((_read(KEYS.feedback) || {})[path]);
    return e.o ? e.o.key : null;
  }
  function getFeedbackId(path) {
    var e = _fbNorm((_read(KEYS.feedback) || {})[path]);
    return (e.o && typeof e.o.id === 'number') ? e.o.id : null;
  }
  function getSukaGiven(path) { return _fbNorm((_read(KEYS.feedback) || {})[path]).s != null; }
  function getSukaId(path) {
    var s = _fbNorm((_read(KEYS.feedback) || {})[path]).s;
    return typeof s === 'number' ? s : null;
  }
  function clearSuka(path) {
    var f = _read(KEYS.feedback) || {};
    var e = _fbNorm(f[path]);
    e.s = null;
    if (e.o) {
      f[path] = { s: null, o: e.o };
      _write(KEYS.feedback, f);
    } else {
      delete f[path];
      if (Object.keys(f).length) _write(KEYS.feedback, f);
      else try { localStorage.removeItem(KEYS.feedback); } catch (x) {}
    }
  }
  function clearOpinion(path) {
    var f = _read(KEYS.feedback) || {};
    var e = _fbNorm(f[path]);
    e.o = null;
    if (e.s != null) {
      f[path] = { s: e.s, o: null };
      _write(KEYS.feedback, f);
    } else {
      delete f[path];
      if (Object.keys(f).length) _write(KEYS.feedback, f);
      else try { localStorage.removeItem(KEYS.feedback); } catch (x) {}
    }
  }
  function saveFeedback(path, reaction, supId) {
    var f = _read(KEYS.feedback) || {};
    var e = _fbNorm(f[path]);
    if (reaction === 'suka') {
      e.s = supId != null ? supId : (e.s != null ? e.s : 'p');
    } else {
      e.o = { key: reaction, id: supId != null ? supId : (e.o && e.o.key === reaction ? e.o.id : null) };
    }
    f[path] = { s: e.s, o: e.o };
    _write(KEYS.feedback, f);
  }
  function clearFeedback() { try { localStorage.removeItem(KEYS.feedback); } catch (e) {} }
  function getFeedbackCount() { return Object.keys(_read(KEYS.feedback) || {}).length; }
  function getAllFeedback() { return Object.assign({}, _read(KEYS.feedback) || {}); }
  function deleteFeedbackEntry(path) {
    var f = _read(KEYS.feedback) || {}; delete f[path];
    if (Object.keys(f).length) _write(KEYS.feedback, f); else try { localStorage.removeItem(KEYS.feedback); } catch (e) {}
  }

  function isDismissed(k) { return !!(_read(KEYS.dismissed) || {})[k]; }
  function setDismissed(k) { var d = _read(KEYS.dismissed) || {}; d[k] = true; _write(KEYS.dismissed, d); }

  function getApp(k) { return (_read(KEYS.app) || {})[k]; }
  function setApp(k, v) { var a = _read(KEYS.app) || {}; a[k] = v; _write(KEYS.app, a); }

  function getUserSecret() {
    var a = _read(KEYS.app) || {};
    if (a.usersecret) return a.usersecret;
    var uid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    a.usersecret = uid; _write(KEYS.app, a);
    return uid;
  }

  function clearAll() {
    Object.keys(KEYS).forEach(function (k) {
      try { localStorage.removeItem(KEYS[k]); } catch (e) {}
    });
    // Bersihkan kunci lama sekiranya masih ada
    ['zymnotes-theme','hzedu-hand','hzedu-fab-corner','zymnotes-pwa-installed',
     'hzedu-chip-debug','hzedu-lang-mode'].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && (key.indexOf('hzaudio-notice') === 0 ||
                  key.indexOf('hzfb-') === 0 ||
                  key.indexOf('zymnotes-quiz-best-') === 0)) {
        toRemove.push(key);
      }
    }
    toRemove.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
  }

  function migrate() {
    if (((_read(KEYS.app) || {}).migrated)) return;
    var prefs = Object.assign(_defaultPrefs(), _read(KEYS.prefs) || {});
    var oldTheme = localStorage.getItem('zymnotes-theme');
    if (oldTheme) prefs.theme = oldTheme;
    var oldCorner = localStorage.getItem('hzedu-fab-corner');
    if (oldCorner) prefs.fabCorner = oldCorner;
    _write(KEYS.prefs, prefs);

    var quiz = _read(KEYS.quiz) || {};
    var fb = _read(KEYS.feedback) || {};
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k) continue;
      if (k.indexOf('zymnotes-quiz-best-') === 0) {
        quiz[k.replace('zymnotes-quiz-best-', '')] = parseInt(localStorage.getItem(k) || '0', 10);
        toRemove.push(k);
      } else if (k.indexOf('hzfb-') === 0) {
        fb[k.replace('hzfb-', '')] = localStorage.getItem(k);
        toRemove.push(k);
      } else if (k.indexOf('hzaudio-notice') === 0) {
        toRemove.push(k);
      }
    }
    if (Object.keys(quiz).length) _write(KEYS.quiz, quiz);
    if (Object.keys(fb).length) _write(KEYS.feedback, fb);
    if (localStorage.getItem('zymnotes-pwa-installed') === '1') setApp('pwaInstalled', true);
    setApp('migrated', true);
    ['zymnotes-theme','hzedu-hand','hzedu-fab-corner','zymnotes-pwa-installed','hzedu-chip-debug'].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    toRemove.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
  }

  return {
    getPref: getPref, hasPref: hasPref, setPref: setPref, getPrefs: getPrefs,
    getQuizScore: getQuizScore, saveQuizScore: saveQuizScore,
    clearQuizScores: clearQuizScores, getQuizCount: getQuizCount,
    getAllQuizScores: getAllQuizScores, deleteQuizScore: deleteQuizScore,
    getFeedback: getFeedback, getFeedbackId: getFeedbackId, saveFeedback: saveFeedback,
    getSukaGiven: getSukaGiven, getSukaId: getSukaId, clearSuka: clearSuka, clearOpinion: clearOpinion,
    clearFeedback: clearFeedback, getFeedbackCount: getFeedbackCount,
    getAllFeedback: getAllFeedback, deleteFeedbackEntry: deleteFeedbackEntry,
    isDismissed: isDismissed, setDismissed: setDismissed, getUserSecret: getUserSecret,
    getApp: getApp, setApp: setApp,
    clearAll: clearAll, migrate: migrate
  };
})();

ZymStore.migrate();

// Latar bertema (bab induk, subtopik, kuiz bab) — denyut halus hanya CSS, tanpa scroll
(function () {
  var doc = document.documentElement;
  var body = document.body;
  if (!body) return;

  function hasClassPrefix(el, prefix) {
    if (!el || !el.classList) return false;
    var list = el.classList;
    for (var i = 0; i < list.length; i++) {
      if (list[i].indexOf(prefix) === 0) return true;
    }
    return false;
  }

  var isBabHub = body.classList.contains("bab-hub-page");
  var isReadingNotes =
    body.classList.contains("note-reading-app") &&
    body.classList.contains("page-theme-notes");
  var isBabQuiz =
    body.classList.contains("quiz-page") &&
    body.classList.contains("note-reading-app") &&
    body.classList.contains("page-theme-notes");

  if (!isBabHub && !isReadingNotes && !isBabQuiz) return;
  if (!hasClassPrefix(body, "bab-theme-")) return;

  doc.classList.add("hz-themed-scroll-backdrop");
  for (var i = 0; i < body.classList.length; i++) {
    var c = body.classList[i];
    if (c.indexOf("bab-theme-") === 0) {
      doc.classList.add(c);
      break;
    }
  }
})();


// =========================
// HOME (/) — PWA soft transition into page (standalone, once per session)
// =========================
(function () {
  var path = (location.pathname || "/").replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  var root = document.documentElement;
  var loader = document.getElementById("pwa-loader");
  var loaderDoneKey = "zym-loader-done";

  function isStandalonePwa() {
    try {
      if (window.matchMedia("(display-mode: standalone)").matches) return true;
    } catch (e) {}
    return typeof navigator.standalone === "boolean" && navigator.standalone;
  }

  function showLoader() {
    if (!loader) return;
    loader.removeAttribute("hidden");
    root.classList.add("pwa-loader-pending");
  }

  function removeLoaderCompletely() {
    root.classList.remove("pwa-loader-pending");
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
  }

  function hideLoaderAnimated() {
    if (!loader || loader.getAttribute("data-loader-dismissed") === "1") {
      removeLoaderCompletely();
      return;
    }
    loader.setAttribute("data-loader-dismissed", "1");
    loader.classList.add("pwa-loader--hide");
    root.classList.remove("pwa-loader-pending");
    var done = false;
    var fadeMs = 1200;
    function finish() {
      if (done) return;
      done = true;
      removeLoaderCompletely();
    }
    function onTransitionEnd(ev) {
      if (ev && ev.target === loader && ev.propertyName === "opacity") {
        finish();
      }
    }
    loader.addEventListener("transitionend", onTransitionEnd);
    /* Fallback: jangan potong sebelum ~1.2s opacity selesai (bukan 780ms) */
    setTimeout(finish, fadeMs + 400);
  }

  try {
    if (sessionStorage.getItem(loaderDoneKey) === "1") {
      removeLoaderCompletely();
      return;
    }
  } catch (e) {}

  if (!isStandalonePwa()) {
    removeLoaderCompletely();
    return;
  }

  showLoader();

  var fontsPromise =
    document.fonts && document.fonts.ready
      ? document.fonts.ready.catch(function () {})
      : Promise.resolve();

  function runLoadSequence() {
    /* ~2.6s minimum so tagline can be read once comfortably */
    var minMs = 2600;
    var maxWaitMs = 11000;
    var t0 = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

    function elapsed() {
      var t = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
      return t - t0;
    }

    function waitForLoaderEnd() {
      return Promise.all([
        fontsPromise,
        new Promise(function (r) {
          setTimeout(r, minMs);
        }),
      ]).then(function () {
        return new Promise(function (r) {
          requestAnimationFrame(function () {
            requestAnimationFrame(r);
          });
        });
      });
    }

    var budget = Math.max(0, maxWaitMs - elapsed());
    Promise.race([
      waitForLoaderEnd(),
      new Promise(function (r) {
        setTimeout(r, budget);
      }),
    ]).then(function () {
      try {
        sessionStorage.setItem(loaderDoneKey, "1");
      } catch (e) {}
      hideLoaderAnimated();
    });
  }

  if (document.readyState === "complete") {
    runLoadSequence();
  } else {
    window.addEventListener("load", runLoadSequence, { once: true });
  }

  window.addEventListener("pageshow", function (ev) {
    if (ev.persisted) removeLoaderCompletely();
  });
})();

// ── SVG Icon Library (shared: bottom nav, search, theme toggle) ─────────────
var HZ_ICONS = (function () {
  var s = ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  return {
    // Nav bar — Fluent UI System Icons (regular variant, fill="currentColor")
    home:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.55 2.53a2.25 2.25 0 012.9 0l6.75 5.86c.48.42.76 1.03.76 1.67V19.75A2.25 2.25 0 0118.7 22H14.5a1 1 0 01-1-1v-4.5h-3V21a1 1 0 01-1 1H5.29a2.25 2.25 0 01-2.25-2.25V10.06c0-.64.28-1.25.76-1.67l6.75-5.86zm1.45 1.12L5.25 9.51a.75.75 0 00-.21.55V19.75c0 .41.34.75.75.75H9v-4.5a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5V20.5h3.2a.75.75 0 00.75-.75V10.06a.75.75 0 00-.21-.55l-6.74-5.86z"/></svg>',
    notes:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 2A3.5 3.5 0 003 5.5v13A3.5 3.5 0 006.5 22h11a.5.5 0 000-1H6.5A2.5 2.5 0 014 18.5V5.5A2.5 2.5 0 016.5 3H17v9.5a.5.5 0 001 0V2.5a.5.5 0 00-.5-.5h-11zm3 5a.75.75 0 000 1.5h5a.75.75 0 000-1.5h-5zm0 3.5a.75.75 0 000 1.5h5a.75.75 0 000-1.5h-5zm0 3.5a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z"/></svg>',
    search:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2.75a7.25 7.25 0 014.96 12.48l4.9 4.9a.75.75 0 01-1.06 1.07l-4.9-4.9A7.25 7.25 0 1110 2.75zm0 1.5a5.75 5.75 0 100 11.5 5.75 5.75 0 000-11.5z"/></svg>',
    about:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 1.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zm0 6.5a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0v-5.5A.75.75 0 0112 10zm0-3.25a1 1 0 110 2 1 1 0 010-2z"/></svg>',
    // Other UI icons (Feather, stroke-based)
    sun:     '<svg viewBox="0 0 24 24"' + s + '><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon:    '<svg viewBox="0 0 24 24"' + s + '><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H23l-7.5 5.4 2.4 7.5L12 17.7l-5.9 4.6 2.4-7.5L1 9.4h8.6L12 2z"/></svg>',
    audio:      '<svg viewBox="0 0 24 24"' + s + '><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>',
    audioPause: '<svg viewBox="0 0 24 24"' + s + '><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    archive: '<svg viewBox="0 0 24 24"' + s + '><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
    close:   '<svg viewBox="0 0 24 24"' + s + '><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };
})();

// Icons8 3D Fluency — bottom nav bar
var HZ_ICONS8_NAV = {
  home:   'https://img.icons8.com/3d-fluency/96/home.png',
  notes:  'https://img.icons8.com/3d-fluency/96/book-shelf.png',
  search: 'https://img.icons8.com/3d-fluency/96/search.png',
  about:  'https://img.icons8.com/3d-fluency/96/about.png'
};
function hzNavImg(key) {
  return '<img class="hz-nav-img" src="' + HZ_ICONS8_NAV[key] + '" alt="" width="28" height="28" decoding="async">';
}

// Nav bar filled variants (Fluent UI System Icons — active state)
var HZ_ICONS_FILLED = {
  home:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.45 2.53a2.25 2.25 0 00-2.9 0L3.8 8.39a2.25 2.25 0 00-.76 1.67v9.69A2.25 2.25 0 005.29 22H9.5a1 1 0 001-1v-4.5h3V21a1 1 0 001 1h4.2a2.25 2.25 0 002.25-2.25v-9.7c0-.63-.28-1.24-.76-1.66l-6.74-5.86z"/></svg>',
  notes:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 2H6.5A3.5 3.5 0 003 5.5v13A3.5 3.5 0 006.5 22H17a.5.5 0 000-1H6.5A2.5 2.5 0 014 18.5V5.5A2.5 2.5 0 016.5 3H17v9.5a.5.5 0 001 0V2.5a.5.5 0 00-.5-.5zM9.5 7a.75.75 0 000 1.5h5a.75.75 0 000-1.5h-5zm0 3.5a.75.75 0 000 1.5h5a.75.75 0 000-1.5h-5zm0 3.5a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2.75a7.25 7.25 0 014.96 12.48l4.9 4.9a.75.75 0 01-1.06 1.07l-4.9-4.9A7.25 7.25 0 1110 2.75z"/></svg>',
  about:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 6.5a1 1 0 110 2 1 1 0 010-2zm0 3.25a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0v-5.5A.75.75 0 0112 11.75z"/></svg>'
};

// =========================
// DARK MODE
// =========================
(function () {
  function getTheme() {
    return (
      ZymStore.getPref('theme') ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    );
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    ZymStore.setPref('theme', theme);
    var tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.content = theme === "dark" ? "#0D0F1A" : "#ffffff";
  }

  applyTheme(getTheme());

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!ZymStore.hasPref('theme')) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });

  window.hzApplyTheme = applyTheme;
})();

document.addEventListener("DOMContentLoaded", function () {
  // =========================
  // NAV TOGGLE
  // =========================
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        siteNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (event) => {
      const clickedInsideNav = siteNav.contains(event.target);
      const clickedToggle = navToggle.contains(event.target);
      const clickedDisplayFab = event.target.closest(".display-fab");
      const clickedZhFab = event.target.closest(".zh-mode-fab");

      if (!clickedInsideNav && !clickedToggle && !clickedDisplayFab && !clickedZhFab && siteNav.classList.contains("open")) {
        siteNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // =========================
  // PAPER TIMELINE — satu kad per langkah (tajuk + isi sentiasa kelihatan)
  // =========================
  document.querySelectorAll(".paper-timeline").forEach(function (wrap) {
    if (wrap.dataset.zymTimelineWrapped) return;
    wrap.dataset.zymTimelineWrapped = "1";
    var el = wrap.firstElementChild;
    while (el) {
      var next = el.nextElementSibling;
      if (
        el.classList &&
        el.classList.contains("paper-timeline-node") &&
        next &&
        next.classList &&
        next.classList.contains("paper-timeline-panel")
      ) {
        var card = document.createElement("article");
        card.className = "paper-timeline-card";
        card.setAttribute("role", "group");
        wrap.insertBefore(card, el);
        card.appendChild(el);
        card.appendChild(next);
        el = card.nextElementSibling;
      } else {
        el = next;
      }
    }
  });

  // =========================
  // PROCESS CARDS
  // =========================
  const processCards = document.querySelectorAll(".paper-process-card");
  const processPanels = document.querySelectorAll(".paper-process-panel");

  function activateProcessCard(card) {
    const targetId = card.getAttribute("data-process");
    if (!targetId) return;

    const targetPanel = document.getElementById(targetId);
    if (!targetPanel) return;

    processCards.forEach((item) => item.classList.remove("active"));
    processPanels.forEach((panel) => panel.classList.remove("active"));

    card.classList.add("active");
    targetPanel.classList.add("active");
  }

  if (processCards.length && processPanels.length) {
    processCards.forEach((card) => {
      card.addEventListener("click", () => activateProcessCard(card));
    });

    if (!document.querySelector(".paper-process-card.active")) {
      activateProcessCard(processCards[0]);
    }
  }

  // =========================
  // PAPER ACCORDION
  // =========================
  function getOwnAccordionPanel(item) {
    return item.querySelector(":scope > .paper-accordion-panel");
  }

  function getOwnAccordionTrigger(item) {
    return item.querySelector(":scope > .paper-accordion-trigger");
  }

  /** Nearest accordion group: parent .paper-accordion of this item (fixes nested accordions; closest() would grab the outer wrapper). */
  function getAccordionGroupForItem(item) {
    if (!item || !item.parentElement) return null;
    const parent = item.parentElement;
    return parent.classList.contains("paper-accordion")
      ? parent
      : item.closest(".paper-accordion");
  }

  function animateOpen(panel, item) {
    panel.classList.add("active");
    item.classList.add("is-open");

    panel.style.overflow = "hidden";
    panel.style.maxHeight = "0px";
    panel.style.opacity = "1";

    requestAnimationFrame(() => {
      panel.style.maxHeight = panel.scrollHeight + "px";
      panel.style.opacity = "1";
    });

    const onTransitionEnd = function (e) {
      if (e.target !== panel || e.propertyName !== "max-height") return;
      if (item.classList.contains("is-open")) {
        panel.style.maxHeight = "none";
        panel.style.overflow = "visible";
      }
      panel.removeEventListener("transitionend", onTransitionEnd);
    };

    panel.addEventListener("transitionend", onTransitionEnd);
  }

  function animateClose(panel, item) {
    const fullHeight = panel.scrollHeight;

    panel.style.overflow = "hidden";
    panel.style.maxHeight = fullHeight + "px";

    requestAnimationFrame(() => {
      if (!item.classList.contains("is-open")) {
        panel.style.maxHeight = "0px";
        panel.style.opacity = "0";
      }
    });

    const onTransitionEnd = function (e) {
      if (e.target !== panel || e.propertyName !== "max-height") return;
      if (!item.classList.contains("is-open")) {
        panel.classList.remove("active");
      }
      panel.removeEventListener("transitionend", onTransitionEnd);
    };

    panel.addEventListener("transitionend", onTransitionEnd);
  }

  function setAccordionState(item, open) {
    const trigger = getOwnAccordionTrigger(item);
    const panel = getOwnAccordionPanel(item);
    if (!trigger || !panel) return;

    trigger.classList.toggle("active", open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");

    if (open) {
      animateOpen(panel, item);
    } else {
      item.classList.remove("is-open");
      animateClose(panel, item);
    }
  }

  function getHeaderOffset() {
    const header = document.querySelector(".site-header");
    const headerHeight = header ? header.getBoundingClientRect().height : 72;
    const sticky = document.querySelector(".audio-sticky");
    const stickyHeight =
      sticky && sticky.classList.contains("is-visible")
        ? sticky.getBoundingClientRect().height
        : 0;
    return Math.round(headerHeight + stickyHeight + 12);
  }

  function waitUntilScrollReaches(targetTop, callback) {
    let stableFrames = 0;
    const MAX_FRAMES = 90;
    let frameCount = 0;

    function check() {
      frameCount += 1;
      const distance = Math.abs(window.scrollY - targetTop);

      if (distance <= 2) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
      }

      if (stableFrames >= 4 || frameCount >= MAX_FRAMES) {
        window.scrollTo(0, targetTop);
        callback();
        return;
      }

      requestAnimationFrame(check);
    }

    requestAnimationFrame(check);
  }

  function refreshOpenAccordions() {
    document.querySelectorAll(".paper-accordion-item.is-open").forEach((item) => {
      const panel = getOwnAccordionPanel(item);
      if (!panel) return;

      panel.style.maxHeight = "none";
      const height = panel.scrollHeight;
      panel.style.overflow = "hidden";
      panel.style.maxHeight = height + "px";

      requestAnimationFrame(() => {
        if (item.classList.contains("is-open")) {
          panel.style.maxHeight = "none";
          panel.style.overflow = "visible";
        }
      });
    });
  }

  function prepareAccordionPanels(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll(".paper-accordion-trigger").forEach((trigger) => {
      const item = trigger.closest(".paper-accordion-item");
      const panel = item ? getOwnAccordionPanel(item) : null;

      trigger.setAttribute(
        "aria-expanded",
        item && item.classList.contains("is-open") ? "true" : "false"
      );

      if (panel && item && !item.classList.contains("is-open")) {
        panel.style.maxHeight = "0px";
        panel.style.opacity = "0";
        panel.style.overflow = "hidden";
      }

      if (panel && item && item.classList.contains("is-open")) {
        panel.classList.add("active");
        panel.style.maxHeight = "none";
        panel.style.opacity = "1";
        panel.style.overflow = "visible";
      }
    });
  }

  window.hzPreparePaperAccordions = prepareAccordionPanels;

  document.body.addEventListener("click", function (accordionEv) {
    const trigger = accordionEv.target.closest(".paper-accordion-trigger");
    if (!trigger || !document.body.contains(trigger)) return;

    const currentItem = trigger.closest(".paper-accordion-item");
    const accordionGroup = getAccordionGroupForItem(currentItem);
    if (!currentItem || !accordionGroup) return;

    const wasOpen = currentItem.classList.contains("is-open");

    if (wasOpen) {
      const anchorTop = trigger.getBoundingClientRect().top;

      document.documentElement.classList.add("accordion-no-smooth-scroll");
      document.body.classList.add("accordion-no-smooth-scroll");

      accordionGroup
        .querySelectorAll(":scope > .paper-accordion-item")
        .forEach((item) => {
          setAccordionState(item, false);
        });

      trigger.blur();

      let stillFrames = 0;
      let lastTop = null;
      const REQUIRED_STILL_FRAMES = 10;
      const MAX_FRAMES = 40;
      let frameCount = 0;

      function stabilizeClose() {
        frameCount += 1;

        const currentTop = trigger.getBoundingClientRect().top;
        const delta = currentTop - anchorTop;

        if (Math.abs(delta) > 0.5) {
          window.scrollTo(window.scrollX, window.scrollY + delta);
        }

        const adjustedTop = trigger.getBoundingClientRect().top;

        if (lastTop !== null && Math.abs(adjustedTop - lastTop) < 0.25) {
          stillFrames += 1;
        } else {
          stillFrames = 0;
        }

        lastTop = adjustedTop;

        if (stillFrames < REQUIRED_STILL_FRAMES && frameCount < MAX_FRAMES) {
          requestAnimationFrame(stabilizeClose);
        } else {
          document.documentElement.classList.remove("accordion-no-smooth-scroll");
          document.body.classList.remove("accordion-no-smooth-scroll");
        }
      }

      requestAnimationFrame(stabilizeClose);
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const absoluteTop = window.scrollY + triggerRect.top;
    const targetTop = Math.max(0, Math.round(absoluteTop - getHeaderOffset()));

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });

    waitUntilScrollReaches(targetTop, () => {
      const anchorTop = trigger.getBoundingClientRect().top;

      document.documentElement.classList.add("accordion-no-smooth-scroll");
      document.body.classList.add("accordion-no-smooth-scroll");

      accordionGroup
        .querySelectorAll(":scope > .paper-accordion-item")
        .forEach((item) => {
          setAccordionState(item, false);
        });

      setAccordionState(currentItem, true);
      trigger.blur();

      let stillFrames = 0;
      let lastTop = null;
      const REQUIRED_STILL_FRAMES = 10;
      const MAX_FRAMES = 50;
      let frameCount = 0;

      function stabilizeOpen() {
        frameCount += 1;

        const currentTop = trigger.getBoundingClientRect().top;
        const delta = currentTop - anchorTop;

        if (Math.abs(delta) > 0.5) {
          window.scrollTo(window.scrollX, window.scrollY + delta);
        }

        const adjustedTop = trigger.getBoundingClientRect().top;

        if (lastTop !== null && Math.abs(adjustedTop - lastTop) < 0.25) {
          stillFrames += 1;
        } else {
          stillFrames = 0;
        }

        lastTop = adjustedTop;

        if (stillFrames < REQUIRED_STILL_FRAMES && frameCount < MAX_FRAMES) {
          requestAnimationFrame(stabilizeOpen);
        } else {
          document.documentElement.classList.remove("accordion-no-smooth-scroll");
          document.body.classList.remove("accordion-no-smooth-scroll");

          const finalAbsoluteTop = window.scrollY + trigger.getBoundingClientRect().top;
          const finalTargetTop = Math.max(
            0,
            Math.round(finalAbsoluteTop - getHeaderOffset())
          );

          window.scrollTo({
            top: finalTargetTop,
            behavior: "auto",
          });

          refreshOpenAccordions();
        }
      }

      requestAnimationFrame(stabilizeOpen);
    });
  });

  prepareAccordionPanels(document.body);

  window.addEventListener("resize", refreshOpenAccordions);

  // =========================
  // REVEAL ON SCROLL
  // =========================
  const revealElements = document.querySelectorAll(".reveal-on-scroll");

  if (revealElements.length) {
    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
      );

      revealElements.forEach((el) => revealObserver.observe(el));
    } else {
      function revealFallback() {
        revealElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight - 70) {
            el.classList.add("visible");
          }
        });
      }

      window.addEventListener("scroll", revealFallback, { passive: true });
      window.addEventListener("load", revealFallback);
    }
  }

  // =========================
  // AUDIO MARKER ON SUBTOPIC CARDS
  // =========================
  const SUBTOPIC_QUIZ_HREF_RE = /^bab-(?:1-[1-4]|2-[1-8])\.html$/i;

  function appendAriaHint(card, fragment) {
    const currentLabel = card.getAttribute("aria-label");
    if (!currentLabel) return;
    if (currentLabel.includes(fragment)) return;
    card.setAttribute("aria-label", `${currentLabel} (${fragment})`);
  }

  function injectBabCardFluent3dBadges() {
    var fluentRef = "62ecdc0d7ca5";
    var fluentBase =
      "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@" +
      fluentRef +
      "/assets";
    function fluentAsset(folderName, fileName) {
      return fluentBase + "/" + encodeURIComponent(folderName) + "/3D/" + fileName;
    }

    document.querySelectorAll(".bab-card-badge-fluent").forEach(function (el) {
      el.remove();
    });

    document
      .querySelectorAll(".bab-card[href].has-quiz, .bab-card[href].has-audio")
      .forEach(function (card) {
        var quiz = card.classList.contains("has-quiz");
        var audio = card.classList.contains("has-audio");
        if (!quiz && !audio) return;

        var wrap = document.createElement("span");
        wrap.className = "bab-card-badge-fluent";
        wrap.setAttribute("aria-hidden", "true");

        if (quiz) {
          var iq = document.createElement("img");
          iq.className = "fluent-3d-emoji fluent-3d-emoji--bab-badge";
          iq.src = fluentAsset("Puzzle piece", "puzzle_piece_3d.png");
          iq.alt = "";
          iq.width = 18;
          iq.height = 18;
          iq.decoding = "async";
          iq.setAttribute("data-bab-badge", "quiz");
          wrap.appendChild(iq);
        }
        if (audio) {
          var ia = document.createElement("img");
          ia.className = "fluent-3d-emoji fluent-3d-emoji--bab-badge";
          ia.src = fluentAsset("Headphone", "headphone_3d.png");
          ia.alt = "";
          ia.width = 18;
          ia.height = 18;
          ia.decoding = "async";
          ia.setAttribute("data-bab-badge", "audio");
          wrap.appendChild(ia);
        }

        card.appendChild(wrap);
      });
  }

  async function markSubtopicCardsWithAudio() {
    const subtopicCards = Array.from(document.querySelectorAll(".bab-card[href]")).filter((card) => {
      const href = card.getAttribute("href") || "";
      return /bab-\d+-\d+\.html$/i.test(href);
    });

    if (!subtopicCards.length) return;

    subtopicCards.forEach((card) => {
      const href = card.getAttribute("href") || "";
      const file = href.split("/").pop() || href;
      if (SUBTOPIC_QUIZ_HREF_RE.test(file)) {
        card.classList.add("has-quiz");
        card.setAttribute("data-has-quiz", "true");
        appendAriaHint(card, "ada kuiz");
      }
    });

    await Promise.all(
      subtopicCards.map(async (card) => {
        const href = card.getAttribute("href");
        if (!href) return;

        const slug = href.replace(/\.html$/i, "");
        const audioPath = `../assets/audio/${slug}.mp3`;

        try {
          const response = await fetch(audioPath, { method: "HEAD" });
          if (!response.ok) return;

          card.classList.add("has-audio");
          card.setAttribute("data-has-audio", "true");

          appendAriaHint(card, "ada audio");
        } catch (e) {
          // senyap sahaja jika audio belum wujud
        }
      })
    );

    injectBabCardFluent3dBadges();
  }

  markSubtopicCardsWithAudio();
});

/**
 * Path helpers for mindmap + sparkle menu + search (must match pretty URLs).
 * - Home is "/", "/index", "/index.html", "/index/", etc. — but never under /notes/.
 * - Notes section is any path containing "/notes" as a segment ("/notes", "/repo/notes/…").
 */
function hzZymnotesIsHomePathname(p) {
  if (!p || typeof p !== "string") return false;
  if (/\/notes(?:\/|$)/i.test(p)) return false;
  var tail = p.replace(/\/+$/, "").split("/").pop() || "";
  return tail === "" || tail === "index" || tail === "index.html";
}

function hzZymnotesIsNotesPathname(p) {
  return !!p && /\/notes(?:\/|$)/i.test(p);
}

function hzZymnotesIsFeedbackPathname(p) {
  if (!p || typeof p !== "string") return false;
  var tail = p.replace(/\/+$/, "").split("/").pop() || "";
  return /^feedback\.html$/i.test(tail);
}

/** Utama, indeks nota, tentang, maklum balas — sparkle menu + mindmap; bab induk + subtopik nota. */
function hzZymnotesIsSparkleShellPathname(p) {
  if (!p || typeof p !== "string") return false;
  if (hzZymnotesIsHomePathname(p) || hzZymnotesIsNotesPathname(p)) return true;
  var tail = p.replace(/\/+$/, "").split("/").pop() || "";
  return /^about\.html$/i.test(tail) || hzZymnotesIsFeedbackPathname(p);
}

/** Halaman induk bab sahaja: bab-1.html … bab-8.html (bukan subtopik). */
function hzZymnotesIsBabHubPathname(p) {
  if (!p || typeof p !== "string") return false;
  return /\/notes\/bab-[1-8](?:\.html)?(?:\/)?$/i.test(p);
}

/** Halaman nota subtopik: bab-X-Y.html (bukan bab induk). */
function hzZymnotesIsSubtopicNotePathname(p) {
  if (!p || typeof p !== "string") return false;
  return /\/notes\/bab-\d+-\d+(?:\.html)?(?:\/)?$/i.test(p);
}

/** Halaman kuiz bawah /quiz/ (contoh: bab-1-1.html). */
function hzZymnotesIsQuizPathname(p) {
  if (!p || typeof p !== "string") return false;
  return /\/quiz\/bab-\d+-\d+(?:\.html)?(?:\/)?$/i.test(p);
}

/** Site path prefix before "/notes/…" ("" or "/repo" style); always without trailing slash except "/". */
function hzZymnotesSiteRootPath() {
  var p = (window.location.pathname || "/").split("?")[0].split("#")[0];
  var m = p.match(/^(.*?)\/notes(?:\/|$)/i);
  if (m) {
    var prefix = m[1] || "";
    return prefix.replace(/\/+$/, "") || "/";
  }
  var trimmed = p.replace(/\/+$/, "");
  if (trimmed === "" || trimmed === "/") return "/";
  var dir = trimmed.replace(/\/[^/]+$/, "");
  return dir === "" ? "/" : dir;
}

/** Absolute URL to a file inside /notes/ (correct from homepage, chapter pages, and subtopics). */
function hzZymnotesNoteHref(filename) {
  var root = hzZymnotesSiteRootPath();
  var path = (root === "/" ? "/notes/" : root + "/notes/") + filename;
  try {
    return new URL(path, window.location.origin).href;
  } catch (e) {
    return path;
  }
}

// =========================
// SEARCH INDEX SOURCE (single source of truth)
// =========================
var HZ_NOTES_SEARCH_PAGES = [
  { title: "Bab 1 · Warisan Negara Bangsa", tag: "Bab Induk", href: "bab-1.html" },
  { title: "1.1 · Latar Belakang Negara Bangsa Sebelum Kedatangan Barat", tag: "Subtopik 1.1", href: "bab-1-1.html" },
  { title: "1.2 · Ciri-ciri Negara Bangsa Kesultanan Melayu Melaka", tag: "Subtopik 1.2", href: "bab-1-2.html" },
  { title: "1.3 · Keunggulan Sistem Pentadbiran dan Undang-undang", tag: "Subtopik 1.3", href: "bab-1-3.html" },
  { title: "1.4 · Peranan Pemerintah dan Rakyat", tag: "Subtopik 1.4", href: "bab-1-4.html" },

  { title: "Bab 2 · Kebangkitan Nasionalisme", tag: "Bab Induk", href: "bab-2.html" },
  { title: "2.1 · Maksud Nasionalisme", tag: "Subtopik 2.1", href: "bab-2-1.html" },
  { title: "2.2 · Perkembangan Idea Nasionalisme di Barat", tag: "Subtopik 2.2", href: "bab-2-2.html" },
  { title: "2.3 · Perkembangan Nasionalisme di Asia", tag: "Subtopik 2.3", href: "bab-2-3.html" },
  { title: "2.4 · Perkembangan Nasionalisme di Asia Tenggara", tag: "Subtopik 2.4", href: "bab-2-4.html" },
  { title: "2.5 · Kesedaran Nasionalisme di Negara Kita", tag: "Subtopik 2.5", href: "bab-2-5.html" },
  { title: "2.6 · Faktor Kemunculan Gerakan Nasionalisme", tag: "Subtopik 2.6", href: "bab-2-6.html" },
  { title: "2.7 · Perkembangan Nasionalisme", tag: "Subtopik 2.7", href: "bab-2-7.html" },
  { title: "2.8 · Kesan Perkembangan Nasionalisme", tag: "Subtopik 2.8", href: "bab-2-8.html" },

  { title: "Bab 3 · Konflik Dunia dan Pendudukan Jepun di Negara Kita", tag: "Bab Induk", href: "bab-3.html" },
  { title: "3.1 · Nasionalisme di Negara Kita Sebelum Perang Dunia", tag: "Subtopik 3.1", href: "bab-3-1.html" },
  { title: "3.2 · Latar Belakang Perang Dunia", tag: "Subtopik 3.2", href: "bab-3-2.html" },
  { title: "3.3 · Perang Dunia Kedua", tag: "Subtopik 3.3", href: "bab-3-3.html" },
  { title: "3.4 · Perang Dunia Kedua di Asia Pasifik", tag: "Subtopik 3.4", href: "bab-3-4.html" },
  { title: "3.5 · Faktor Kedatangan Jepun ke Negara Kita", tag: "Subtopik 3.5", href: "bab-3-5.html" },
  { title: "3.6 · Dasar Pendudukan Jepun di Negara Kita", tag: "Subtopik 3.6", href: "bab-3-6.html" },
  { title: "3.7 · Perjuangan Rakyat Menentang Pendudukan Jepun", tag: "Subtopik 3.7", href: "bab-3-7.html" },
  { title: "3.8 · Perkembangan Gerakan Nasionalisme Tempatan dan Pendudukan Jepun", tag: "Subtopik 3.8", href: "bab-3-8.html" },
  { title: "3.9 · Keadaan Negara Kita Selepas Kekalahan Jepun", tag: "Subtopik 3.9", href: "bab-3-9.html" },

  { title: "Bab 4 · Era Peralihan Kuasa British di Negara Kita", tag: "Bab Induk", href: "bab-4.html" },
  { title: "4.1 · British Military Administration (BMA)", tag: "Subtopik 4.1", href: "bab-4-1.html" },
  { title: "4.2 · Gagasan Malayan Union", tag: "Subtopik 4.2", href: "bab-4-2.html" },
  { title: "4.3 · Reaksi Penduduk Tempatan terhadap Malayan Union", tag: "Subtopik 4.3", href: "bab-4-3.html" },
  { title: "4.4 · Penyerahan Sarawak kepada Kerajaan British", tag: "Subtopik 4.4", href: "bab-4-4.html" },
  { title: "4.5 · Reaksi Penduduk Tempatan terhadap Penyerahan Sarawak", tag: "Subtopik 4.5", href: "bab-4-5.html" },
  { title: "4.6 · Penyerahan Sabah kepada Kerajaan British", tag: "Subtopik 4.6", href: "bab-4-6.html" },
  { title: "4.7 · Reaksi Penduduk Tempatan terhadap Penyerahan Sabah", tag: "Subtopik 4.7", href: "bab-4-7.html" },

  { title: "Bab 5 · Persekutuan Tanah Melayu 1948", tag: "Bab Induk", href: "bab-5.html" },
  { title: "5.1 · Latar Belakang Penubuhan Persekutuan Tanah Melayu 1948", tag: "Subtopik 5.1", href: "bab-5-1.html" },
  { title: "5.2 · Faktor Penubuhan Persekutuan Tanah Melayu 1948", tag: "Subtopik 5.2", href: "bab-5-2.html" },
  { title: "5.3 · Ciri-ciri Persekutuan Tanah Melayu 1948", tag: "Subtopik 5.3", href: "bab-5-3.html" },
  { title: "5.4 · Kesan Penubuhan Persekutuan Tanah Melayu 1948", tag: "Subtopik 5.4", href: "bab-5-4.html" },

  { title: "Bab 6 · Ancaman Komunis dan Perisytiharan Darurat", tag: "Bab Induk", href: "bab-6.html" },
  { title: "6.1 · Kemasukan Pengaruh Komunis di Negara Kita", tag: "Subtopik 6.1", href: "bab-6-1.html" },
  { title: "6.2 · Ancaman Komunis di Negara Kita", tag: "Subtopik 6.2", href: "bab-6-2.html" },
  { title: "6.3 · Usaha Menangani Ancaman Komunis", tag: "Subtopik 6.3", href: "bab-6-3.html" },
  { title: "6.4 · Kesan Zaman Darurat terhadap Negara Kita", tag: "Subtopik 6.4", href: "bab-6-4.html" },

  { title: "Bab 7 · Usaha Ke Arah Kemerdekaan", tag: "Bab Induk", href: "bab-7.html" },
  { title: "7.1 · Latar Belakang Idea Negara Merdeka", tag: "Subtopik 7.1", href: "bab-7-1.html" },
  { title: "7.2 · Jawatankuasa Hubungan Antara Kaum (CLC)", tag: "Subtopik 7.2", href: "bab-7-2.html" },
  { title: "7.3 · Sistem Ahli", tag: "Subtopik 7.3", href: "bab-7-3.html" },
  { title: "7.4 · Sistem Pendidikan Kebangsaan", tag: "Subtopik 7.4", href: "bab-7-4.html" },
  { title: "7.5 · Penubuhan Parti Politik", tag: "Subtopik 7.5", href: "bab-7-5.html" },

  { title: "Bab 8 · Pilihan Raya", tag: "Bab Induk", href: "bab-8.html" },
  { title: "8.1 · Perkembangan Pilihan Raya di Persekutuan Tanah Melayu", tag: "Subtopik 8.1", href: "bab-8-1.html" },
  { title: "8.2 · Proses Pilihan Raya Umum Pertama", tag: "Subtopik 8.2", href: "bab-8-2.html" },
  { title: "8.3 · Penubuhan Majlis Perundangan Persekutuan", tag: "Subtopik 8.3", href: "bab-8-3.html" },
  { title: "8.4 · Peranan Kabinet Pertama Persekutuan Tanah Melayu", tag: "Subtopik 8.4", href: "bab-8-4.html" },
];

// =========================
// SEARCH ENGINE — Full text fetch
// =========================
(function setupSearch() {
  const searchInput = document.querySelector(".search-input");
  if (!searchInput) return;

  const resultsContainer = document.querySelector(".search-results");
  const emptyState = document.querySelector(".search-empty");
  const countEl = document.querySelector(".search-result-count");
  if (!resultsContainer) return;

  const isInNotes = hzZymnotesIsNotesPathname(window.location.pathname);
  const base = isInNotes ? "" : "notes/";

  const PAGES = HZ_NOTES_SEARCH_PAGES;

  let INDEX = null;
  let indexBuilding = false;

  function extractText(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("header, footer, script, style, .site-nav, .hero-actions, .keyword-legend-wrap").forEach(function (el) {
      el.remove();
    });
    const main = doc.querySelector("main") || doc.body;
    return main ? main.textContent.replace(/\s+/g, " ").trim() : "";
  }

  async function buildIndex() {
    if (INDEX || indexBuilding) return;
    indexBuilding = true;
    INDEX = [];

    const fetches = PAGES.map(async function (page) {
      try {
        const res = await fetch(base + page.href);
        if (!res.ok) return;

        const html = await res.text();
        const fullText = extractText(html);

        INDEX.push({
          title: page.title,
          tag: page.tag,
          href: base + page.href,
          fullText: fullText.toLowerCase(),
          excerpt: fullText.slice(0, 160) + "...",
        });
      } catch (e) {
        // senyap sahaja
      }
    });

    await Promise.all(fetches);
    indexBuilding = false;
  }

  function normalize(str) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function highlight(text, query) {
    if (!query) return text;

    query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .forEach(function (word) {
        const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        text = text.replace(new RegExp("(" + esc + ")", "gi"), "<mark>$1</mark>");
      });

    return text;
  }

  function findExcerpt(fullText, query) {
    const words = query.toLowerCase().trim().split(/\s+/);
    const lower = fullText.toLowerCase();
    let best = -1;

    words.forEach(function (w) {
      const p = lower.indexOf(w);
      if (p !== -1 && (best === -1 || p < best)) best = p;
    });

    if (best === -1) return fullText.slice(0, 160) + "...";

    const s = Math.max(0, best - 40);
    const e = Math.min(fullText.length, best + 160);
    return (s > 0 ? "..." : "") + fullText.slice(s, e) + "...";
  }

  function search(query) {
    if (!INDEX) return [];

    const q = normalize(query.trim());
    if (!q) return [];

    const words = q.split(/\s+/).filter(Boolean);

    return INDEX.filter(function (item) {
      const hay = normalize(item.fullText + " " + item.title);
      return words.every(function (w) {
        return hay.includes(w);
      });
    }).map(function (item) {
      return Object.assign({}, item, {
        relevantExcerpt: findExcerpt(item.fullText, q),
      });
    });
  }

  function clearResults() {
    resultsContainer.querySelectorAll(".search-result-item").forEach(function (el) {
      el.remove();
    });
    resultsContainer.classList.remove("has-results");
    if (emptyState) emptyState.classList.remove("visible");
    if (countEl) countEl.textContent = "";
  }

  function renderResults(results, query) {
    resultsContainer.querySelectorAll(".search-result-item").forEach(function (el) {
      el.remove();
    });

    if (results.length === 0) {
      resultsContainer.classList.remove("has-results");
      if (emptyState) emptyState.classList.add("visible");
      return;
    }

    if (emptyState) emptyState.classList.remove("visible");
    resultsContainer.classList.add("has-results");
    if (countEl) countEl.textContent = results.length + " keputusan ditemui";

    results.forEach(function (item) {
      const a = document.createElement("a");
      a.className = "search-result-item";
      a.href = item.href;
      a.innerHTML =
        '<span class="search-result-tag">' + item.tag + "</span>" +
        '<p class="search-result-title">' + highlight(item.title, query) + "</p>" +
        '<p class="search-result-excerpt">' + highlight(item.relevantExcerpt, query) + "</p>";
      resultsContainer.appendChild(a);
    });
  }

  let debounceTimer;

  searchInput.addEventListener("input", function () {
    const query = this.value.trim();
    clearTimeout(debounceTimer);

    if (!query) {
      clearResults();
      return;
    }

    debounceTimer = setTimeout(async function () {
      if (!INDEX) {
        resultsContainer.classList.add("has-results");
        if (countEl) countEl.textContent = "Sedang memuat indeks...";
        await buildIndex();
      }
      renderResults(search(query), query);
    }, 250);
  });

  if ("requestIdleCallback" in window) {
    requestIdleCallback(function () {
      buildIndex();
    }, { timeout: 3000 });
  } else {
    setTimeout(function () {
      buildIndex();
    }, 2000);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (e.key === "Escape" && document.activeElement === searchInput) {
      searchInput.blur();
    }
  });
})();

// =========================
// MOBILE CHIP LAYOUT FIX
// =========================
(function setupMobileChipFix() {
  const style = document.createElement("style");
  style.innerHTML = `
    @media (max-width: 760px) {
      .paper-chip.paper-chip-sentence,
      .paper-chip-list .paper-chip.paper-chip-sentence {
        display: block !important;
        width: 100% !important;
        flex: none !important;
      }
      .paper-accordion-panel .paper-chip-list,
      .answer-paper .paper-chip-list,
      .info-paper .paper-chip-list,
      .glossary-paper .paper-chip-list {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 0.62rem !important;
      }
      .paper-accordion-panel div.paper-chip,
      .answer-paper div.paper-chip,
      .info-paper div.paper-chip,
      .glossary-paper div.paper-chip {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      .master-summary-paper .paper-chip-list,
      .summary-paper .paper-chip-list {
        display: flex !important;
        grid-template-columns: none !important;
      }
      .master-summary-paper div.paper-chip,
      .summary-paper div.paper-chip {
        width: auto !important;
        max-width: 100% !important;
      }
    }
  `;
  document.head.appendChild(style);
})();

// =========================
// QUICK NAV DATA
// =========================
var ZYMNOTES_NAV = { chapters: [
  { num: 1, title: 'Warisan Negara Bangsa', url: 'bab-1.html',
    color: { bg: '#eef2ff', text: '#312e81', accent: '#6366f1' },
    subtopics: [
    { num: '1.1', title: 'Latar Belakang Negara Bangsa Sebelum Kedatangan Barat', url: 'bab-1-1.html' },
    { num: '1.2', title: 'Ciri-ciri Negara Bangsa Kesultanan Melayu Melaka', url: 'bab-1-2.html' },
    { num: '1.3', title: 'Keunggulan Sistem Pentadbiran dan Undang-undang', url: 'bab-1-3.html' },
    { num: '1.4', title: 'Peranan Pemerintah dan Rakyat', url: 'bab-1-4.html' },
  ]},
  { num: 2, title: 'Kebangkitan Nasionalisme', url: 'bab-2.html',
    color: { bg: '#e0f2fe', text: '#0c4a6e', accent: '#0284c7' },
    subtopics: [
    { num: '2.1', title: 'Maksud Nasionalisme', url: 'bab-2-1.html' },
    { num: '2.2', title: 'Perkembangan Idea Nasionalisme di Barat', url: 'bab-2-2.html' },
    { num: '2.3', title: 'Perkembangan Nasionalisme di Asia', url: 'bab-2-3.html' },
    { num: '2.4', title: 'Perkembangan Nasionalisme di Asia Tenggara', url: 'bab-2-4.html' },
    { num: '2.5', title: 'Kesedaran Nasionalisme di Negara Kita', url: 'bab-2-5.html' },
    { num: '2.6', title: 'Faktor Kemunculan Gerakan Nasionalisme', url: 'bab-2-6.html' },
    { num: '2.7', title: 'Perkembangan Nasionalisme', url: 'bab-2-7.html' },
    { num: '2.8', title: 'Kesan Perkembangan Nasionalisme', url: 'bab-2-8.html' },
  ]},
  { num: 3, title: 'Konflik Dunia dan Pendudukan Jepun di Negara Kita', url: 'bab-3.html',
    color: { bg: '#f1f5f9', text: '#334155', accent: '#64748b' },
    subtopics: [
    { num: '3.1', title: 'Nasionalisme di Negara Kita Sebelum Perang Dunia', url: 'bab-3-1.html' },
    { num: '3.2', title: 'Latar Belakang Perang Dunia', url: 'bab-3-2.html' },
    { num: '3.3', title: 'Perang Dunia Kedua', url: 'bab-3-3.html' },
    { num: '3.4', title: 'Perang Dunia Kedua di Asia Pasifik', url: 'bab-3-4.html' },
    { num: '3.5', title: 'Faktor Kedatangan Jepun ke Negara Kita', url: 'bab-3-5.html' },
    { num: '3.6', title: 'Dasar Pendudukan Jepun di Negara Kita', url: 'bab-3-6.html' },
    { num: '3.7', title: 'Perjuangan Rakyat Menentang Pendudukan Jepun', url: 'bab-3-7.html' },
    { num: '3.8', title: 'Perkembangan Gerakan Nasionalisme Tempatan dan Pendudukan Jepun', url: 'bab-3-8.html' },
    { num: '3.9', title: 'Keadaan Negara Kita Selepas Kekalahan Jepun', url: 'bab-3-9.html' },
  ]},
  { num: 4, title: 'Era Peralihan Kuasa British di Negara Kita', url: 'bab-4.html',
    color: { bg: '#ede9fe', text: '#4c1d95', accent: '#7c3aed' },
    subtopics: [
    { num: '4.1', title: 'British Military Administration (BMA)', url: 'bab-4-1.html' },
    { num: '4.2', title: 'Gagasan Malayan Union', url: 'bab-4-2.html' },
    { num: '4.3', title: 'Reaksi Penduduk Tempatan terhadap Malayan Union', url: 'bab-4-3.html' },
    { num: '4.4', title: 'Penyerahan Sarawak kepada Kerajaan British', url: 'bab-4-4.html' },
    { num: '4.5', title: 'Reaksi Penduduk Tempatan terhadap Penyerahan Sarawak', url: 'bab-4-5.html' },
    { num: '4.6', title: 'Penyerahan Sabah kepada Kerajaan British', url: 'bab-4-6.html' },
    { num: '4.7', title: 'Reaksi Penduduk Tempatan terhadap Penyerahan Sabah', url: 'bab-4-7.html' },
  ]},
  { num: 5, title: 'Persekutuan Tanah Melayu 1948', url: 'bab-5.html',
    color: { bg: '#ecfdf5', text: '#065f46', accent: '#059669' },
    subtopics: [
    { num: '5.1', title: 'Latar Belakang Penubuhan Persekutuan Tanah Melayu 1948', url: 'bab-5-1.html' },
    { num: '5.2', title: 'Faktor Penubuhan Persekutuan Tanah Melayu 1948', url: 'bab-5-2.html' },
    { num: '5.3', title: 'Ciri-ciri Persekutuan Tanah Melayu 1948', url: 'bab-5-3.html' },
    { num: '5.4', title: 'Kesan Penubuhan Persekutuan Tanah Melayu 1948', url: 'bab-5-4.html' },
  ]},
  { num: 6, title: 'Ancaman Komunis dan Perisytiharan Darurat', url: 'bab-6.html',
    color: { bg: '#fef2f2', text: '#9f1239', accent: '#e11d48' },
    subtopics: [
    { num: '6.1', title: 'Kemasukan Pengaruh Komunis di Negara Kita', url: 'bab-6-1.html' },
    { num: '6.2', title: 'Ancaman Komunis di Negara Kita', url: 'bab-6-2.html' },
    { num: '6.3', title: 'Usaha Menangani Ancaman Komunis', url: 'bab-6-3.html' },
    { num: '6.4', title: 'Kesan Zaman Darurat terhadap Negara Kita', url: 'bab-6-4.html' },
  ]},
  { num: 7, title: 'Usaha ke Arah Kemerdekaan', url: 'bab-7.html',
    color: { bg: '#faf5ff', text: '#6b21a8', accent: '#9333ea' },
    subtopics: [
    { num: '7.1', title: 'Latar Belakang Idea Negara Merdeka', url: 'bab-7-1.html' },
    { num: '7.2', title: 'Jawatankuasa Hubungan Antara Kaum', url: 'bab-7-2.html' },
    { num: '7.3', title: 'Sistem Ahli', url: 'bab-7-3.html' },
    { num: '7.4', title: 'Sistem Pendidikan Kebangsaan', url: 'bab-7-4.html' },
    { num: '7.5', title: 'Penubuhan Parti Politik', url: 'bab-7-5.html' },
  ]},
  { num: 8, title: 'Pilihan Raya', url: 'bab-8.html',
    color: { bg: '#ecfeff', text: '#155e75', accent: '#0891b2' },
    subtopics: [
    { num: '8.1', title: 'Perkembangan Pilihan Raya di Persekutuan Tanah Melayu', url: 'bab-8-1.html' },
    { num: '8.2', title: 'Proses Pilihan Raya Umum Pertama', url: 'bab-8-2.html' },
    { num: '8.3', title: 'Penubuhan Majlis Perundangan Persekutuan', url: 'bab-8-3.html' },
    { num: '8.4', title: 'Peranan Kabinet Pertama Persekutuan Tanah Melayu', url: 'bab-8-4.html' },
  ]},
]};

// ── CTA indeks bab induk seterusnya (subtopik terakhir sahaja) ──────────────────
// Pada halaman subtopik terakhir dalam bab: ganti butang utama "Kembali ke Bab N"
// (ke indeks bab semasa) dengan "Seterusnya: Bab M" ke indeks bab berikutnya.
// Subtopik lain tidak diubah. Tiada bab selepas 8 — kekalkan CTA asal.
(function () {
  var pathname = window.location.pathname;
  var fileMatch = pathname.match(/(bab-(\d+)-\d+\.html)$/i);
  if (!fileMatch) return;
  var currentFile = fileMatch[1].toLowerCase();
  var chNum = parseInt(fileMatch[2], 10);
  if (!(chNum >= 1 && chNum <= 8)) return;
  if (!window.ZYMNOTES_NAV || !ZYMNOTES_NAV.chapters || !ZYMNOTES_NAV.chapters.length) return;
  var idx = chNum - 1;
  var chapter = ZYMNOTES_NAV.chapters[idx];
  if (!chapter || !chapter.subtopics || !chapter.subtopics.length) return;
  var lastSubUrl = String(chapter.subtopics[chapter.subtopics.length - 1].url || '').toLowerCase();
  if (lastSubUrl !== currentFile) return;
  if (idx + 1 >= ZYMNOTES_NAV.chapters.length) return;
  var nextCh = ZYMNOTES_NAV.chapters[idx + 1];

  function hrefBasename(h) {
    if (!h) return '';
    var x = String(h).split('#')[0].split('?')[0];
    var parts = x.split('/');
    return (parts[parts.length - 1] || '').toLowerCase();
  }
  var hubFile = hrefBasename(chapter.url);

  var bars = document.querySelectorAll('main.note-reading-main .note-subsection .hero-actions');
  if (!bars.length) bars = document.querySelectorAll('main .note-subsection .hero-actions');
  if (!bars.length) return;

  for (var b = 0; b < bars.length; b++) {
    var bar = bars[b];
    var target = null;
    var primaries = bar.querySelectorAll('a.btn.btn-primary');
    for (var pi = 0; pi < primaries.length; pi++) {
      if (hrefBasename(primaries[pi].getAttribute('href')) === hubFile) {
        target = primaries[pi];
        break;
      }
    }
    if (!target) {
      var anchors = bar.querySelectorAll('a.btn');
      for (var i = 0; i < anchors.length; i++) {
        if (hrefBasename(anchors[i].getAttribute('href')) === hubFile) {
          target = anchors[i];
          break;
        }
      }
    }
    if (!target) continue;

    target.setAttribute('data-zym-next-bab', '1');
    target.href = nextCh.url;
    target.textContent = 'Seterusnya: Bab ' + nextCh.num;
    target.setAttribute('aria-label', 'Pergi ke indeks Bab ' + nextCh.num + ' — ' + nextCh.title);
  }
})();


// =========================
// AUDIO PLAYER
// =========================
(function setupAudioPlayers() {
  // Audio kini dikawal sepenuhnya oleh Sparkle Menu (setupNoteFeatures).
})();

// Microsoft Fluent UI Emoji 3D (PNG) — sparkle menu & kawalan audio (MIT)
// https://github.com/microsoft/fluentui-emoji — commit dipin untuk URL stabil
var FLUENT_EMOJI_3D_REF = "62ecdc0d7ca5";
var FLUENT_EMOJI_3D_BASE =
  "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@" +
  FLUENT_EMOJI_3D_REF +
  "/assets";

function hzFluent3dAsset(folderName, fileName) {
  return FLUENT_EMOJI_3D_BASE + "/" + encodeURIComponent(folderName) + "/3D/" + fileName;
}

/** Ikon sparkle / audio — folder Fluent (nama paparan) + fail PNG 3D */
var HZ_FLUENT_SPARKLE = {
  sparkles: ["Sparkles", "sparkles_3d.png"],
  worldMap: ["World map", "world_map_3d.png"],
  headphones: ["Headphone", "headphone_3d.png"],
  puzzlePiece: ["Puzzle piece", "puzzle_piece_3d.png"],
  pause: ["Pause button", "pause_button_3d.png"],
  play: ["Play button", "play_button_3d.png"],
  stopMedia: ["Stop button", "stop_button_3d.png"],
  minus: ["Minus", "minus_3d.png"],
  plus: ["Plus", "plus_3d.png"],
  crossMark: ["Cross mark", "cross_mark_3d.png"],
  gear: ["Gear", "gear_3d.png"],
  artistPalette: ["Artist palette", "artist_palette_3d.png"],
  trophy: ["Trophy", "trophy_3d.png"],
  memo: ["Memo", "memo_3d.png"],
  wastebasket: ["Wastebasket", "wastebasket_3d.png"],
  faceSmiling: ["Smiling face with smiling eyes", "smiling_face_with_smiling_eyes_3d.png"],
  faceThinking: ["Thinking face", "thinking_face_3d.png"],
  faceConfused: ["Confused face", "confused_face_3d.png"],
  faceRelieved: ["Relieved face", "relieved_face_3d.png"],
  thumbsUp: ["Thumbs up", "thumbs_up_3d.png"],
  sparklingHeart: ["Sparkling heart", "sparkling_heart_3d.png"],
};

/** data-lab-openmoji-hex (OpenMoji) → aset Fluent 3D untuk item Kuiz */
var HZ_LAB_OPENMOJI_HEX_TO_FLUENT = {
  "1F9E9.svg": HZ_FLUENT_SPARKLE.puzzlePiece,
};

function hzFluentSparkleImg(pair, extraClass, w, h) {
  var img = document.createElement("img");
  img.className = "fluent-3d-emoji" + (extraClass ? " " + extraClass : "");
  img.src = hzFluent3dAsset(pair[0], pair[1]);
  img.alt = "";
  img.width = w;
  img.height = h;
  img.decoding = "async";
  return img;
}

function hzFluentImgHtml(pair, size) {
  var src = hzFluent3dAsset(pair[0], pair[1]);
  return '<img class="fluent-3d-emoji" src="' + src + '" alt="" width="' + size + '" height="' + size + '" decoding="async">';
}

// Icons8 3D Fluency — sparkle menu & settings panel
var HZ_ICONS8_3D = 'https://img.icons8.com/3d-fluency/96/';
var HZ_ICONS8_SPARKLE = {
  sparkles:      'https://img.icons8.com/?size=96&id=LuXk2sw4rJVF&format=png',
  worldMap:      'https://img.icons8.com/?size=96&id=IJyJrL3znN8t&format=png',
  headphones:    'https://img.icons8.com/?size=96&id=N06cr99JrdGK&format=png',
  puzzlePiece:   'https://img.icons8.com/?size=96&id=8fF8GAV7U3Pt&format=png',
  gear:          HZ_ICONS8_3D + 'gear.png',
  play:          HZ_ICONS8_3D + 'play.png',
  pause:         HZ_ICONS8_3D + 'pause.png',
  stopMedia:     HZ_ICONS8_3D + 'stop.png',
  minus:         HZ_ICONS8_3D + 'rewind.png',
  plus:          HZ_ICONS8_3D + 'fast-forward.png',
  crossMark:     HZ_ICONS8_3D + 'delete-sign.png',
  artistPalette: HZ_ICONS8_3D + 'color-palette.png',
  trophy:        'https://img.icons8.com/?size=96&id=94bZrF6ZIaXP&format=png',
  memo:          'https://img.icons8.com/?size=96&id=zIKcpVIKdvP1&format=png',
  wastebasket:   HZ_ICONS8_3D + 'trash.png',

};
function hzIcons8SparkleImg(url, extraClass, w, h) {
  var img = document.createElement('img');
  img.className = 'fluent-3d-emoji' + (extraClass ? ' ' + extraClass : '');
  img.src = url;
  img.alt = '';
  img.width = w;
  img.height = h;
  img.decoding = 'async';
  if (url.indexOf('/3d-fluency/') !== -1) {
    img.onerror = function() { if (!this._fb) { this._fb = 1; this.src = this.src.replace('/3d-fluency/', '/fluency/'); } };
  }
  return img;
}
function hzIcons8ImgHtml(url, size) {
  var oe = url.indexOf('/3d-fluency/') !== -1 ? ' onerror="if(!this._fb){this._fb=1;this.src=this.src.replace(\'/3d-fluency/\',\'/fluency/\')}"' : '';
  return '<img class="fluent-3d-emoji" src="' + url + '" alt="" width="' + size + '" height="' + size + '" decoding="async"' + oe + '>';
}

function hzSparkleIcon(key) {
  return HZ_ICONS8_SPARKLE[key] || HZ_ICONS8_SPARKLE.puzzlePiece;
}

function hzLabQuizSparklePair() {
  return HZ_ICONS8_SPARKLE.puzzlePiece;
}

// =========================
// NOTE PAGE: SPARKLE MENU — draggable corner FAB
// =========================
(function setupNoteFeatures() {
  document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.note-sparkle-wrap')) return;
    var _p = window.location.pathname;
    if (
      !hzZymnotesIsSparkleShellPathname(_p) &&
      !hzZymnotesIsBabHubPathname(_p) &&
      !hzZymnotesIsSubtopicNotePathname(_p) &&
      !hzZymnotesIsQuizPathname(_p)
    )
      return;

    var audioEl = document.querySelector('.note-audio-player .audio-src');

    var noticeShown = false;

    function showAudioNotice() {
      if (noticeShown || ZymStore.isDismissed('audioNotice')) return;
      noticeShown = true;

      var sheet = document.createElement('div');
      sheet.className = 'audio-notice-sheet';
      sheet.setAttribute('role', 'status');
      sheet.setAttribute('aria-live', 'polite');

      var noticeIconWrap = document.createElement('span');
      noticeIconWrap.className = 'audio-notice-icon';
      noticeIconWrap.setAttribute('aria-hidden', 'true');
      noticeIconWrap.appendChild(
        hzIcons8SparkleImg(hzSparkleIcon("headphones"), "openmoji--notice-icon", 22, 22)
      );

      var contentWrap = document.createElement('div');
      contentWrap.className = 'audio-notice-content';
      var noticeTitle = document.createElement('span');
      noticeTitle.className = 'audio-notice-title';
      noticeTitle.textContent = 'Makluman audio';
      var noticeText = document.createElement('span');
      noticeText.className = 'audio-notice-text';
      noticeText.textContent = 'Audio mungkin mengandungi ringkasan — nota adalah rujukan utama.';
      contentWrap.appendChild(noticeTitle);
      contentWrap.appendChild(noticeText);

      var closeBtn = document.createElement('button');
      closeBtn.className = 'audio-notice-close';
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Tutup');
      closeBtn.appendChild(hzIcons8SparkleImg(HZ_ICONS8_SPARKLE.crossMark, 'openmoji--audio-notice-close', 16, 16));

      sheet.appendChild(noticeIconWrap);
      sheet.appendChild(contentWrap);
      sheet.appendChild(closeBtn);
      document.body.appendChild(sheet);

      function dismiss() {
        ZymStore.setDismissed('audioNotice');
        sheet.classList.remove('zh-toast-show');
        sheet.classList.add('zh-toast-hide');
        setTimeout(function() { sheet.remove(); }, 300);
      }

      closeBtn.addEventListener('click', dismiss);

      requestAnimationFrame(function () {
        requestAnimationFrame(function () { sheet.classList.add('zh-toast-show'); });
      });
    }

    var labHref = document.body.dataset.labHref ||
      (function() {
        var el = document.querySelector('#learning-lab-entry .btn[href]');
        return el ? el.getAttribute('href') : null;
      })();
    var labQuizSparklePair = hzLabQuizSparklePair();
    if (
      labHref &&
      /(?:^|\/)quiz\/bab-(?:1-[1-4]|2-[1-8])\.html(?:$|[?#])/.test(labHref)
    ) {
      labQuizSparklePair = HZ_ICONS8_SPARKLE.puzzlePiece;
    }

    var wrap = document.createElement('div');
    wrap.className = 'note-sparkle-wrap';

    function syncSparklePanelState() {
      var hasOpenPanel =
        wrap.classList.contains('is-open') ||
        wrap.classList.contains('controls-open') ||
        wrap.classList.contains('audio-active');
      document.body.classList.toggle('sparkle-panel-open', hasOpenPanel);
    }

    var itemsContainer = document.createElement('div');
    itemsContainer.className = 'note-sparkle-items';

    function makeSparkleItemFluent(name, tooltip, type, href) {
      var el = href ? document.createElement('a') : document.createElement('button');
      if (href) { el.href = href; }
      else { el.type = 'button'; }
      el.className = 'note-sparkle-item';
      el.setAttribute('aria-label', tooltip);
      el.setAttribute('data-tooltip', tooltip);
      el.setAttribute('data-sparkle-type', type);
      el.appendChild(
        hzIcons8SparkleImg(name, 'openmoji--sparkle-item', 24, 24)
      );
      return el;
    }

    function setFabFluent(name) {
      fab.textContent = '';
      fab.appendChild(
        hzIcons8SparkleImg(name, 'openmoji--sparkle-fab', 24, 24)
      );
    }

    function setSparkleItemFluent(el, name) {
      if (!el) return;
      el.textContent = '';
      el.appendChild(
        hzIcons8SparkleImg(name, 'openmoji--sparkle-item', 24, 24)
      );
    }

    itemsContainer.appendChild(
      makeSparkleItemFluent(HZ_ICONS8_SPARKLE.worldMap, 'Navigasi Cepat', 'nav')
    );
    if (audioEl) {
      itemsContainer.appendChild(
        makeSparkleItemFluent(HZ_ICONS8_SPARKLE.headphones, 'Main audio', 'audio')
      );
    }
    if (labHref) {
      itemsContainer.appendChild(
        makeSparkleItemFluent(labQuizSparklePair, 'Kuiz', 'lab', labHref)
      );
    }

    // Item tetapan — dibuat terus di sini supaya timing betul
    (function () {
      var settingsEl = makeSparkleItemFluent(HZ_ICONS8_SPARKLE.gear, 'Tetapan', 'settings');
      settingsEl.addEventListener('click', function () {
        wrap.classList.remove('is-open');
        if (window.ZymSettings) window.ZymSettings.open();
      });
      itemsContainer.appendChild(settingsEl);
    })();

    var fab = document.createElement('button');
    fab.className = 'note-sparkle-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Menu pembelajaran');
    setFabFluent(HZ_ICONS8_SPARKLE.sparkles);

    // ── Audio Progress Ring (around FAB) ──────────────────────────────
    var CIRC = 2 * Math.PI * 30;
    var svgNS = 'http://www.w3.org/2000/svg';
    var ringDiv = document.createElement('div');
    ringDiv.className = 'sparkle-audio-ring';

    var ringsvg = document.createElementNS(svgNS, 'svg');
    ringsvg.setAttribute('viewBox', '0 0 68 68');
    ringsvg.setAttribute('aria-hidden', 'true');

    var ringDefs = document.createElementNS(svgNS, 'defs');
    var grad = document.createElementNS(svgNS, 'linearGradient');
    grad.setAttribute('id', 'sparkleRingGrad');
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
    var stop1 = document.createElementNS(svgNS, 'stop');
    stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#38bdf8');
    var stop2 = document.createElementNS(svgNS, 'stop');
    stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#818cf8');
    grad.appendChild(stop1); grad.appendChild(stop2);
    ringDefs.appendChild(grad); ringsvg.appendChild(ringDefs);

    var trackCircle = document.createElementNS(svgNS, 'circle');
    trackCircle.setAttribute('cx', '34'); trackCircle.setAttribute('cy', '34');
    trackCircle.setAttribute('r', '30'); trackCircle.setAttribute('fill', 'none');
    trackCircle.setAttribute('stroke', 'rgba(109,99,255,0.18)');
    trackCircle.setAttribute('stroke-width', '3.5');
    ringsvg.appendChild(trackCircle);

    var progCircle = document.createElementNS(svgNS, 'circle');
    progCircle.setAttribute('cx', '34'); progCircle.setAttribute('cy', '34');
    progCircle.setAttribute('r', '30'); progCircle.setAttribute('fill', 'none');
    progCircle.setAttribute('stroke', 'url(#sparkleRingGrad)');
    progCircle.setAttribute('stroke-width', '3.5');
    progCircle.setAttribute('stroke-linecap', 'round');
    progCircle.setAttribute('stroke-dasharray', CIRC);
    progCircle.setAttribute('stroke-dashoffset', '0');
    ringsvg.appendChild(progCircle);
    ringDiv.appendChild(ringsvg);

    // ── Countdown text (below FAB) ────────────────────────────────────
    var countdownEl = document.createElement('span');
    countdownEl.className = 'sparkle-audio-countdown';
    countdownEl.setAttribute('aria-hidden', 'true');

    var fabInner = document.createElement('div');
    fabInner.className = 'note-sparkle-fab-inner';
    fabInner.appendChild(fab);
    fabInner.appendChild(ringDiv);

    var fabGroup = document.createElement('div');
    fabGroup.className = 'note-sparkle-fab-group';
    fabGroup.appendChild(fabInner);
    fabGroup.appendChild(countdownEl);

    // ── Audio Side Controls ───────────────────────────────────────────
    function makeCtrlBtnFluent(name, ariaLabel, action, extraClass) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sparkle-ctrl-btn';
      if (extraClass) btn.classList.add(extraClass);
      btn.setAttribute('data-ctrl', action);
      btn.setAttribute('aria-label', ariaLabel);
      btn.appendChild(
        hzIcons8SparkleImg(name, 'openmoji--sparkle-ctrl', 18, 18)
      );
      return btn;
    }

    var ctrlStop = makeCtrlBtnFluent(HZ_ICONS8_SPARKLE.stopMedia, 'Berhenti', 'stop');
    var ctrlBack = makeCtrlBtnFluent(HZ_ICONS8_SPARKLE.minus, 'Undur 10 saat', 'skip-back');
    var ctrlPlayPause = makeCtrlBtnFluent(HZ_ICONS8_SPARKLE.play, 'Main / jeda', 'play-pause', 'sparkle-ctrl-btn--play-pause');
    var ctrlFwd = makeCtrlBtnFluent(HZ_ICONS8_SPARKLE.plus, 'Maju 10 saat', 'skip-fwd');

    var audioControls = document.createElement('div');
    audioControls.className = 'sparkle-audio-controls';
    audioControls.appendChild(ctrlStop);
    audioControls.appendChild(ctrlBack);
    audioControls.appendChild(ctrlPlayPause);
    audioControls.appendChild(ctrlFwd);

    var fabRow = document.createElement('div');
    fabRow.className = 'sparkle-fab-row';
    fabRow.appendChild(audioControls);
    fabRow.appendChild(fabGroup);

    wrap.appendChild(itemsContainer);
    wrap.appendChild(fabRow);
    document.body.appendChild(wrap);

    // ── Corner Position ───────────────────────────────────────────────
    var corner = ZymStore.getPref('fabCorner') || 'br';
    wrap.classList.add('fab-corner-' + corner);

    function snapToCorner(c) {
      ['br','bl','tr','tl'].forEach(function(cc) { wrap.classList.remove('fab-corner-' + cc); });
      wrap.style.cssText = '';
      corner = c;
      ZymStore.setPref('fabCorner', corner);
      wrap.classList.add('fab-corner-' + corner);
    }

    // ── Drag Behaviour ────────────────────────────────────────────────
    var isDragging = false;
    var didDrag    = false;
    var dragStartX, dragStartY, wrapStartLeft, wrapStartTop;

    fab.addEventListener('pointerdown', function(e) {
      isDragging  = true;
      didDrag     = false;
      dragStartX  = e.clientX;
      dragStartY  = e.clientY;
      var r = wrap.getBoundingClientRect();
      wrapStartLeft = r.left;
      wrapStartTop  = r.top;
      fab.setPointerCapture(e.pointerId);
    });

    fab.addEventListener('pointermove', function(e) {
      if (!isDragging) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      if (!didDrag && Math.hypot(dx, dy) < 8) return;
      if (!didDrag) {
        didDrag = true;
        wrap.classList.add('is-dragging');
        wrap.classList.remove('is-open');
        syncSparklePanelState();
        ['br','bl','tr','tl'].forEach(function(cc) { wrap.classList.remove('fab-corner-' + cc); });
      }
      var vw = window.innerWidth, vh = window.innerHeight;
      var r  = wrap.getBoundingClientRect();
      var nx = Math.max(0, Math.min(vw - r.width,  wrapStartLeft + dx));
      var ny = Math.max(0, Math.min(vh - r.height, wrapStartTop  + dy));
      wrap.style.position = 'fixed';
      wrap.style.left   = nx + 'px';
      wrap.style.top    = ny + 'px';
      wrap.style.right  = 'auto';
      wrap.style.bottom = 'auto';
    });

    fab.addEventListener('pointerup', function() {
      if (!isDragging) return;
      isDragging = false;
      wrap.classList.remove('is-dragging');
      if (!didDrag) return; // tap — handled by click listener
      var r  = wrap.getBoundingClientRect();
      var cx = r.left + r.width  / 2;
      var cy = r.top  + r.height / 2;
      snapToCorner((cy < window.innerHeight / 2 ? 't' : 'b') + (cx < window.innerWidth / 2 ? 'l' : 'r'));
    });

    fab.addEventListener('pointercancel', function() {
      if (!isDragging) return;
      isDragging = false;
      wrap.classList.remove('is-dragging');
      if (didDrag) snapToCorner(corner);
    });

    // ── Menu / Controls Toggle (tap only) ────────────────────────────
    fab.addEventListener('click', function(e) {
      e.stopPropagation();
      if (didDrag) return;
      wrap.classList.toggle('is-open');
      syncSparklePanelState();
    });

    document.addEventListener('click', function(e) {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('is-open');
        wrap.classList.remove('controls-open');
        syncSparklePanelState();
      }
    });

    // ── Item Actions ──────────────────────────────────────────────────
    itemsContainer.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-sparkle-type]');
      if (!btn) return;
      var type = btn.getAttribute('data-sparkle-type');
      if (type === 'nav') {
        wrap.classList.remove('is-open');
        syncSparklePanelState();
        if (window.HzMindmap) window.HzMindmap.open();
        return;
      }
      if (type === 'audio' && audioEl) {
        showAudioNotice();
        audioEl.paused ? audioEl.play() : audioEl.pause();
        wrap.classList.remove('is-open');
        syncSparklePanelState();
      }
      if (type === 'lab') {
        wrap.classList.remove('is-open');
        syncSparklePanelState();
      }
    });

    // ── Audio State Machine ───────────────────────────────────────────
    if (audioEl) {
      var audioBtn = itemsContainer.querySelector('[data-sparkle-type="audio"]');

      function replaceSparkleCtrlIcon(btn, name) {
        btn.replaceChildren(
          hzIcons8SparkleImg(name, 'openmoji--sparkle-ctrl', 18, 18)
        );
      }

      function syncPlayPauseCtrlVisual() {
        replaceSparkleCtrlIcon(
          ctrlPlayPause,
          audioEl.paused ? HZ_ICONS8_SPARKLE.play : HZ_ICONS8_SPARKLE.pause
        );
        ctrlPlayPause.classList.toggle('is-paused', audioEl.paused);
      }

      function fmtRemaining() {
        if (!isFinite(audioEl.duration)) return '';
        var rem = Math.max(0, Math.ceil(audioEl.duration - audioEl.currentTime));
        var m = Math.floor(rem / 60), s = rem % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
      }

      function updateRing() {
        if (!audioEl.duration) return;
        progCircle.setAttribute('stroke-dashoffset',
          CIRC * (audioEl.currentTime / audioEl.duration));
        countdownEl.textContent = fmtRemaining();
      }

      function stopAudio() {
        audioEl.pause();
        audioEl.currentTime = 0;
        setFabFluent(HZ_ICONS8_SPARKLE.sparkles);
        wrap.classList.remove('audio-active');
        wrap.classList.remove('controls-open');
        syncSparklePanelState();
        progCircle.setAttribute('stroke-dashoffset', '0');
        countdownEl.textContent = '';
        replaceSparkleCtrlIcon(ctrlPlayPause, HZ_ICONS8_SPARKLE.play);
        ctrlPlayPause.classList.remove('is-paused');
        setSparkleItemFluent(audioBtn, HZ_ICONS8_SPARKLE.headphones);
      }

      function onTimeUpdate() { updateRing(); }
      function onPlay() {
        setFabFluent(HZ_ICONS8_SPARKLE.headphones);
        wrap.classList.add('audio-active');
        wrap.classList.remove('is-open');
        syncSparklePanelState();
        syncPlayPauseCtrlVisual();
        countdownEl.textContent = fmtRemaining();
        setSparkleItemFluent(audioBtn, HZ_ICONS8_SPARKLE.pause);
      }
      function onPause() {
        syncPlayPauseCtrlVisual();
        setSparkleItemFluent(audioBtn, HZ_ICONS8_SPARKLE.headphones);
      }
      function onEnded() { stopAudio(); }

      function detachAudioListeners(el) {
        if (!el) return;
        el.removeEventListener('timeupdate', onTimeUpdate);
        el.removeEventListener('play', onPlay);
        el.removeEventListener('pause', onPause);
        el.removeEventListener('ended', onEnded);
      }

      function attachAudioListeners(el) {
        if (!el) return;
        el.addEventListener('timeupdate', onTimeUpdate);
        el.addEventListener('play', onPlay);
        el.addEventListener('pause', onPause);
        el.addEventListener('ended', onEnded);
      }

      window.HzSparkleRebindNoteAudio = function () {
        var next = document.querySelector('.note-audio-player .audio-src');
        if (!next || next === audioEl) return;
        detachAudioListeners(audioEl);
        audioEl = next;
        attachAudioListeners(audioEl);
        stopAudio();
      };

      attachAudioListeners(audioEl);

      // ── Control button actions ──────────────────────────────────────
      audioControls.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-ctrl]');
        if (!btn) return;
        e.stopPropagation();
        var action = btn.getAttribute('data-ctrl');
        if (action === 'stop') {
          stopAudio();
        } else if (action === 'skip-back') {
          audioEl.currentTime = Math.max(0, audioEl.currentTime - 10);
        } else if (action === 'skip-fwd') {
          audioEl.currentTime = Math.min(audioEl.duration || 0, audioEl.currentTime + 10);
        } else if (action === 'play-pause') {
          audioEl.paused ? audioEl.play() : audioEl.pause();
        }
      });
    }
  });
})();

// =========================
// MINDMAP NAVIGATION OVERLAY
// =========================
(function () {
  var _p = window.location.pathname;
  if (
    !hzZymnotesIsSparkleShellPathname(_p) &&
    !hzZymnotesIsBabHubPathname(_p) &&
    !hzZymnotesIsSubtopicNotePathname(_p) &&
    !hzZymnotesIsQuizPathname(_p)
  )
    return;

  var overlay = null;
  var svgEl = null;
  var centerEl = null;
  var nodesWrap = null;
  var backBtn = null;
  var closeBtn = null;
  var state = 'subject'; // 'subject' | 'chapter'
  var activeChapterIdx = -1;
  var svgNS = 'http://www.w3.org/2000/svg';
  /** Half-size of .hz-mm-node (72×60 default; 78×60 ≥480px) — keep in sync with ui.css */
  var NODE_HALF_W = 40;
  var NODE_HALF_H = 30;
  var stageResizeObserver = null;

  /**
   * Filename of the active notes page (e.g. bab-3-2.html) for matching nav data.
   * pathname.split('/').pop() fails for extensionless URLs (/notes/bab-3-2).
   */
  function getNotesPageSlug() {
    var p = window.location.pathname;
    var m = p.match(/\/(bab-\d+(?:-\d+)?)(?:\.html)?\/?$/i);
    if (m) {
      var slug = m[1];
      return /\.html$/i.test(slug) ? slug : slug + '.html';
    }
    var last = p.split('/').filter(Boolean).pop();
    return last && /\.html$/i.test(last) ? last : '';
  }

  function noteHref(filename) {
    return hzZymnotesNoteHref(filename);
  }

  function buildOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'hz-mindmap-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Navigasi Nota Mindmap');

    var stage = document.createElement('div');
    stage.className = 'hz-mindmap-stage';

    svgEl = document.createElementNS(svgNS, 'svg');
    svgEl.setAttribute('class', 'hz-mindmap-svg');
    svgEl.setAttribute('aria-hidden', 'true');

    centerEl = document.createElement('div');
    centerEl.className = 'hz-mm-center';

    nodesWrap = document.createElement('div');
    nodesWrap.className = 'hz-mm-nodes';

    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'hz-mm-close';
    closeBtn.setAttribute('aria-label', 'Tutup navigasi');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', close);

    backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'hz-mm-back';
    backBtn.setAttribute('aria-label', 'Kembali ke semua bab');
    backBtn.innerHTML = '← Semua Bab';
    backBtn.style.display = 'none';
    backBtn.addEventListener('click', function () { showSubjectView(true); });

    stage.appendChild(svgEl);
    stage.appendChild(centerEl);
    stage.appendChild(nodesWrap);
    stage.appendChild(closeBtn);
    stage.appendChild(backBtn);
    overlay.appendChild(stage);
    document.body.appendChild(overlay);

    if (typeof ResizeObserver !== 'undefined') {
      stageResizeObserver = new ResizeObserver(function () {
        if (overlay && overlay.classList.contains('is-open')) refreshMindmapLayout();
      });
      stageResizeObserver.observe(stage);
    } else {
      window.addEventListener('resize', refreshMindmapLayout);
    }

    centerEl.addEventListener('click', function (e) {
      if (state !== 'chapter') return;
      e.stopPropagation();
      showSubjectView(true);
    });
    centerEl.addEventListener('keydown', onCenterKeydown);

    overlay.addEventListener('click', function (e) {
      var st = overlay.querySelector('.hz-mindmap-stage');
      if (!st) { close(); return; }
      // Use composedPath() so the check survives DOM mutations that happen inside
      // click handlers (e.g. clearNodes() removes the clicked chapter button before
      // this handler runs, making st.contains(e.target) incorrectly return false).
      var path = e.composedPath ? e.composedPath() : [];
      if (st.contains(e.target) || path.indexOf(st) !== -1) return;
      close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('is-open')) close();
    });
  }

  function onCenterKeydown(e) {
    if (state !== 'chapter') return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showSubjectView(true);
    }
  }

  function getIdealRadius(count) {
    if (count <= 4) return 140;
    if (count <= 6) return 155;
    if (count <= 8) return 168;
    return 182;
  }

  /** Largest |cos θ| and |sin θ| for equally spaced nodes (start −90°). */
  function maxAxisExtents(count) {
    var maxC = 0;
    var maxS = 0;
    for (var i = 0; i < count; i++) {
      var ang = (2 * Math.PI * i / count) - Math.PI / 2;
      var ac = Math.abs(Math.cos(ang));
      var asn = Math.abs(Math.sin(ang));
      if (ac > maxC) maxC = ac;
      if (asn > maxS) maxS = asn;
    }
    return { cos: maxC, sin: maxS };
  }

  /**
   * Cap radial distance so node boxes stay inside the stage (mobile has a small
   * fixed stage vs desktop ideal radius).
   */
  function getRadiusForStage(sw, sh, count) {
    var ideal = getIdealRadius(count);
    if (!sw || !sh || count < 1) return ideal;
    var margin = 8;
    var ax = maxAxisExtents(count);
    var capX = ax.cos > 0.001 ? (sw / 2 - margin - NODE_HALF_W) / ax.cos : ideal;
    var capY = ax.sin > 0.001 ? (sh / 2 - margin - NODE_HALF_H) / ax.sin : ideal;
    var cap = Math.min(capX, capY);
    return Math.max(48, Math.min(ideal, cap));
  }

  function calcPositions(count, radius) {
    var positions = [];
    for (var i = 0; i < count; i++) {
      var angle = (2 * Math.PI * i / count) - Math.PI / 2;
      positions.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    return positions;
  }

  function makeSvgLines(positions, stageW, stageH, lineColor) {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    var cx = stageW / 2, cy = stageH / 2;
    positions.forEach(function (pos) {
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', cx + pos.x);
      line.setAttribute('y2', cy + pos.y);
      line.setAttribute('class', 'hz-mm-line');
      if (lineColor) line.style.stroke = lineColor;
      svgEl.appendChild(line);
    });
  }

  function clearNodes() {
    while (nodesWrap.firstChild) nodesWrap.removeChild(nodesWrap.firstChild);
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  }

  function makeNode(label, sublabel, href, onClick, extraClass, color) {
    var el = href ? document.createElement('a') : document.createElement('button');
    if (href) {
      el.href = href;
      el.addEventListener('click', function () {
        setTimeout(close, 0);
      });
    } else {
      el.type = 'button';
      if (onClick) el.addEventListener('click', function (e) {
        e.stopPropagation();
        onClick();
      });
    }
    el.className = 'hz-mm-node' + (extraClass ? ' ' + extraClass : '');
    if (color) {
      el.style.setProperty('--mm-node-bg', color.bg);
      el.style.setProperty('--mm-node-text', color.text);
      el.style.setProperty('--mm-node-accent', color.accent);
    }
    el.innerHTML =
      '<span class="hz-mm-node-num">' + label + '</span>' +
      (sublabel ? '<span class="hz-mm-node-sub">' + sublabel + '</span>' : '');
    return el;
  }

  function applyChapterCenter(chapter) {
    centerEl.className = 'hz-mm-center hz-mm-center--chapter';
    if (chapter && chapter.color) {
      centerEl.style.setProperty('--mm-ch-bg', chapter.color.bg);
      centerEl.style.setProperty('--mm-ch-text', chapter.color.text);
      centerEl.style.setProperty('--mm-ch-accent', chapter.color.accent);
    }
  }

  function showSubjectView(animated) {
    state = 'subject';
    activeChapterIdx = -1;

    clearNodes();
    centerEl.className = 'hz-mm-center';
    centerEl.removeAttribute('style');
    centerEl.innerHTML =
      '<span class="hz-mm-center-title">Sejarah</span>' +
      '<span class="hz-mm-center-sub">Tingkatan 4</span>';

    var chapters = ZYMNOTES_NAV.chapters;
    var stage = overlay.querySelector('.hz-mindmap-stage');
    var sw = stage.offsetWidth || window.innerWidth;
    var sh = stage.offsetHeight || window.innerHeight;
    var positions = calcPositions(chapters.length, getRadiusForStage(sw, sh, chapters.length));
    makeSvgLines(positions, sw, sh, null);

    var currentFile = getNotesPageSlug();

    chapters.forEach(function (ch, i) {
      var isCurrent = ch.subtopics.some(function (s) { return s.url === currentFile; }) ||
                      ch.url === currentFile;
      var node = makeNode(
        'Bab ' + ch.num,
        ch.title.split(' ').slice(0, 3).join(' ') + (ch.title.split(' ').length > 3 ? '…' : ''),
        null,
        (function (c, idx) { return function () { showChapterView(c, idx); }; })(ch, i),
        isCurrent ? 'is-current' : '',
        ch.color
      );
      node.style.setProperty('--mm-x', positions[i].x + 'px');
      node.style.setProperty('--mm-y', positions[i].y + 'px');
      node.classList.add('mm-anim-in');
      node.style.animationDelay = (i * 48) + 'ms';
      nodesWrap.appendChild(node);
    });

    backBtn.style.display = 'none';
    centerEl.removeAttribute('title');
    centerEl.removeAttribute('role');
    centerEl.removeAttribute('tabindex');
    centerEl.removeAttribute('aria-label');
    if (animated) {
      centerEl.classList.add('mm-fade');
      setTimeout(function () { centerEl.classList.remove('mm-fade'); }, 280);
    }
  }

  function showChapterView(chapter, chIdx, animated) {
    state = 'chapter';
    activeChapterIdx = chIdx;
    if (animated === undefined) animated = true;

    clearNodes();
    applyChapterCenter(chapter);
    centerEl.innerHTML =
      '<span class="hz-mm-center-title">Bab ' + chapter.num + '</span>' +
      '<span class="hz-mm-center-sub">' + chapter.title.split(' ').slice(0, 4).join(' ') + (chapter.title.split(' ').length > 4 ? '…' : '') + '</span>';
    centerEl.setAttribute('title', 'Ketik untuk kembali ke mindmap semua bab');
    centerEl.setAttribute('role', 'button');
    centerEl.setAttribute('tabindex', '0');
    centerEl.setAttribute('aria-label', 'Kembali ke mindmap semua bab');

    var subs = chapter.subtopics;
    var stage = overlay.querySelector('.hz-mindmap-stage');
    var sw = stage.offsetWidth || window.innerWidth;
    var sh = stage.offsetHeight || window.innerHeight;
    var positions = calcPositions(subs.length, getRadiusForStage(sw, sh, subs.length));
    var lineColor = chapter.color ? chapter.color.accent : null;
    makeSvgLines(positions, sw, sh, lineColor);

    var currentFile = getNotesPageSlug();

    subs.forEach(function (sub, i) {
      var isCurrent = sub.url === currentFile;
      var node = makeNode(
        sub.num,
        sub.title.split(' ').slice(0, 3).join(' ') + (sub.title.split(' ').length > 3 ? '…' : ''),
        noteHref(sub.url),
        null,
        isCurrent ? 'is-current' : '',
        chapter.color
      );
      node.style.setProperty('--mm-x', positions[i].x + 'px');
      node.style.setProperty('--mm-y', positions[i].y + 'px');
      node.classList.add('mm-anim-in');
      node.style.animationDelay = (i * 40) + 'ms';
      nodesWrap.appendChild(node);
    });

    backBtn.style.display = '';
    if (animated) {
      centerEl.classList.add('mm-fade');
      setTimeout(function () { centerEl.classList.remove('mm-fade'); }, 280);
    }
  }

  function refreshMindmapLayout() {
    if (!overlay || !overlay.classList.contains('is-open')) return;
    if (state === 'subject') {
      showSubjectView(false);
    } else if (activeChapterIdx >= 0 && ZYMNOTES_NAV.chapters[activeChapterIdx]) {
      showChapterView(ZYMNOTES_NAV.chapters[activeChapterIdx], activeChapterIdx, false);
    }
  }

  function open(startChapterIdx) {
    buildOverlay();
    overlay.classList.add('is-open');
    document.body.classList.add('mindmap-open');

    if (typeof startChapterIdx === 'number') {
      showChapterView(ZYMNOTES_NAV.chapters[startChapterIdx], startChapterIdx, false);
    } else {
      var currentFile = getNotesPageSlug();
      var autoIdx = -1;
      ZYMNOTES_NAV.chapters.forEach(function (ch, i) {
        if (ch.subtopics.some(function (s) { return s.url === currentFile; })) autoIdx = i;
      });
      if (autoIdx >= 0) {
        showChapterView(ZYMNOTES_NAV.chapters[autoIdx], autoIdx, false);
      } else {
        showSubjectView(false);
      }
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(refreshMindmapLayout);
    });
    setTimeout(function () { closeBtn.focus(); }, 80);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('mindmap-open');
  }

  window.HzMindmap = { open: open, close: close };
})();

// ── Nota Feedback Widget ──────────────────────────────────────────────────────
// Skema Supabase (jadual nota_feedback, RPC submit/delete/kiraan) + log PDF:
//   docs/supabase/nota_feedback_pdf.sql
//
var NOTA_FB_SUPABASE_URL = 'https://hcvdhonpszwdiwcxwcrp.supabase.co';
var NOTA_FB_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjdmRob25wc3p3ZGl3Y3h3Y3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwOTEsImV4cCI6MjA5MzYzMTA5MX0.UazJr2fXKTG08s7GbYA8aZnl2HwP6Uh60eSN6ei_m1A';

(function () {
  if (!window.location.pathname.match(/\/notes\/bab-\d+-\d+\.html/)) return;

  var pathname = window.location.pathname;
  var SUKA_SRC   = 'https://img.icons8.com/?size=100&id=5twNojKL5zU7&format=png&color=000000';
  var KONGSI_SRC = 'https://img.icons8.com/?size=100&id=xPX4qmtKvtBp&format=png&color=000000';
  var PDF_DL_SRC = 'https://img.icons8.com/?size=100&id=d2H6kHCiPSIg&format=png&color=000000';
  /* Ikon cerah untuk bar gelap — elakkan filter CSS invert pada PNG Icons8 (warna jadi negatif/pelik). */
  var PDF_ICONS8_PRINT = 'https://img.icons8.com/?size=100&id=uRoarpD5f5ra&format=png&color=E2E8F0';
  var PDF_ICONS8_DOWNLOAD = 'https://img.icons8.com/?size=100&id=yGBEe6Dss9zK&format=png&color=E2E8F0';

  var style = document.createElement('style');
  style.textContent = [
    '.nota-feedback{text-align:center;padding:1.2rem 1rem 0.6rem;opacity:0;animation:nfb-in 0.4s ease 0.5s forwards}',
    '@keyframes nfb-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}',
    '.nota-feedback-actions{display:flex;justify-content:center;gap:0.5rem;margin-top:0.65rem;flex-wrap:wrap}',
    '.nota-feedback-suka-btn{display:inline-flex;align-items:center;gap:0.35rem;padding:0.38rem 1.3rem;border-radius:999px;border:2px solid rgba(224,80,140,0.28);background:rgba(224,80,140,0.06);color:#b8406a;font-size:0.82rem;font-weight:700;cursor:pointer;transition:transform 0.14s,box-shadow 0.14s,background 0.14s,border-color 0.14s}',
    '.nota-feedback-suka-btn img{width:22px;height:22px;pointer-events:none;flex-shrink:0}',
    '.nota-feedback-suka-btn:hover{transform:scale(1.05);box-shadow:0 3px 12px rgba(224,80,140,0.2)}',
    '.nota-feedback-suka-btn:active{transform:scale(0.96)}',
    '.nota-feedback-suka-btn.is-active{background:rgba(224,80,140,0.14);border-color:rgba(224,80,140,0.6);color:#a03060}',
    '.nota-feedback-label{margin:0 0 0.6rem;font-size:0.8rem;font-weight:700;color:#8c7d6a;letter-spacing:0.01em}',
    '.nota-feedback-options{display:flex;justify-content:center;gap:0.5rem}',
    '.nota-feedback-option-wrap{display:flex;flex-direction:column;align-items:center;gap:0.28rem}',
    '.nota-feedback-btn{width:48px;height:48px;border-radius:999px;border:1.5px solid rgba(92,110,132,0.14);background:rgba(255,253,248,0.9);cursor:pointer;transition:transform 0.14s,box-shadow 0.14s;display:inline-flex;align-items:center;justify-content:center;padding:0}',
    '.nota-feedback-btn img{width:26px;height:26px;pointer-events:none;display:block}',
    '.nota-feedback-btn:hover{transform:scale(1.18);box-shadow:0 4px 14px rgba(0,0,0,0.09)}',
    '.nota-feedback-btn:active{transform:scale(0.94)}',
    '.nota-feedback-btn-label{font-size:10px;font-weight:600;color:#8c7d6a;text-align:center;line-height:1.25}',
    '.nota-feedback-opinion-appr{display:flex;align-items:center;justify-content:center;gap:0.45rem;padding:0.3rem 0;opacity:0;animation:nfb-in 0.35s ease 0.05s forwards}',
    '.nota-feedback-opinion-appr img{width:28px;height:28px;flex-shrink:0}',
    '.nota-feedback-appr-msg{font-size:0.8rem;font-weight:700;color:#8c7d6a;margin:0}',
    '.nota-feedback-kongsi-btn{display:inline-flex;align-items:center;gap:0.35rem;padding:0.34rem 1.1rem;border-radius:999px;border:1.5px solid rgba(50,130,200,0.25);background:rgba(50,130,200,0.05);color:#2a6090;font-size:0.78rem;font-weight:700;cursor:pointer;transition:transform 0.14s,box-shadow 0.14s,background 0.14s}',
    '.nota-feedback-kongsi-btn img{width:18px;height:18px;pointer-events:none;flex-shrink:0}',
    '.nota-feedback-kongsi-btn:hover{transform:scale(1.05);box-shadow:0 3px 10px rgba(50,130,200,0.15)}',
    '.nota-feedback-kongsi-btn:active{transform:scale(0.96)}',
    '[data-theme="dark"] .nota-feedback-suka-btn{background:rgba(224,80,140,0.08);border-color:rgba(224,80,140,0.22);color:#d06090}',
    '[data-theme="dark"] .nota-feedback-suka-btn.is-active{background:rgba(224,80,140,0.18);border-color:rgba(224,80,140,0.5)}',
    '[data-theme="dark"] .nota-feedback-label{color:#b8aea1}',
    '[data-theme="dark"] .nota-feedback-btn{background:rgba(50,48,44,0.9);border-color:rgba(220,210,190,0.13)}',
    '[data-theme="dark"] .nota-feedback-btn-label{color:#8a8077}',
    '[data-theme="dark"] .nota-feedback-appr-msg{color:#b8aea1}',
    '[data-theme="dark"] .nota-feedback-kongsi-btn{background:rgba(50,130,200,0.08);border-color:rgba(50,130,200,0.2);color:#6aaad8}',
    '[data-theme="dark"] .nota-feedback-kongsi-btn img{filter:brightness(0) invert(1)}',
    '.nota-feedback-pdf-btn{display:inline-flex;align-items:center;gap:0.35rem;padding:0.34rem 1.1rem;border-radius:999px;border:1.5px solid rgba(79,70,229,0.22);background:rgba(79,70,229,0.05);color:#3730a3;font-size:0.78rem;font-weight:700;cursor:pointer;transition:transform 0.14s,box-shadow 0.14s,background 0.14s}',
    '.nota-feedback-pdf-btn img{width:18px;height:18px;pointer-events:none;flex-shrink:0}',
    '.nota-feedback-pdf-btn:hover{transform:scale(1.05);box-shadow:0 3px 10px rgba(79,70,229,0.15)}',
    '.nota-feedback-pdf-btn:active{transform:scale(0.96)}',
    '[data-theme="dark"] .nota-feedback-pdf-btn{background:rgba(79,70,229,0.1);border-color:rgba(79,70,229,0.25);color:#a5b4fc}',
    '[data-theme="dark"] .nota-feedback-pdf-btn img{filter:brightness(0) invert(1)}',
    '#zym-pdf-overlay{position:fixed;inset:0;z-index:10001;display:flex;flex-direction:column;background:#18182b;opacity:0;visibility:hidden;transition:opacity 0.22s,visibility 0.22s}',
    '#zym-pdf-overlay.is-open{opacity:1;visibility:visible}',
    '#zym-pdf-topbar{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#0f172a;flex-shrink:0;min-height:52px}',
    '#zym-pdf-topbar-title{font-family:Fredoka,sans-serif;font-size:0.92rem;font-weight:600;color:#cbd5e1;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#zym-pdf-mode-wrap{display:flex;align-items:center;gap:8px;flex-shrink:0;margin-right:4px}',
    '#zym-pdf-mode-seg{display:inline-flex;border-radius:999px;background:rgba(255,255,255,0.06);padding:3px;gap:2px}',
    '#zym-pdf-mode-full,#zym-pdf-mode-eco{border:none;cursor:pointer;font-family:Fredoka,sans-serif;font-size:0.72rem;font-weight:600;padding:6px 11px;border-radius:999px;color:#94a3b8;background:transparent;white-space:nowrap;transition:background 0.15s,color 0.15s}',
    '#zym-pdf-mode-full:disabled,#zym-pdf-mode-eco:disabled{opacity:0.45;cursor:default}',
    '#zym-pdf-mode-full:hover,#zym-pdf-mode-eco:hover{color:#e2e8f0}',
    '#zym-pdf-mode-full.is-active,#zym-pdf-mode-eco.is-active{background:rgba(79,70,229,0.45);color:#fff}',
    '#zym-pdf-topbar-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}',
    '#zym-pdf-print-btn,#zym-pdf-download-btn{width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,0.09);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.14s}',
    '#zym-pdf-print-btn:hover,#zym-pdf-download-btn:hover{background:rgba(255,255,255,0.18)}',
    '#zym-pdf-print-btn:disabled,#zym-pdf-download-btn:disabled{opacity:0.35;cursor:default;pointer-events:none}',
    '#zym-pdf-print-btn img,#zym-pdf-download-btn img{width:20px;height:20px;display:block;pointer-events:none}',
    '#zym-pdf-close-btn{width:34px;height:34px;border-radius:50%;border:none;background:rgba(255,255,255,0.07);color:#94a3b8;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.14s,color 0.14s}',
    '#zym-pdf-close-btn:hover{background:rgba(255,255,255,0.15);color:#e2e8f0}',
    '#zym-pdf-pages-viewport{flex:1;position:relative;min-height:0;display:flex;flex-direction:column;background:#1e293b}',
    '#zym-pdf-pages{flex:1;display:flex;flex-direction:row;align-items:center;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;gap:0;width:100%;scrollbar-width:thin;overscroll-behavior-x:contain}',
    '#zym-pdf-pages::-webkit-scrollbar{height:6px}',
    '#zym-pdf-pages::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:3px}',
    '.zym-pdf-page-slide{flex:0 0 100%;width:100%;min-width:100%;max-width:100%;box-sizing:border-box;scroll-snap-align:center;scroll-snap-stop:always;display:flex;align-items:center;justify-content:center;padding:12px 44px 18px;min-height:0}',
    '#zym-pdf-carousel-prev,#zym-pdf-carousel-next{position:absolute;top:50%;transform:translateY(-50%);z-index:3;width:40px;height:40px;border-radius:50%;border:none;background:rgba(15,23,42,0.55);color:#e2e8f0;font-size:1.35rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,0.35);transition:background 0.15s,color 0.15s}',
    '#zym-pdf-carousel-prev:hover,#zym-pdf-carousel-next:hover{background:rgba(79,70,229,0.55);color:#fff}',
    '#zym-pdf-carousel-prev:disabled,#zym-pdf-carousel-next:disabled{opacity:0.25;cursor:default;pointer-events:none}',
    '#zym-pdf-carousel-prev{left:6px}',
    '#zym-pdf-carousel-next{right:6px}',
    '#zym-pdf-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:60px 24px;color:#94a3b8;font-size:0.85rem;text-align:center;width:100%;min-width:100%}',
    '.zym-pdf-spinner{width:36px;height:36px;border:3px solid rgba(79,70,229,0.2);border-top-color:#4f46e5;border-radius:50%;animation:zym-spin 0.8s linear infinite;flex-shrink:0}',
    '@keyframes zym-spin{to{transform:rotate(360deg)}}',
    '.zym-pdf-page-outer{background:#fff;box-shadow:0 6px 28px rgba(0,0,0,0.4);width:100%;max-width:min(520px,calc(100vw - 88px));overflow:hidden;border-radius:2px;flex-shrink:0}',
    '.zym-pdf-page-hdr{display:flex;align-items:center;justify-content:space-between;padding:5px 9px;border-bottom:0.5px solid #d4d4e8;font-family:Fredoka,sans-serif}',
    '.zym-pdf-page-hdr-l{font-size:0.65rem;font-weight:700;color:#6060a0}',
    '.zym-pdf-page-hdr-r{font-size:0.57rem;color:#b0b0cc;max-width:55%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-align:right}',
    '.zym-pdf-page-canvas-wrap{display:flex;align-items:center;justify-content:center;background:#fff;min-height:0}',
    '.zym-pdf-page-canvas-wrap img{display:block;max-width:100%;max-height:min(72vh,calc(100dvh - 210px));width:auto;height:auto;object-fit:contain;border:0}',
    '.zym-pdf-page-ftr{display:flex;align-items:center;justify-content:space-between;padding:4px 9px;border-top:0.5px solid #d4d4e8;font-size:0.55rem;color:#b8b8d0;font-family:Fredoka,sans-serif}',
    '.zym-pdf-page-num{color:#6b7280;font-size:0.7rem;text-align:center;font-family:Fredoka,sans-serif;padding:2px}',
    '@media print{#zym-pdf-overlay{display:none!important}}',
    '#zym-print-header,#zym-print-footer{display:none}'
  ].join('');
  document.head.appendChild(style);

  function submitFeedback(reaction) {
    if (!NOTA_FB_SUPABASE_URL || !NOTA_FB_SUPABASE_KEY) return Promise.resolve(null);
    return fetch(NOTA_FB_SUPABASE_URL + '/rest/v1/rpc/submit_nota_feedback', {
      method: 'POST',
      headers: { 'apikey': NOTA_FB_SUPABASE_KEY, 'Authorization': 'Bearer ' + NOTA_FB_SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_path: pathname, p_reaction: reaction, p_secret: ZymStore.getUserSecret() })
    }).then(function (r) { return r && r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function deleteSukaFromSupabase(id) {
    if (!id || !NOTA_FB_SUPABASE_URL || !NOTA_FB_SUPABASE_KEY) return;
    fetch(NOTA_FB_SUPABASE_URL + '/rest/v1/rpc/delete_nota_feedback_entries', {
      method: 'POST',
      headers: { 'apikey': NOTA_FB_SUPABASE_KEY, 'Authorization': 'Bearer ' + NOTA_FB_SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_ids: [id], p_secret: ZymStore.getUserSecret() })
    }).catch(function () {});
  }

  function fluentImg(pair, size) {
    return '<img src="' + hzFluent3dAsset(pair[0], pair[1]) + '" alt="" width="' + size + '" height="' + size + '" loading="lazy">';
  }

  var OPINION_REACTIONS = [
    { key: 'mudah',        pair: HZ_FLUENT_SPARKLE.faceSmiling,  label: 'Mudah<br>difahami',  msg: 'Gembira nota ini mudah difahami! Terima kasih.' },
    { key: 'boleh-baik',   pair: HZ_FLUENT_SPARKLE.faceThinking, label: 'Boleh<br>diperbaiki', msg: 'Terima kasih! Kami akan usahakan yang terbaik.' },
    { key: 'kurang-jelas', pair: HZ_FLUENT_SPARKLE.faceConfused,  label: 'Kurang<br>jelas',    msg: 'Terima kasih! Maklum balas anda amat berharga.' }
  ];

  function findOpinion(key) {
    for (var i = 0; i < OPINION_REACTIONS.length; i++) {
      if (OPINION_REACTIONS[i].key === key) return OPINION_REACTIONS[i];
    }
    return null;
  }

  function makeOpinionAppr(opinionKey) {
    var r = findOpinion(opinionKey);
    var div = document.createElement('div');
    div.className = 'nota-feedback-opinion-appr';
    div.innerHTML = (r ? fluentImg(r.pair, 28) : '') +
      '<p class="nota-feedback-appr-msg">' + (r ? r.msg : 'Terima kasih!') + '</p>';
    return div;
  }

  var navSection = document.querySelector('.note-subsection .hero-actions');
  if (!navSection) return;
  var insertBefore = navSection.closest('.note-subsection');
  if (!insertBefore) return;

  var sukaState  = { given: ZymStore.getSukaGiven(pathname), id: ZymStore.getSukaId(pathname) };
  var opinionKey = ZymStore.getFeedback(pathname);

  var widget = document.createElement('div');
  widget.className = 'nota-feedback';

  // ── Suka section (toggleable, lives in bottom actions row) ───
  var sukaSection = document.createElement('div');

  function renderSuka() {
    var active = sukaState.given;
    sukaSection.innerHTML =
      '<button class="nota-feedback-suka-btn' + (active ? ' is-active' : '') + '" type="button">' +
      '<img src="' + SUKA_SRC + '" alt="" width="22" height="22" loading="lazy">' +
      '<span>' + (active ? 'Suka! ✓' : 'Suka!') + '</span></button>';
    sukaSection.querySelector('button').addEventListener('click', function () {
      if (sukaState.given) {
        // undo
        var id = sukaState.id;
        ZymStore.clearSuka(pathname);
        sukaState.given = false;
        sukaState.id = null;
        deleteSukaFromSupabase(id);
      } else {
        if (typeof gtag === 'function') gtag('event', 'nota_reaction', { reaction: 'suka', page_path: pathname });
        ZymStore.saveFeedback(pathname, 'suka', null);
        sukaState.given = true;
        submitFeedback('suka').then(function (supId) {
          if (supId) { ZymStore.saveFeedback(pathname, 'suka', supId); sukaState.id = supId; }
        });
      }
      renderSuka();
    });
  }
  renderSuka();

  // ── Opinion section ───────────────────────────────
  var opinionSection = document.createElement('div');
  if (opinionKey) {
    opinionSection.appendChild(makeOpinionAppr(opinionKey));
  } else {
    opinionSection.innerHTML =
      '<p class="nota-feedback-label">Apa pendapat anda tentang nota ini?</p>' +
      '<div class="nota-feedback-options">' +
      OPINION_REACTIONS.map(function (r) {
        return '<div class="nota-feedback-option-wrap">' +
          '<button class="nota-feedback-btn" type="button" data-reaction="' + r.key + '">' +
          fluentImg(r.pair, 26) + '</button>' +
          '<span class="nota-feedback-btn-label">' + r.label + '</span></div>';
      }).join('') + '</div>';
    opinionSection.querySelectorAll('.nota-feedback-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var reaction = btn.getAttribute('data-reaction');
        if (typeof gtag === 'function') gtag('event', 'nota_reaction', { reaction: reaction, page_path: pathname });
        ZymStore.saveFeedback(pathname, reaction, null);
        submitFeedback(reaction).then(function (supId) {
          if (supId) ZymStore.saveFeedback(pathname, reaction, supId);
        });
        opinionSection.innerHTML = '';
        opinionSection.appendChild(makeOpinionAppr(reaction));
      });
    });
  }

  // ── Kongsi Pautan button ──────────────────────────
  var kongsiBtn = document.createElement('button');
  kongsiBtn.className = 'nota-feedback-kongsi-btn';
  kongsiBtn.type = 'button';
  kongsiBtn.innerHTML = '<img src="' + KONGSI_SRC + '" alt="" width="18" height="18" loading="lazy"><span>Kongsi Pautan</span>';
  kongsiBtn.addEventListener('click', function () {
    var url = window.location.href;
    var title = document.title || 'ZymNotes';
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        var span = kongsiBtn.querySelector('span');
        span.textContent = 'Pautan disalin!';
        setTimeout(function () { span.textContent = 'Kongsi Pautan'; }, 2000);
      }).catch(function () {});
    }
  });

  // ── PDF Download — Pratonton dalaman ZymNotes + jana PDF terus ──────────
  var pdfBtn = document.createElement('button');
  pdfBtn.className = 'nota-feedback-pdf-btn';
  pdfBtn.type = 'button';
  pdfBtn.innerHTML = '<img src="' + PDF_DL_SRC + '" alt="" width="18" height="18" loading="lazy"><span>PDF</span>';

  // Build preview overlay
  var pdfOverlay = document.createElement('div');
  pdfOverlay.id = 'zym-pdf-overlay';
  pdfOverlay.setAttribute('aria-hidden', 'true');
  pdfOverlay.setAttribute('role', 'dialog');
  pdfOverlay.setAttribute('aria-modal', 'true');
  pdfOverlay.setAttribute('aria-label', 'Pratonton PDF');
  pdfOverlay.innerHTML = [
    '<div id="zym-pdf-topbar">',
      '<div id="zym-pdf-topbar-title">Pratonton PDF</div>',
      '<div id="zym-pdf-mode-wrap" role="group" aria-label="Mod PDF">',
        '<div id="zym-pdf-mode-seg">',
          '<button type="button" id="zym-pdf-mode-full" class="is-active" aria-pressed="true">Warna & emoji</button>',
          '<button type="button" id="zym-pdf-mode-eco" aria-pressed="false">Jimat dakwat</button>',
        '</div>',
      '</div>',
      '<div id="zym-pdf-topbar-actions">',
        '<button type="button" id="zym-pdf-print-btn" class="zym-pdf-icon-btn" disabled aria-label="Cetak nota">',
          '<img src="' + PDF_ICONS8_PRINT + '" alt="" width="20" height="20" loading="lazy">',
        '</button>',
        '<button type="button" id="zym-pdf-download-btn" class="zym-pdf-icon-btn" disabled aria-label="Muat turun PDF">',
          '<img src="' + PDF_ICONS8_DOWNLOAD + '" alt="" width="20" height="20" loading="lazy">',
        '</button>',
      '</div>',
      '<button id="zym-pdf-close-btn" type="button" aria-label="Tutup">✕</button>',
    '</div>',
    '<div id="zym-pdf-pages-viewport" class="zym-pdf-pages-viewport">',
      '<div id="zym-pdf-pages">',
        '<div id="zym-pdf-loading">',
          '<div class="zym-pdf-spinner"></div>',
          '<p>Sedang menyediakan pratonton…</p>',
        '</div>',
      '</div>',
      '<button type="button" id="zym-pdf-carousel-prev" aria-label="Halaman sebelumnya">‹</button>',
      '<button type="button" id="zym-pdf-carousel-next" aria-label="Halaman seterusnya">›</button>',
    '</div>'
  ].join('');
  document.body.appendChild(pdfOverlay);

  function _pdfUpdateCarouselUi() {
    var track = document.getElementById('zym-pdf-pages');
    var prev = document.getElementById('zym-pdf-carousel-prev');
    var next = document.getElementById('zym-pdf-carousel-next');
    var ttl = document.getElementById('zym-pdf-topbar-title');
    if (!track || !prev || !next) return;
    var slides = track.querySelectorAll('.zym-pdf-page-slide');
    var n = slides.length;
    if (!n) {
      prev.disabled = true;
      next.disabled = true;
      if (ttl) ttl.textContent = 'Pratonton PDF';
      return;
    }
    var cw = track.clientWidth || 1;
    var idx = Math.min(n - 1, Math.max(0, Math.round(track.scrollLeft / cw)));
    prev.disabled = idx <= 0;
    next.disabled = idx >= n - 1;
    if (ttl) ttl.textContent = 'Pratonton PDF · ' + (idx + 1) + ' / ' + n;
  }

  (function _pdfCarouselInit() {
    var track = document.getElementById('zym-pdf-pages');
    if (!track || track.dataset.zymPdfCarousel) return;
    track.dataset.zymPdfCarousel = '1';
    track.addEventListener('scroll', function() {
      requestAnimationFrame(_pdfUpdateCarouselUi);
    }, { passive: true });
    var prev = document.getElementById('zym-pdf-carousel-prev');
    var next = document.getElementById('zym-pdf-carousel-next');
    if (prev) {
      prev.addEventListener('click', function() {
        var t = document.getElementById('zym-pdf-pages');
        if (t) t.scrollBy({ left: -(t.clientWidth || 0), behavior: 'smooth' });
      });
    }
    if (next) {
      next.addEventListener('click', function() {
        var t = document.getElementById('zym-pdf-pages');
        if (t) t.scrollBy({ left: (t.clientWidth || 0), behavior: 'smooth' });
      });
    }
  })();

  var _pdfPageCanvases = [];
  var _pdfDims = null;
  var _pdfNoteTitle = '';
  var _pdfBusy = false;
  var _pdfModalHistoryActive = false;
  var _pdfActiveMode = 'full';
  var _pdfCache = { full: { pages: null, dims: null }, eco: { pages: null, dims: null } };

  function _escPdfHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _escPdfAttr(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  function _loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = function() { cb(null); };
    s.onerror = function() { cb(new Error('Gagal memuatkan: ' + src)); };
    document.head.appendChild(s);
  }

  function _ensureLibs(cb) {
    var toLoad = [];
    if (!window.html2canvas) toLoad.push('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    if (!window.jspdf && !window.jsPDF) toLoad.push('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    if (!toLoad.length) { cb(null); return; }
    var done = 0;
    var failed = false;
    toLoad.forEach(function(src) {
      _loadScript(src, function(err) {
        if (failed) return;
        if (err) { failed = true; cb(err); return; }
        done++;
        if (done === toLoad.length) cb(null);
      });
    });
  }

  // ── Print Renderer: extract note DOM → build clean paper HTML ────────
  /** Indeks anak pertama dalam rentetan emoji di penghujung (teks di hadapan). */
  function _pdfTrailingEmojiStartIndex(childNodes) {
    var n = childNodes.length;
    if (!n) return -1;
    var j = n - 1;
    while (j >= 0) {
      var node = childNodes[j];
      if (node.nodeType === 3 && !/\S/.test(node.textContent)) { j--; continue; }
      break;
    }
    if (j < 0) return -1;
    if (childNodes[j].nodeType !== 1 || childNodes[j].tagName !== 'IMG') return -1;
    while (j >= 0) {
      var nn = childNodes[j];
      if (nn.nodeType === 3 && !/\S/.test(nn.textContent)) { j--; continue; }
      if (nn.nodeType === 1 && nn.tagName === 'IMG') { j--; continue; }
      break;
    }
    var trailStart = j + 1;
    return trailStart > 0 ? trailStart : -1;
  }

  /** Indeks anak pertama selepas rentetan emoji/ruang di permulaan (untuk balut teks dinaikkan dalam PDF). */
  function _pdfLeadingEmojiCutIndex(childNodes) {
    var n = childNodes.length;
    var i = 0;
    while (i < n) {
      var node = childNodes[i];
      if (node.nodeType === 3 && !/\S/.test(node.textContent)) { i++; continue; }
      break;
    }
    if (i >= n) return -1;
    if (childNodes[i].nodeType !== 1 || childNodes[i].tagName !== 'IMG') return -1;
    while (i < n) {
      var nn = childNodes[i];
      if (nn.nodeType === 3 && !/\S/.test(nn.textContent)) { i++; continue; }
      if (nn.nodeType === 1 && nn.tagName === 'IMG') { i++; continue; }
      break;
    }
    return i < n ? i : -1;
  }

  function _kwHtmlOne(node, o) {
    o = o || {};
    if (node.nodeType === 3) return _escPdfHtml(node.textContent);
    if (node.nodeType !== 1) return '';
    if (node.tagName === 'IMG') {
      var src = node.getAttribute('src');
      if (!src) return '';
      var w = node.getAttribute('width') || (node.width ? String(node.width) : '20');
      var h = node.getAttribute('height') || (node.height ? String(node.height) : '20');
      return '<img class="zp-emoji" src="' + _escPdfAttr(src) + '" alt="" width="' + _escPdfAttr(String(w)) + '" height="' + _escPdfAttr(String(h)) + '" decoding="async" />';
    }
    var m = (node.className || '').match(/\bkw-(istilah|tempat|tokoh|masa|tahun|konsep|kerajaan|pentadbiran|perjanjian|peristiwa|gerakan|pertubuhan|karya|tarikh)\b/);
    if (m) return '<span class="zpkw zpkw-' + m[1] + '">' + _escPdfHtml(node.textContent) + '</span>';
    return _kwHtml(node, { freeze: !!o.freeze });
  }

  function _kwHtml(el, opts) {
    if (!el || el.nodeType !== 1 || !el.childNodes || !el.childNodes.length) return '';
    opts = opts || {};
    if (!opts.freeze) {
      var cut = _pdfLeadingEmojiCutIndex(el.childNodes);
      if (cut >= 0) {
        var head = '';
        for (var i = 0; i < cut; i++) head += _kwHtmlOne(el.childNodes[i], { freeze: true });
        var tail = '';
        for (var j = cut; j < el.childNodes.length; j++) tail += _kwHtmlOne(el.childNodes[j], { freeze: true });
        return head + '<span class="zp-txt-up">' + tail + '</span>';
      }
      var ts = _pdfTrailingEmojiStartIndex(el.childNodes);
      if (ts >= 0) {
        var headT = '';
        for (var ia = 0; ia < ts; ia++) headT += _kwHtmlOne(el.childNodes[ia], { freeze: true });
        var tailT = '';
        for (var jb = ts; jb < el.childNodes.length; jb++) tailT += _kwHtmlOne(el.childNodes[jb], { freeze: true });
        return '<span class="zp-txt-up">' + headT + '</span>' + tailT;
      }
    }
    var out = '';
    for (var k = 0; k < el.childNodes.length; k++) {
      out += _kwHtmlOne(el.childNodes[k], opts);
    }
    return out;
  }

  function _bodyHtml(el) {
    var h = '';
    el.childNodes.forEach(function(node) {
      if (node.nodeType !== 1) return;
      var cls = node.className || '', tag = node.tagName;
      if (cls.indexOf('paper-chip-list') !== -1) {
        var hasSentence = node.querySelector('.paper-chip-sentence') !== null;
        if (hasSentence) {
          node.querySelectorAll('.paper-chip').forEach(function(c) {
            h += '<p class="zp-sentence">' + _kwHtml(c) + '</p>';
          });
        } else {
          h += '<div class="zp-chips">';
          node.querySelectorAll('.paper-chip').forEach(function(c) {
            h += '<span class="zp-chip">' + _kwHtml(c) + '</span>';
          });
          h += '</div>';
        }
      } else if (cls.indexOf('point-heading') !== -1) {
        h += '<p class="zp-ph">' + _kwHtml(node) + '</p>';
      } else if (cls.indexOf('point-line') !== -1) {
        h += '<p class="zp-p">· ' + _kwHtml(node) + '</p>';
      } else if (tag === 'P') {
        var t = node.textContent.trim();
        if (t && t.indexOf('Klik kad') === -1 && t.indexOf('akan terbuka') === -1)
          h += '<p class="zp-p">' + _kwHtml(node) + '</p>';
      } else if (tag === 'H2' || tag === 'H3' || tag === 'H4') {
        h += '<p class="zp-ph">' + _escPdfHtml(node.textContent.trim()) + '</p>';
      } else if (cls.indexOf('answer-paper') !== -1) {
        h += '<div class="zp-answer">' + _bodyHtml(node) + '</div>';
      } else if (tag === 'UL' || tag === 'OL') {
        node.querySelectorAll('li').forEach(function(li) {
          h += '<p class="zp-p">· ' + _kwHtml(li) + '</p>';
        });
      } else if (cls.indexOf('paper-grid') !== -1) {
        h += '<div class="zp-chips">';
        node.querySelectorAll('.paper-kingdom').forEach(function(k) {
          h += '<span class="zp-chip">' + _kwHtml(k) + '</span>';
        });
        h += '</div>';
      } else if (cls.indexOf('paper-steps') !== -1) {
        h += '<div class="zp-steps">';
        node.querySelectorAll('.paper-step').forEach(function(step) {
          var p = step.querySelector('p');
          if (p) h += '<span class="zp-step">' + _escPdfHtml(p.textContent.trim()) + '</span>';
        });
        h += '</div>';
      } else if (cls.indexOf('paper-accordion') !== -1) {
        var idx2 = 0;
        node.querySelectorAll('.paper-accordion-item').forEach(function(item) {
          idx2++;
          var trig2  = item.querySelector('.paper-accordion-trigger');
          var panel2 = item.querySelector('.paper-accordion-panel');
          h += '<div class="zp-acc">';
          if (trig2) {
            var ttl2 = trig2.querySelector('.paper-accordion-title');
            h += '<div class="zp-acc-hd"><span class="zp-acc-num">' + idx2 + '</span>';
            if (ttl2) h += '<span class="zp-acc-ttl">' + _kwHtml(ttl2) + '</span>';
            h += '</div>';
          }
          if (panel2) {
            var body3 = panel2.querySelector('.cv-unit-body');
            h += '<div class="zp-acc-body">' + (body3 ? _bodyHtml(body3) : '') + '</div>';
          }
          h += '</div>';
        });
      } else if (cls.indexOf('org-chart') !== -1) {
        node.querySelectorAll('.org-level').forEach(function(level, li) {
          var lc = level.className;
          var nodes = level.querySelectorAll('.org-node');
          var isL2 = lc.indexOf('org-level-2') !== -1;
          var isL3 = lc.indexOf('org-level-3') !== -1;
          if (li > 0) h += '<p style="color:#6366f1;font-size:12px;margin:2px 0 2px ' + (isL3 ? '40px' : isL2 ? '20px' : '0') + '">↓</p>';
          if (isL3) {
            h += '<div class="zp-chips" style="padding-left:40px">';
            nodes.forEach(function(n) { h += '<span class="zp-chip">' + _kwHtml(n) + '</span>'; });
            h += '</div>';
          } else {
            nodes.forEach(function(n) {
              var ps = isL2 ? ' style="padding-left:20px"' : '';
              h += '<p class="zp-ph"' + ps + '>' + _kwHtml(n) + '</p>';
            });
          }
        });
      } else if (cls.indexOf('paper-timeline') !== -1) {
        h += _pdfPaperTimelineHtml(node);
      } else { h += _bodyHtml(node); }
    });
    return h;
  }

  /** Garis masa (.paper-timeline) → HTML pratonton PDF — satu sumber benar untuk _bodyHtml & _renderSubChild (node + panel). */
  function _pdfPaperTimelineHtml(timelineEl) {
    if (!timelineEl) return '';
    function _zpTlStep(nodeEl, panelEl) {
      var s = '<div class="zp-tl-card">';
      s += '<p class="zp-tl-hd">' + _kwHtml(nodeEl) + '</p>';
      if (panelEl && (panelEl.className || '').indexOf('paper-timeline-panel') !== -1) {
        var bd = _bodyHtml(panelEl);
        if (bd) s += '<div class="zp-tl-bd">' + bd + '</div>';
      }
      s += '</div>';
      return s;
    }
    var out = '<div class="zp-tl">';
    var ch = timelineEl.firstElementChild;
    while (ch) {
      if ((ch.className || '').indexOf('paper-timeline-card') !== -1) {
        var hd = ch.querySelector(':scope > .paper-timeline-node');
        var bd = ch.querySelector(':scope > .paper-timeline-panel');
        if (hd) out += _zpTlStep(hd, bd);
        else if (bd) {
          var onlyBd = _bodyHtml(bd);
          if (onlyBd) out += '<div class="zp-tl-card"><div class="zp-tl-bd">' + onlyBd + '</div></div>';
        }
        ch = ch.nextElementSibling;
        continue;
      }
      if ((ch.className || '').indexOf('paper-timeline-node') !== -1) {
        var pn = ch.nextElementSibling;
        var panel = pn && (pn.className || '').indexOf('paper-timeline-panel') !== -1 ? pn : null;
        out += _zpTlStep(ch, panel);
        ch = panel ? panel.nextElementSibling : ch.nextElementSibling;
        continue;
      }
      ch = ch.nextElementSibling;
    }
    out += '</div>';
    return out;
  }

  function _buildPrintHtml(mainEl) {
    function _renderBoard(el, h) {
      var strip = el.querySelector('.paper-strip');
      var body  = el.querySelector('.cv-unit-body');
      var color = '#4f46e5';
      if (strip) {
        var sc = strip.className;
        if (sc.indexOf('strip-summary') !== -1) color = '#16a34a';
        else if (sc.indexOf('strip-info') !== -1) color = '#2563eb';
        else if (sc.indexOf('strip-glossary') !== -1) color = '#7c3aed';
        else if (sc.indexOf('strip-sub') !== -1) color = '#d97706';
      }
      h += '<div class="zp-board" style="border-color:' + color + '">';
      if (strip) h += '<div class="zp-board-lbl" style="color:' + color + '">' + _kwHtml(strip) + '</div>';
      if (body) h += _bodyHtml(body);
      h += '</div>';
      return h;
    }
    function _renderAccordion(el, h) {
      var idx = 0;
      el.querySelectorAll('.paper-accordion-item').forEach(function(item) {
        idx++;
        var trig  = item.querySelector('.paper-accordion-trigger');
        var panel = item.querySelector('.paper-accordion-panel');
        h += '<div class="zp-acc">';
        if (trig) {
          var ttl = trig.querySelector('.paper-accordion-title');
          h += '<div class="zp-acc-hd"><span class="zp-acc-num">' + idx + '</span>';
          if (ttl) {
            h += '<span class="zp-acc-ttl"><span class="zp-acc-ttl-txt">' +
              _escPdfHtml(ttl.textContent.trim()) + '</span></span>';
          }
          h += '</div>';
        }
        if (panel) {
          var body2 = panel.querySelector('.cv-unit-body');
          h += '<div class="zp-acc-body">' + (body2 ? _bodyHtml(body2) : '') + '</div>';
        }
        h += '</div>';
      });
      return h;
    }
    function _renderSubChild(child, h) {
      var cls = child.className || '';
      if (cls.indexOf('paper-flap-card') !== -1) {
        var fTop = child.querySelector('.flap-top');
        var fQ   = child.querySelector('.point-heading');
        var fA   = child.querySelector('.answer-paper');
        h += '<div class="zp-flap">';
        if (fTop) h += '<div class="zp-flap-top">' + _kwHtml(fTop) + '</div>';
        if (fQ)   h += '<div class="zp-flap-q">' + _kwHtml(fQ) + '</div>';
        if (fA)   h += '<div class="zp-flap-a">' + _bodyHtml(fA) + '</div>';
        h += '</div>';
      } else if (cls.indexOf('section-heading') !== -1) {
        var badge = child.querySelector('.paper-label');
        var sh2   = child.querySelector('h2');
        h += '<div class="zp-section">';
        if (badge) h += '<span class="zp-section-badge">' + _escPdfHtml(badge.textContent.trim()) + '</span>';
        if (sh2)   h += '<h2 class="zp-section-title">' + _kwHtml(sh2) + '</h2>';
        child.querySelectorAll(':scope > p').forEach(function(pEl) {
          var tp = pEl.textContent.trim();
          if (tp && tp.indexOf('Klik kad') === -1 && tp.indexOf('akan terbuka') === -1) {
            h += '<p class="zp-p">' + _kwHtml(pEl) + '</p>';
          }
        });
        h += '</div>';
      } else if (cls.indexOf('paper-timeline') !== -1) {
        h += _pdfPaperTimelineHtml(child);
      } else if (cls.indexOf('paper-board') !== -1) {
        h = _renderBoard(child, h);
      } else if (cls.indexOf('paper-accordion') !== -1) {
        h = _renderAccordion(child, h);
      } else if (cls.indexOf('paper-grid') !== -1) {
        child.querySelectorAll('.paper-board').forEach(function(board) {
          h = _renderBoard(board, h);
        });
      } else if (cls.indexOf('hero-actions') !== -1) {
        /* butang navigasi bawah halaman — tiada dalam PDF */
      } else {
        /* Bungkus baharu / blok tidak dikenali: elak kandungan hilang (cth. .paper-timeline dalam div pembungkus) */
        h += _bodyHtml(child);
      }
      return h;
    }

    var h = '<div class="zp-page">';

    // Hero: direct child of main
    var heroEl = mainEl.querySelector('.page-hero');
    if (heroEl) {
      var lbl  = heroEl.querySelector('.paper-label');
      var eye  = heroEl.querySelector('.eyebrow');
      var h1   = heroEl.querySelector('h1');
      var lead = heroEl.querySelector('.lead');
      h += '<div class="zp-hero">';
      if (lbl)  h += '<span class="zp-chapter-lbl">' + _escPdfHtml(lbl.textContent.trim()) + '</span>';
      if (eye)  h += '<div class="zp-subtopik">' + _kwHtml(eye) + '</div>';
      if (h1)   h += '<h1 class="zp-title">' + _kwHtml(h1) + '</h1>';
      if (lead) h += '<p class="zp-desc">' + _kwHtml(lead) + '</p>';
      h += '</div>';
    }

    // All note content lives inside .note-section > .container (one level below main)
    // Walk its direct children in DOM order: master-summary board first, then subsections.
    // Dalam setiap note-subsection, _renderSubChild mengendalikan section-heading, paper-timeline,
    // paper-board, paper-accordion, paper-grid, paper-flap-card; lain-lain (kecuali hero-actions)
    // lulus ke _bodyHtml supaya pembungkus baharu tidak membuang kandungan (cth. garis masa).
    var contentEl = mainEl.querySelector('.note-section .container') ||
                    mainEl.querySelector('.container.narrow') ||
                    mainEl;
    contentEl.childNodes.forEach(function(child) {
      if (child.nodeType !== 1) return;
      var cls = child.className || '';
      // Skip audio player and other non-content elements
      if (cls.indexOf('note-audio') !== -1) return;
      if (cls.indexOf('cv-lab') !== -1) return;
      if (cls.indexOf('pdf-') !== -1) return;

      if (cls.indexOf('paper-board') !== -1) {
        // master-summary-paper (Ringkasan) and other direct boards
        h = _renderBoard(child, h);
      } else if (cls.indexOf('note-subsection') !== -1) {
        var subKids = [];
        for (var si = 0; si < child.childNodes.length; si++) {
          var sn = child.childNodes[si];
          if (sn.nodeType === 1) subKids.push(sn);
        }
        var i = 0;
        while (i < subKids.length) {
          var c = subKids[i];
          var ccls = c.className || '';
          if (ccls.indexOf('section-heading') !== -1) {
            h += '<div class="zp-section-wrap">';
            h = _renderSubChild(c, h);
            i++;
            while (i < subKids.length) {
              var nx = subKids[i];
              var nxcls = nx.className || '';
              if (nxcls.indexOf('section-heading') !== -1) break;
              h = _renderSubChild(nx, h);
              i++;
            }
            h += '</div>';
          } else {
            h = _renderSubChild(c, h);
            i++;
          }
        }
      }
    });

    h += '</div>';
    return h;
  }
  function _getPrintCss(mode) {
    var isEco = mode === 'eco';
    var rules = [
      '#zym-pr,#zym-pr *{box-sizing:border-box;font-family:Fredoka,sans-serif}',
      '#zym-pr{position:fixed;left:-9999px;top:0;width:794px;background:#fff;font-size:13.5px;color:#1a1a3a;line-height:1.48;z-index:-9999;pointer-events:none}',
      '#zym-pr .zp-page{padding:0 34px 26px}',
      // Hero
      '#zym-pr .zp-hero{padding:16px 0 12px;border-bottom:2px solid #4f46e5;margin-bottom:12px;break-inside:avoid;page-break-inside:avoid}',
      '#zym-pr .zp-chapter-lbl{display:inline-flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:700;color:#fff;background:#4f46e5;padding:5px 11px;border-radius:4px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;line-height:1;min-height:22px}',
      '#zym-pr .zp-subtopik{display:flex;align-items:center;font-size:9.5px;color:#6b7280;letter-spacing:.1em;text-transform:uppercase;margin:4px 0 5px;line-height:1.2;min-height:18px}',
      '#zym-pr h1.zp-title{display:flex;flex-wrap:wrap;align-items:center;column-gap:.35em;row-gap:.12em;font-size:22px;font-weight:700;color:#1e1e3a;line-height:1.2;margin:0 0 6px}',
      '#zym-pr .zp-desc{font-size:12px;color:#4a4a6a;margin:0;line-height:1.5}',
      // Boards — padding & margin lebih selesa (elak teks “tersepit” dengan sempadan)
      '#zym-pr .zp-board{border:1.5px solid;border-left-width:4px;border-radius:0 8px 8px 0;padding:9px 13px;margin-bottom:7px;background:#fafaff;break-inside:avoid;page-break-inside:avoid}',
      '#zym-pr .zp-board-lbl{display:flex;align-items:center;min-height:20px;font-size:8.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;margin-bottom:7px;line-height:1.08}',
      // Flap card (Soalan Utama)
      '#zym-pr .zp-flap{border:1.5px solid #d97706;border-radius:8px;overflow:hidden;margin-bottom:8px;break-inside:avoid;page-break-inside:avoid}',
      '#zym-pr .zp-flap-top{display:flex;align-items:center;min-height:30px;line-height:1.1;background:#fef3c7;padding:7px 13px;font-size:11.5px;font-weight:700;color:#92400e;border-bottom:1px solid #fde68a}',
      '#zym-pr .zp-flap-q{display:flex;flex-wrap:wrap;align-items:center;gap:.35em;padding:10px 14px 6px;font-size:12.5px;font-weight:700;color:#1a1a3a;line-height:1.28}',
      '#zym-pr .zp-flap-a{display:flex;flex-wrap:wrap;align-items:center;gap:.35em;padding:5px 14px 10px;font-size:12.5px;color:#3a3a5a;background:#fffbf0;line-height:1.45}',
      // Section (eyebrow → tajuk)
      '#zym-pr .zp-section{margin:14px 0 6px;break-inside:avoid;page-break-inside:avoid}',
      '#zym-pr .zp-section-badge{display:inline-flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#4f46e5;padding:5px 12px;border-radius:999px;margin-bottom:7px;line-height:1;min-height:22px}',
      '#zym-pr h2.zp-section-title{display:flex;flex-wrap:wrap;align-items:center;column-gap:.35em;row-gap:.15em;font-size:16px;font-weight:700;color:#1e1e3a;margin:0 0 8px;line-height:1.25}',
      // Pembungkus bahagian (logik DOM sahaja; elak pisah halaman diurus melalui julat blok PDF)
      '#zym-pr .zp-section-wrap{margin:10px 0 12px}',
      '#zym-pr .zp-section-wrap .zp-section{margin:0 0 3px}',
      '#zym-pr .zp-section-wrap .zp-section-badge{margin-bottom:5px}',
      '#zym-pr .zp-section-wrap h2.zp-section-title{margin:0 0 5px}',
      // Accordion — sedikit lebih jimat ruang (contoh: “Berlaku secara” bab 1.1)
      '#zym-pr .zp-acc{border:1px solid #e0e0ef;border-radius:8px;margin-bottom:4px;overflow:hidden;break-inside:avoid}',
      '#zym-pr .zp-acc-hd{display:flex;align-items:center;gap:7px;padding:5px 9px;background:#f4f4ff;border-bottom:1px solid #e0e0ef}',
      '#zym-pr .zp-acc-num{font-size:10px;font-weight:700;color:#4f46e5;min-width:20px;height:20px;line-height:1;background:#ede9fe;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}',
      '#zym-pr .zp-acc-ttl{font-size:12.5px;font-weight:700;color:#1e1e3a;line-height:1.08;display:flex;align-items:center;flex-wrap:wrap;column-gap:.28em;row-gap:.1em}',
      '#zym-pr .zp-acc-ttl-txt{position:relative;top:-0.26em;display:inline-block;line-height:1.06}',
      // Teks selepas emoji (dibungkus semasa _kwHtml) — naikkan optik selari imej (html2canvas tidak sentiasa hormati :has())
      '#zym-pr .zp-txt-up{position:relative;top:-0.32em;display:inline}',
      '#zym-pr .zp-acc-body{padding:5px 9px}',
      '#zym-pr .zp-acc-body > p.zp-p{margin:2px 0 5px;line-height:1.46}',
      '#zym-pr .zp-acc-body > p.zp-ph{margin:3px 0 3px}',
      // Garis masa PDF — kad selari blok akordion (kepala + isi)
      '#zym-pr .zp-tl{margin:4px 0 10px}',
      '#zym-pr .zp-tl-card{border:1px solid #e0e0ef;border-radius:8px;margin-bottom:5px;overflow:hidden;break-inside:avoid;background:#fafbff}',
      '#zym-pr .zp-tl-hd{margin:0;padding:7px 11px;font-size:12.5px;font-weight:700;color:#1e1e3a;line-height:1.28;background:#f4f4ff;border-bottom:1px solid #e0e0ef}',
      '#zym-pr .zp-tl-bd{padding:6px 11px 9px;background:#fff;font-size:12.5px;color:#3a3a5a}',
      '#zym-pr .zp-tl-bd p.zp-p{margin:3px 0 6px;line-height:1.46}',
      '#zym-pr .zp-tl-bd p.zp-ph{margin:4px 0;font-size:12.5px;line-height:1.3}',
      '#zym-pr .zp-tl-bd .zp-chips{margin:4px 0 6px}',
      '#zym-pr .zp-tl-bd .zp-answer{margin:4px 0}',
      // Chips — lebih tinggi & jarak baris supaya teks tidak mepet bingkai
      '#zym-pr .zp-chips{display:flex;flex-wrap:wrap;gap:5px 7px;margin:5px 0}',
      '#zym-pr .zp-chip{border:1px solid #d8d8ee;background:#f0f0f8;border-radius:6px;padding:4px 9px;font-size:11.5px;color:#2d2d5a;display:inline-flex;align-items:center;justify-content:center;gap:4px;max-width:100%;line-height:1.16;min-height:24px}',
      // Steps (process flow)
      '#zym-pr .zp-steps{display:flex;flex-wrap:wrap;gap:5px 8px;margin:7px 0;align-items:center}',
      '#zym-pr .zp-step{border:1px solid #c7d2fe;background:#eef2ff;border-radius:6px;padding:5px 10px;font-size:11.5px;color:#3730a3;position:relative;display:inline-flex;align-items:center;justify-content:center;line-height:1.34;min-height:30px}',
      '#zym-pr .zp-step+.zp-step::before{content:"→";margin-right:6px;color:#6366f1;font-size:12px}',
      // Answer box
      '#zym-pr .zp-answer{border-left:3px solid #d0d0e8;padding-left:10px;margin:5px 0}',
      // Text
      '#zym-pr p.zp-p{font-size:12.5px;color:#3a3a5a;margin:4px 0 7px;line-height:1.52}',
      '#zym-pr p.zp-ph{font-size:13px;font-weight:700;color:#1a1a3a;margin:6px 0 5px;line-height:1.32}',
      '#zym-pr p.zp-sentence{font-size:12.5px;color:#3a3a5a;margin:5px 0;padding:6px 11px;border-left:3px solid #c7d2fe;line-height:1.55}',
      // Kata kunci — penyerlah: inline-block + translateY supaya latar selari Fredoka/html2canvas
      '#zym-pr .zpkw{display:inline-block;vertical-align:text-bottom;line-height:1.1;padding:0.05em 0.26em 0.09em;margin:0;border-radius:0.35em;font-size:inherit;font-weight:700;transform:translateY(0.11em);-webkit-box-decoration-break:clone;box-decoration-break:clone;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '#zym-pr .zpkw-tokoh{color:#7f1d1d;background:rgba(254,202,211,0.62)}',
      '#zym-pr .zpkw-masa{color:#1e3a8a;background:rgba(191,219,254,0.62)}',
      '#zym-pr .zpkw-tahun{color:#0c4a6e;background:rgba(125,211,252,0.45)}',
      '#zym-pr .zpkw-tempat{color:#14532d;background:rgba(187,247,208,0.62)}',
      '#zym-pr .zpkw-konsep{color:#7c2d12;background:rgba(254,215,170,0.62)}',
      '#zym-pr .zpkw-kerajaan{color:#4c1d95;background:rgba(221,214,254,0.62)}',
      '#zym-pr .zpkw-istilah{color:#115e59;background:rgba(153,246,228,0.55)}',
      '#zym-pr .zpkw-pentadbiran{color:#78350f;background:rgba(254,243,199,0.72)}',
      '#zym-pr .zpkw-perjanjian{color:#831843;background:rgba(251,207,232,0.62)}',
      '#zym-pr .zpkw-peristiwa{color:#713f12;background:rgba(254,249,195,0.65)}',
      '#zym-pr .zpkw-gerakan{color:#581c87;background:rgba(233,213,255,0.58)}',
      '#zym-pr .zpkw-pertubuhan{color:#312e81;background:rgba(199,210,254,0.62)}',
      '#zym-pr .zpkw-karya{color:#0e7490;background:rgba(165,243,252,0.55)}',
      '#zym-pr .zpkw-tarikh{color:#1e3a8a;background:rgba(191,219,254,0.55)}',
      // Saiz 1em; imej duduk sedikit lebih rendah berbanding rentak teks yang dibungkus .zp-txt-up
      '#zym-pr .zp-emoji{display:inline-block;width:1em;height:1em;vertical-align:middle;margin:0 .24em 0 0;object-fit:contain;flex-shrink:0;line-height:1;position:relative;top:0.06em}',
    ];
    if (isEco) {
      rules.push(
        '#zym-pr.zp-mode-eco .zpkw,#zym-pr.zp-mode-eco [class*="zpkw-"]{color:#1e293b!important;font-weight:700!important;display:inline-block!important;vertical-align:text-bottom!important;line-height:1.1!important;padding:0.05em 0.26em 0.09em!important;border-radius:0.35em!important;background:rgba(241,245,249,0.95)!important;transform:translateY(0.11em)!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}',
        '#zym-pr.zp-mode-eco .zp-chapter-lbl,#zym-pr.zp-mode-eco .zp-section-badge{background:#4b5563!important;color:#fff!important}',
        '#zym-pr.zp-mode-eco .zp-hero{border-bottom-color:#9ca3af!important}',
        '#zym-pr.zp-mode-eco .zp-subtopik{color:#52525b!important}',
        '#zym-pr.zp-mode-eco .zp-board{border:1.5px solid #a1a1aa!important;border-left-width:4px!important;background:#fff!important}',
        '#zym-pr.zp-mode-eco .zp-board-lbl{color:#374151!important}',
        '#zym-pr.zp-mode-eco .zp-flap{border-color:#9ca3af!important}',
        '#zym-pr.zp-mode-eco .zp-flap-top{background:#f3f4f6!important;color:#111827!important;border-bottom-color:#d1d5db!important}',
        '#zym-pr.zp-mode-eco .zp-flap-a{background:#fafafa!important;color:#27272a!important}',
        '#zym-pr.zp-mode-eco .zp-acc{border-color:#d4d4d8!important}',
        '#zym-pr.zp-mode-eco .zp-acc-hd{background:#f3f4f6!important;border-bottom-color:#d1d5db!important}',
        '#zym-pr.zp-mode-eco .zp-acc-num{color:#374151!important;background:#e5e7eb!important}',
        '#zym-pr.zp-mode-eco .zp-acc-ttl,#zym-pr.zp-mode-eco .zp-acc-ttl-txt{color:#27272a!important}',
        '#zym-pr.zp-mode-eco .zp-tl-card{border-color:#d4d4d8!important;background:#fff!important}',
        '#zym-pr.zp-mode-eco .zp-tl-hd{background:#f3f4f6!important;border-bottom-color:#d1d5db!important;color:#27272a!important}',
        '#zym-pr.zp-mode-eco .zp-tl-bd{background:#fafafa!important;color:#27272a!important}',
        '#zym-pr.zp-mode-eco .zp-chip,#zym-pr.zp-mode-eco .zp-step{background:#f4f4f5!important;border-color:#d4d4d8!important;color:#27272a!important}',
        '#zym-pr.zp-mode-eco .zp-step+.zp-step::before{color:#6b7280!important}',
        '#zym-pr.zp-mode-eco .zp-sentence{border-left-color:#9ca3af!important}',
        '#zym-pr.zp-mode-eco p.zp-p,#zym-pr.zp-mode-eco p.zp-ph,#zym-pr.zp-mode-eco p.zp-sentence{color:#27272a!important}',
        '#zym-pr.zp-mode-eco .zp-desc{color:#3f3f46!important}',
        '#zym-pr.zp-mode-eco .zp-emoji{display:none!important}'
      );
    }
    return rules.join('');
  }

  /** Koordinat piksel kanvas (html2canvas scale) untuk blok — elak pisah tengah kotak / eyebrow + blok pertama. */
  function _collectPdfBlockRanges(container, scale) {
    var ranges = [];
    if (!container || !scale) return ranges;
    try {
      var cr = container.getBoundingClientRect();
      function rectRange(el) {
        var r = el.getBoundingClientRect();
        return {
          top: (r.top - cr.top) * scale,
          bottom: (r.bottom - cr.top) * scale
        };
      }
      function pushRange(top, bottom) {
        if (bottom > top + 2) ranges.push({ top: top, bottom: bottom });
      }
      function mergePair(a, b) {
        return { top: Math.min(a.top, b.top), bottom: Math.max(a.bottom, b.bottom) };
      }

      container.querySelectorAll('.zp-hero').forEach(function(el) {
        var rg = rectRange(el);
        pushRange(rg.top, rg.bottom);
      });

      container.querySelectorAll('.zp-section-wrap').forEach(function(wrap) {
        var sectionEl = wrap.querySelector(':scope > .zp-section');
        var first = sectionEl ? sectionEl.nextElementSibling : null;
        var glueFirst = first && first.classList &&
          (first.classList.contains('zp-board') || first.classList.contains('zp-flap') || first.classList.contains('zp-acc') || first.classList.contains('zp-tl'));
        var mergedFirst = false;
        if (sectionEl && glueFirst) {
          var merged = mergePair(rectRange(sectionEl), rectRange(first));
          var mergedDocH = (merged.bottom - merged.top) / scale;
          if (mergedDocH <= 560) {
            pushRange(merged.top, merged.bottom);
            mergedFirst = true;
          } else {
            pushRange(rectRange(sectionEl).top, rectRange(sectionEl).bottom);
          }
        } else if (sectionEl) {
          var secRg = rectRange(sectionEl);
          pushRange(secRg.top, secRg.bottom);
        }
        for (var ci = 0; ci < wrap.children.length; ci++) {
          var ch = wrap.children[ci];
          if (!ch.classList) continue;
          if (ch.classList.contains('zp-section')) continue;
          if (mergedFirst && first && ch === first) continue;
          if (ch.classList.contains('zp-board') || ch.classList.contains('zp-flap') || ch.classList.contains('zp-acc') || ch.classList.contains('zp-tl')) {
            var chRg = rectRange(ch);
            pushRange(chRg.top, chRg.bottom);
          }
        }
      });

      container.querySelectorAll('.zp-board, .zp-flap, .zp-acc, .zp-tl').forEach(function(el) {
        if (el.closest && el.closest('.zp-section-wrap')) return;
        var rg = rectRange(el);
        pushRange(rg.top, rg.bottom);
      });

      container.querySelectorAll('.zp-section').forEach(function(el) {
        if (el.closest && el.closest('.zp-section-wrap')) return;
        var rg2 = rectRange(el);
        pushRange(rg2.top, rg2.bottom);
      });
    } catch (e) {}
    return ranges;
  }

  function _generatePages(mode, cb) {
    var pdfMode = mode === 'eco' ? 'eco' : 'full';
    var mainEl = document.querySelector('main.note-reading-main');
    if (!mainEl) { cb(new Error('Tiada kandungan nota')); return; }
    var savedScrollY = window.scrollY || window.pageYOffset || 0;

    _ensureLibs(function(err) {
      if (err) { cb(err); return; }

      // Inject scoped CSS for the print renderer
      var cssEl = document.createElement('style');
      cssEl.id = 'zym-pr-css';
      cssEl.textContent = _getPrintCss(pdfMode);
      document.head.appendChild(cssEl);

      // Build clean print container from note DOM
      var container = document.createElement('div');
      container.id = 'zym-pr';
      if (pdfMode === 'eco') container.classList.add('zp-mode-eco');
      container.setAttribute('aria-hidden', 'true');
      container.innerHTML = _buildPrintHtml(mainEl);
      document.body.appendChild(container);

      function _cleanup() {
        container.remove();
        var c = document.getElementById('zym-pr-css');
        if (c) c.remove();
        window.scrollTo(0, savedScrollY);
      }

      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          var h2cScale = 2;
          void container.offsetHeight;
          var blockRanges = _collectPdfBlockRanges(container, h2cScale);
          window.html2canvas(container, {
            scale: h2cScale,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 15000,
            onclone: function(doc) {
              var s = doc.createElement('style');
              s.textContent = '*{transition:none!important;animation-duration:0s!important}';
              doc.head.appendChild(s);
            }
          }).then(function(canvas) {
            _cleanup();
            var mLeft=12, mRight=12, mTop=18, mBottom=22;
            var pageW=210, pageH=297;
            var cW = pageW - mLeft - mRight;
            var cH = pageH - mTop - mBottom;
            var pxPerMm = canvas.width / cW;
            var pxPerPage = Math.round(cH * pxPerMm);
            var numPages = Math.ceil(canvas.height / pxPerPage);
            var ctxFull = canvas.getContext('2d');
            var cwPx = canvas.width;

            function _rowWhiteness(y) {
              if (y < 0 || y >= canvas.height) return 0;
              var row = ctxFull.getImageData(0, y, cwPx, 1).data;
              var light = 0;
              var samp = 0;
              for (var xi = 0; xi < row.length; xi += 16) {
                samp++;
                if (row[xi] > 235 && row[xi + 1] > 235 && row[xi + 2] > 235) light++;
              }
              return samp ? light / samp : 0;
            }

            function _rowBisectsBlock(y, ranges) {
              for (var i = 0; i < ranges.length; i++) {
                var rg = ranges[i];
                if (y > rg.top && y < rg.bottom) return true;
              }
              return false;
            }

            function _rowWhiteBlend(y) {
              return (_rowWhiteness(y) + _rowWhiteness(y - 1) + _rowWhiteness(y + 1)) / 3;
            }

            /** Pilih baris hampir dengan sempadan bawah blok (ruang antara kotak) — elak potong tengah kandungan. */
            function _pickPdfBoundarySplit(ideal, minY, forwardPx, ranges) {
              var hi = Math.min(Math.floor(ideal + forwardPx), canvas.height - 2);
              var edges = [];
              for (var ri = 0; ri < ranges.length; ri++) {
                var b = Math.floor(ranges[ri].bottom) + 2;
                if (b > minY && b <= hi) edges.push(b);
              }
              edges.sort(function(a, x) { return a - x; });
              var uniq = [];
              for (var ei = 0; ei < edges.length; ei++) {
                if (ei === 0 || edges[ei] > edges[ei - 1]) uniq.push(edges[ei]);
              }
              var bestY = -1;
              var bestScore = -1;
              for (var ui = 0; ui < uniq.length; ui++) {
                var yy = uniq[ui];
                var w = _rowWhiteBlend(yy);
                var near = 1 - Math.min(1, Math.abs(yy - ideal) / (pxPerPage * 0.3));
                var score = w * 0.78 + near * 0.22;
                if (score > bestScore) {
                  bestScore = score;
                  bestY = yy;
                }
              }
              return bestY;
            }

            /** Cari baris pisahan: utamakan yang tidak melintasi blok; kemudian sempadan blok; kemudian “ruang putih”. */
            function _pickPdfSplitY(approxY, ranges, minY) {
              var maxSearch = Math.min(Math.round(pxPerPage * 0.36), approxY - minY);
              if (maxSearch < 0) maxSearch = 0;
              var bestSafeY = -1;
              var bestSafeWhite = -1;
              var bestAnyY = approxY;
              var bestAnyCombo = -1e9;
              for (var dy = 0; dy <= maxSearch; dy++) {
                var y = Math.floor(approxY - dy);
                if (y <= minY) break;
                var white = _rowWhiteBlend(y);
                var bisects = _rowBisectsBlock(y, ranges);
                var penalty = (maxSearch > 0 ? dy / maxSearch : 0) * 0.12;
                var combo = white - penalty;
                if (!bisects && white > bestSafeWhite) {
                  bestSafeWhite = white;
                  bestSafeY = y;
                }
                if (combo > bestAnyCombo) {
                  bestAnyCombo = combo;
                  bestAnyY = y;
                }
              }
              if (bestSafeY > minY && bestSafeWhite > 0.1) return bestSafeY;
              var fwd = Math.round(pxPerPage * 0.26);
              var bnd = _pickPdfBoundarySplit(approxY, minY, fwd, ranges);
              if (bnd > minY && !_rowBisectsBlock(bnd, ranges)) return bnd;
              if (bestAnyY > minY) return bestAnyY;
              if (bnd > minY) return bnd;
              return Math.max(minY + 1, Math.min(approxY, canvas.height - 1));
            }

            var splitPts = [0];
            var minGapPx = Math.min(Math.round(pxPerPage * 0.055), 72);
            for (var s = 1; s < numPages; s++) {
              var ideal = Math.round(s * pxPerPage);
              var prevY = splitPts[s - 1];
              var minY = Math.min(prevY + minGapPx, ideal - 6);
              if (minY >= ideal) minY = prevY + 40;
              var yPick = _pickPdfSplitY(ideal, blockRanges, minY);
              if (yPick <= prevY) yPick = Math.min(prevY + minGapPx, canvas.height - 2);
              splitPts.push(yPick);
            }
            splitPts.push(canvas.height);

            var pages = [];
            for (var p = 0; p < numPages; p++) {
              var srcY = splitPts[p];
              var srcH = splitPts[p + 1] - srcY;
              var pc = document.createElement('canvas');
              pc.width = canvas.width;
              pc.height = pxPerPage;
              var pctx = pc.getContext('2d');
              pctx.fillStyle = '#ffffff';
              pctx.fillRect(0, 0, pc.width, pc.height);
              pctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, Math.min(srcH, pxPerPage));
              pages.push(pc);
            }
            cb(null, pages, {
              pageW: pageW,
              pageH: pageH,
              mLeft: mLeft,
              mRight: mRight,
              mTop: mTop,
              mBottom: mBottom,
              cW: cW,
              cH: cH,
              jpegQuality: pdfMode === 'eco' ? 0.82 : 0.92,
              grayscalePdf: pdfMode === 'eco',
              mode: pdfMode
            });
          }).catch(function(e) { _cleanup(); cb(e); });
        });
      });
    });
  }

  function _pdfGrayscaleCanvas(src) {
    var c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    var ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    try {
      var imgData = ctx.getImageData(0, 0, c.width, c.height);
      var d = imgData.data;
      for (var i = 0; i < d.length; i += 4) {
        var y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = y;
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {}
    return c;
  }

  function _pdfCanvasToJpegDataUrl(pc, dims) {
    var q = dims && typeof dims.jpegQuality === 'number' ? dims.jpegQuality : 0.92;
    if (dims && dims.grayscalePdf) {
      try {
        var g = _pdfGrayscaleCanvas(pc);
        return g.toDataURL('image/jpeg', q);
      } catch (e2) {}
    }
    return pc.toDataURL('image/jpeg', q);
  }

  function _pdfPopulateSlides(pages, dims) {
    var pagesDiv = document.getElementById('zym-pdf-pages');
    if (!pagesDiv) return;
    pagesDiv.innerHTML = '';
    pages.forEach(function(pc, i) {
      var slide = document.createElement('div');
      slide.className = 'zym-pdf-page-slide';

      var outer = document.createElement('div');
      outer.className = 'zym-pdf-page-outer';

      var hdr = document.createElement('div');
      hdr.className = 'zym-pdf-page-hdr';
      hdr.innerHTML = '<span class="zym-pdf-page-hdr-l">ZymNotes</span>' +
        '<span class="zym-pdf-page-hdr-r">' + _escPdfHtml(_pdfNoteTitle) + '</span>';
      outer.appendChild(hdr);

      var wrap = document.createElement('div');
      wrap.className = 'zym-pdf-page-canvas-wrap';
      var img = document.createElement('img');
      img.src = _pdfCanvasToJpegDataUrl(pc, dims);
      img.alt = '';
      img.decoding = 'async';
      wrap.appendChild(img);
      outer.appendChild(wrap);

      var ftr = document.createElement('div');
      ftr.className = 'zym-pdf-page-ftr';
      ftr.innerHTML = '<span>zymnotes.com</span>' +
        '<span style="color:#9090b8;font-weight:600">' + (i + 1) + ' / ' + pages.length + '</span>';
      outer.appendChild(ftr);

      slide.appendChild(outer);
      pagesDiv.appendChild(slide);
    });
    pagesDiv.scrollLeft = 0;
    requestAnimationFrame(_pdfUpdateCarouselUi);
  }

  function _pdfSetModeSegmentUI(mode) {
    var full = document.getElementById('zym-pdf-mode-full');
    var eco = document.getElementById('zym-pdf-mode-eco');
    if (full) {
      full.classList.toggle('is-active', mode === 'full');
      full.setAttribute('aria-pressed', mode === 'full' ? 'true' : 'false');
    }
    if (eco) {
      eco.classList.toggle('is-active', mode === 'eco');
      eco.setAttribute('aria-pressed', mode === 'eco' ? 'true' : 'false');
    }
  }

  function _pdfSwitchMode(mode) {
    if (_pdfBusy) return;
    var target = mode === 'eco' ? 'eco' : 'full';
    if (target === _pdfActiveMode) return;
    var prev = _pdfActiveMode;
    var slot = target === 'full' ? _pdfCache.full : _pdfCache.eco;
    if (slot.pages && slot.dims) {
      _pdfActiveMode = target;
      _pdfPageCanvases = slot.pages;
      _pdfDims = slot.dims;
      _pdfSetModeSegmentUI(target);
      _pdfPopulateSlides(slot.pages, slot.dims);
      return;
    }
    _pdfBusy = true;
    _pdfSetModeSegmentUI(target);
    var genLoad = document.createElement('div');
    genLoad.id = 'zym-pdf-gen-load';
    genLoad.innerHTML =
      '<div class="zym-pdf-spinner" style="width:40px;height:40px;border-width:4px"></div>' +
      '<p style="margin:0;font-size:0.9rem;font-family:Fredoka,sans-serif">Menjana PDF (' +
      (target === 'eco' ? 'Jimat dakwat' : 'Warna') + ')…</p>';
    genLoad.style.cssText =
      'position:fixed;inset:0;z-index:10002;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:14px;' +
      'background:rgba(15,23,42,0.82);color:#94a3b8;' +
      'backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)';
    document.body.appendChild(genLoad);
    var dlBtn = document.getElementById('zym-pdf-download-btn');
    var prBtn = document.getElementById('zym-pdf-print-btn');
    if (dlBtn) dlBtn.disabled = true;
    if (prBtn) prBtn.disabled = true;
    var mfSw = document.getElementById('zym-pdf-mode-full');
    var meSw = document.getElementById('zym-pdf-mode-eco');
    if (mfSw) mfSw.disabled = true;
    if (meSw) meSw.disabled = true;

    _generatePages(target, function(err, pages, dims) {
      _pdfBusy = false;
      genLoad.remove();
      if (err) {
        _pdfSetModeSegmentUI(prev);
        if (dlBtn) dlBtn.disabled = false;
        if (prBtn) prBtn.disabled = false;
        if (mfSw) mfSw.disabled = false;
        if (meSw) meSw.disabled = false;
        var toast = document.createElement('div');
        toast.style.cssText =
          'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
          'background:#ef4444;color:#fff;padding:10px 22px;border-radius:8px;' +
          'font-size:0.85rem;z-index:10002;font-family:Fredoka,sans-serif;white-space:nowrap';
        toast.textContent = 'Ralat semasa menyediakan PDF. Cuba lagi.';
        document.body.appendChild(toast);
        setTimeout(function() { toast.remove(); }, 4000);
        return;
      }
      _pdfActiveMode = target;
      if (target === 'full') {
        _pdfCache.full = { pages: pages, dims: dims };
      } else {
        _pdfCache.eco = { pages: pages, dims: dims };
      }
      _pdfPageCanvases = pages;
      _pdfDims = dims;
      _pdfPopulateSlides(pages, dims);
      if (dlBtn) dlBtn.disabled = false;
      if (prBtn) prBtn.disabled = false;
      if (mfSw) mfSw.disabled = false;
      if (meSw) meSw.disabled = false;
    });
  }

  function _savePdf(pages, dims, title) {
    var jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDF) { alert('Ralat: pustaka PDF tidak dimuat.'); return; }
    var pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    var total = pages.length;
    pages.forEach(function(pc, i) {
      if (i > 0) pdf.addPage();
      var imgData = _pdfCanvasToJpegDataUrl(pc, dims);
      pdf.addImage(imgData, 'JPEG', dims.mLeft, dims.mTop, dims.cW, dims.cH);
      // Header
      pdf.setDrawColor(212, 212, 232);
      pdf.setLineWidth(0.3);
      pdf.line(dims.mLeft, dims.mTop - 2, dims.pageW - dims.mRight, dims.mTop - 2);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(96, 96, 160);
      pdf.text('ZymNotes', dims.mLeft, dims.mTop - 5);
      if (title) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(176, 176, 204);
        pdf.text(title, dims.pageW - dims.mRight, dims.mTop - 5, { align:'right', maxWidth: dims.cW * 0.6 });
      }
      // Footer
      var fY = dims.pageH - dims.mBottom + 2;
      pdf.setDrawColor(212, 212, 232);
      pdf.line(dims.mLeft, fY, dims.pageW - dims.mRight, fY);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(144, 144, 184);
      pdf.text('zymnotes.com', dims.mLeft, fY + 4);
      pdf.setTextColor(176, 176, 204);
      pdf.text((i + 1) + ' / ' + total, dims.pageW / 2, fY + 4, { align:'center' });
      pdf.setTextColor(184, 184, 208);
      pdf.text('© 2026 ZymNotes', dims.pageW - dims.mRight, fY + 4, { align:'right' });
    });
    var fname = (title || 'ZymNotes').replace(/[^\w\sÀ-ɏ-]/g,'').trim().replace(/\s+/g,'-') || 'ZymNotes';
    if (dims && dims.mode === 'eco') fname = fname + '-kelas';
    pdf.save(fname + '.pdf');
    recordPdfDownload().finally(function () {
      document.dispatchEvent(new CustomEvent('zym-nota-pdf-downloaded', { detail: { path: pathname } }));
    });
  }

  function recordPdfDownload() {
    if (!NOTA_FB_SUPABASE_URL || !NOTA_FB_SUPABASE_KEY) return Promise.resolve();
    return fetch(NOTA_FB_SUPABASE_URL + '/rest/v1/rpc/submit_nota_pdf_download', {
      method: 'POST',
      headers: {
        'apikey': NOTA_FB_SUPABASE_KEY,
        'Authorization': 'Bearer ' + NOTA_FB_SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ p_path: pathname })
    }).then(function (r) {
      if (!r.ok) return Promise.reject(new Error('pdf dl rpc'));
      if (typeof gtag === 'function') gtag('event', 'nota_pdf_download', { page_path: pathname });
    });
  }

  function openPdfPreview() {
    if (_pdfBusy) return;
    _pdfBusy = true;
    _pdfPageCanvases = [];
    _pdfDims = null;
    _pdfCache = { full: { pages: null, dims: null }, eco: { pages: null, dims: null } };
    _pdfActiveMode = 'full';
    _pdfSetModeSegmentUI('full');

    var h1El = document.querySelector('.note-hero h1, .papercraft-hero h1');
    _pdfNoteTitle = (h1El ? h1El.textContent : document.title.replace(/\s*·.*$/,'')).trim();

    var dlBtn0 = document.getElementById('zym-pdf-download-btn');
    var prBtn0 = document.getElementById('zym-pdf-print-btn');
    var mf0 = document.getElementById('zym-pdf-mode-full');
    var me0 = document.getElementById('zym-pdf-mode-eco');
    if (dlBtn0) dlBtn0.disabled = true;
    if (prBtn0) prBtn0.disabled = true;
    if (mf0) mf0.disabled = true;
    if (me0) me0.disabled = true;

    // Show a translucent loading screen OVER the page — NOT the overlay.
    // Opening the overlay first would block html2canvas from seeing the note content.
    var genLoad = document.createElement('div');
    genLoad.id = 'zym-pdf-gen-load';
    genLoad.innerHTML =
      '<div class="zym-pdf-spinner" style="width:40px;height:40px;border-width:4px"></div>' +
      '<p style="margin:0;font-size:0.9rem;font-family:Fredoka,sans-serif">Sedang menyediakan pratonton…</p>';
    genLoad.style.cssText =
      'position:fixed;inset:0;z-index:10002;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:14px;' +
      'background:rgba(15,23,42,0.82);color:#94a3b8;' +
      'backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)';
    document.body.appendChild(genLoad);

    _generatePages('full', function(err, pages, dims) {
      _pdfBusy = false;
      genLoad.remove();

      if (err) {
        if (dlBtn0) dlBtn0.disabled = false;
        if (prBtn0) prBtn0.disabled = false;
        if (mf0) mf0.disabled = false;
        if (me0) me0.disabled = false;
        var toast = document.createElement('div');
        toast.style.cssText =
          'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
          'background:#ef4444;color:#fff;padding:10px 22px;border-radius:8px;' +
          'font-size:0.85rem;z-index:10002;font-family:Fredoka,sans-serif;white-space:nowrap';
        toast.textContent = 'Ralat semasa menyediakan PDF. Cuba lagi.';
        document.body.appendChild(toast);
        setTimeout(function() { toast.remove(); }, 4000);
        return;
      }

      _pdfCache.full = { pages: pages, dims: dims };
      _pdfPageCanvases = pages;
      _pdfDims = dims;

      var dlBtn = document.getElementById('zym-pdf-download-btn');
      var prBtn = document.getElementById('zym-pdf-print-btn');
      _pdfPopulateSlides(pages, dims);

      if (dlBtn) dlBtn.disabled = false;
      if (prBtn) prBtn.disabled = false;
      var mf1 = document.getElementById('zym-pdf-mode-full');
      var me1 = document.getElementById('zym-pdf-mode-eco');
      if (mf1) mf1.disabled = false;
      if (me1) me1.disabled = false;
      // Open the overlay AFTER pages are ready
      pdfOverlay.classList.add('is-open');
      pdfOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      history.pushState({ zymPdfPreview: 1 }, '', window.location.href);
      _pdfModalHistoryActive = true;
      if (pages.length && dlBtn) dlBtn.focus();
    });
  }

  function _closePdfPreviewUi() {
    pdfOverlay.classList.remove('is-open');
    pdfOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    var ttl = document.getElementById('zym-pdf-topbar-title');
    if (ttl) ttl.textContent = 'Pratonton PDF';
    var dlBtn = document.getElementById('zym-pdf-download-btn');
    var prBtn = document.getElementById('zym-pdf-print-btn');
    if (dlBtn) dlBtn.disabled = true;
    if (prBtn) prBtn.disabled = true;
  }

  function closePdfPreview() {
    if (!pdfOverlay.classList.contains('is-open')) return;
    document.body.classList.remove('zym-print-pdf-preview');
    var hadHist = _pdfModalHistoryActive;
    _closePdfPreviewUi();
    if (hadHist) {
      _pdfModalHistoryActive = false;
      history.back();
    }
  }

  window.addEventListener('popstate', function () {
    if (!pdfOverlay.classList.contains('is-open')) return;
    _pdfModalHistoryActive = false;
    _closePdfPreviewUi();
  });

  document.getElementById('zym-pdf-download-btn').addEventListener('click', function() {
    if (!_pdfPageCanvases.length || !_pdfDims) return;
    var btn = this;
    btn.disabled = true;
    setTimeout(function() {
      _savePdf(_pdfPageCanvases, _pdfDims, _pdfNoteTitle);
      btn.disabled = false;
    }, 50);
  });

  document.getElementById('zym-pdf-print-btn').addEventListener('click', function() {
    if (!pdfOverlay.classList.contains('is-open')) return;
    document.body.classList.add('zym-print-pdf-preview');
    function onAfterPrint() {
      window.removeEventListener('afterprint', onAfterPrint);
      document.body.classList.remove('zym-print-pdf-preview');
    }
    window.addEventListener('afterprint', onAfterPrint);
    setTimeout(function() { window.print(); }, 0);
  });

  document.getElementById('zym-pdf-close-btn').addEventListener('click', closePdfPreview);
  pdfOverlay.addEventListener('click', function(e) {
    var t = e.target;
    if (t && t.id === 'zym-pdf-mode-full') {
      e.preventDefault();
      _pdfSwitchMode('full');
      return;
    }
    if (t && t.id === 'zym-pdf-mode-eco') {
      e.preventDefault();
      _pdfSwitchMode('eco');
      return;
    }
    if (e.target === pdfOverlay) closePdfPreview();
  });
  document.addEventListener('keydown', function(e) {
    if (!pdfOverlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closePdfPreview();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      var t = document.getElementById('zym-pdf-pages');
      if (t) t.scrollBy({ left: -(t.clientWidth || 0), behavior: 'smooth' });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      var t2 = document.getElementById('zym-pdf-pages');
      if (t2) t2.scrollBy({ left: (t2.clientWidth || 0), behavior: 'smooth' });
    }
  });

  pdfBtn.addEventListener('click', openPdfPreview);

  // ── Bottom actions row: Suka + Kongsi + PDF ──────────────────
  var actionsSection = document.createElement('div');
  actionsSection.className = 'nota-feedback-actions';
  actionsSection.appendChild(sukaSection);
  actionsSection.appendChild(kongsiBtn);
  actionsSection.appendChild(pdfBtn);

  widget.appendChild(opinionSection);
  widget.appendChild(actionsSection);
  insertBefore.parentNode.insertBefore(widget, insertBefore);
})();

// ── Nota Stat Bar ─────────────────────────────────────────────────────────────
// Tunjuk kiraan reaksi ringkas (suka, mudah) + kiraan muat turun PDF di hero nota.
// Hanya muncul apabila ada sekurang-kurangnya satu kiraan > 0.
// Skema Supabase (RPC get_nota_reaction_counts, get_nota_pdf_download_count, dll.):
//   docs/supabase/nota_feedback_pdf.sql
(function () {
  if (!window.location.pathname.match(/\/notes\/bab-\d+-\d+\.html/)) return;

  var pathname = window.location.pathname;
  var qMatch = pathname.match(/\/notes\/(bab-\d+-\d+)\.html/i);
  var quizId = qMatch ? qMatch[1] : null;
  var bestScore = quizId && window.ZymStore ? ZymStore.getQuizScore(quizId) : 0;

  function fetchReactionCounts() {
    if (!NOTA_FB_SUPABASE_URL || !NOTA_FB_SUPABASE_KEY) return Promise.resolve(null);
    return fetch(NOTA_FB_SUPABASE_URL + '/rest/v1/rpc/get_nota_reaction_counts', {
      method: 'POST',
      headers: {
        'apikey': NOTA_FB_SUPABASE_KEY,
        'Authorization': 'Bearer ' + NOTA_FB_SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_path: pathname })
    }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function fetchPdfDownloadCount() {
    if (!NOTA_FB_SUPABASE_URL || !NOTA_FB_SUPABASE_KEY) return Promise.resolve(0);
    return fetch(NOTA_FB_SUPABASE_URL + '/rest/v1/rpc/get_nota_pdf_download_count', {
      method: 'POST',
      headers: {
        'apikey': NOTA_FB_SUPABASE_KEY,
        'Authorization': 'Bearer ' + NOTA_FB_SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_path: pathname })
    })
      .then(function (r) {
        if (!r.ok) return 0;
        return r.text().then(function (t) {
          try {
            var s = (t || '').trim();
            if (!s) return 0;
            var j = JSON.parse(s);
            if (Array.isArray(j)) j = j[0];
            var n = typeof j === 'number' ? j : parseInt(String(j), 10);
            return isNaN(n) ? 0 : n;
          } catch (e) {
            return 0;
          }
        });
      })
      .catch(function () { return 0; });
  }

  var lead = document.querySelector('.note-hero .lead');
  if (!lead) return;

  var STAT_REACTIONS = [
    { key: 'suka',  imgSrc: 'https://img.icons8.com/?size=100&id=5twNojKL5zU7&format=png&color=000000' },
    { key: 'mudah', pair: HZ_FLUENT_SPARKLE.faceSmiling }
  ];
  var STAT_PDF_DL_IMG = 'https://img.icons8.com/?size=100&id=yGBEe6Dss9zK&format=png&color=000000';

  function pillImg(r) {
    var src = r.imgSrc || hzFluent3dAsset(r.pair[0], r.pair[1]);
    return '<img src="' + src + '" alt="" width="14" height="14" loading="lazy" class="nota-stat-emoji">';
  }

  function mountNotaStatBar() {
    Promise.all([fetchReactionCounts(), fetchPdfDownloadCount()]).then(function (pair) {
      var counts = pair[0];
      var pdfN = pair[1];
      var pills = [];

      if (counts) {
        STAT_REACTIONS.forEach(function (r) {
          var n = Number(counts[r.key] || 0);
          if (n > 0) pills.push(pillImg(r) + '<span>' + n + '</span>');
        });
      }
      if (pdfN > 0) {
        pills.push(
          '<img src="' + STAT_PDF_DL_IMG + '" alt="" width="14" height="14" loading="lazy" class="nota-stat-emoji">' +
          '<span>' + pdfN + '</span>'
        );
      }

      var oldBar = document.querySelector('.nota-stat-bar');
      if (oldBar) oldBar.remove();

      if (!pills.length) return;

      var bar = document.createElement('div');
      bar.className = 'nota-stat-bar';
      bar.innerHTML = pills.map(function (html) {
        return '<span class="nota-stat-pill">' + html + '</span>';
      }).join('');
      lead.insertAdjacentElement('afterend', bar);
    });
  }

  mountNotaStatBar();
  document.addEventListener('zym-nota-pdf-downloaded', function (ev) {
    if (!ev || !ev.detail || ev.detail.path !== pathname) return;
    mountNotaStatBar();
  });
})();

// ── Brand Logo Injection ───────────────────────────────────────────────────────
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var style = document.createElement('style');
    style.textContent =
      'a.brand{display:inline-flex;align-items:center;gap:0.36em}' +
      '.footer-brand{display:inline-flex;align-items:center;gap:0.36em}' +
      '.brand-icon{border-radius:5px;flex-shrink:0;display:block}';
    document.head.appendChild(style);

    document.querySelectorAll('a.brand').forEach(function (el) {
      var img = document.createElement('img');
      img.src = '/icons/icon.svg?v=4';
      img.alt = '';
      img.width = 22;
      img.height = 22;
      img.className = 'brand-icon';
      el.insertBefore(img, el.firstChild);
    });

    document.querySelectorAll('.footer-brand').forEach(function (el) {
      var img = document.createElement('img');
      img.src = '/icons/icon.svg?v=4';
      img.alt = '';
      img.width = 18;
      img.height = 18;
      img.className = 'brand-icon';
      el.insertBefore(img, el.firstChild);
    });
  });
})();

// ── Reading Progress Bar (note subtopic pages only) ───────────────────────────
(function () {
  if (!hzZymnotesIsSubtopicNotePathname(location.pathname)) return;
  document.addEventListener("DOMContentLoaded", function () {
    var bar = document.createElement("div");
    bar.className = "reading-progress-bar is-active";
    var header = document.querySelector(".site-header");
    if (header) header.appendChild(bar);
    var raf;
    window.addEventListener(
      "scroll",
      function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var scrolled = window.scrollY;
          var total = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.width = (total > 0 ? Math.min((scrolled / total) * 100, 100) : 0) + "%";
        });
      },
      { passive: true }
    );
  });
})();


// ── Keyboard Shortcuts: ← → prev/next on note pages ─────────────────────────
(function () {
  var p = location.pathname;
  if (!hzZymnotesIsSubtopicNotePathname(p) && !hzZymnotesIsBabHubPathname(p)) return;
  document.addEventListener('keydown', function (e) {
    if (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(document.activeElement.tagName) !== -1) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var actions = document.querySelectorAll('.hero-actions a.btn');
    if (!actions.length) return;
    if (e.key === 'ArrowRight') actions[actions.length - 1].click();
    if (e.key === 'ArrowLeft')  actions[0].click();
  });
})();


// ── Global Search Overlay ─────────────────────────────────────────────────────
(function () {
  var PAGES = HZ_NOTES_SEARCH_PAGES;


  var overlay, searchInput, resultsEl, emptyMsgEl;
  var INDEX = null, indexBuilding = false;

  function buildOverlayDOM() {
    overlay = document.createElement('div');
    overlay.className = 'hz-search-overlay';
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Carian');

    var sheet = document.createElement('div');
    sheet.className = 'hz-search-sheet';
    sheet.innerHTML =
      '<div class="hz-search-header">' +
        '<div class="hz-search-input-wrap">' +
          '<span class="hz-search-icon">' + HZ_ICONS.search + '</span>' +
          '<input class="hz-search-input" type="text" inputmode="search" enterkeyhint="search" placeholder="Cari nota..." autocomplete="off" />' +
          '<button class="hz-search-close" type="button" aria-label="Tutup">' + HZ_ICONS.close + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="hz-search-body">' +
        '<div class="hz-search-results"></div>' +
        '<div class="hz-search-empty-msg"></div>' +
      '</div>';

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    searchInput = sheet.querySelector('.hz-search-input');
    resultsEl   = sheet.querySelector('.hz-search-results');
    emptyMsgEl  = sheet.querySelector('.hz-search-empty-msg');

    sheet.querySelector('.hz-search-close').addEventListener('click', closeOverlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeOverlay(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeOverlay();
    });

    searchInput.addEventListener('input', function() {
      var q = searchInput.value.trim();
      if (!q) { clearResults(); return; }
      if (!INDEX) {
        emptyMsgEl.textContent = 'Membina indeks carian…';
        emptyMsgEl.classList.add('is-visible');
        buildIndex().then(function() {
          emptyMsgEl.classList.remove('is-visible');
          renderResults(doSearch(q), q);
        });
        return;
      }
      renderResults(doSearch(q), q);
    });
  }

  function openOverlay() {
    if (!overlay) buildOverlayDOM();
    overlay.classList.add('is-open');
    clearResults();
    searchInput.value = '';
    setTimeout(function() { searchInput.focus(); }, 80);
    if (!INDEX && !indexBuilding) buildIndex();
  }

  function closeOverlay() {
    if (overlay) overlay.classList.remove('is-open');
  }

  function clearResults() {
    if (resultsEl)   resultsEl.innerHTML = '';
    if (emptyMsgEl)  emptyMsgEl.classList.remove('is-visible');
  }

  function extractText(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('header, footer, script, style, .site-nav, .hero-actions, .keyword-legend-wrap').forEach(function(el) { el.remove(); });
    var main = doc.querySelector('main') || doc.body;
    return main ? main.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function buildIndex() {
    if (indexBuilding || INDEX) return Promise.resolve();
    indexBuilding = true;
    INDEX = [];
    var fetches = PAGES.map(function(page) {
      return fetch('/notes/' + page.href)
        .then(function(res) { return res.ok ? res.text() : ''; })
        .then(function(html) {
          if (!html) return;
          var ft = extractText(html);
          INDEX.push({ title: page.title, tag: page.tag, href: '/notes/' + page.href,
                       fullText: ft.toLowerCase(), excerpt: ft.slice(0, 160) + '…' });
        })
        .catch(function() {});
    });
    return Promise.all(fetches).then(function() { indexBuilding = false; });
  }

  function normalize(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function highlight(text, query) {
    query.trim().split(/\s+/).filter(Boolean).forEach(function(word) {
      var esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp('(' + esc + ')', 'gi'), '<mark>$1</mark>');
    });
    return text;
  }

  function findExcerpt(fullText, query) {
    var words = query.toLowerCase().trim().split(/\s+/);
    var lower = fullText.toLowerCase(), best = -1;
    words.forEach(function(w) { var p = lower.indexOf(w); if (p !== -1 && (best === -1 || p < best)) best = p; });
    if (best === -1) return fullText.slice(0, 160) + '…';
    var s = Math.max(0, best - 40), e = Math.min(fullText.length, best + 160);
    return (s > 0 ? '…' : '') + fullText.slice(s, e) + '…';
  }

  function doSearch(query) {
    if (!INDEX) return [];
    var q = normalize(query.trim());
    if (!q) return [];
    var words = q.split(/\s+/).filter(Boolean);
    return INDEX.filter(function(item) {
      var hay = normalize(item.fullText + ' ' + item.title);
      return words.every(function(w) { return hay.includes(w); });
    }).map(function(item) {
      return Object.assign({}, item, { relevantExcerpt: findExcerpt(item.fullText, q) });
    });
  }

  function renderResults(items, query) {
    resultsEl.innerHTML = '';
    emptyMsgEl.classList.remove('is-visible');
    if (!items.length) {
      emptyMsgEl.textContent = 'Tiada keputusan untuk "' + query + '"';
      emptyMsgEl.classList.add('is-visible');
      return;
    }
    items.forEach(function(item) {
      var a = document.createElement('a');
      a.className = 'hz-search-result-item';
      a.href = item.href;
      a.innerHTML =
        '<span class="hz-search-result-tag">' + item.tag + '</span>' +
        '<p class="hz-search-result-title">' + highlight(item.title, query) + '</p>' +
        '<p class="hz-search-result-excerpt">' + highlight(item.relevantExcerpt, query) + '</p>';
      a.addEventListener('click', closeOverlay);
      resultsEl.appendChild(a);
    });
  }

  document.addEventListener('hz:search-open', openOverlay);
})();

// ── Bottom Navigation Bar (mobile) ───────────────────────────────────────────
(function () {
  if (document.body && document.body.classList.contains('no-bottom-nav')) return;
  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('no-bottom-nav')) return;
    var p = location.pathname;
    function isActive(href) {
      var hp = href.replace(/\/?(index\.html)?$/, '').replace(/^\//, '');
      var pp = p.replace(/\/?(index\.html)?$/, '').replace(/^\//, '');
      if (href === 'hz:search') {
        return false;
      }
      if (href.includes('/notes/') && !href.endsWith('index.html')) {
        return p.includes('/notes/') && !p.endsWith('index.html');
      }
      if (href.includes('/notes/')) return p.includes('/notes/');
      if (href === '/index.html') return pp === '' || pp === 'index.html';
      return pp === hp;
    }
    var tabs = [
      { iconKey: 'home',   label: 'Utama',   href: '/index.html' },
      { iconKey: 'notes',  label: 'Nota',    href: '/notes/index.html' },
      { iconKey: 'search', label: 'Cari',    href: 'hz:search' },
      { iconKey: 'about',  label: 'Tentang', href: '/about.html' }
    ];
    var nav = document.createElement('nav');
    nav.className = 'hz-bottom-nav';
    nav.setAttribute('aria-label', 'Navigasi utama');
    tabs.forEach(function (tab) {
      var active = isActive(tab.href);
      var icon = hzNavImg(tab.iconKey);
      var el;
      if (tab.href === 'hz:search') {
        el = document.createElement('button');
        el.type = 'button';
        el.className = 'hz-bottom-nav-item';
        el.setAttribute('aria-label', 'Buka carian nota');
        el.innerHTML = '<span class="hz-nav-icon">' + icon + '</span><span>' + tab.label + '</span>';
        el.addEventListener('click', function () {
          document.dispatchEvent(new CustomEvent('hz:search-open'));
        });
      } else {
        el = document.createElement('a');
        el.href = tab.href;
        el.className = 'hz-bottom-nav-item' + (active ? ' is-active' : '');
        el.innerHTML = '<span class="hz-nav-icon">' + icon + '</span><span>' + tab.label + '</span>';
      }
      nav.appendChild(el);
    });
    document.body.appendChild(nav);

    function refreshBottomNavActive() {
      var p = location.pathname;
      nav.querySelectorAll('.hz-bottom-nav-item').forEach(function (el, idx) {
        var tab = tabs[idx];
        if (!tab) return;
        var active = isActive(tab.href);
        el.classList.toggle('is-active', active);
      });
    }

    window.addEventListener('popstate', refreshBottomNavActive);
    document.addEventListener('hz:note-active-changed', refreshBottomNavActive);
  });
})();

// ── Desktop Floating TOC (note subtopic pages, wide screens) ─────────────────
(function () {
  if (!hzZymnotesIsSubtopicNotePathname(location.pathname)) return;
  document.addEventListener('DOMContentLoaded', function () {
    if (window.innerWidth < 1024) return;
    var headings = document.querySelectorAll(
      '.note-section h2, .note-subsection h2, .note-section h3, .note-subsection h3'
    );
    if (headings.length < 3) return;
    var toc = document.createElement('nav');
    toc.className = 'hz-toc';
    toc.setAttribute('aria-label', 'Isi kandungan');
    var items = [];
    headings.forEach(function (h, i) {
      if (!h.id) h.id = 'hz-h-' + i;
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.className = 'hz-toc-item';
      a.textContent = h.textContent.trim().replace(/\s+/g, ' ');
      toc.appendChild(a);
      items.push(a);
    });
    document.body.appendChild(toc);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          items.forEach(function (it) { it.classList.remove('is-active'); });
          var active = toc.querySelector('[href="#' + entry.target.id + '"]');
          if (active) active.classList.add('is-active');
        }
      });
    }, { rootMargin: '-15% 0px -72% 0px' });
    headings.forEach(function (h) { io.observe(h); });
  });
})();


// ── Pull-to-refresh tersuai — anak panah membulat (gaya Chrome) + warna ZymNotes ─
(function setupZymPullToRefresh() {
  if (!window.matchMedia || !window.matchMedia('(max-width: 760px)').matches) return;

  document.documentElement.classList.add('hz-ptr-enabled');

  var indicator = document.createElement('div');
  indicator.className = 'hz-ptr-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  indicator.innerHTML =
    '<div class="hz-ptr-sheen">' +
      '<svg class="hz-ptr-arrow-svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="hzPtrSpinGrad" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#9B77FF"/>' +
            '<stop offset="100%" stop-color="#55B5FF"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<g transform="translate(12,12)">' +
          '<g class="hz-ptr-arrow-rot">' +
            '<circle class="hz-ptr-arrow-arc" cx="0" cy="0" r="7.5" fill="none" stroke="url(#hzPtrSpinGrad)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="34 14" transform="rotate(-88)"/>' +
          '</g>' +
        '</g>' +
      '</svg>' +
    '</div>';
  document.body.appendChild(indicator);

  /* Jarak + halaju: refresh bila niat jelas — jarak commit lebih pendek (rapat Chrome), scrollY guard kekal */
  var DIST_MIN = 200;
  var DIST_STRONG = 278;
  var VEL_MS_WINDOW = 110;
  var VEL_MIN = 0.48;
  var MIN_SAMPLES_FOR_VEL_COMMIT = 6;
  /* Paparan “getah”: sedikit kurang rintangan — anak panah ikut jari lebih rapat */
  var RUBBER_MAX_PX = 66;
  var RUBBER_TAU = 118;
  var startY = 0;
  var active = false;
  var pulling = false;
  var lastDy = 0;
  var lastVisualPx = 0;
  var moveSamples = [];
  var sheen = indicator.querySelector('.hz-ptr-sheen');

  function rubberVisualPx(dy) {
    if (dy <= 0) return 0;
    return RUBBER_MAX_PX * (1 - Math.exp(-dy / RUBBER_TAU));
  }

  function overlaysOpen() {
    return (
      document.querySelector('.hz-search-overlay.is-open') ||
      document.body.classList.contains('mindmap-open') ||
      document.body.classList.contains('sparkle-panel-open')
    );
  }

  /** True if element can scroll vertically (overflow + content taller than box). */
  function isVerticallyScrollable(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    var st = window.getComputedStyle(el);
    var oy = st.overflowY;
    var yScroll =
      oy === 'auto' || oy === 'scroll' || oy === 'overlay' ||
      st.overflow === 'auto' || st.overflow === 'scroll';
    if (!yScroll) return false;
    return el.scrollHeight > el.clientHeight + 1;
  }

  /**
   * Walk ancestors from node: if any vertically scrollable ancestor is scrolled
   * down (scrollTop > 0), pull-to-refresh must not steal the gesture — window.scrollY
   * stays 0 while inner scrollables move (quiz notice card, game card, feedback).
   */
  function innerVerticalScrollNotAtTop(node) {
    for (var el = node; el && el !== document.documentElement; el = el.parentElement) {
      if (!el || el.nodeType !== 1) continue;
      if (!isVerticallyScrollable(el)) continue;
      if (el.scrollTop > 1) return true;
    }
    return false;
  }

  function innerVerticalScrollNotAtTopAtPoint(clientX, clientY) {
    if (typeof document.elementFromPoint !== 'function') return false;
    var top = document.elementFromPoint(clientX, clientY);
    if (!top || top === document.documentElement) return false;
    return innerVerticalScrollNotAtTop(top);
  }

  function setPull(dy, ready) {
    lastDy = dy;
    lastVisualPx = rubberVisualPx(dy);
    indicator.style.setProperty('--hz-ptr-pull', lastVisualPx + 'px');
    indicator.classList.toggle('hz-ptr-pulling', dy > 6);
    indicator.classList.toggle('hz-ptr-ready', ready);
  }

  function reset() {
    pulling = false;
    active = false;
    lastDy = 0;
    lastVisualPx = 0;
    moveSamples.length = 0;
    indicator.classList.remove('hz-ptr-snapping', 'hz-ptr-pulling', 'hz-ptr-ready', 'hz-ptr-releasing');
    indicator.style.setProperty('--hz-ptr-pull', '0px');
  }

  function snapBackThenReset() {
    if (!sheen || lastVisualPx < 2) {
      reset();
      return;
    }
    indicator.classList.add('hz-ptr-snapping');
    indicator.classList.remove('hz-ptr-ready');
    void sheen.offsetWidth;
    indicator.style.setProperty('--hz-ptr-pull', '0px');
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      sheen.removeEventListener('transitionend', onTransEnd);
      indicator.classList.remove('hz-ptr-snapping');
      reset();
    }
    function onTransEnd(e) {
      if (e.propertyName !== 'transform') return;
      finish();
    }
    sheen.addEventListener('transitionend', onTransEnd);
    window.setTimeout(finish, 480);
  }

  function endVelocityPxPerMs() {
    var now = performance.now();
    var t0 = now - VEL_MS_WINDOW;
    var i = moveSamples.length - 1;
    while (i >= 0 && moveSamples[i].t < t0) i--;
    if (i < 1) return 0;
    var a = moveSamples[i - 1];
    var b = moveSamples[moveSamples.length - 1];
    var dt = b.t - a.t;
    if (dt < 12) return 0;
    return (b.y - a.y) / dt;
  }

  function shouldCommitRefresh() {
    if (lastDy < DIST_MIN) return false;
    if (lastDy >= DIST_STRONG) return true;
    if (moveSamples.length < MIN_SAMPLES_FOR_VEL_COMMIT) return false;
    return endVelocityPxPerMs() >= VEL_MIN;
  }

  window.addEventListener(
    'touchstart',
    function (e) {
      if (overlaysOpen()) return;
      if (window.scrollY > 18) return;
      if (innerVerticalScrollNotAtTop(e.target)) return;
      indicator.classList.remove('hz-ptr-snapping');
      active = true;
      lastDy = 0;
      lastVisualPx = 0;
      moveSamples.length = 0;
      startY = e.touches[0].clientY;
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    function (e) {
      if (!active || overlaysOpen()) return;
      if (window.scrollY > 18) {
        reset();
        return;
      }
      var t = e.touches[0];
      if (innerVerticalScrollNotAtTopAtPoint(t.clientX, t.clientY)) {
        reset();
        return;
      }
      var dy = t.clientY - startY;
      if (dy <= 0) return;
      pulling = true;
      var now = performance.now();
      var y = e.touches[0].clientY;
      moveSamples.push({ t: now, y: y });
      if (moveSamples.length > 12) moveSamples.shift();
      var ready =
        dy >= DIST_STRONG ||
        (dy >= DIST_MIN &&
          moveSamples.length >= MIN_SAMPLES_FOR_VEL_COMMIT &&
          endVelocityPxPerMs() >= VEL_MIN * 0.92);
      setPull(dy, ready);
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    function () {
      if (!active) return;
      if (pulling && shouldCommitRefresh()) {
        indicator.classList.add('hz-ptr-releasing');
        window.location.reload();
        return;
      }
      if (pulling) snapBackThenReset();
      else reset();
    },
    { passive: true }
  );

  window.addEventListener(
    'touchcancel',
    function () {
      if (!active) return;
      if (pulling) snapBackThenReset();
      else reset();
    },
    { passive: true }
  );
})();

// =========================
// ABOUT PAGE — PWA INSTALL (hide when installed; re-show after uninstall)
// =========================
(function () {
  var FORCE_KEY = "zymnotes-about-pwa-force-show";
  var card = document.getElementById("about-pwa-card");
  var btn = document.getElementById("about-pwa-install-btn");
  var recoverWrap = document.getElementById("about-pwa-recover");
  var recoverBtn = document.getElementById("about-pwa-recover-btn");
  if (!card || !btn) return;

  function isStandaloneDisplay() {
    try {
      if (window.matchMedia("(display-mode: standalone)").matches) return true;
      if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
      if (window.matchMedia("(display-mode: window-controls-overlay)").matches) return true;
    } catch (e) {}
    if (typeof navigator.standalone === "boolean" && navigator.standalone) return true;
    return false;
  }

  function storageSaysInstalled() {
    return !!ZymStore.getApp('pwaInstalled');
  }

  function skipStorageHide() {
    try {
      return sessionStorage.getItem(FORCE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function clearInstalledFlag() {
    ZymStore.setApp('pwaInstalled', false);
  }

  function syncRecoverUI() {
    if (!recoverWrap) return;
    if (!document.documentElement.classList.contains("about-pwa-hide-card")) {
      recoverWrap.hidden = true;
      return;
    }
    recoverWrap.hidden = isStandaloneDisplay();
  }

  function hidePwaCard() {
    document.documentElement.classList.add("about-pwa-hide-card");
    syncRecoverUI();
  }

  function showPwaCard() {
    document.documentElement.classList.remove("about-pwa-hide-card");
    if (recoverWrap) recoverWrap.hidden = true;
  }

  function markInstalled() {
    ZymStore.setApp('pwaInstalled', true);
    hidePwaCard();
  }

  function getRelatedAppsResult() {
    if (!navigator.getInstalledRelatedApps) {
      return Promise.resolve({ supported: false });
    }
    return navigator
      .getInstalledRelatedApps()
      .then(function (apps) {
        return { supported: true, apps: apps || [] };
      })
      .catch(function () {
        return { supported: false };
      });
  }

  function applyAboutPwaVisibility() {
    if (isStandaloneDisplay()) {
      markInstalled();
      return;
    }
    getRelatedAppsResult().then(function (result) {
      if (isStandaloneDisplay()) {
        markInstalled();
        return;
      }
      if (result.supported && result.apps.length) {
        markInstalled();
        return;
      }
      if (result.supported && result.apps.length === 0) {
        clearInstalledFlag();
      }
      if (storageSaysInstalled() && !skipStorageHide()) {
        hidePwaCard();
        return;
      }
      showPwaCard();
    });
  }

  if (recoverBtn) {
    recoverBtn.addEventListener("click", function () {
      try {
        sessionStorage.setItem(FORCE_KEY, "1");
      } catch (e) {}
      clearInstalledFlag();
      showPwaCard();
    });
  }

  applyAboutPwaVisibility();

  var deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    clearInstalledFlag();
    deferredPrompt = e;
    btn.hidden = false;
    showPwaCard();
  });

  window.addEventListener("appinstalled", function () {
    markInstalled();
    deferredPrompt = null;
  });

  btn.addEventListener("click", function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choice) {
      if (choice && choice.outcome === "accepted") {
        markInstalled();
      } else {
        btn.hidden = true;
      }
      deferredPrompt = null;
    });
  });
})();

// =========================
// PANEL TETAPAN (ZymSettings)
// =========================
(function () {
  var overlay, sheet, themeRow, quizRow, feedbackRow, confirmBox;

  function getThemeLabel() {
    var t = document.documentElement.getAttribute('data-theme') || 'light';
    return t === 'dark' ? 'Gelap' : 'Cerah';
  }

  function buildSheet() {
    overlay = document.createElement('div');
    overlay.className = 'zym-settings-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    sheet = document.createElement('div');
    sheet.className = 'zym-settings-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Tetapan');

    sheet.innerHTML =
      '<div class="zym-settings-handle"><div class="zym-settings-handle-bar"></div></div>' +
      '<div class="zym-settings-header">' +
        '<p class="zym-settings-title">Tetapan</p>' +
        '<button class="zym-settings-close" type="button" aria-label="Tutup tetapan">✕</button>' +
      '</div>' +
      '<div class="zym-settings-body">' +
        // Paparan
        '<div class="zym-settings-section">' +
          '<p class="zym-settings-section-label">Paparan</p>' +
          '<div class="zym-settings-row" id="zymset-theme-row">' +
            '<span class="zym-settings-row-icon">' + hzIcons8ImgHtml(HZ_ICONS8_SPARKLE.artistPalette, 18) + '</span>' +
            '<div class="zym-settings-row-body">' +
              '<span class="zym-settings-row-label">Tema</span>' +
            '</div>' +
            '<div class="zym-theme-toggle-group">' +
              '<button class="zym-theme-btn" data-theme-val="light" type="button">Cerah</button>' +
              '<button class="zym-theme-btn" data-theme-val="dark" type="button">Gelap</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="zym-settings-divider"></div>' +
        // Data Pembelajaran
        '<div class="zym-settings-section">' +
          '<p class="zym-settings-section-label">Data Pembelajaran</p>' +
          '<div class="zym-settings-row" id="zymset-quiz-row">' +
            '<span class="zym-settings-row-icon">' + hzIcons8ImgHtml(HZ_ICONS8_SPARKLE.trophy, 18) + '</span>' +
            '<div class="zym-settings-row-body">' +
              '<span class="zym-settings-row-label">Skor Kuiz</span>' +
              '<span class="zym-settings-row-meta" id="zymset-quiz-meta">memuatkan...</span>' +
              '<button class="zymset-detail-toggle" id="zymset-quiz-toggle" type="button" hidden>Butiran ▾</button>' +
            '</div>' +
            '<button class="zym-settings-action-btn" id="zymset-quiz-btn" type="button">Tetapkan Semula</button>' +
          '</div>' +
          '<div class="zymset-detail-panel" id="zymset-quiz-detail"></div>' +
          '<div class="zym-settings-row" id="zymset-feedback-row">' +
            '<span class="zym-settings-row-icon">' + hzIcons8ImgHtml(HZ_ICONS8_SPARKLE.memo, 18) + '</span>' +
            '<div class="zym-settings-row-body">' +
              '<span class="zym-settings-row-label">Maklum Balas Nota</span>' +
              '<span class="zym-settings-row-meta" id="zymset-feedback-meta">memuatkan...</span>' +
              '<button class="zymset-detail-toggle" id="zymset-feedback-toggle" type="button" hidden>Butiran ▾</button>' +
            '</div>' +
            '<button class="zym-settings-action-btn" id="zymset-feedback-btn" type="button">Tetapkan Semula</button>' +
          '</div>' +
          '<div class="zymset-detail-panel" id="zymset-feedback-detail"></div>' +
        '</div>' +
        '<div class="zym-settings-divider"></div>' +
        // Padam Semua
        '<div class="zym-settings-section" style="padding-bottom:0.6rem">' +
          '<button class="zym-settings-danger-btn" id="zymset-clear-all-btn" type="button">' +
            hzIcons8ImgHtml(HZ_ICONS8_SPARKLE.wastebasket, 20) + ' Padam Semua Data' +
          '</button>' +
          '<div class="zym-settings-confirm" id="zymset-confirm">' +
            '<p class="zym-settings-confirm-text">Tindakan ini tidak boleh diterbalikkan. Semua tetapan dan data pembelajaran akan dipadamkan.</p>' +
            '<div class="zym-settings-confirm-actions">' +
              '<button class="zym-settings-confirm-yes" id="zymset-confirm-yes" type="button">Ya, Padam</button>' +
              '<button class="zym-settings-confirm-no" id="zymset-confirm-no" type="button">Batal</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(sheet);

    // Sambungkan events
    sheet.querySelector('.zym-settings-close').addEventListener('click', closeSettings);
    overlay.addEventListener('click', closeSettings);

    // Toggle tema
    sheet.querySelectorAll('.zym-theme-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.getAttribute('data-theme-val');
        if (window.hzApplyTheme) window.hzApplyTheme(val);
        syncThemeButtons();
      });
    });

    // Helper: padam semua rekod Supabase untuk pengguna ini (guna ID yang tersimpan)
    function deleteAllFeedbackFromSupabase() {
      var fb = ZymStore.getAllFeedback();
      var ids = [];
      Object.keys(fb).forEach(function (p) {
        var sid = ZymStore.getSukaId(p);
        var oid = ZymStore.getFeedbackId(p);
        if (sid) ids.push(sid);
        if (oid) ids.push(oid);
      });
      if (!ids.length || !NOTA_FB_SUPABASE_URL || !NOTA_FB_SUPABASE_KEY) return Promise.resolve();
      return fetch(NOTA_FB_SUPABASE_URL + '/rest/v1/rpc/delete_nota_feedback_entries', {
        method: 'POST',
        headers: {
          'apikey': NOTA_FB_SUPABASE_KEY,
          'Authorization': 'Bearer ' + NOTA_FB_SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_ids: ids, p_secret: ZymStore.getUserSecret() })
      }).catch(function () {});
    }

    var isNotaPage = !!window.location.pathname.match(/\/notes\/bab-\d+-\d+\.html/);

    // Reset skor kuiz
    sheet.querySelector('#zymset-quiz-btn').addEventListener('click', function () {
      ZymStore.clearQuizScores();
      updateDataCounts();
      var btn = sheet.querySelector('#zymset-quiz-btn');
      btn.textContent = '✓ Dipadam';
      btn.classList.add('is-done');
      if (isNotaPage) { setTimeout(function () { window.location.reload(); }, 600); return; }
      setTimeout(function () {
        btn.textContent = 'Tetapkan Semula';
        btn.classList.remove('is-done');
      }, 2200);
    });

    // Reset maklum balas
    sheet.querySelector('#zymset-feedback-btn').addEventListener('click', function () {
      var btn = sheet.querySelector('#zymset-feedback-btn');
      btn.textContent = '⏳ Memadam...';
      btn.disabled = true;
      deleteAllFeedbackFromSupabase().then(function () {
        ZymStore.clearFeedback();
        updateDataCounts();
        if (isNotaPage) { window.location.reload(); return; }
        btn.textContent = '✓ Dipadam';
        btn.classList.add('is-done');
        btn.disabled = false;
        setTimeout(function () {
          btn.textContent = 'Tetapkan Semula';
          btn.classList.remove('is-done');
        }, 2200);
      });
    });

    // Toggle panel butiran kuiz
    sheet.querySelector('#zymset-quiz-toggle').addEventListener('click', function () {
      var panel = sheet.querySelector('#zymset-quiz-detail');
      var toggle = sheet.querySelector('#zymset-quiz-toggle');
      var open = panel.classList.toggle('is-open');
      toggle.textContent = open ? 'Tutup ▴' : 'Butiran ▾';
      if (open) renderQuizDetail();
    });

    // Toggle panel butiran maklum balas
    sheet.querySelector('#zymset-feedback-toggle').addEventListener('click', function () {
      var panel = sheet.querySelector('#zymset-feedback-detail');
      var toggle = sheet.querySelector('#zymset-feedback-toggle');
      var open = panel.classList.toggle('is-open');
      toggle.textContent = open ? 'Tutup ▴' : 'Butiran ▾';
      if (open) renderFeedbackDetail();
    });

    // Padam entri kuiz individu (event delegation)
    sheet.querySelector('#zymset-quiz-detail').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-quiz-del]');
      if (!btn) return;
      var qid = btn.getAttribute('data-quiz-del');
      ZymStore.deleteQuizScore(qid);
      updateDataCounts();
      // Reload jika kuiz ini milik halaman semasa supaya stat bar hilang
      var pageMatch = window.location.pathname.match(/\/notes\/(bab-\d+-\d+)\.html/i);
      if (pageMatch && pageMatch[1] === qid) window.location.reload();
    });

    // Padam suka atau pendapat secara berasingan (event delegation)
    sheet.querySelector('#zymset-feedback-detail').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-fb-suka-del],[data-fb-op-del]');
      if (!btn) return;
      var isSuka = btn.hasAttribute('data-fb-suka-del');
      var path = btn.getAttribute(isSuka ? 'data-fb-suka-del' : 'data-fb-op-del');
      var isCurrentPage = (path === window.location.pathname);
      var id = isSuka ? ZymStore.getSukaId(path) : ZymStore.getFeedbackId(path);

      var deleteOp = (id && NOTA_FB_SUPABASE_URL && NOTA_FB_SUPABASE_KEY)
        ? fetch(NOTA_FB_SUPABASE_URL + '/rest/v1/rpc/delete_nota_feedback_entries', {
            method: 'POST',
            headers: { 'apikey': NOTA_FB_SUPABASE_KEY, 'Authorization': 'Bearer ' + NOTA_FB_SUPABASE_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_ids: [id], p_secret: ZymStore.getUserSecret() })
          }).catch(function () {})
        : Promise.resolve();

      if (isSuka) ZymStore.clearSuka(path); else ZymStore.clearOpinion(path);
      updateDataCounts();
      renderFeedbackDetail();

      if (isCurrentPage) deleteOp.then(function () { window.location.reload(); });
    });

    // Padam semua — tunjuk pengesahan
    sheet.querySelector('#zymset-clear-all-btn').addEventListener('click', function () {
      sheet.querySelector('#zymset-confirm').classList.add('is-visible');
    });
    sheet.querySelector('#zymset-confirm-no').addEventListener('click', function () {
      sheet.querySelector('#zymset-confirm').classList.remove('is-visible');
    });
    sheet.querySelector('#zymset-confirm-yes').addEventListener('click', function () {
      sheet.querySelector('#zymset-confirm').classList.remove('is-visible');
      deleteAllFeedbackFromSupabase().then(function () {
        ZymStore.clearAll();
        updateDataCounts();
        var sysTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        if (window.hzApplyTheme) window.hzApplyTheme(sysTheme);
        syncThemeButtons();
        if (isNotaPage) { window.location.reload(); return; }
        var dangerBtn = sheet.querySelector('#zymset-clear-all-btn');
        dangerBtn.textContent = '✓ Semua data dipadamkan';
        dangerBtn.disabled = true;
        setTimeout(function () {
          dangerBtn.innerHTML = hzIcons8ImgHtml(HZ_ICONS8_SPARKLE.wastebasket, 20) + ' Padam Semua Data';
          dangerBtn.disabled = false;
        }, 3000);
      });
    });

    // Swipe ke bawah untuk tutup
    var startY = 0;
    sheet.addEventListener('touchstart', function (e) { startY = e.touches[0].clientY; }, { passive: true });
    sheet.addEventListener('touchend', function (e) {
      if (e.changedTouches[0].clientY - startY > 60) closeSettings();
    }, { passive: true });
  }

  function syncThemeButtons() {
    if (!sheet) return;
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    sheet.querySelectorAll('.zym-theme-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-theme-val') === current);
    });
  }

  var REACTION_LABELS = { 'suka': 'Suka!', 'mudah': 'Mudah difahami', 'boleh-baik': 'Boleh diperbaiki', 'kurang-jelas': 'Kurang jelas' };
  var REACTION_PAIRS  = { 'suka': HZ_FLUENT_SPARKLE.sparklingHeart, 'mudah': HZ_FLUENT_SPARKLE.faceSmiling, 'boleh-baik': HZ_FLUENT_SPARKLE.faceThinking, 'kurang-jelas': HZ_FLUENT_SPARKLE.faceConfused };

  function fmtSubtopic(key) {
    var m = key.match(/bab-(\d+)-(\d+)/i);
    return m ? 'Bab ' + m[1] + '.' + m[2] : key;
  }

  function renderQuizDetail() {
    if (!sheet) return;
    var panel = sheet.querySelector('#zymset-quiz-detail');
    if (!panel || !panel.classList.contains('is-open')) return;
    var scores = ZymStore.getAllQuizScores();
    var keys = Object.keys(scores).sort();
    if (!keys.length) { panel.classList.remove('is-open'); sheet.querySelector('#zymset-quiz-toggle').textContent = 'Butiran ▾'; return; }
    panel.innerHTML = keys.map(function (id) {
      return '<div class="zymset-detail-item">' +
        '<span class="zymset-detail-label">' + fmtSubtopic(id) + '</span>' +
        '<span class="zymset-detail-val">' + scores[id] + '%</span>' +
        '<button class="zymset-detail-del" type="button" data-quiz-del="' + id + '" title="Padam entri ini">×</button>' +
        '</div>';
    }).join('');
  }

  function renderFeedbackDetail() {
    if (!sheet) return;
    var panel = sheet.querySelector('#zymset-feedback-detail');
    if (!panel || !panel.classList.contains('is-open')) return;
    var fb = ZymStore.getAllFeedback();
    var keys = Object.keys(fb).sort();
    if (!keys.length) { panel.classList.remove('is-open'); sheet.querySelector('#zymset-feedback-toggle').textContent = 'Butiran ▾'; return; }
    var rows = [];
    keys.forEach(function (path) {
      var label = fmtSubtopic(path);
      if (ZymStore.getSukaGiven(path)) {
        var sp = REACTION_PAIRS['suka'];
        rows.push(
          '<div class="zymset-detail-item">' +
          '<span class="zymset-detail-label">' + label + '</span>' +
          '<span class="zymset-detail-val"><img src="' + hzFluent3dAsset(sp[0], sp[1]) + '" width="14" height="14" loading="lazy" style="vertical-align:middle"> Suka!</span>' +
          '<button class="zymset-detail-del" type="button" data-fb-suka-del="' + path + '" title="Padam">×</button>' +
          '</div>'
        );
      }
      var oKey = ZymStore.getFeedback(path);
      if (oKey) {
        var op = REACTION_PAIRS[oKey];
        rows.push(
          '<div class="zymset-detail-item">' +
          '<span class="zymset-detail-label">' + label + '</span>' +
          '<span class="zymset-detail-val">' + (op ? '<img src="' + hzFluent3dAsset(op[0], op[1]) + '" width="14" height="14" loading="lazy" style="vertical-align:middle"> ' : '') + (REACTION_LABELS[oKey] || oKey) + '</span>' +
          '<button class="zymset-detail-del" type="button" data-fb-op-del="' + path + '" title="Padam">×</button>' +
          '</div>'
        );
      }
    });
    panel.innerHTML = rows.join('');
  }

  function updateDataCounts() {
    if (!sheet) return;
    var qCount = ZymStore.getQuizCount();
    var fCount = ZymStore.getFeedbackCount();
    var qMeta = sheet.querySelector('#zymset-quiz-meta');
    var fMeta = sheet.querySelector('#zymset-feedback-meta');
    var qBtn = sheet.querySelector('#zymset-quiz-btn');
    var fBtn = sheet.querySelector('#zymset-feedback-btn');
    var qToggle = sheet.querySelector('#zymset-quiz-toggle');
    var fToggle = sheet.querySelector('#zymset-feedback-toggle');
    var qPanel = sheet.querySelector('#zymset-quiz-detail');
    var fPanel = sheet.querySelector('#zymset-feedback-detail');

    if (qMeta) qMeta.textContent = qCount > 0 ? qCount + ' rekod tersimpan' : 'Tiada rekod';
    if (fMeta) fMeta.textContent = fCount > 0 ? fCount + ' rekod tersimpan' : 'Tiada rekod';
    if (qBtn) qBtn.disabled = qCount === 0;
    if (fBtn) fBtn.disabled = fCount === 0;
    if (qToggle) qToggle.hidden = qCount === 0;
    if (fToggle) fToggle.hidden = fCount === 0;

    if (qCount === 0 && qPanel) { qPanel.classList.remove('is-open'); qPanel.innerHTML = ''; if (qToggle) qToggle.textContent = 'Butiran ▾'; }
    if (fCount === 0 && fPanel) { fPanel.classList.remove('is-open'); fPanel.innerHTML = ''; if (fToggle) fToggle.textContent = 'Butiran ▾'; }

    renderQuizDetail();
    renderFeedbackDetail();
  }

  function openSettings() {
    if (!sheet) buildSheet();
    syncThemeButtons();
    updateDataCounts();
    sheet.querySelector('#zymset-confirm').classList.remove('is-visible');
    overlay.classList.add('is-open');
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var closeBtn = sheet.querySelector('.zym-settings-close');
      if (closeBtn) closeBtn.focus();
    }, 80);
  }

  function closeSettings() {
    if (!sheet) return;
    overlay.classList.remove('is-open');
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  window.ZymSettings = { open: openSettings, close: closeSettings };

  // Injek butang ⚙️ ke header di semua halaman
  document.addEventListener('DOMContentLoaded', function () {
    // Keyboard: Escape tutup panel
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet && sheet.classList.contains('is-open')) closeSettings();
    });
  });
})();

// =========================
// KEMASKINI TERKINI — baca dari updates.json
// =========================
(function () {
  var el = document.querySelector('[data-last-updated]');
  if (!el) return;

  var BULAN = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];

  fetch('/data/updates.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var latest = data.entries && data.entries[0] && data.entries[0].date;
      if (!latest) return;
      var parts = latest.split('-');
      var label = BULAN[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
      el.textContent = 'Kemaskini terkini: ' + label;
    })
    .catch(function () {});
})();

// =========================
// SERVICE WORKER REGISTRATION
// =========================
(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js?v=421').catch(function (error) {
      console.warn('Service worker registration failed:', error);
    });
  });
})();
