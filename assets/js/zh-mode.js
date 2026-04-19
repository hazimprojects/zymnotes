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
  var CHIP_DISPLAY_INLINE = "inline";
  var CHIP_DISPLAY_STACKED = "stacked";
  var CHIP_TOUCH_CLICK_DELAY_MS = 360;
  var chipInteractionsBound = false;
  var sentenceTranslationCache = Object.create(null);
  var sentenceTranslationInFlight = Object.create(null);
  var ENTITY_WARNING_LABEL = "⚠︎ Entiti dikekalkan (BM asal).";
  var HARD_PROTECTED_ENTITIES = [
    "Raja-raja Melayu", "Majlis Raja-raja",
    "Sultan Johor", "Sultan Selangor", "Sultan Kedah", "Raja Perlis", "Sultan Perak",
    "Sultan Pahang", "Sultan Kelantan", "Sultan Terengganu",
    "Tuanku Permaisuri Perak", "Raja Perempuan Kelsom",
    "Sir Harold MacMichael", "H.C. Willan", "Frank Swettenham", "Roland Braddell",
    "Cecil Clementi Smith", "Richard Winstedt", "Frederick Weld", "George Maxwell",
    "Dato’ Onn Jaafar", "Dato' Onn Jaafar", "Dato’ Nik Ahmad Kamil", "Za’ba", "Za'ba",
    "Tunku Abdul Rahman", "Dato’ Panglima Bukit Gantang", "Dato' Panglima Bukit Gantang",
    "Utusan Melayu", "Majlis", "Warta Negara",
    "Persekutuan Tanah Melayu", "Malayan Union", "Tanah Melayu"
  ];

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

  function escapeRegExp(str) {
    return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function uniqueByLengthDesc(items) {
    return Array.from(new Set(items.filter(Boolean))).sort(function (a, b) {
      return b.length - a.length;
    });
  }

  function extractProtectedEntities(text, glossaryMeta) {
    var sourceText = typeof text === "string" ? text : "";
    if (!sourceText.trim()) {
      return { protectedText: "", placeholderMap: {}, placeholders: [] };
    }

    var PERSON_TITLES = [
      "Tun", "Tunku", "Tuanku", "Datuk", "Dato", "Dato'", "Dato’", "Tan Sri",
      "Puan Sri", "Datin", "Datuk Seri", "Dato' Seri", "Yang di-Pertuan",
      "Dr", "Dr.", "Prof", "Profesor", "Haji", "Hajah", "Syed", "Sayyid"
    ];
    var ORG_TERMS = [
      "Kementerian", "Persekutuan", "Majlis", "Jabatan", "Universiti", "Sekolah",
      "Bank", "Suruhanjaya", "Pertubuhan", "Lembaga", "Dewan", "Mahkamah",
      "Parlimen", "Kerajaan", "Angkatan", "Institut", "Pejabat"
    ];
    var PLACE_OR_HISTORICAL_TERMS = [
      "Tanah Melayu", "Alam Melayu", "Kesultanan Melayu Melaka", "Selat Melaka",
      "Bumi Putera", "Yang di-Pertuan Agong", "Raja-raja Melayu"
    ];
    var OFFICIAL_TERMS_TO_PRESERVE = [
      "Persekutuan Tanah Melayu", "Negeri-negeri Selat", "Negeri-negeri Melayu Bersekutu",
      "Negeri-negeri Melayu Tidak Bersekutu", "Suruhanjaya Reid", "Malayan Union",
      "Majlis Raja-raja", "Yang di-Pertuan Agong", "Rukun Negara", "Piagam Madinah"
    ];
    var COMMON_SENTENCE_STARTERS = new Set([
      "Pada", "Di", "Dalam", "Bagi", "Untuk", "Semasa", "Apabila", "Namun",
      "Kemudian", "Seterusnya", "Selain", "Walau", "Jika", "Maka", "Sejak"
    ]);

    var segments = [];
    function pushMatch(matchText, index) {
      if (!matchText || typeof index !== "number" || index < 0) return;
      var cleaned = matchText.trim();
      if (!cleaned) return;
      segments.push({ start: index, end: index + matchText.length, text: cleaned });
    }

    function collectByRegex(re) {
      var m;
      re.lastIndex = 0;
      while ((m = re.exec(sourceText)) !== null) {
        pushMatch(m[0], m.index);
      }
    }

    var personTitlePattern = new RegExp(
      "\\b(?:" + PERSON_TITLES.map(escapeRegExp).join("|") + ")\\s+" +
      "[A-Z][\\w'’.-]+(?:\\s+(?:bin|binti)\\s+[A-Z][\\w'’.-]+)?(?:\\s+[A-Z][\\w'’.-]+){0,4}\\b",
      "g"
    );
    collectByRegex(personTitlePattern);
    collectByRegex(/\b[A-Z][\w'’.-]+(?:\s+[A-Z][\w'’.-]+)?\s+(?:bin|binti)\s+[A-Z][\w'’.-]+(?:\s+[A-Z][\w'’.-]+){0,3}\b/g);

    var orgPattern = new RegExp(
      "\\b(?:" + ORG_TERMS.map(escapeRegExp).join("|") + ")\\s+" +
      "(?:[A-Z][\\w'’.-]*|di|dan|Malaysia|Negara|Negeri|Kebangsaan|Islam|Melayu|Pertama|Kedua|Ketiga|Keempat)(?:\\s+(?:[A-Z][\\w'’.-]*|di|dan|Malaysia|Negara|Negeri|Kebangsaan|Islam|Melayu|Pertama|Kedua|Ketiga|Keempat)){0,8}",
      "g"
    );
    collectByRegex(orgPattern);

    uniqueByLengthDesc(PLACE_OR_HISTORICAL_TERMS).forEach(function (term) {
      var re = new RegExp("\\b" + escapeRegExp(term) + "\\b", "gi");
      var m;
      while ((m = re.exec(sourceText)) !== null) {
        pushMatch(m[0], m.index);
      }
    });

    var glossaryKeys = glossaryMeta && typeof glossaryMeta === "object" ? Object.keys(glossaryMeta) : [];
    var glossaryPhrases = glossaryKeys.filter(function (key) {
      if (!key || key.length < 5) return false;
      return /\b(kementerian|persekutuan|majlis|kesultanan|negeri|tanah|raja|agong)\b/i.test(key);
    });
    uniqueByLengthDesc(glossaryPhrases).forEach(function (phrase) {
      var re = new RegExp("\\b" + escapeRegExp(phrase) + "\\b", "gi");
      var m;
      while ((m = re.exec(sourceText)) !== null) {
        pushMatch(m[0], m.index);
      }
    });

    uniqueByLengthDesc(OFFICIAL_TERMS_TO_PRESERVE).forEach(function (term) {
      var re = new RegExp("\\b" + escapeRegExp(term) + "\\b", "gi");
      var m;
      while ((m = re.exec(sourceText)) !== null) {
        pushMatch(m[0], m.index);
      }
    });

    uniqueByLengthDesc(HARD_PROTECTED_ENTITIES).forEach(function (term) {
      var re = new RegExp("\\b" + escapeRegExp(term) + "\\b", "gi");
      var m;
      while ((m = re.exec(sourceText)) !== null) {
        pushMatch(m[0], m.index);
      }
    });

    // Preserve uppercase acronym blocks (e.g. UMNO, PKMM, MBSA).
    collectByRegex(/\b[A-Z]{2,}(?:-[A-Z]{2,})?\b/g);

    // Preserve quoted official names/titles to avoid awkward literal translations.
    collectByRegex(/["“”'‘’](.{2,80}?)["“”'‘’]/g);

    // Preserve multi-word proper names even when no honorific is present.
    var properNamePattern = /\b([A-Z][\w'’.-]{2,})(?:\s+(?:al-|Al-)?[A-Z][\w'’.-]{2,}){1,4}\b/g;
    var pm;
    while ((pm = properNamePattern.exec(sourceText)) !== null) {
      var phrase = pm[0] || "";
      var firstToken = phrase.split(/\s+/)[0] || "";
      if (COMMON_SENTENCE_STARTERS.has(firstToken)) continue;
      if (/\b(?:Malaysia|Melayu|Islam|Negara|Negeri|Kerajaan)\b/.test(phrase) && phrase.split(/\s+/).length < 3) {
        continue;
      }
      pushMatch(phrase, pm.index);
    }

    segments.sort(function (a, b) {
      if (a.start !== b.start) return a.start - b.start;
      return b.end - a.end;
    });

    var merged = [];
    segments.forEach(function (seg) {
      var prev = merged[merged.length - 1];
      if (!prev || seg.start >= prev.end) {
        merged.push(seg);
      }
    });

    if (merged.length === 0) {
      return { protectedText: sourceText, placeholderMap: {}, placeholders: [] };
    }

    var protectedText = "";
    var cursor = 0;
    var placeholderMap = {};
    var placeholders = [];
    merged.forEach(function (seg, idx) {
      var placeholder = "__HZ_ENT_" + String(idx + 1).padStart(3, "0") + "__";
      placeholders.push(placeholder);
      placeholderMap[placeholder] = sourceText.slice(seg.start, seg.end);
      protectedText += sourceText.slice(cursor, seg.start) + placeholder;
      cursor = seg.end;
    });
    protectedText += sourceText.slice(cursor);

    return { protectedText: protectedText, placeholderMap: placeholderMap, placeholders: placeholders };
  }

  function restoreProtectedEntities(translatedText, entitiesPayload) {
    var translated = typeof translatedText === "string" ? translatedText : "";
    var payload = entitiesPayload || {};
    var placeholders = Array.isArray(payload.placeholders) ? payload.placeholders : [];
    var placeholderMap = payload.placeholderMap || {};

    if (placeholders.length === 0) {
      return { text: translated, stable: true };
    }

    for (var i = 0; i < placeholders.length; i++) {
      if (translated.indexOf(placeholders[i]) === -1) {
        return { text: "", stable: false };
      }
    }

    var restored = translated;
    placeholders.forEach(function (placeholder) {
      var original = placeholderMap[placeholder];
      if (typeof original !== "string") return;
      var placeholderRe = new RegExp(escapeRegExp(placeholder), "g");
      restored = restored.replace(placeholderRe, original);
    });

    return { text: restored, stable: true };
  }

  function getElementZhMode(el, fallbackMode) {
    if (!el || !el.getAttribute) return fallbackMode || ZH_MODE_EXPLAIN;
    var mode = (el.getAttribute("data-zh-mode") || "").trim().toLowerCase();
    if (mode === ZH_MODE_GLOSSARY || mode === ZH_MODE_EXPLAIN) return mode;
    return fallbackMode || ZH_MODE_EXPLAIN;
  }

  function getChipDisplayMode(chip, fallbackMode) {
    if (!chip || !chip.getAttribute) return fallbackMode || CHIP_DISPLAY_STACKED;
    var value = (
      chip.getAttribute("data-chip-display-mode") ||
      chip.getAttribute("data-zh-display-mode") ||
      ""
    ).trim().toLowerCase();
    if (value === CHIP_DISPLAY_INLINE || value === CHIP_DISPLAY_STACKED) return value;
    return fallbackMode || CHIP_DISPLAY_STACKED;
  }

  function shouldDebugChipFlip() {
    if (window.__HZ_CHIP_DEBUG__ === true) return true;
    return localStorage.getItem("hzedu-chip-debug") === "1";
  }

  function reportChipFlipIssue(chip, reason, meta) {
    if (!window.__HZ_CHIP_FLIP_LOGS__) window.__HZ_CHIP_FLIP_LOGS__ = [];
    var payload = {
      ts: Date.now(),
      reason: reason,
      chipText: chip && chip.textContent ? chip.textContent.trim().slice(0, 220) : "",
      chipId: chip && chip.getAttribute ? (chip.getAttribute("data-zh-unit-id") || "") : "",
      mode: chip && chip.getAttribute ? (chip.getAttribute("data-zh-mode") || "") : "",
      meta: meta || {}
    };
    window.__HZ_CHIP_FLIP_LOGS__.push(payload);
    if (shouldDebugChipFlip()) {
      console.warn("[HzEdu] chip flip issue:", payload);
    }
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

    function mergeUnits(mapped, payload, options) {
      var opts = options || {};
      var overwrite = opts.overwrite !== false;
      var units = Array.isArray(payload) ? payload : (Array.isArray(payload && payload.units) ? payload.units : []);
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

        return Promise.all(requests)
          .then(function (payloads) {
            payloads.forEach(function (payload) {
              if (!payload) return;
              mergeUnits(mapped, payload, { overwrite: true });
            });
            if (Object.keys(mapped).length > 0) {
              return mapped;
            }
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


  function parseGoogleTranslateSentence(payload) {
    if (!Array.isArray(payload) || !Array.isArray(payload[0])) return "";
    return payload[0]
      .map(function (part) {
        return Array.isArray(part) && typeof part[0] === "string" ? part[0] : "";
      })
      .join("")
      .trim();
  }

  function fetchSentenceTranslation(text) {
    var sourceText = typeof text === "string" ? text.trim() : "";
    if (!sourceText) return Promise.resolve("");
    if (sentenceTranslationCache[sourceText] !== undefined) {
      return Promise.resolve(sentenceTranslationCache[sourceText]);
    }
    var normalizedSource = normalize(sourceText);
    if (sentenceTranslationCache[normalizedSource] !== undefined) {
      return Promise.resolve(sentenceTranslationCache[normalizedSource]);
    }
    if (sentenceTranslationInFlight[sourceText]) {
      return sentenceTranslationInFlight[sourceText];
    }
    var endpoint = "https://translate.googleapis.com/translate_a/single" +
      "?client=gtx" +
      "&sl=ms" +
      "&tl=zh-CN" +
      "&dt=t" +
      "&q=" + encodeURIComponent(sourceText);

    sentenceTranslationInFlight[sourceText] = fetch(endpoint)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (payload) {
        var translated = parseGoogleTranslateSentence(payload);
        return translated || "";
      })
      .then(function (translated) {
        var finalText = translated && translated.trim() ? translated.trim() : "";
        sentenceTranslationCache[sourceText] = finalText;
        sentenceTranslationCache[normalizedSource] = finalText;
        delete sentenceTranslationInFlight[sourceText];
        return finalText;
      }, function () {
        delete sentenceTranslationInFlight[sourceText];
        sentenceTranslationCache[sourceText] = "";
        sentenceTranslationCache[normalizedSource] = "";
        return "";
      });

    return sentenceTranslationInFlight[sourceText];
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
        text: exactZh,
        fallbackLabel: ""
      };
    }

    // Partial match — collect BM→中文 pairs, skip overly-general terms, max 4
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
        if (pairs.length >= 4) break;
      }
    }

    if (pairs.length === 0) return null;

    // Chinese only — no BM repetition
    var textStr = pairs.map(function (p) { return p.zh; }).join(" · ");
    return { modeLabel: "词汇注释", pairs: pairs, text: textStr, fallbackLabel: "" };
  }

  function buildExplainFallback(sourceText, gl) {
    var textForTranslate = stripCorruptedZhLeadPrefix(typeof sourceText === "string" ? sourceText : "");
    if (!textForTranslate) return null;
    var cached = sentenceTranslationCache[textForTranslate] || sentenceTranslationCache[normalize(textForTranslate)];
    var entitiesPayload = extractProtectedEntities(textForTranslate, gl);
    return {
      modeLabel: "Google Translate",
      text: cached || "…",
      fallbackLabel: "",
      autoTranslate: true,
      autoTranslateSource: entitiesPayload.protectedText || textForTranslate,
      autoTranslateEntities: entitiesPayload,
      autoTranslateOriginal: textForTranslate
    };
  }

  function stripChipDecorations(text) {
    return String(text || "")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
      .replace(/[“”"「」]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function stripCorruptedZhLeadPrefix(text) {
    if (typeof text !== "string") return "";
    return text
      .replace(/^\s*['"“”‘’`「」\[\]（）()]*\s*重点\s*[：:]\s*/u, "")
      .replace(/^\s+/, "")
      .trim();
  }

  function normalizeZhExplain(text, gl) {
    if (typeof text !== "string") return "";
    var raw = stripCorruptedZhLeadPrefix(text);
    if (!raw) return "";

    // Pattern: "X。这是Y的中文要义。"
    var meaningMatch = raw.match(/^(.+?)。这是.+?的中文要义。?$/);
    if (meaningMatch && meaningMatch[1]) {
      return stripChipDecorations(meaningMatch[1]) + "。";
    }

    // Pattern: "本点涉及「Y」，是本节的重要知识点，考试时需掌握其背景与意义。"
    var pointMatch = raw.match(/^本点涉及「(.+?)」，是本节的重要知识点，考试时需掌握其背景与意义。?$/);
    if (pointMatch && pointMatch[1]) {
      var pointSource = stripChipDecorations(pointMatch[1]);
      var pointBm = pointSource.toLowerCase();
      if (gl && gl[pointBm] && typeof gl[pointBm] === "string") {
        return gl[pointBm].trim().replace(/。?$/, "。");
      }
      var glossaryFallback = buildGlossaryFallback(pointSource, gl);
      if (glossaryFallback && typeof glossaryFallback.text === "string" && glossaryFallback.text.trim()) {
        return glossaryFallback.text.trim().replace(/。?$/, "。");
      }
      return raw;
    }

    // Pattern: "「Y」—— 此项核心概念为Z，是本章考试重点，需结合史实加以说明。"
    var coreMatch = raw.match(/^「.+?」——\s*此项核心概念为(.+?)，是本章考试重点，需结合史实加以说明。?$/);
    if (coreMatch && coreMatch[1]) {
      return stripChipDecorations(coreMatch[1]).replace(/。?$/, "。");
    }

    // If still verbose phrase slipped through, keep only first sentence to stay concise.
    if (/本章考试重点|本节的重要知识点|中文要义/.test(raw)) {
      var firstSentence = raw.split(/[。!?]/)[0];
      return stripChipDecorations(firstSentence).replace(/。?$/, "。");
    }

    return raw;
  }

  function isTemplateLikeZhExplain(text) {
    if (typeof text !== "string") return true;
    var raw = text.trim();
    if (!raw) return true;
    if (/重点词|要点说明|术语说明|条目说明|此句是本节重要结论|本句说明本节核心内容/.test(raw)) {
      return true;
    }
    if (/^[a-z][a-z\s'-]*（[^）]+）(?:；[a-z][a-z\s'-]*（[^）]+）)*。?$/i.test(raw)) {
      return true;
    }
    return false;
  }

  function looksMalayHeavy(text) {
    if (typeof text !== "string") return false;
    var lower = text.toLowerCase();
    var malayMarkers = [
      " ialah ", " yang ", " dan ", " dengan ", " kepada ", " oleh ",
      " untuk ", " dalam ", " kerana ", " selepas ", " terhadap ", " rakyat ",
      " kerajaan ", " pentadbiran ", " penentangan "
    ];
    var hits = 0;
    for (var i = 0; i < malayMarkers.length; i++) {
      if (lower.indexOf(malayMarkers[i]) !== -1) hits += 1;
    }
    return hits >= 3;
  }

  function hasCodeMixedGrammarArtifacts(text) {
    if (typeof text !== "string") return false;
    var raw = text.trim();
    if (!raw) return false;
    if (!/[\u4e00-\u9fff]/.test(raw)) return false;

    // Corak campuran BM + partikel CN yang lazim muncul dari terjemahan rosak.
    if (/\b(?:yang|dan|di|ke|daripada|kepada|oleh|untuk|dengan|kerana|namun|selepas|masalah|penduduk|penyerahan)\b[\s,.;:]+(?:的|在|由|向|给|因|作为)\b/i.test(raw)) {
      return true;
    }
    if (/(?:的|在|由|向|给|因|作为)[\s,.;:]+(?:yang|dan|di|ke|daripada|kepada|oleh|untuk|dengan|kerana|namun|selepas|masalah|penduduk|penyerahan)\b/i.test(raw)) {
      return true;
    }
    if (/给\/向|在…之后/.test(raw)) return true;

    return false;
  }

  function hasTooMuchMalayInMixedSentence(text) {
    if (typeof text !== "string") return false;
    var raw = text.trim();
    if (!raw) return false;
    if (!/[\u4e00-\u9fff]/.test(raw)) return false;

    var zhCount = (raw.match(/[\u4e00-\u9fff]/g) || []).length;
    var latinTokens = raw.match(/[A-Za-z][A-Za-z'’.-]*/g) || [];
    if (latinTokens.length < 8) return false;

    // Jika token latin jauh lebih banyak berbanding aksara Cina, ia hampir pasti code-mixed.
    return latinTokens.length > Math.max(zhCount * 0.7, 10);
  }

  function isUsableCuratedZhText(text, gl, bmSource) {
    if (typeof text !== "string") return false;
    var raw = text.trim();
    if (!raw) return false;
    if (isTemplateLikeZhExplain(raw)) return false;

    var zhCount = (raw.match(/[\u4e00-\u9fff]/g) || []).length;
    if (zhCount < 4) return false;
    if (looksMalayHeavy(raw)) return false;
    if (hasCodeMixedGrammarArtifacts(raw)) return false;
    if (hasTooMuchMalayInMixedSentence(raw)) return false;

    // Ensure protected entities (if any) are retained for historical names/acronyms.
    if (typeof bmSource === "string" && bmSource.trim()) {
      var entities = extractProtectedEntities(bmSource, gl);
      var placeholders = Array.isArray(entities.placeholders) ? entities.placeholders : [];
      var map = entities.placeholderMap || {};
      for (var i = 0; i < placeholders.length; i++) {
        var original = map[placeholders[i]];
        if (typeof original !== "string" || !original.trim()) continue;
        if (original.length < 3) continue;
        if (/[A-Z]{2,}/.test(original) || /\b(?:Raja|Sultan|Tun|Dato|Tunku|Tuanku)\b/.test(original)) {
          if (raw.indexOf(original) === -1) return false;
        }
      }
    }

    return true;
  }

  function buildChipBackContent(chip, sourceText, gl, comprehension) {
    var chipId = chip && chip.getAttribute ? (chip.getAttribute("data-zh-unit-id") || "").trim() : "";
    var unit = chipId && comprehension && comprehension[chipId] ? comprehension[chipId] : null;
    var bmSource = unit && typeof unit.bm_original === "string" && unit.bm_original.trim()
      ? stripCorruptedZhLeadPrefix(unit.bm_original)
      : stripCorruptedZhLeadPrefix(sourceText);
    var curated = unit && typeof unit.translate === "string" ? normalizeZhExplain(unit.translate, gl) : "";

    if (isUsableCuratedZhText(curated, gl, bmSource)) {
      return {
        modeLabel: "Unit ZH",
        text: curated,
        fallbackLabel: ""
      };
    }
    return buildExplainFallback(bmSource, gl);
  }

  function isSentenceLikeChip(sourceText) {
    if (!sourceText) return false;
    if (/[.!?;:]/.test(sourceText)) return true;
    var words = sourceText.trim().split(/\s+/).filter(Boolean);
    return words.length > 6;
  }

  function setupChipFlips(gl, comprehension) {
    bindChipInteractions();
    document.querySelectorAll(".paper-chip-list").forEach(function (listEl) {
      listEl.classList.add("zh-chip-list-ready");
    });

    var chips = document.querySelectorAll(".paper-chip");
    chips.forEach(function (chip) {
      var hasLegacyFlipMarkup =
        chip.classList.contains("zh-chip-flip-ready") ||
        chip.classList.contains("zh-chip-translated") ||
        !!chip.querySelector(".zh-chip-inner") ||
        !!chip.querySelector(".zh-chip-primary") ||
        !!chip.getAttribute("data-zh-bm") ||
        !!chip.getAttribute("data-zh-cn");

      if (hasLegacyFlipMarkup) {
        if (chip.__zhOriginalHTML) {
          chip.innerHTML = chip.__zhOriginalHTML;
        }
        chip.classList.remove("zh-chip-flip-ready", "zh-chip-flipped", "zh-chip-translated", "zh-chip-inline");
        chip.removeAttribute("data-zh-bm");
        chip.removeAttribute("data-zh-cn");
        chip.removeAttribute("data-zh-mode-label");
        chip.removeAttribute("data-zh-fallback-label");
      }

      // Build clean front HTML (preserve original structure, strip any Chinese annotations)
      var sourceNode = chip.cloneNode(true);
      sourceNode.querySelectorAll(".kw-zh-ann").forEach(function (ann) { ann.remove(); });
      sourceNode.querySelectorAll(".kw-zh-annotated, .kw-zh-open").forEach(function (el) {
        el.classList.remove("kw-zh-annotated", "kw-zh-open");
        if (el.__zhKwHandler) {
          el.removeEventListener("click", el.__zhKwHandler);
          el.__zhKwHandler = null;
        }
      });
      var frontHTML = sourceNode.innerHTML;
      var sourceText = sourceNode.textContent ? sourceNode.textContent.trim() : "";

      // Always save clean original (without annotation artefacts)
      chip.__zhOriginalHTML = frontHTML;

      if (!sourceText || sourceText.length < 3 || sourceText.length > 320) {
        reportChipFlipIssue(chip, "conditional-render", { hasLegacyFlipMarkup: hasLegacyFlipMarkup });
        return;
      }

      var backContent = buildChipBackContent(chip, sourceText, gl, comprehension);
      if (!backContent || !backContent.text || !backContent.text.trim()) {
        var reason = hasLegacyFlipMarkup ? "legacy-markup" : "data-shape-not-uniform";
        reportChipFlipIssue(chip, reason, { sourceText: sourceText.slice(0, 160) });
        return;
      }

      // All chips use the same model: original visible, translation hidden until tap
      chip.classList.add("zh-chip-flip-ready", "zh-chip-translated", "zh-chip-can-flip");
      chip.setAttribute("data-zh-bm", sourceText);
      chip.setAttribute("data-zh-cn", backContent.text);
      chip.setAttribute("data-zh-mode-label", backContent.modeLabel);
      chip.setAttribute("data-zh-fallback-label", backContent.fallbackLabel || "");
      chip.setAttribute("data-chip-can-flip", "true");
      chip.setAttribute("data-chip-display-mode", CHIP_DISPLAY_STACKED);
      chip.setAttribute("role", "button");
      chip.setAttribute("tabindex", "0");
      chip.setAttribute("aria-pressed", "false");

      chip.__zhChipState = {
        canFlip: true,
        translation: backContent.text,
        displayMode: CHIP_DISPLAY_STACKED,
        isFlipped: false
      };

      // Build translation HTML based on content type:
      //   • Multiple vocab pairs  → labeled "bm = 中文" list below the BM text
      //   • Long explain text     → readable block below the BM text
      //   • Single pair / short   → inline （中文） appended to the BM text
      var translationHtml;
      var hasPairs = backContent.pairs && backContent.pairs.length > 1;
      var isLongExplain = !hasPairs && backContent.text && backContent.text.length > 28;

      var hasFullSentence = typeof backContent.fullSentenceZh === "string" && !!backContent.fullSentenceZh.trim();
      var fullSentenceHtml = hasFullSentence
        ? (
          '<span class="zh-chip-full-sentence-wrap">' +
            '<span class="zh-chip-full-sentence-label">整句：</span>' +
            '<span class="zh-chip-full-sentence" lang="zh-Hans">' + escapeHtml(backContent.fullSentenceZh.trim()) + '</span>' +
          '</span>'
        )
        : "";

      if (hasPairs) {
        var pairsHtml = backContent.pairs.map(function (p) {
          return (
            '<span class="zh-pair-item">' +
              '<span class="zh-pair-bm">' + escapeHtml(p.bm) + '</span>' +
              '<span class="zh-pair-eq"> = </span>' +
              '<span class="zh-pair-zh" lang="zh-Hans">' + escapeHtml(p.zh) + '</span>' +
            '</span>'
          );
        }).join('');
        translationHtml = '<span class="zh-chip-translation zh-chip-translation-pairs" lang="zh-Hans">' + pairsHtml + fullSentenceHtml + '</span>';
        chip.classList.add("zh-chip-has-pairs");
      } else if (isLongExplain) {
        translationHtml = (
          '<span class="zh-chip-translation zh-chip-translation-explain" lang="zh-Hans">' +
            '<span class="zh-chip-explain-text">' + escapeHtml(backContent.text) + '</span>' +
            fullSentenceHtml +
          '</span>'
        );
        chip.classList.add("zh-chip-has-explain");
      } else {
        var shortContent = '<span class="zh-chip-short-inline">（' + escapeHtml(backContent.text) + '）</span>';
        translationHtml = '<span class="zh-chip-translation" lang="zh-Hans">' + shortContent + fullSentenceHtml + '</span>';
      }

      chip.innerHTML =
        '<span class="zh-chip-inner">' +
          '<span class="zh-chip-primary">' + chip.__zhOriginalHTML + '</span>' +
          translationHtml +
        '</span>';

      if (backContent.autoTranslate && backContent.autoTranslateSource) {
        fetchSentenceTranslation(backContent.autoTranslateSource).then(function (translated) {
          var translatedText = translated && translated.trim() ? translated.trim() : "";
          var restored = restoreProtectedEntities(translatedText, backContent.autoTranslateEntities);
          var finalText = restored.stable && restored.text && restored.text.trim()
            ? restored.text.trim()
            : ((backContent.autoTranslateOriginal || sourceText || "").trim());
          var hasFallbackWarning = !restored.stable;
          chip.setAttribute("data-zh-cn", finalText);
          chip.setAttribute("data-zh-fallback-label", hasFallbackWarning ? ENTITY_WARNING_LABEL : "");
          if (chip.__zhChipState) {
            chip.__zhChipState.translation = finalText;
          }
          var explainNode = chip.querySelector(".zh-chip-explain-text");
          if (explainNode) explainNode.textContent = hasFallbackWarning ? (finalText + " " + ENTITY_WARNING_LABEL) : finalText;
          var inlineNode = chip.querySelector(".zh-chip-short-inline");
          if (inlineNode) inlineNode.textContent = "（" + finalText + (hasFallbackWarning ? " · ⚠︎" : "") + "）";
        });
      }

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

      if (chip.__zhOriginalHTML) {
        chip.innerHTML = chip.__zhOriginalHTML;
      }
      chip.classList.remove("zh-chip-flip-ready", "zh-chip-flipped", "zh-chip-translated", "zh-chip-inline", "zh-chip-has-pairs", "zh-chip-has-explain");
      chip.removeAttribute("data-zh-bm");
      chip.removeAttribute("data-zh-cn");
      chip.removeAttribute("data-zh-mode-label");
      chip.removeAttribute("data-zh-fallback-label");
      chip.removeAttribute("data-chip-display-mode");
      chip.removeAttribute("role");
      chip.removeAttribute("tabindex");
      chip.removeAttribute("aria-pressed");
      chip.__zhChipState = null;
    });
    document.querySelectorAll(".paper-chip-list.zh-chip-list-ready").forEach(function (listEl) {
      listEl.classList.remove("zh-chip-list-ready");
    });
  }

  function toggleChipFlip(chip, triggerType) {
    if (!chip || !chip.classList || !chip.classList.contains("paper-chip")) return;
    var state = chip.__zhChipState;
    if (!state) {
      reportChipFlipIssue(chip, "missing-state", { triggerType: triggerType });
      return;
    }
    if (!state.translation || !state.translation.trim()) {
      reportChipFlipIssue(chip, "data-shape-not-uniform", { triggerType: triggerType });
      return;
    }
    if (!state.canFlip) {
      reportChipFlipIssue(chip, "flip-disabled", {
        triggerType: triggerType,
        canFlip: state.canFlip
      });
      return;
    }

    state.isFlipped = !state.isFlipped;
    chip.classList.toggle("zh-chip-flipped", state.isFlipped);
    chip.setAttribute("aria-pressed", state.isFlipped ? "true" : "false");
  }

  function bindChipInteractions() {
    if (chipInteractionsBound) return;
    chipInteractionsBound = true;

    document.addEventListener("touchend", function (event) {
      var chip = event.target && event.target.closest ? event.target.closest(".paper-chip.zh-chip-translated") : null;
      if (!chip) return;
      chip.__zhLastTouchTs = Date.now();
      toggleChipFlip(chip, "touchend");
    }, { passive: true });

    document.addEventListener("click", function (event) {
      var chip = event.target && event.target.closest ? event.target.closest(".paper-chip.zh-chip-translated") : null;
      if (!chip) return;
      if (chip.__zhLastTouchTs && Date.now() - chip.__zhLastTouchTs < CHIP_TOUCH_CLICK_DELAY_MS) return;
      toggleChipFlip(chip, "click");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      var chip = event.target && event.target.closest ? event.target.closest(".paper-chip.zh-chip-translated") : null;
      if (!chip) return;
      event.preventDefault();
      toggleChipFlip(chip, "keyboard");
    });
  }

  // ── Legacy zh panels cleanup (disabled) ─────────────────

  function removeComprehensionPanels() {
    document.querySelectorAll(".zh-comprehension-panel").forEach(function (panel) { panel.remove(); });
  }

  // ── Raw Text Annotation (difficult words in plain text) ──

  function annotateRawText(gl) {
    if (!gl) return;

    // Build sorted term list: length-descending, min 4 chars, skip overly-general
    var terms = Object.keys(gl)
      .filter(function (k) {
        return typeof gl[k] === "string"
          && !OVERLY_GENERAL_TERMS.has(normalize(k))
          && k.length >= 4;
      })
      .sort(function (a, b) { return b.length - a.length; });

    if (terms.length === 0) return;

    // Build single regex from all terms (longest first = precedence)
    var escaped = terms.map(function (t) {
      return t.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&");
    });
    var re = new RegExp("\\b(" + escaped.join("|") + ")\\b", "gi");

    // Selectors to skip (already handled elsewhere, or structural)
    var SKIP = ".kw,.paper-chip,.paper-kingdom,code,pre,.kw-zh-ann,.zh-chip-translation,.zh-raw-ann,.zh-heading-ann,script,style,nav,header,footer,.keyword-legend-item,.zh-comprehension-panel";

    var contentArea = document.querySelector(".note-section") || document.body;

    // Collect text nodes first (can't modify DOM while walking)
    var walker = document.createTreeWalker(
      contentArea,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          var p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    var textNodes = [];
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && n.nodeValue.trim()) textNodes.push(n);
    }

    textNodes.forEach(function (textNode) {
      var text = textNode.nodeValue;
      re.lastIndex = 0;
      if (!re.test(text)) { re.lastIndex = 0; return; }
      re.lastIndex = 0;

      var parts = [];
      var lastIdx = 0;
      var m;
      while ((m = re.exec(text)) !== null) {
        var matchedTerm = m[1];
        var zh = gl[normalize(matchedTerm)] || gl[matchedTerm.toLowerCase()];
        if (!zh) continue;

        if (m.index > lastIdx) {
          parts.push(document.createTextNode(text.slice(lastIdx, m.index)));
        }

        var span = document.createElement("span");
        span.className = "zh-raw-ann kw-zh-annotated";
        span.appendChild(document.createTextNode(matchedTerm));

        var ann = document.createElement("span");
        ann.className = "kw-zh-ann";
        ann.setAttribute("lang", "zh-Hans");
        ann.setAttribute("aria-hidden", "true");
        ann.textContent = zh;
        span.appendChild(ann);

        (function (s) {
          var handler = function (e) {
            e.stopPropagation();
            s.classList.toggle("kw-zh-open");
          };
          s.__zhKwHandler = handler;
          s.addEventListener("click", handler);
        })(span);

        parts.push(span);
        lastIdx = m.index + matchedTerm.length;
      }

      if (parts.length === 0) return;
      if (lastIdx < text.length) {
        parts.push(document.createTextNode(text.slice(lastIdx)));
      }

      var frag = document.createDocumentFragment();
      parts.forEach(function (p) { frag.appendChild(p); });
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function removeRawAnnotations() {
    document.querySelectorAll(".zh-raw-ann").forEach(function (span) {
      if (span.__zhKwHandler) {
        span.removeEventListener("click", span.__zhKwHandler);
        span.__zhKwHandler = null;
      }
      // Replace span with its original BM text (first text child node)
      var bmText = "";
      for (var i = 0; i < span.childNodes.length; i++) {
        if (span.childNodes[i].nodeType === Node.TEXT_NODE) {
          bmText = span.childNodes[i].nodeValue;
          break;
        }
      }
      if (span.parentNode) {
        span.parentNode.replaceChild(document.createTextNode(bmText), span);
      }
    });
  }

  // ── Orphan Text Annotation ───────────────────────────────

  function buildPointExplainText(rawText, unit, gl) {
    var sentenceSource = "";
    if (unit && typeof unit.bm_original === "string" && unit.bm_original.trim()) {
      sentenceSource = stripCorruptedZhLeadPrefix(unit.bm_original);
    } else if (typeof rawText === "string" && rawText.trim()) {
      sentenceSource = stripCorruptedZhLeadPrefix(rawText);
    }

    var curated = unit && typeof unit.translate === "string"
      ? normalizeZhExplain(unit.translate, gl)
      : "";
    if (isUsableCuratedZhText(curated, gl, sentenceSource)) {
      return Promise.resolve({
        text: curated,
        warning: ""
      });
    }

    var entitiesPayload = extractProtectedEntities(sentenceSource, gl);
    var sourceForTranslate = entitiesPayload.protectedText || sentenceSource;

    return fetchSentenceTranslation(sourceForTranslate).then(function (translated) {
      var translatedText = translated && translated.trim() ? translated.trim() : "";
      var restored = restoreProtectedEntities(translatedText, entitiesPayload);
      if (!restored.stable) {
        return {
          text: sentenceSource,
          warning: ENTITY_WARNING_LABEL
        };
      }
      return {
        text: restored.text && restored.text.trim() ? restored.text.trim() : "",
        warning: ""
      };
    });
  }

  function annotateOrphanText(gl, comprehension) {
    var EMOJI_STRIP_RE = /[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2600-\u27BF]|[\u{1F000}-\u{1FFFF}]|[📌💡📖🔍⬆️]/gu;
    var mappedComprehension = comprehension || {};

    function resolveUnit(el) {
      if (!el || !el.getAttribute) return null;
      var directId = (el.getAttribute("data-zh-unit-id") || "").trim();
      if (directId && mappedComprehension[directId]) return mappedComprehension[directId];

      var nested = el.querySelector ? el.querySelector("[data-zh-unit-id]") : null;
      if (nested && nested.getAttribute) {
        var nestedId = (nested.getAttribute("data-zh-unit-id") || "").trim();
        if (nestedId && mappedComprehension[nestedId]) return mappedComprehension[nestedId];
      }

      return null;
    }

    function attachToggle(el, rawText) {
      if (el.querySelector(".zh-heading-toggle")) return;
      var cleanText = normalize(rawText.replace(EMOJI_STRIP_RE, "").replace(/^[^a-zA-ZÀ-ÿ]+/, ""));
      if (!cleanText || cleanText.length < 3) return;

      var unit = resolveUnit(el);
      var toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "zh-heading-toggle";
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", "中文句意解析");
      toggleBtn.textContent = "中";

      var annSpan = document.createElement("span");
      annSpan.className = "zh-heading-ann";
      annSpan.setAttribute("hidden", "");
      annSpan.setAttribute("aria-hidden", "true");
      annSpan.setAttribute("lang", "zh-Hans");
      annSpan.dataset.status = "idle";

      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = !annSpan.hasAttribute("hidden");
        if (isOpen) {
          annSpan.setAttribute("hidden", "");
          toggleBtn.setAttribute("aria-expanded", "false");
        } else {
          annSpan.removeAttribute("hidden");
          toggleBtn.setAttribute("aria-expanded", "true");
          if (annSpan.dataset.status === "idle") {
            annSpan.dataset.status = "loading";
            buildPointExplainText(cleanText, unit, gl).then(function (explanationText) {
              var text = explanationText && explanationText.text ? explanationText.text : "";
              var warning = explanationText && explanationText.warning ? explanationText.warning : "";
              annSpan.textContent = warning ? (text + " " + warning) : text;
              annSpan.dataset.status = "done";
            }).catch(function () {
              annSpan.textContent = "";
              annSpan.dataset.status = "done";
            });
          }
        }
      });

      el.classList.add("zh-heading-has-ann");
      el.appendChild(toggleBtn);
      el.appendChild(annSpan);
    }

    // Block-level text elements
    var blockSel = [
      ".point-heading",
      ".point-line",
      ".lead",
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
      '<span class="zh-disclaimer-icon">中</span>' +
      '<div class="zh-disclaimer-content">' +
        '<span class="zh-disclaimer-text">Mod Bahasa Cina aktif · versi awal bantuan belajar</span>' +
        '<button class="zh-help-toggle zh-disclaimer-help-toggle" type="button" aria-expanded="false">❓ Makluman</button>' +
        '<span class="zh-disclaimer-help" hidden>Fungsi ini diperkenalkan untuk memudahkan pelajar memahami isi penting. Oleh sebab masih di peringkat awal, sesetengah padanan istilah atau konteks ayat mungkin belum tepat sepenuhnya. Gunakan sebagai bantuan kefahaman, dan jadikan nota BM sebagai rujukan utama.</span>' +
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
        setupChipFlips(merged, comprehension);
        annotateOrphanText(merged, comprehension);
        if (!opts.silentDisclaimer) {
          showDisclaimer();
        }
      });
    } else {
      document.documentElement.removeAttribute("data-lang-mode");
      removeAnnotations();
      removeRawAnnotations();
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
      btn.setAttribute("aria-label", "Mod Bahasa Cina (versi awal)");
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
        setupChipFlips(merged, comprehension);
        annotateOrphanText(merged, comprehension);
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
