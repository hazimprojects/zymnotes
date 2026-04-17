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
  var CUSTOM_GLOSSARY_KEY = "hzedu-zh-custom-glossary";
  var TRANSLATE_ENDPOINT = "https://api.mymemory.translated.net/get";
  var glossary = null;
  var customGlossary = {};
  var onlineTranslateCache = {};
  var annotated = false;
  var glossaryDrawerApi = null;
  var legacyControlsInitialized = false;

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

  function loadCustomGlossary() {
    try {
      var raw = localStorage.getItem(CUSTOM_GLOSSARY_KEY);
      customGlossary = raw ? JSON.parse(raw) : {};
    } catch (err) {
      customGlossary = {};
    }
    return customGlossary;
  }

  function saveCustomGlossary(data) {
    customGlossary = data || {};
    localStorage.setItem(CUSTOM_GLOSSARY_KEY, JSON.stringify(customGlossary));
  }

  function getMergedGlossary() {
    var merged = {};
    var key;
    if (glossary) {
      for (key in glossary) {
        if (Object.prototype.hasOwnProperty.call(glossary, key)) {
          merged[key] = glossary[key];
        }
      }
    }
    for (key in customGlossary) {
      if (Object.prototype.hasOwnProperty.call(customGlossary, key)) {
        merged[key] = customGlossary[key];
      }
    }
    return merged;
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

  function cleanTranslatedText(text, original) {
    if (!text) return "";
    var cleaned = String(text).trim()
      .replace(/\[.*?\]/g, "")
      .replace(/\s+/g, " ");
    if (!cleaned) return "";
    if (normalize(cleaned) === normalize(original)) return "";
    return cleaned;
  }

  function fetchOnlineTranslation(text) {
    var normalizedText = normalize(text);
    if (onlineTranslateCache[normalizedText]) {
      return Promise.resolve(onlineTranslateCache[normalizedText]);
    }

    var url = TRANSLATE_ENDPOINT +
      "?q=" + encodeURIComponent(text) +
      "&langpair=ms|zh-CN";

    return fetch(url)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (payload) {
        if (!payload || !payload.responseData) return "";
        var raw = payload.responseData.translatedText || "";
        var translated = cleanTranslatedText(raw, text);
        if (translated) {
          onlineTranslateCache[normalizedText] = translated;
        }
        return translated;
      })
      .catch(function () {
        return "";
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

      var sourceText = chip.textContent ? chip.textContent.trim() : "";
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

      chip.addEventListener("click", toggleFlip);
      chip.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleFlip();
        }
      });
    });
  }

  function resetChipFlips() {
    document.querySelectorAll(".paper-chip.zh-chip-flip-ready").forEach(function (chip) {
      var bm = chip.getAttribute("data-zh-bm");
      if (bm) {
        chip.textContent = bm;
      }
      chip.classList.remove("zh-chip-flip-ready", "zh-chip-flipped");
      chip.removeAttribute("tabindex");
      chip.removeAttribute("role");
      chip.removeAttribute("aria-label");
      chip.removeAttribute("data-zh-bm");
      chip.removeAttribute("data-zh-cn");
    });
  }

  // ── Editable Glossary Drawer ─────────────────────────────

  function renderCustomGlossaryList() {
    var list = document.querySelector(".zh-glossary-list");
    if (!list) return;

    var keys = Object.keys(customGlossary);
    if (keys.length === 0) {
      list.innerHTML = '<p class="zh-glossary-empty">Belum ada nota lagi. Pilih teks dan tekan “Simpan Nota / 保存”. 目前还没有笔记，选中文字后点保存。</p>';
      return;
    }

    keys.sort();
    list.innerHTML = keys.map(function (key) {
      return (
        '<div class="zh-glossary-item" data-key="' + escapeHtml(key) + '">' +
          '<div class="zh-glossary-main">' +
            '<span class="zh-glossary-ms">' + escapeHtml(key) + '</span>' +
            '<span class="zh-glossary-zh">' + escapeHtml(customGlossary[key]) + "</span>" +
          "</div>" +
          '<button type="button" class="zh-glossary-delete" data-delete="' + escapeHtml(key) + '">Buang</button>' +
        "</div>"
      );
    }).join("");
  }

  function initGlossaryDrawer() {
    if (glossaryDrawerApi) return glossaryDrawerApi;
    var drawer = document.createElement("aside");
    drawer.className = "zh-glossary-drawer";
    drawer.innerHTML =
      '<button type="button" class="zh-glossary-toggle" aria-expanded="false">📝 Nota</button>' +
      '<div class="zh-glossary-panel" aria-hidden="true">' +
        '<div class="zh-glossary-head">' +
          "<strong>📝 Nota Peribadi</strong>" +
          '<button type="button" class="zh-glossary-close" aria-label="Tutup">✕</button>' +
        "</div>" +
        '<button type="button" class="zh-help-toggle" aria-expanded="false">❓ Help</button>' +
        '<p class="zh-glossary-help" hidden>Simpan istilah penting untuk ulang kaji; anda boleh ubah terjemahan ikut konteks. 可保存重点词语，并按语境自行修改翻译。</p>' +
        '<div class="zh-glossary-list"></div>' +
      "</div>";

    document.body.appendChild(drawer);

    var toggleBtn = drawer.querySelector(".zh-glossary-toggle");
    var closeBtn = drawer.querySelector(".zh-glossary-close");
    var panel = drawer.querySelector(".zh-glossary-panel");
    var helpToggle = drawer.querySelector(".zh-help-toggle");
    var helpText = drawer.querySelector(".zh-glossary-help");

    if (helpToggle && helpText) {
      helpToggle.addEventListener("click", function () {
        var expanded = helpToggle.getAttribute("aria-expanded") === "true";
        helpToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        helpText.hidden = expanded;
      });
    }

    function openDrawer() {
      if (!isZhMode()) return;
      drawer.classList.add("is-open");
      toggleBtn.setAttribute("aria-expanded", "true");
      panel.setAttribute("aria-hidden", "false");
      renderCustomGlossaryList();
    }

    function closeDrawer() {
      drawer.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
    }

    toggleBtn.addEventListener("click", function () {
      if (drawer.classList.contains("is-open")) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    closeBtn.addEventListener("click", closeDrawer);

    drawer.addEventListener("click", function (e) {
      var deleteKey = e.target && e.target.getAttribute && e.target.getAttribute("data-delete");
      if (!deleteKey) return;
      delete customGlossary[deleteKey];
      saveCustomGlossary(customGlossary);
      renderCustomGlossaryList();
      if (isZhMode()) {
        var merged = getMergedGlossary();
        removeAnnotations();
        annotateKeywords(merged);
        resetChipFlips();
        setupChipFlips(merged);
      }
    });

    glossaryDrawerApi = {
      open: openDrawer,
      close: closeDrawer,
      drawer: drawer
    };

    return glossaryDrawerApi;
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
        '<span class="zh-disclaimer-text">中文 ON · Pilih teks</span>' +
        '<button class="zh-help-toggle zh-disclaimer-help-toggle" type="button" aria-expanded="false">❓ Help</button>' +
        '<span class="zh-disclaimer-help" hidden>Mod Bahasa Cina aktif. Pilih teks untuk terjemahan segera (glosari/internet), boleh edit sebelum simpan. 中文模式已开启：选中文字可即时翻译（词汇表/网络），可编辑后保存。</span>' +
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

  // ── Text Selection Translation ────────────────────────────

  function initSelectionTranslation() {
    var popup = document.createElement("div");
    popup.className = "zh-selection-popup";
    popup.setAttribute("aria-hidden", "true");
    popup.setAttribute("role", "dialog");
    popup.innerHTML =
      '<div class="zh-selection-main"></div>' +
      '<div class="zh-selection-actions zh-selection-actions--compact">' +
        '<button type="button" class="zh-selection-edit-toggle" aria-expanded="false">✍️ Edit</button>' +
      "</div>" +
      '<div class="zh-selection-expanded" hidden>' +
        '<label class="zh-selection-edit-wrap">✍️ Edit' +
          '<input type="text" class="zh-selection-edit" autocomplete="off" />' +
        "</label>" +
        '<div class="zh-selection-status" aria-live="polite"></div>' +
        '<button type="button" class="zh-help-toggle zh-selection-help-toggle" aria-expanded="false">❓ Help</button>' +
        '<div class="zh-selection-help" hidden>Pilih teks untuk semak glosari dahulu, kemudian internet jika tiada padanan. Anda boleh edit terjemahan sebelum simpan ke nota. 先查词汇表，若无结果再查网络；保存前可自行编辑翻译。</div>' +
        '<div class="zh-selection-actions zh-selection-actions--expanded">' +
          '<button type="button" class="zh-selection-save">💾 Simpan</button>' +
          '<button type="button" class="zh-selection-done">Selesai</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(popup);

    var currentSelection = "";
    var currentTranslation = "";
    var lookupRequestId = 0;
    var isCoarsePointer = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    var expandedPanel = popup.querySelector(".zh-selection-expanded");
    var editInput = popup.querySelector(".zh-selection-edit");
    var statusEl = popup.querySelector(".zh-selection-status");
    var saveBtn = popup.querySelector(".zh-selection-save");
    var editToggleBtn = popup.querySelector(".zh-selection-edit-toggle");
    var doneBtn = popup.querySelector(".zh-selection-done");
    var selectionHelpToggle = popup.querySelector(".zh-selection-help-toggle");
    var selectionHelpText = popup.querySelector(".zh-selection-help");

    if (selectionHelpToggle && selectionHelpText) {
      selectionHelpToggle.addEventListener("click", function () {
        var expanded = selectionHelpToggle.getAttribute("aria-expanded") === "true";
        selectionHelpToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        selectionHelpText.hidden = expanded;
      });
    }

    function setExpandedState(expanded) {
      popup.classList.toggle("zh-selection-popup--expanded", expanded);
      popup.classList.toggle("zh-selection-popup--compact", !expanded);
      editToggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
      expandedPanel.hidden = !expanded;
      if (!expanded) {
        selectionHelpToggle.setAttribute("aria-expanded", "false");
        selectionHelpText.hidden = true;
      }
    }

    editToggleBtn.addEventListener("click", function () {
      setExpandedState(true);
      editInput.focus();
      editInput.select();
    });

    doneBtn.addEventListener("click", function () {
      setExpandedState(false);
    });

    setExpandedState(false);

    function hidePopup() {
      popup.classList.remove("zh-selection-popup--visible");
      popup.classList.remove("zh-selection-popup--mobile");
      setExpandedState(false);
    }

    function saveSelectionNote() {
      var editedTranslation = editInput.value.trim();
      if (!currentSelection || !editedTranslation) return;
      currentTranslation = editedTranslation;
      customGlossary[normalize(currentSelection)] = currentTranslation;
      saveCustomGlossary(customGlossary);
      renderCustomGlossaryList();

      var merged = getMergedGlossary();
      removeAnnotations();
      annotateKeywords(merged);
      resetChipFlips();
      setupChipFlips(merged);

      popup.classList.add("zh-selection-popup--saved");
      setTimeout(function () {
        popup.classList.remove("zh-selection-popup--saved");
      }, 900);
    }

    popup.querySelector(".zh-selection-save").addEventListener("click", function () {
      saveSelectionNote();
    });

    function setSelectionResult(selectedText, zh, sourceTag) {
      currentSelection = selectedText;
      currentTranslation = zh;
      editInput.value = zh;
      saveBtn.disabled = !zh;
      setExpandedState(false);

      statusEl.textContent = sourceTag || "";
      popup.querySelector(".zh-selection-main").innerHTML =
        '<span class="zh-selection-ms">' + escapeHtml(selectedText) + '</span>' +
        '<span class="zh-selection-arrow">→</span>' +
        '<span class="zh-selection-zh">' + escapeHtml(zh || "—") + "</span>";
    }

    function positionPopupFromSelection(selection) {
      if (isCoarsePointer) {
        popup.classList.add("zh-selection-popup--mobile");
        popup.style.left = "50%";
        popup.style.top = "auto";
        popup.style.bottom = "max(6.2rem, calc(env(safe-area-inset-bottom) + 5.6rem))";
        return;
      }

      popup.classList.remove("zh-selection-popup--mobile");
      popup.style.bottom = "auto";
      var range = selection.getRangeAt(0);
      var rect = range.getBoundingClientRect();
      var scrollY = window.scrollY || document.documentElement.scrollTop;
      var popupWidth = popup.offsetWidth || 220;
      var left = rect.left + (rect.width / 2) - (popupWidth / 2);
      left = Math.max(8, Math.min(left, window.innerWidth - popupWidth - 8));
      popup.style.left = left + "px";
      popup.style.top = (rect.top + scrollY - popup.offsetHeight - 12) + "px";
    }

    function handleSelectionEnd() {
      if (!isZhMode() || !glossary) { hidePopup(); return; }

      var selection = window.getSelection();
      if (!selection || selection.isCollapsed) { hidePopup(); return; }

      var selectedText = selection.toString().trim();
      if (selectedText.length < 2 || selectedText.length > 80) { hidePopup(); return; }

      var mergedGlossary = getMergedGlossary();
      var zh = lookupTerm(selectedText, mergedGlossary);
      popup.classList.add("zh-selection-popup--visible");
      positionPopupFromSelection(selection);

      if (zh) {
        setSelectionResult(selectedText, zh, "📘 Glosari");
        return;
      }

      setSelectionResult(selectedText, "", "🌐 Cari...");
      var requestId = ++lookupRequestId;
      saveBtn.disabled = true;

      fetchOnlineTranslation(selectedText).then(function (onlineZh) {
        if (requestId !== lookupRequestId) return;
        if (!onlineZh) {
          setSelectionResult(selectedText, "", "⚠️ Tiada padanan · isi manual");
          saveBtn.disabled = true;
          return;
        }
        setSelectionResult(selectedText, onlineZh, "🌐 Internet (edit)");
      });
    }

    editInput.addEventListener("input", function () {
      saveBtn.disabled = !editInput.value.trim();
    });

    document.addEventListener("mouseup", function (e) {
      if (e.target.closest && e.target.closest(".zh-selection-popup")) return;
      setTimeout(function () { handleSelectionEnd(); }, 20);
    });

    document.addEventListener("touchend", function (e) {
      if (e.target.closest && e.target.closest(".zh-selection-popup")) return;
      setTimeout(function () { handleSelectionEnd(); }, 420);
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

  function updateLegacyToggleButtons(active) {
    document.querySelectorAll(".zh-mode-fab").forEach(function (btn) {
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.classList.toggle("is-active", active);
    });
  }

  function applyZhMode(active, options) {
    var opts = options || {};
    localStorage.setItem(LANG_KEY, active ? "zh" : "ms");
    updateLegacyToggleButtons(active);

    if (active) {
      document.documentElement.setAttribute("data-lang-mode", "zh");
      loadGlossary().then(function () {
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
      if (glossaryDrawerApi) {
        glossaryDrawerApi.close();
      }
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
    initGlossaryDrawer();
  }

  function openGlossaryNotes() {
    var drawerApi = initGlossaryDrawer();
    drawerApi.open();
  }

  function shouldUseSparkleForZhControls() {
    return /\/notes\//.test(window.location.pathname) && !window.__HZ_ZH_LEGACY_REQUESTED;
  }

  // ── Init ─────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", function () {
    loadCustomGlossary();
    initSelectionTranslation();

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
