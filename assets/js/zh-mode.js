// =========================
// MOD BAHASA CINA (中文模式)
// =========================
// Flash prevention — apply data-lang-mode before first paint
(function () {
  if (localStorage.getItem("hzedu-lang-mode") === "zh") {
    document.documentElement.setAttribute("data-lang-mode", "zh");
  }
})();

(function () {
  var LANG_KEY = "hzedu-lang-mode";
  var DISCLAIMER_KEY = "hzedu-zh-disclaimer-shown";
  var glossary = null;
  var annotated = false;

  // ── Helpers ──────────────────────────────────────────────

  function isZhMode() {
    return localStorage.getItem(LANG_KEY) === "zh";
  }

  function normalize(str) {
    return str.trim().toLowerCase().replace(/\s+/g, " ");
  }

  function resolveGlossaryPath() {
    var parts = window.location.pathname.split("/").filter(Boolean);
    return parts.length > 1 ? "../data/zh-glossary.json" : "data/zh-glossary.json";
  }

  // ── Glossary Loading ─────────────────────────────────────

  function loadGlossary() {
    if (glossary !== null) return Promise.resolve(glossary);
    return fetch(resolveGlossaryPath())
      .then(function (res) { return res.ok ? res.json() : {}; })
      .then(function (data) {
        glossary = data;
        return glossary;
      })
      .catch(function () {
        glossary = {};
        return {};
      });
  }

  // ── Keyword Annotation ───────────────────────────────────

  function lookupTerm(text, gl) {
    var key = normalize(text);
    if (gl[key]) return gl[key];
    // Partial match: find glossary key contained within the text
    var keys = Object.keys(gl);
    for (var i = 0; i < keys.length; i++) {
      if (key.indexOf(keys[i]) !== -1 && keys[i].length > 3) {
        return gl[keys[i]];
      }
    }
    return null;
  }

  function annotateKeywords(gl) {
    if (annotated) return;
    annotated = true;
    var spans = document.querySelectorAll(".kw");
    spans.forEach(function (span) {
      // Skip keyword legend labels — they contain category names, not real terms
      if (span.closest(".keyword-legend-item")) return;
      // Skip spans that already have child elements (complex nested content)
      if (span.children.length > 0) return;
      // data-zh override takes priority over glossary lookup
      var zh = span.getAttribute("data-zh") || lookupTerm(span.textContent, gl);
      if (!zh) return;
      var ann = document.createElement("span");
      ann.className = "kw-zh-ann";
      ann.textContent = zh;
      ann.setAttribute("aria-hidden", "true");
      span.classList.add("kw-zh-annotated");
      span.appendChild(ann);
    });
  }

  function removeAnnotations() {
    document.querySelectorAll(".kw-zh-ann").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".kw-zh-annotated").forEach(function (el) {
      el.classList.remove("kw-zh-annotated");
    });
    annotated = false;
  }

  // ── Disclaimer Toast ─────────────────────────────────────

  function showDisclaimer() {
    if (sessionStorage.getItem(DISCLAIMER_KEY)) return;
    sessionStorage.setItem(DISCLAIMER_KEY, "1");

    var toast = document.createElement("div");
    toast.className = "zh-disclaimer-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML =
      '<span class="zh-disclaimer-icon">中</span>' +
      '<span class="zh-disclaimer-text">Mod Bahasa Cina diaktifkan. Terjemahan ini adalah panduan untuk memudahkan pemahaman istilah sejarah. Pelajar tetap perlu menguasai dan menjawab soalan peperiksaan dalam Bahasa Melayu.</span>' +
      '<button class="zh-disclaimer-close" type="button" aria-label="Tutup">✕</button>';

    document.body.appendChild(toast);

    toast.querySelector(".zh-disclaimer-close").addEventListener("click", function () {
      toast.classList.add("zh-toast-hide");
      setTimeout(function () { toast.remove(); }, 300);
    });

    setTimeout(function () {
      if (toast.parentNode) {
        toast.classList.add("zh-toast-hide");
        setTimeout(function () { toast.remove(); }, 300);
      }
    }, 8000);

    // Trigger entrance animation
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add("zh-toast-show"); });
    });
  }

  // ── Text Selection Translation ────────────────────────────

  function initSelectionTranslation() {
    var popup = document.createElement("div");
    popup.className = "zh-selection-popup";
    popup.setAttribute("aria-hidden", "true");
    popup.setAttribute("role", "tooltip");
    document.body.appendChild(popup);

    function hidePopup() {
      popup.classList.remove("zh-selection-popup--visible");
    }

    function handleSelectionEnd(e) {
      if (!isZhMode() || !glossary) { hidePopup(); return; }

      var selection = window.getSelection();
      if (!selection || selection.isCollapsed) { hidePopup(); return; }

      var selectedText = selection.toString().trim();
      if (selectedText.length < 2 || selectedText.length > 80) { hidePopup(); return; }

      var zh = lookupTerm(selectedText, glossary);
      if (!zh) { hidePopup(); return; }

      var range = selection.getRangeAt(0);
      var rect = range.getBoundingClientRect();
      var scrollY = window.scrollY || document.documentElement.scrollTop;

      popup.textContent = zh;
      popup.classList.add("zh-selection-popup--visible");

      // Position above the selection
      var popupWidth = popup.offsetWidth || 120;
      var left = rect.left + (rect.width / 2) - (popupWidth / 2);
      left = Math.max(8, Math.min(left, window.innerWidth - popupWidth - 8));
      popup.style.left = left + "px";
      popup.style.top = (rect.top + scrollY - popup.offsetHeight - 10) + "px";
    }

    document.addEventListener("mouseup", function (e) {
      if (e.target.closest && e.target.closest(".zh-selection-popup")) return;
      setTimeout(function () { handleSelectionEnd(e); }, 10);
    });

    document.addEventListener("touchend", function (e) {
      if (e.target.closest && e.target.closest(".zh-selection-popup")) return;
      setTimeout(function () { handleSelectionEnd(e); }, 200);
    });

    document.addEventListener("mousedown", function (e) {
      if (e.target.closest && e.target.closest(".zh-selection-popup")) return;
      hidePopup();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") hidePopup();
    });
  }

  // ── Mode Application ─────────────────────────────────────

  function applyZhMode(active) {
    localStorage.setItem(LANG_KEY, active ? "zh" : "ms");

    if (active) {
      document.documentElement.setAttribute("data-lang-mode", "zh");
      document.querySelectorAll(".zh-mode-fab").forEach(function (btn) {
        btn.setAttribute("aria-pressed", "true");
        btn.classList.add("is-active");
      });
      loadGlossary().then(function (gl) {
        annotateKeywords(gl);
        showDisclaimer();
      });
    } else {
      document.documentElement.removeAttribute("data-lang-mode");
      document.querySelectorAll(".zh-mode-fab").forEach(function (btn) {
        btn.setAttribute("aria-pressed", "false");
        btn.classList.remove("is-active");
      });
      removeAnnotations();
    }
  }

  // ── FAB Button Injection ─────────────────────────────────

  function injectFabButtons() {
    document.querySelectorAll(".nav-wrap").forEach(function (nav) {
      if (nav.querySelector(".zh-mode-fab")) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zh-mode-fab";
      btn.setAttribute("aria-label", "Mod Bahasa Cina (中文模式)");
      btn.setAttribute("aria-pressed", isZhMode() ? "true" : "false");
      btn.textContent = "华";
      if (isZhMode()) btn.classList.add("is-active");

      btn.addEventListener("click", function () {
        applyZhMode(!isZhMode());
      });

      // Insert before .nav-toggle (dark mode FAB will be injected after by main.js)
      var navToggle = nav.querySelector(".nav-toggle");
      if (navToggle) {
        nav.insertBefore(btn, navToggle);
      } else {
        nav.appendChild(btn);
      }
    });
  }

  // ── Init ─────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", function () {
    injectFabButtons();
    initSelectionTranslation();

    if (isZhMode()) {
      loadGlossary().then(function (gl) {
        annotateKeywords(gl);
      });
    }
  });
})();
