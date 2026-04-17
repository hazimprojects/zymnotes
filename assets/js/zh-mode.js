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
  var legacyControlsInitialized = false;
  var applyRequestId = 0;

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

  function getMergedGlossary() {
    return glossary || {};
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
    var keys = Object.keys(gl).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i++) {
      if (key.indexOf(keys[i]) !== -1 && keys[i].length > 2) {
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
      if (span.closest(".keyword-legend-item")) return;
      if (span.children.length > 0) return;
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

  // ── Paper Chip Flip Translation ──────────────────────────

  function translateTextByGlossary(text, gl) {
    var translated = text;
    var keys = Object.keys(gl).sort(function (a, b) { return b.length - a.length; });

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!key || key.length < 2) continue;
      var escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var rx = new RegExp(escaped, "gi");
      translated = translated.replace(rx, function (term) {
        return term + " (" + gl[key] + ")";
      });
    }

    return translated;
  }

  function setupChipFlips(gl) {
    var chips = document.querySelectorAll(".paper-chip");
    chips.forEach(function (chip) {
      if (chip.classList.contains("zh-chip-flip-ready")) return;
      if (chip.querySelector(".zh-chip-inner")) return;

      if (!chip.__zhOriginalHTML) {
        chip.__zhOriginalHTML = chip.innerHTML;
      }

      var sourceNode = chip.cloneNode(true);
      sourceNode.querySelectorAll(".kw-zh-ann").forEach(function (ann) { ann.remove(); });
      var sourceText = sourceNode.textContent ? sourceNode.textContent.trim() : "";
      if (!sourceText || sourceText.length < 3 || sourceText.length > 320) return;

      var translatedText = translateTextByGlossary(sourceText, gl);
      if (!translatedText || translatedText === sourceText) return;

      chip.classList.add("zh-chip-flip-ready");
      chip.setAttribute("tabindex", "0");
      chip.setAttribute("role", "button");
      chip.setAttribute("aria-label", "Klik untuk flip dan lihat terjemahan Cina");
      chip.setAttribute("data-zh-bm", sourceText);
      chip.setAttribute("data-zh-cn", translatedText);

      chip.innerHTML =
        '<span class="zh-chip-inner">' +
          '<span class="zh-chip-front">' + escapeHtml(sourceText) + "</span>" +
          '<span class="zh-chip-back">' + escapeHtml(translatedText) + "</span>" +
        "</span>";

      function toggleFlip() {
        if (!isZhMode()) return;
        chip.classList.toggle("zh-chip-flipped");
      }

      function onKeydown(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleFlip();
        }
      }

      chip.__zhFlipHandlers = {
        click: toggleFlip,
        keydown: onKeydown
      };

      chip.addEventListener("click", chip.__zhFlipHandlers.click);
      chip.addEventListener("keydown", chip.__zhFlipHandlers.keydown);
    });
  }

  function resetChipFlips() {
    document.querySelectorAll(".paper-chip.zh-chip-flip-ready").forEach(function (chip) {
      if (chip.__zhFlipHandlers) {
        chip.removeEventListener("click", chip.__zhFlipHandlers.click);
        chip.removeEventListener("keydown", chip.__zhFlipHandlers.keydown);
        chip.__zhFlipHandlers = null;
      }

      if (chip.__zhOriginalHTML) {
        chip.innerHTML = chip.__zhOriginalHTML;
      }
      chip.classList.remove("zh-chip-flip-ready", "zh-chip-flipped");
      chip.removeAttribute("tabindex");
      chip.removeAttribute("role");
      chip.removeAttribute("aria-label");
      chip.removeAttribute("data-zh-bm");
      chip.removeAttribute("data-zh-cn");
    });
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
      '<div class="zh-disclaimer-content">' +
        '<span class="zh-disclaimer-text">中文 ON · Terjemahan kata kunci</span>' +
        '<button class="zh-help-toggle zh-disclaimer-help-toggle" type="button" aria-expanded="false">❓ Help</button>' +
        '<span class="zh-disclaimer-help" hidden>Mod Bahasa Cina aktif. Terjemahan istilah utama dipaparkan terus pada kata kunci untuk rujukan pantas. 中文模式已开启：重点词会直接显示中文释义。</span>' +
      "</div>" +
      '<button class="zh-disclaimer-close" type="button" aria-label="Tutup">✕</button>';

    document.body.appendChild(toast);

    var helpToggle = toast.querySelector(".zh-disclaimer-help-toggle");
    var helpText = toast.querySelector(".zh-disclaimer-help");
    if (helpToggle && helpText) {
      helpToggle.addEventListener("click", function () {
        var expanded = helpToggle.getAttribute("aria-expanded") === "true";
        helpToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        helpText.hidden = expanded;
      });
    }

    toast.querySelector(".zh-disclaimer-close").addEventListener("click", function () {
      toast.classList.add("zh-toast-hide");
      setTimeout(function () { toast.remove(); }, 300);
    });

    setTimeout(function () {
      if (toast.parentNode) {
        toast.classList.add("zh-toast-hide");
        setTimeout(function () { toast.remove(); }, 300);
      }
    }, 8500);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add("zh-toast-show"); });
    });
  }

  // ── Mode Application ─────────────────────────────────────

  function updateLegacyToggleButtons(active) {
    document.querySelectorAll(".zh-mode-fab").forEach(function (btn) {
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.classList.toggle("is-active", active);
    });
  }

  function applyZhMode(active, options) {
    var opts = options || {};
    var requestId = ++applyRequestId;
    localStorage.setItem(LANG_KEY, active ? "zh" : "ms");
    updateLegacyToggleButtons(active);

    if (active) {
      document.documentElement.setAttribute("data-lang-mode", "zh");
      loadGlossary().then(function () {
        if (requestId !== applyRequestId) return;
        if (!isZhMode()) return;
        var merged = getMergedGlossary();
        annotateKeywords(merged);
        setupChipFlips(merged);
        if (!opts.silentDisclaimer) {
          showDisclaimer();
        }
      });
    } else {
      document.documentElement.removeAttribute("data-lang-mode");
      removeAnnotations();
      resetChipFlips();
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

      var navToggle = nav.querySelector(".nav-toggle");
      if (navToggle) {
        nav.insertBefore(btn, navToggle);
      } else {
        nav.appendChild(btn);
      }
    });
  }

  function initLegacyControls() {
    if (legacyControlsInitialized) return;
    legacyControlsInitialized = true;
    injectFabButtons();
  }

  function openGlossaryNotes() {
    return false;
  }

  function shouldUseSparkleForZhControls() {
    return /\/notes\//.test(window.location.pathname) && !window.__HZ_ZH_LEGACY_REQUESTED;
  }

  // ── Init ─────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", function () {
    if (!shouldUseSparkleForZhControls()) {
      initLegacyControls();
    }

    if (isZhMode()) {
      loadGlossary().then(function () {
        var merged = getMergedGlossary();
        annotateKeywords(merged);
        setupChipFlips(merged);
      });
    }
  });

  document.addEventListener("hz:zh-legacy-controls", function () {
    window.__HZ_ZH_LEGACY_REQUESTED = true;
    initLegacyControls();
  });

  window.HzZhMode = {
    isActive: isZhMode,
    toggle: function () {
      applyZhMode(!isZhMode());
      return isZhMode();
    },
    setActive: function (active, options) {
      applyZhMode(!!active, options || {});
      return isZhMode();
    },
    openGlossaryNotes: openGlossaryNotes,
    initLegacyControls: function () {
      window.__HZ_ZH_LEGACY_REQUESTED = true;
      initLegacyControls();
    },
    showDisclaimer: showDisclaimer
  };
})();
