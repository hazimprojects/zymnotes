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

  var OVERLY_GENERAL_TERMS = new Set([
    "bahasa", "politik", "agama", "kampung", "rakyat",
    "masyarakat", "penduduk", "bandar", "kawasan"
  ]);

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

  function buildGlossaryFallback(text, gl) {
    if (!text || shouldSkipChipTranslation(text)) return null;

    var cleanText = normalize(text.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]|\u00a9|\u00ae|[\u2000-\u3300]/g, "").replace(/^[\s📌💡📖🔍⬆️]+/, ""));
    if (!cleanText || cleanText.length < 2) return null;

    // Exact match
    if (gl[cleanText] && typeof gl[cleanText] === "string") {
      var exactZh = gl[cleanText];
      return {
        modeLabel: "词汇注释",
        pairs: [{ bm: cleanText, zh: exactZh }],
        text: exactZh + "（" + cleanText + "）",
        fallbackLabel: ""
      };
    }

    // Partial match — collect BM→中文 pairs, skip overly-general terms, max 8
    var keys = Object.keys(gl)
      .filter(function (k) {
        return typeof gl[k] === "string" && !OVERLY_GENERAL_TERMS.has(normalize(k)) && k.length > 2;
      })
      .sort(function (a, b) { return b.length - a.length; });

    var pairs = [];
    var seen = new Set();
    for (var i = 0; i < keys.length; i++) {
      var nk = normalize(keys[i]);
      if (cleanText.indexOf(nk) !== -1 && !seen.has(nk)) {
        pairs.push({ bm: keys[i], zh: gl[keys[i]] });
        seen.add(nk);
        if (pairs.length >= 8) break;
      }
    }

    if (pairs.length === 0) return null;

    var textStr = pairs.map(function (p) { return p.zh + "（" + p.bm + "）"; }).join(" · ");
    return { modeLabel: "词汇注释", pairs: pairs, text: textStr, fallbackLabel: "" };
  }

  function buildExplainFallback(unit) {
    if (!unit || typeof unit !== "object") return null;
    var focusPhrase = typeof unit.bm_focus_phrase === "string" ? unit.bm_focus_phrase.trim() : "";
    var summaryParts = ["句意解析尚未提供"];
    if (focusPhrase) {
      summaryParts.push("BM重点摘要：" + focusPhrase);
    }
    return {
      modeLabel: "句意解析",
      text: summaryParts.join(" · "),
      fallbackLabel: focusPhrase ? "仅提供BM重点摘要" : ""
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
          modeLabel: "句意解析",
          text: unit.zh_explain.trim(),
          fallbackLabel: ""
        };
      }
      return buildExplainFallback(unit);
    }

    if (mode === ZH_MODE_GLOSSARY) {
      if (unit && typeof unit.glossary_zh === "string" && unit.glossary_zh.trim()) {
        return {
          modeLabel: "词汇注释",
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
      chip.setAttribute("aria-label", "点击翻转查看中文解析");
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

  function makePanelToggleable(panel) {
    var toggle = panel.querySelector(".zh-panel-toggle");
    var body = panel.querySelector(".zh-panel-body");
    if (!toggle || !body) return;
    toggle.addEventListener("click", function () {
      var isOpen = !body.hidden;
      body.hidden = isOpen;
      toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
      panel.classList.toggle("zh-panel-open", !isOpen);
      panel.classList.toggle("zh-panel-collapsed", isOpen);
      var chevron = toggle.querySelector(".zh-panel-chevron");
      if (chevron) chevron.textContent = isOpen ? "▼" : "▲";
    });
  }

  function renderComprehensionPanels(map, gl) {
    function appendGlossaryPanel(sourceEl, sourceText) {
      var glossaryFallback = buildGlossaryFallback(sourceText, gl);
      if (!glossaryFallback) return;

      var glossaryPanel = document.createElement("aside");
      glossaryPanel.className = "zh-comprehension-panel zh-panel-collapsed";
      glossaryPanel.setAttribute("lang", "zh-Hans");
      glossaryPanel.setAttribute("aria-label", "词汇注释面板");
      var glBodyHTML;
      if (glossaryFallback.pairs && glossaryFallback.pairs.length > 0) {
        glBodyHTML = '<p class="zh-comprehension-explain zh-glossary-pairs">' +
          glossaryFallback.pairs.map(function (p) {
            return '<span class="zh-ann-pair"><strong class="zh-ann-bm">' + escapeHtml(p.bm) + '</strong><span class="zh-ann-zh">（' + escapeHtml(p.zh) + '）</span></span>';
          }).join('<span class="zh-ann-sep"> · </span>') + '</p>';
      } else {
        glBodyHTML = '<p class="zh-comprehension-explain">' + escapeHtml(glossaryFallback.text) + "</p>";
      }
      glossaryPanel.innerHTML =
        '<button class="zh-panel-toggle" aria-expanded="false">' +
          '🈶 词汇注释 · 术语速查 <span class="zh-panel-chevron">▼</span>' +
        '</button>' +
        '<div class="zh-panel-body" hidden>' + glBodyHTML + '</div>';
      sourceEl.insertAdjacentElement("afterend", glossaryPanel);
      makePanelToggleable(glossaryPanel);
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
        : (fallback ? fallback.text : "句意解析尚未提供。");

      var bodyHTML =
        '<p class="zh-comprehension-explain">' + escapeHtml(explainText) + "</p>" +
        (unit && unit.zh_explain && unit.zh_explain.trim() && keyPoints.length
          ? ('<ul class="zh-comprehension-points">' + keyPoints.map(function (item) {
              return "<li>" + escapeHtml(item) + "</li>";
            }).join("") + "</ul>")
          : "") +
        (((unit && unit.bm_focus_phrase) || sourceText)
          ? ('<p class="zh-comprehension-focus"><span>BM重点摘要：</span> <strong>' + escapeHtml((unit && unit.bm_focus_phrase) || sourceText) + "</strong></p>")
          : '<p class="zh-comprehension-focus"><span>BM重点摘要：</span> <strong>尚未提供</strong></p>');

      var panel = document.createElement("aside");
      panel.className = "zh-comprehension-panel zh-panel-collapsed";
      panel.setAttribute("lang", "zh-Hans");
      panel.setAttribute("aria-label", "句意解析面板");
      panel.innerHTML =
        '<button class="zh-panel-toggle" aria-expanded="false">' +
          '🧠 句意解析 · 中文辅助理解 <span class="zh-panel-chevron">▼</span>' +
        '</button>' +
        '<div class="zh-panel-body" hidden>' + bodyHTML + '</div>';

      sourceEl.insertAdjacentElement("afterend", panel);
      makePanelToggleable(panel);

      if (!unit || !unit.zh_explain || !unit.zh_explain.trim()) {
        appendGlossaryPanel(sourceEl, (unit && unit.bm_focus_phrase) || sourceText);
      }
    });
  }

  // ── Orphan Text Annotation ───────────────────────────────

  function annotateOrphanText(gl) {
    var EMOJI_STRIP_RE = /[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2600-\u27BF]|[\u{1F000}-\u{1FFFF}]|[📌💡📖🔍⬆️]/gu;

    function attachToggle(el, rawText) {
      if (el.querySelector(".zh-heading-toggle")) return;
      var cleanText = normalize(rawText.replace(EMOJI_STRIP_RE, "").replace(/^[^a-zA-ZÀ-ÿ]+/, ""));
      if (!cleanText || cleanText.length < 3) return;

      var result = buildGlossaryFallback(cleanText, gl);
      if (!result || !result.text) return;

      var toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "zh-heading-toggle";
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", "中文词汇注释");
      toggleBtn.textContent = "中";

      var annSpan = document.createElement("span");
      annSpan.className = "zh-heading-ann";
      annSpan.setAttribute("hidden", "");
      annSpan.setAttribute("aria-hidden", "true");
      annSpan.setAttribute("lang", "zh-Hans");

      if (result.pairs && result.pairs.length > 0) {
        var annHTML = '<span class="zh-ann-label">词汇：</span>';
        annHTML += result.pairs.map(function (p) {
          return '<span class="zh-ann-pair"><strong class="zh-ann-bm">' + escapeHtml(p.bm) + '</strong><span class="zh-ann-zh">（' + escapeHtml(p.zh) + '）</span></span>';
        }).join('<span class="zh-ann-sep"> · </span>');
        annSpan.innerHTML = annHTML;
      } else {
        annSpan.textContent = result.text;
      }

      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = !annSpan.hasAttribute("hidden");
        if (isOpen) {
          annSpan.setAttribute("hidden", "");
          toggleBtn.setAttribute("aria-expanded", "false");
        } else {
          annSpan.removeAttribute("hidden");
          toggleBtn.setAttribute("aria-expanded", "true");
        }
      });

      el.classList.add("zh-heading-has-ann");
      el.appendChild(toggleBtn);
      el.appendChild(annSpan);
    }

    // Block-level text elements
    var blockSel = [
      ".point-heading:not([data-zh-unit-id])",
      ".point-line:not([data-zh-unit-id])",
      ".lead:not([data-zh-unit-id])",
      ".paper-process-panel",
      ".paper-timeline-panel > p",
      ".conclusion-paper h2",
      ".summary-paper h2"
    ].join(", ");

    document.querySelectorAll(blockSel).forEach(function (el) {
      attachToggle(el, (el.textContent || "").trim());
    });

    // emoji-point-list: text lives in the last <span> of each <li>
    document.querySelectorAll(".emoji-point-list li").forEach(function (li) {
      if (li.querySelector(".zh-heading-toggle")) return;
      var spans = li.querySelectorAll("span");
      if (spans.length < 2) return;
      var textSpan = spans[spans.length - 1];
      if (!textSpan || textSpan.classList.contains("emoji-bullet")) return;
      attachToggle(li, (textSpan.textContent || "").trim());
    });
  }

  function removeOrphanAnnotations() {
    document.querySelectorAll(".zh-heading-toggle").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".zh-heading-ann").forEach(function (el) { el.remove(); });
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
      '<span class=”zh-disclaimer-icon”>中</span>' +
      '<div class=”zh-disclaimer-content”>' +
        '<span class=”zh-disclaimer-text”>中文模式已开启 · 词汇注释 + 句意解析</span>' +
        '<button class=”zh-help-toggle zh-disclaimer-help-toggle” type=”button” aria-expanded=”false”>❓ 说明</button>' +
        '<span class=”zh-disclaimer-help” hidden>中文辅助模式已启动。点击纸片（chip）可翻转查看词汇注释。点击句意解析面板标题可展开或收起中文解析。点击句子旁的「中」按钮可查看词汇提示。BM用词仍须熟记，因为考试须以马来文作答。</span>' +
      "</div>" +
      '<button class=”zh-disclaimer-close” type=”button” aria-label=”关闭”>✕</button>';

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
        annotateOrphanText(merged);
        if (!opts.silentDisclaimer) {
          showDisclaimer();
        }
      });
    } else {
      document.documentElement.removeAttribute("data-lang-mode");
      removeAnnotations();
      resetChipFlips();
      removeComprehensionPanels();
      removeOrphanAnnotations();
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
        annotateOrphanText(merged);
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
