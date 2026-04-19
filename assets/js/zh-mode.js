// =========================
// MOD BAHASA CINA (中文模式)
// Workflow: manual JSON only
// =========================

// Flash prevention — apply data-lang-mode before first paint
(function () {
  try {
    if (localStorage.getItem("hzedu-lang-mode") === "zh") {
      document.documentElement.setAttribute("data-lang-mode", "zh");
    }
  } catch (e) {}
})();

(function () {
  "use strict";

  var LANG_KEY = "hzedu-lang-mode";
  var DISCLAIMER_KEY = "hzedu-zh-disclaimer-shown";

  var glossary = null;
  var comprehensionMap = null;
  var annotated = false;
  var legacyControlsInitialized = false;
  var applyRequestId = 0;

  // ── Helpers ──────────────────────────────────────────────

  function isZhMode() {
    try {
      return localStorage.getItem(LANG_KEY) === "zh";
    } catch (e) {
      return false;
    }
  }

  function normalize(str) {
    return String(str || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function resolveGlossaryPath() {
    var parts = window.location.pathname.split("/").filter(Boolean);
    return parts.length > 1 ? "../data/zh-glossary.json" : "data/zh-glossary.json";
  }

  function resolveComprehensionPath() {
    var parts = window.location.pathname.split("/").filter(Boolean);
    return parts.length > 1 ? "../data/zh-comprehension.json" : "data/zh-comprehension.json";
  }

  function resolveComprehensionIndexPath() {
    var parts = window.location.pathname.split("/").filter(Boolean);
    return parts.length > 1 ? "../data/zh-units/index.json" : "data/zh-units/index.json";
  }

  function resolveComprehensionUnitPath(fileName) {
    if (!fileName || typeof fileName !== "string") return null;
    if (/^https?:\/\//i.test(fileName)) return fileName;

    var trimmed = fileName.replace(/^\.\//, "");
    var parts = window.location.pathname.split("/").filter(Boolean);
    var prefix = parts.length > 1 ? "../" : "";

    if (trimmed.indexOf("data/") === 0) return prefix + trimmed;
    return prefix + "data/zh-units/" + trimmed;
  }

  function getMergedGlossary() {
    return glossary || {};
  }

  function getComprehensionMap() {
    return comprehensionMap || {};
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stripCorruptedZhLeadPrefix(text) {
    return String(text || "")
      .replace(/^\s*['"“”‘’`「」\[\]（）()]*\s*重点\s*[：:]\s*/u, "")
      .trim();
  }

  function normalizeZhExplain(text) {
    return stripCorruptedZhLeadPrefix(text)
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasZhUnitId(el) {
    if (!el || !el.getAttribute) return false;
    return !!(el.getAttribute("data-zh-unit-id") || "").trim();
  }

  function lookupTerm(text, gl) {
    var source = normalize(text);
    if (!source) return null;

    if (gl[source] && typeof gl[source] === "string") return gl[source];

    var keys = Object.keys(gl || {})
      .filter(function (k) { return typeof gl[k] === "string"; })
      .sort(function (a, b) { return b.length - a.length; });

    for (var i = 0; i < keys.length; i++) {
      if (source.indexOf(normalize(keys[i])) !== -1 && keys[i].length > 2) {
        return gl[keys[i]];
      }
    }

    return null;
  }

  // ── Data Loading ─────────────────────────────────────────

  function loadGlossary() {
    if (glossary !== null) return Promise.resolve(glossary);

    return fetch(resolveGlossaryPath())
      .then(function (res) {
        return res.ok ? res.json() : {};
      })
      .then(function (data) {
        glossary = data || {};
        return glossary;
      })
      .catch(function () {
        glossary = {};
        return glossary;
      });
  }

  function loadComprehensionData() {
    if (comprehensionMap !== null) return Promise.resolve(comprehensionMap);

    function mergeUnits(mapped, payload, options) {
      var opts = options || {};
      var overwrite = opts.overwrite !== false;
      var units = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload && payload.units) ? payload.units : []);

      units.forEach(function (unit) {
        if (!unit || typeof unit !== "object") return;
        if (!unit.source_id || typeof unit.source_id !== "string") return;
        if (!overwrite && Object.prototype.hasOwnProperty.call(mapped, unit.source_id)) return;
        mapped[unit.source_id] = unit;
      });
    }

    function loadLegacyComprehension(mapped) {
      return fetch(resolveComprehensionPath())
        .then(function (res) { return res.ok ? res.json() : {}; })
        .then(function (data) {
          mergeUnits(mapped, data, { overwrite: false });
          return mapped;
        })
        .catch(function () { return mapped; });
    }

    return fetch(resolveComprehensionIndexPath())
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (indexPayload) {
        var mapped = {};
        var fileList = [];

        if (Array.isArray(indexPayload)) {
          fileList = indexPayload;
        } else if (indexPayload && Array.isArray(indexPayload.files)) {
          fileList = indexPayload.files;
        }

        var requests = fileList
          .map(resolveComprehensionUnitPath)
          .filter(function (path) { return typeof path === "string" && path; })
          .map(function (path) {
            return fetch(path)
              .then(function (res) { return res.ok ? res.json() : null; })
              .catch(function () { return null; });
          });

        return Promise.all(requests).then(function (payloads) {
          payloads.forEach(function (payload) {
            if (!payload) return;
            mergeUnits(mapped, payload, { overwrite: true });
          });

          if (Object.keys(mapped).length > 0) return mapped;
          return loadLegacyComprehension(mapped);
        });
      })
      .catch(function () {
        return loadLegacyComprehension({});
      })
      .then(function (mapped) {
        comprehensionMap = mapped || {};
        return comprehensionMap;
      });
  }

  // ── Keyword Annotation (.kw only) ───────────────────────

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
      ann.setAttribute("lang", "zh-Hans");

      span.classList.add("kw-zh-annotated");
      span.appendChild(ann);

      function toggleKw(e) {
        e.stopPropagation();
        span.classList.toggle("kw-zh-open");
      }

      span.__zhKwHandler = toggleKw;
      span.addEventListener("click", toggleKw);
    });
  }

  function removeAnnotations() {
    document.querySelectorAll(".kw-zh-ann").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".kw-zh-annotated").forEach(function (el) {
      el.classList.remove("kw-zh-annotated", "kw-zh-open");
      if (el.__zhKwHandler) {
        el.removeEventListener("click", el.__zhKwHandler);
        el.__zhKwHandler = null;
      }
    });
    annotated = false;
  }

  // ── Manual Unit Translation Rendering ───────────────────

  function getUnitById(unitId, comprehension) {
    if (!unitId) return null;
    return comprehension && comprehension[unitId] ? comprehension[unitId] : null;
  }

  function getManualTranslation(unit) {
    if (!unit || typeof unit.translate !== "string") return "";
    return normalizeZhExplain(unit.translate);
  }

  function setupChipTranslations(comprehension) {
    var chips = document.querySelectorAll(".paper-chip[data-zh-unit-id]");

    chips.forEach(function (chip) {
      var unitId = (chip.getAttribute("data-zh-unit-id") || "").trim();
      if (!unitId) return;

      var unit = getUnitById(unitId, comprehension);
      var translation = getManualTranslation(unit);
      if (!translation) return;

      if (!chip.__zhOriginalHTML) {
        chip.__zhOriginalHTML = chip.innerHTML;
      }

      chip.classList.add("zh-chip-manual-ready");
      chip.setAttribute("data-chip-manual-zh", "true");

      chip.innerHTML =
        '<span class="zh-chip-inner">' +
          '<span class="zh-chip-primary">' + chip.__zhOriginalHTML + '</span>' +
          '<span class="zh-chip-translation zh-chip-translation-explain" lang="zh-Hans">' +
            '<span class="zh-chip-explain-text">' + escapeHtml(translation) + '</span>' +
          '</span>' +
        '</span>';
    });
  }

  function resetChipTranslations() {
    document.querySelectorAll(".paper-chip[data-chip-manual-zh='true']").forEach(function (chip) {
      if (chip.__zhOriginalHTML) {
        chip.innerHTML = chip.__zhOriginalHTML;
      }
      chip.classList.remove("zh-chip-manual-ready");
      chip.removeAttribute("data-chip-manual-zh");
    });
  }

  function applyExplainAnnotations(comprehension) {
    var selector = [
      ".point-heading[data-zh-unit-id]",
      ".point-line[data-zh-unit-id]",
      ".formula-block[data-zh-unit-id]",
      ".summary-paper[data-zh-unit-id]",
      ".conclusion-paper[data-zh-unit-id]",
      ".master-summary-paper[data-zh-unit-id]",
      "[data-zh-unit-id]"
    ].join(", ");

    var seen = new WeakSet();
    var targets = Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (el) {
      if (!hasZhUnitId(el)) return false;
      if (seen.has(el)) return false;
      seen.add(el);

      // chip handled separately
      if (el.classList && el.classList.contains("paper-chip")) return false;
      return true;
    });

    targets.forEach(function (el) {
      var unitId = (el.getAttribute("data-zh-unit-id") || "").trim();
      if (!unitId) return;

      var unit = getUnitById(unitId, comprehension);
      var translation = getManualTranslation(unit);
      if (!translation) return;

      var existing = el.nextElementSibling;
      if (existing && existing.classList && existing.classList.contains("zh-heading-ann")) {
        existing.remove();
      }

      var ann = document.createElement("span");
      ann.className = "zh-heading-ann";
      ann.setAttribute("lang", "zh-Hans");
      ann.setAttribute("aria-hidden", "true");
      ann.textContent = translation;

      el.classList.add("zh-heading-has-ann");
      el.insertAdjacentElement("afterend", ann);
    });
  }

  function removeExplainAnnotations() {
    document.querySelectorAll(".zh-heading-ann").forEach(function (el) {
      el.remove();
    });

    document.querySelectorAll(".zh-heading-has-ann").forEach(function (el) {
      el.classList.remove("zh-heading-has-ann");
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
        '<span class="zh-disclaimer-text">Mod Bahasa Cina aktif · versi manual repo</span>' +
        '<button class="zh-help-toggle zh-disclaimer-help-toggle" type="button" aria-expanded="false">❓ Makluman</button>' +
        '<span class="zh-disclaimer-help" hidden>Terjemahan dipaparkan berdasarkan fail JSON manual dalam repo. Jika sesuatu istilah masih kekal dalam BM, itu biasanya disengajakan kerana ia merupakan nama khas atau istilah sejarah.</span>' +
      "</div>" +
      '<button class="zh-disclaimer-close" type="button" aria-label="Tutup makluman">✕</button>';

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

    var closeBtn = toast.querySelector(".zh-disclaimer-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        toast.classList.add("zh-toast-hide");
        setTimeout(function () { toast.remove(); }, 300);
      });
    }

    setTimeout(function () {
      if (toast.parentNode) {
        toast.classList.add("zh-toast-hide");
        setTimeout(function () { toast.remove(); }, 300);
      }
    }, 8500);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.classList.add("zh-toast-show");
      });
    });
  }

  // ── Mode Application ─────────────────────────────────────

  function clearZhModeRender() {
    removeAnnotations();
    resetChipTranslations();
    removeExplainAnnotations();
  }

  function updateLegacyToggleButtons(active) {
    document.querySelectorAll(".zh-mode-fab").forEach(function (btn) {
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.classList.toggle("is-active", active);
    });
  }

  function applyZhMode(active, options) {
    var opts = options || {};
    var requestId = ++applyRequestId;

    try {
      localStorage.setItem(LANG_KEY, active ? "zh" : "ms");
    } catch (e) {}

    updateLegacyToggleButtons(active);

    if (active) {
      document.documentElement.setAttribute("data-lang-mode", "zh");

      Promise.all([loadGlossary(), loadComprehensionData()]).then(function () {
        if (requestId !== applyRequestId) return;
        if (!isZhMode()) return;

        clearZhModeRender();

        var merged = getMergedGlossary();
        var comprehension = getComprehensionMap();

        annotateKeywords(merged);
        setupChipTranslations(comprehension);
        applyExplainAnnotations(comprehension);

        if (!opts.silentDisclaimer) {
          showDisclaimer();
        }
      });
    } else {
      document.documentElement.removeAttribute("data-lang-mode");
      clearZhModeRender();
    }
  }

  // ── FAB Button Injection ─────────────────────────────────

  function injectFabButtons() {
    document.querySelectorAll(".nav-wrap").forEach(function (nav) {
      if (nav.querySelector(".zh-mode-fab")) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zh-mode-fab";
      btn.setAttribute("aria-label", "Mod Bahasa Cina (manual)");
      btn.setAttribute("aria-pressed", isZhMode() ? "true" : "false");
      btn.textContent = "华";

      if (isZhMode()) {
        btn.classList.add("is-active");
      }

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

  function shouldUseSparkleForZhControls() {
    return /\/notes\//.test(window.location.pathname) && !window.__HZ_ZH_LEGACY_REQUESTED;
  }

  // ── Init ─────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", function () {
    if (!shouldUseSparkleForZhControls()) {
      initLegacyControls();
    }

    if (isZhMode()) {
      Promise.all([loadGlossary(), loadComprehensionData()]).then(function () {
        clearZhModeRender();

        var merged = getMergedGlossary();
        var comprehension = getComprehensionMap();

        annotateKeywords(merged);
        setupChipTranslations(comprehension);
        applyExplainAnnotations(comprehension);
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
    initLegacyControls: function () {
      window.__HZ_ZH_LEGACY_REQUESTED = true;
      initLegacyControls();
    },
    showDisclaimer: showDisclaimer
  };
})();
