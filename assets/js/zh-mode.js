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
  var comprehensionMap = null;
  var annotated = false;
  var legacyControlsInitialized = false;
  var applyRequestId = 0;
  var ZH_MODE_GLOSSARY = "glossary";
  var ZH_MODE_EXPLAIN = "explain";

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
    var trimmed = fileName.replace(/^\.?\//, "");
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
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getElementZhMode(el, fallbackMode) {
    if (!el || !el.getAttribute) return fallbackMode || ZH_MODE_EXPLAIN;
    var mode = (el.getAttribute("data-zh-mode") || "").trim().toLowerCase();
    if (mode === ZH_MODE_GLOSSARY || mode === ZH_MODE_EXPLAIN) return mode;
    return fallbackMode || ZH_MODE_EXPLAIN;
  }

  function hasZhUnitId(el) {
    if (!el || !el.getAttribute) return false;
    var sourceId = (el.getAttribute("data-zh-unit-id") || "").trim();
    return !!sourceId;
  }

  function getZhExplainTargets() {
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
    return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (el) {
      if (!hasZhUnitId(el)) return false;
      if (seen.has(el)) return false;
      seen.add(el);
      if (el.classList && el.classList.contains("paper-chip")) return false;
      return true;
    });
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

  function loadComprehensionData() {
    if (comprehensionMap !== null) return Promise.resolve(comprehensionMap);

    function mergeUnits(mapped, payload) {
      var units = Array.isArray(payload) ? payload : (Array.isArray(payload && payload.units) ? payload.units : []);
      units.forEach(function (unit) {
        if (!unit || typeof unit !== "object") return;
        if (!unit.source_id || typeof unit.source_id !== "string") return;
        mapped[unit.source_id] = unit;
      });
    }

    function loadLegacyComprehension(mapped) {
      return fetch(resolveComprehensionPath())
        .then(function (res) { return res.ok ? res.json() : {}; })
        .then(function (data) {
          mergeUnits(mapped, data);
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

        return Promise.all(requests)
          .then(function (payloads) {
            payloads.forEach(function (payload) {
              if (!payload) return;
              mergeUnits(mapped, payload);
            });
            return loadLegacyComprehension(mapped);
          });
      })
      .catch(function () {
        return loadLegacyComprehension({});
      })
      .then(function (mapped) {
        comprehensionMap = mapped;
        return comprehensionMap;
      });
  }

  // ── Keyword Annotation ───────────────────────────────────

  function lookupTerm(text, gl) {
    var key = normalize(text);
    if (gl[key] && typeof gl[key] === 'string') return gl[key];
    // Partial match: find glossary key contained within the text
    var keys = Object.keys(gl).filter(function (k) { return typeof gl[k] === 'string'; }).sort(function (a, b) { return b.length - a.length; });
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
      ann.setAttribute("lang", "zh-Hans");
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

  function shouldSkipChipTranslation(text) {
    if (!text) return true;
    var trimmed = text.trim();
    if (!trimmed) return true;

    // Jangan terjemah chip yang sensitif (data korban/kematian)
    if (/terkorban|terbunuh|tercedera|hilang|jumlah/i.test(trimmed)) return true;

    // Jangan terjemah nama individu (gelaran lazim)
    if (/(^|\s)(Dato['’]?|Datuk|Tun|Tunku|Tan Sri|Dr\.?|Haji|Sheikh|Syed|Sayyid)\s+/i.test(trimmed)) return true;

    // Heuristik nama: sekurang-kurangnya dua perkataan berhuruf besar
    var plain = trimmed.replace(/^[^A-Za-zÀ-ÿ]+/, "");
    if (/^[A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+){1,4}$/.test(plain)) return true;

    return false;
  }

  function translateTextByGlossary(text, gl) {
    if (shouldSkipChipTranslation(text)) return text;

    var translated = text;
    var keys = Object.keys(gl).filter(function (k) { return typeof gl[k] === 'string'; }).sort(function (a, b) { return b.length - a.length; });

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

  function buildGlossaryFallback(text, gl) {
    var translated = translateTextByGlossary(text, gl);
    if (!translated || translated === text) return null;
    return {
      modeLabel: "Terjemahan istilah",
      text: translated,
      fallbackLabel: ""
    };
  }

  function buildExplainFallback(unit) {
    if (!unit || typeof unit !== "object") return null;
    var focusPhrase = typeof unit.bm_focus_phrase === "string" ? unit.bm_focus_phrase.trim() : "";
    var summaryParts = ["Penjelasan ayat belum tersedia"];
    if (focusPhrase) {
      summaryParts.push("Ringkasan fokus (BM): " + focusPhrase);
    }
    return {
      modeLabel: "Penjelasan maksud ayat",
      text: summaryParts.join(" · "),
      fallbackLabel: focusPhrase ? "Ringkasan fokus sahaja" : ""
    };
  }

  function buildChipBackContent(chip, sourceText, gl, comprehension) {
    var hasSentenceClass = chip.classList.contains("paper-chip-sentence");
    var defaultMode = hasSentenceClass ? ZH_MODE_EXPLAIN : ZH_MODE_GLOSSARY;
    var mode = getElementZhMode(chip, defaultMode);
    var sourceId = chip.getAttribute("data-zh-unit-id");
    var unit = sourceId ? comprehension[sourceId] : null;

    if (mode === ZH_MODE_EXPLAIN) {
      if (unit && typeof unit.zh_explain === "string" && unit.zh_explain.trim()) {
        return {
          modeLabel: "Penjelasan maksud ayat",
          text: unit.zh_explain.trim(),
          fallbackLabel: ""
        };
      }
      return buildExplainFallback(unit);
    }

    if (mode === ZH_MODE_GLOSSARY) {
      if (unit && typeof unit.glossary_zh === "string" && unit.glossary_zh.trim()) {
        return {
          modeLabel: "Terjemahan istilah",
          text: unit.glossary_zh.trim(),
          fallbackLabel: ""
        };
      }
      return buildGlossaryFallback(sourceText, gl);
    }

    return null;
  }

  function setupChipFlips(gl, comprehension) {
    var chips = document.querySelectorAll(".paper-chip");
    chips.forEach(function (chip) {
      var hasLegacyFlipMarkup =
        chip.classList.contains("zh-chip-flip-ready") ||
        !!chip.querySelector(".zh-chip-inner") ||
        !!chip.getAttribute("data-zh-bm") ||
        !!chip.getAttribute("data-zh-cn");

      if (hasLegacyFlipMarkup) {
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
      }

      if (!chip.__zhOriginalHTML) {
        chip.__zhOriginalHTML = chip.innerHTML;
      }

      var sourceNode = chip.cloneNode(true);
      sourceNode.querySelectorAll(".kw-zh-ann").forEach(function (ann) { ann.remove(); });
      var sourceText = sourceNode.textContent ? sourceNode.textContent.trim() : "";
      if (!sourceText || sourceText.length < 3 || sourceText.length > 320) return;

      var backContent = buildChipBackContent(chip, sourceText, gl, comprehension);
      if (!backContent || !backContent.text) return;

      chip.classList.add("zh-chip-flip-ready");
      chip.setAttribute("tabindex", "0");
      chip.setAttribute("role", "button");
      chip.setAttribute("aria-label", "Klik untuk flip dan lihat terjemahan Cina");
      chip.setAttribute("data-zh-bm", sourceText);
      chip.setAttribute("data-zh-cn", backContent.text);
      chip.setAttribute("data-zh-mode-label", backContent.modeLabel);
      chip.setAttribute("data-zh-fallback-label", backContent.fallbackLabel);

      chip.innerHTML =
        '<span class="zh-chip-inner">' +
          '<span class="zh-chip-front">' + escapeHtml(sourceText) + "</span>" +
          '<span class="zh-chip-back">' +
            '<strong>' + escapeHtml(backContent.modeLabel) + ":</strong> " +
            escapeHtml(backContent.text) +
            (backContent.fallbackLabel ? (' <em>(' + escapeHtml(backContent.fallbackLabel) + ")</em>") : "") +
          "</span>" +
        "</span>";

      function toggleFlip() {
        if (!isZhMode()) return;
        var inner = chip.querySelector(".zh-chip-inner");
        if (inner) {
          inner.classList.add("zh-chip-fading");
          setTimeout(function () {
            if (!chip.isConnected) return;
            chip.classList.toggle("zh-chip-flipped");
            inner.classList.remove("zh-chip-fading");
          }, 140);
        } else {
          chip.classList.toggle("zh-chip-flipped");
        }
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
    document.querySelectorAll(".paper-chip").forEach(function (chip) {
      var shouldReset =
        !!chip.__zhOriginalHTML ||
        chip.classList.contains("zh-chip-flip-ready") ||
        !!chip.querySelector(".zh-chip-inner") ||
        !!chip.getAttribute("data-zh-bm") ||
        !!chip.getAttribute("data-zh-cn");

      if (!shouldReset) return;

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
      chip.removeAttribute("data-zh-mode-label");
      chip.removeAttribute("data-zh-fallback-label");
    });
  }

  // ── Faham Ayat Panel ────────────────────────────────────

  function removeComprehensionPanels() {
    document.querySelectorAll(".zh-comprehension-panel").forEach(function (panel) { panel.remove(); });
  }

  function renderComprehensionPanels(map, gl) {
    function appendGlossaryPanel(sourceEl, sourceText) {
      var glossaryFallback = buildGlossaryFallback(sourceText, gl);
      if (!glossaryFallback) return;

      var glossaryPanel = document.createElement("aside");
      glossaryPanel.className = "zh-comprehension-panel";
      glossaryPanel.setAttribute("lang", "zh-Hans");
      glossaryPanel.setAttribute("aria-label", "Panel terjemahan istilah");
      glossaryPanel.innerHTML =
        '<p class="zh-comprehension-title">🈶 Terjemahan istilah · 术语速查</p>' +
        '<p class="zh-comprehension-explain">' + escapeHtml(glossaryFallback.text) + "</p>";
      sourceEl.insertAdjacentElement("afterend", glossaryPanel);
    }

    removeComprehensionPanels();
    if (!isZhMode()) return;

    getZhExplainTargets().forEach(function (sourceEl) {
      var mode = getElementZhMode(sourceEl, ZH_MODE_EXPLAIN);
      var sourceId = sourceEl.getAttribute("data-zh-unit-id");
      if (!sourceId) return;
      var unit = map[sourceId];

      if (mode === ZH_MODE_GLOSSARY) {
        var glossarySourceText = (sourceEl.textContent || "").trim();
        appendGlossaryPanel(sourceEl, (unit && unit.bm_focus_phrase) || glossarySourceText);
        return;
      }

      var keyPoints = Array.isArray(unit && unit.key_points_zh) ? unit.key_points_zh.filter(function (item) {
        return typeof item === "string" && item.trim();
      }) : [];
      var sourceText = (sourceEl.textContent || "").trim();
      var fallback = buildExplainFallback({
        bm_focus_phrase: (unit && unit.bm_focus_phrase) || sourceText
      });
      var explainText = unit && unit.zh_explain && unit.zh_explain.trim()
        ? unit.zh_explain.trim()
        : (fallback ? fallback.text : "Penjelasan ayat belum tersedia.");

      var panel = document.createElement("aside");
      panel.className = "zh-comprehension-panel";
      panel.setAttribute("lang", "zh-Hans");
      panel.setAttribute("aria-label", "Panel sokongan faham ayat");
      panel.innerHTML =
        '<p class="zh-comprehension-title">🧠 Penjelasan maksud ayat · 中文辅助理解</p>' +
        ('<p class="zh-comprehension-explain">' + escapeHtml(explainText) + "</p>") +
        (unit && unit.zh_explain && unit.zh_explain.trim() && keyPoints.length
          ? ('<ul class="zh-comprehension-points">' + keyPoints.map(function (item) {
              return "<li>" + escapeHtml(item) + "</li>";
            }).join("") + "</ul>")
          : "") +
        (((unit && unit.bm_focus_phrase) || sourceText)
          ? ('<p class="zh-comprehension-focus"><span>Ringkasan fokus (BM):</span> <strong>' + escapeHtml((unit && unit.bm_focus_phrase) || sourceText) + "</strong></p>")
          : '<p class="zh-comprehension-focus"><span>Ringkasan fokus (BM):</span> <strong>Belum tersedia.</strong></p>');

      sourceEl.insertAdjacentElement("afterend", panel);

      if (!unit || !unit.zh_explain || !unit.zh_explain.trim()) {
        appendGlossaryPanel(sourceEl, (unit && unit.bm_focus_phrase) || sourceText);
      }
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
        '<span class="zh-disclaimer-text">中文 ON · Terjemahan istilah + penjelasan ayat</span>' +
        '<button class="zh-help-toggle zh-disclaimer-help-toggle" type="button" aria-expanded="false">❓ Help</button>' +
        '<span class="zh-disclaimer-help" hidden>Mod Bahasa Cina aktif. “Terjemahan istilah” ialah bantuan cepat pada kata kunci/chip. “Penjelasan maksud ayat” pula menerangkan maksud keseluruhan ayat penting. Jika data ayat tiada, sistem papar notis “Penjelasan ayat belum tersedia” bersama ringkasan fokus BM.</span>' +
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
      Promise.all([loadGlossary(), loadComprehensionData()]).then(function () {
        if (requestId !== applyRequestId) return;
        if (!isZhMode()) return;
        var merged = getMergedGlossary();
        var comprehension = getComprehensionMap();
        annotateKeywords(merged);
        setupChipFlips(merged, comprehension);
        renderComprehensionPanels(comprehension, merged);
        if (!opts.silentDisclaimer) {
          showDisclaimer();
        }
      });
    } else {
      document.documentElement.removeAttribute("data-lang-mode");
      removeAnnotations();
      resetChipFlips();
      removeComprehensionPanels();
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
        var merged = getMergedGlossary();
        var comprehension = getComprehensionMap();
        annotateKeywords(merged);
        setupChipFlips(merged, comprehension);
        renderComprehensionPanels(comprehension, merged);
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
