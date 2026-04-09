document.documentElement.classList.add("js-enhanced");

// =========================
// DARK MODE TOGGLE
// =========================
(function () {
  const KEY = "hazimedu-theme";

  function getTheme() {
    return (
      localStorage.getItem(KEY) ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    );
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEY, theme);
    document.querySelectorAll(".display-fab").forEach((btn) => {
      btn.textContent = theme === "dark" ? "🌙" : "☀️";
    });
  }

  applyTheme(getTheme());

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".nav-wrap").forEach((nav) => {
      if (nav.querySelector(".display-fab")) return;

      const btn = document.createElement("button");
      btn.className = "display-fab";
      btn.setAttribute("type", "button");
      btn.setAttribute("aria-label", "Tukar mod paparan");
      btn.textContent = getTheme() === "dark" ? "🌙" : "☀️";

      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        applyTheme(current === "dark" ? "light" : "dark");
      });

      const navToggle = nav.querySelector(".nav-toggle");
      navToggle ? nav.insertBefore(btn, navToggle) : nav.appendChild(btn);
    });
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem(KEY)) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });
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

      if (!clickedInsideNav && !clickedToggle && !clickedDisplayFab && siteNav.classList.contains("open")) {
        siteNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

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
  const accordionTriggers = document.querySelectorAll(".paper-accordion-trigger");

  function setAccordionState(item, open) {
    const trigger = item.querySelector(":scope > .paper-accordion-trigger");
    const panel = item.querySelector(":scope > .paper-accordion-panel");
    if (!trigger || !panel) return;

    item.classList.toggle("is-open", open);
    trigger.classList.toggle("active", open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("active", open);
  }

  function getHeaderOffset() {
    const header = document.querySelector(".site-header");
    const headerHeight = header ? header.getBoundingClientRect().height : 72;
    const sticky = document.querySelector(".audio-sticky");
    const stickyHeight = (sticky && sticky.classList.contains("is-visible"))
      ? sticky.getBoundingClientRect().height
      : 0;
    return Math.round(headerHeight + stickyHeight + 12);
  }

  function waitUntilScrollReaches(targetTop, callback) {
    let rafId = 0;
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

      rafId = requestAnimationFrame(check);
    }

    rafId = requestAnimationFrame(check);
  }

  accordionTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const currentItem = trigger.closest(".paper-accordion-item");
      const accordionGroup = trigger.closest(".paper-accordion");
      if (!currentItem || !accordionGroup) return;

      const wasOpen = currentItem.classList.contains("is-open");

      // Jika tekan accordion yang sama, tutup seperti biasa
      if (wasOpen) {
        const anchorTop = trigger.getBoundingClientRect().top;

        document.documentElement.classList.add("accordion-no-smooth-scroll");
        document.body.classList.add("accordion-no-smooth-scroll");

        accordionGroup.querySelectorAll(":scope > .paper-accordion-item").forEach((item) => {
          setAccordionState(item, false);
        });

        trigger.blur();

        let rafId = 0;
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
            rafId = requestAnimationFrame(stabilizeClose);
          } else {
            document.documentElement.classList.remove("accordion-no-smooth-scroll");
            document.body.classList.remove("accordion-no-smooth-scroll");
            if (rafId) cancelAnimationFrame(rafId);
          }
        }

        rafId = requestAnimationFrame(stabilizeClose);
        return;
      }

      // 1) Scroll dulu sampai trigger duduk betul-betul bawah nav
      const triggerRect = trigger.getBoundingClientRect();
      const absoluteTop = window.scrollY + triggerRect.top;
      const targetTop = Math.max(0, Math.round(absoluteTop - getHeaderOffset()));

      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });

      // 2) Tunggu scroll benar-benar sampai, baru buka accordion
      waitUntilScrollReaches(targetTop, () => {
        const anchorTop = trigger.getBoundingClientRect().top;

        document.documentElement.classList.add("accordion-no-smooth-scroll");
        document.body.classList.add("accordion-no-smooth-scroll");

        accordionGroup.querySelectorAll(":scope > .paper-accordion-item").forEach((item) => {
          setAccordionState(item, false);
        });

        setAccordionState(currentItem, true);
        trigger.blur();

        let rafId = 0;
        let stillFrames = 0;
        let lastTop = null;
        const REQUIRED_STILL_FRAMES = 10;
        const MAX_FRAMES = 40;
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
            rafId = requestAnimationFrame(stabilizeOpen);
          } else {
            document.documentElement.classList.remove("accordion-no-smooth-scroll");
            document.body.classList.remove("accordion-no-smooth-scroll");
            if (rafId) cancelAnimationFrame(rafId);

            // pastikan posisi akhir tepat di bawah nav
            const finalAbsoluteTop = window.scrollY + trigger.getBoundingClientRect().top;
            const finalTargetTop = Math.max(0, Math.round(finalAbsoluteTop - getHeaderOffset()));
            window.scrollTo({
              top: finalTargetTop,
              behavior: "auto",
            });
          }
        }

        rafId = requestAnimationFrame(stabilizeOpen);
      });
    });
  });

  // =========================
  // PAPER TIMELINE
  // =========================
  const paperTimelineNodes = document.querySelectorAll(".paper-timeline-node");
  const paperTimelinePanels = document.querySelectorAll(".paper-timeline-panel");

  paperTimelineNodes.forEach((node) => {
    node.addEventListener("click", () => {
      const targetId = node.getAttribute("data-timeline");
      if (!targetId) return;

      const targetPanel = document.getElementById(targetId);
      if (!targetPanel) return;

      const isOpen = node.classList.contains("active");

      paperTimelineNodes.forEach((item) => item.classList.remove("active"));
      paperTimelinePanels.forEach((panel) => panel.classList.remove("active"));

      if (!isOpen) {
        node.classList.add("active");
        targetPanel.classList.add("active");
      }
    });
  });

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
});

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

  const isInNotes = window.location.pathname.includes("/notes/");
  const base = isInNotes ? "" : "notes/";

  const PAGES = [
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
  ];

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
// AUDIO PLAYER
// =========================
(function setupAudioPlayers() {
  document.querySelectorAll('.note-audio-player').forEach(function(player) {
    var audio = player.querySelector('.audio-src');
    var playBtn = player.querySelector('.audio-play-btn');
    var trackFill = player.querySelector('.audio-track-fill');
    var track = player.querySelector('.audio-track');
    var timeEl = player.querySelector('.audio-time');
    if (!audio || !playBtn) return;

    // --- Create sticky mini player (with close button) ---
    var sticky = document.createElement('div');
    sticky.className = 'audio-sticky';
    sticky.innerHTML =
      '<div class="audio-sticky-inner">' +
        '<span class="audio-sticky-label">🎧 Audio</span>' +
        '<button class="audio-skip-btn" data-skip="-10" aria-label="Undur 10 saat">\xAB 10s</button>' +
        '<button class="audio-play-btn" aria-label="Main audio"></button>' +
        '<button class="audio-skip-btn" data-skip="10" aria-label="Maju 10 saat">10s \xBB</button>' +
        '<div class="audio-track"><div class="audio-track-fill"></div></div>' +
        '<span class="audio-time">0:00 / --:--</span>' +
        '<button class="audio-sticky-close" aria-label="Tutup">\u2715</button>' +
      '</div>';
    document.body.appendChild(sticky);

    var stickyPlayBtn  = sticky.querySelector('.audio-play-btn');
    var stickyFill     = sticky.querySelector('.audio-track-fill');
    var stickyTrack    = sticky.querySelector('.audio-track');
    var stickyTimeEl   = sticky.querySelector('.audio-time');
    var stickyCloseBtn = sticky.querySelector('.audio-sticky-close');

    // --- State flags ---
    var hasPlayed    = false; // only show sticky after first press
    var dismissed    = false; // permanently hidden after ✕
    var isScrolledPast = false; // true only when player is ABOVE viewport

    function refreshSticky() {
      sticky.classList.toggle('is-visible', !dismissed && hasPlayed && isScrolledPast);
    }

    // --- Shared helpers ---
    function fmt(s) {
      if (!isFinite(s)) return '--:--';
      var m = Math.floor(s / 60), sec = Math.floor(s % 60);
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }
    function updateTime() {
      var t = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
      var pct = (audio.duration ? (audio.currentTime / audio.duration) * 100 : 0) + '%';
      timeEl.textContent = t;       trackFill.style.width = pct;
      stickyTimeEl.textContent = t; stickyFill.style.width = pct;
    }
    function setPlaying(on) {
      playBtn.classList.toggle('is-playing', on);
      stickyPlayBtn.classList.toggle('is-playing', on);
      var lbl = on ? 'Jeda audio' : 'Main audio';
      playBtn.setAttribute('aria-label', lbl);
      stickyPlayBtn.setAttribute('aria-label', lbl);
    }
    function togglePlay() {
      if (audio.paused) {
        audio.play(); setPlaying(true);
        if (!hasPlayed) { hasPlayed = true; }
        if (dismissed) { dismissed = false; }
        refreshSticky();
      } else {
        audio.pause(); setPlaying(false);
      }
    }
    function skip(secs) {
      audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + secs));
      updateTime();
    }
    function seekFromClick(e, el) {
      if (!audio.duration) return;
      var rect = el.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    }

    // --- Wire main player ---
    playBtn.addEventListener('click', togglePlay);
    player.querySelectorAll('.audio-skip-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { skip(parseInt(btn.getAttribute('data-skip'), 10)); });
    });
    track.addEventListener('click', function(e) { seekFromClick(e, track); });

    // --- Wire sticky player ---
    stickyPlayBtn.addEventListener('click', togglePlay);
    sticky.querySelectorAll('.audio-skip-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { skip(parseInt(btn.getAttribute('data-skip'), 10)); });
    });
    stickyTrack.addEventListener('click', function(e) { seekFromClick(e, stickyTrack); });

    // --- Close / dismiss — hide sticky but keep alive so next play can reshow it ---
    var stickyObserver = null;
    stickyCloseBtn.addEventListener('click', function() {
      dismissed = true;
      refreshSticky();
    });

    // --- Audio events ---
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);
    audio.addEventListener('ended', function() { setPlaying(false); updateTime(); });

    // --- Show sticky only when player is ABOVE viewport (scrolled past) ---
    if ('IntersectionObserver' in window) {
      stickyObserver = new IntersectionObserver(function(entries) {
        var entry = entries[0];
        isScrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        refreshSticky();
      }, { threshold: 0 });
      stickyObserver.observe(player);
    }
  });
})();

// =========================
// NOTE PAGE: SPARKLE MENU + READING PROGRESS
// =========================
(function setupNoteFeatures() {
  var THEME_KEY = 'hazimedu-theme';

  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function toggleTheme() {
    var next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    // Sync all display-fab buttons (including nav)
    document.querySelectorAll('.display-fab').forEach(function(btn) {
      btn.textContent = next === 'dark' ? '🌙' : '☀️';
    });
    return next;
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Skip if page already has its own sparkle menu (e.g. lab pages)
    if (document.querySelector('.note-sparkle-wrap')) return;

    // --- Hide nav dark mode button (moves into sparkle menu) ---
    document.querySelectorAll('.display-fab').forEach(function(btn) {
      btn.style.display = 'none';
    });

    // --- Build sparkle menu items ---
    var items = [];

    // Dark mode item (always)
    var dmEmoji = getCurrentTheme() === 'dark' ? '🌙' : '☀️';
    items.push({ emoji: dmEmoji, tooltip: 'Mod paparan', type: 'darkmode' });

    // Audio item (if audio player exists)
    var audioEl = document.querySelector('.note-audio-player .audio-src');
    if (audioEl) {
      items.push({ emoji: '🎧', tooltip: 'Main audio', type: 'audio' });
    }

    // Lab item — check data-lab-href on body, or fall back to inline entry
    var labHref = document.body.dataset.labHref ||
      (function() { var el = document.querySelector('#learning-lab-entry .btn[href]'); return el ? el.getAttribute('href') : null; })();
    if (labHref) {
      items.push({ emoji: '🎮', tooltip: 'Learning Lab', type: 'lab', href: labHref });
    }

    // --- Inject sparkle menu DOM ---
    var wrap = document.createElement('div');
    wrap.className = 'note-sparkle-wrap';

    var itemsContainer = document.createElement('div');
    itemsContainer.className = 'note-sparkle-items';

    items.forEach(function(item) {
      var el;
      if (item.type === 'lab') {
        el = document.createElement('a');
        el.href = item.href;
      } else {
        el = document.createElement('button');
        el.type = 'button';
      }
      el.className = 'note-sparkle-item';
      el.setAttribute('aria-label', item.tooltip);
      el.setAttribute('data-tooltip', item.tooltip);
      el.setAttribute('data-sparkle-type', item.type);
      el.textContent = item.emoji;
      itemsContainer.appendChild(el);
    });

    var fab = document.createElement('button');
    fab.className = 'note-sparkle-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Menu pembelajaran');
    fab.textContent = '✨';

    wrap.appendChild(itemsContainer);
    wrap.appendChild(fab);
    document.body.appendChild(wrap);

    // --- Toggle open/close ---
    fab.addEventListener('click', function(e) {
      e.stopPropagation();
      wrap.classList.toggle('is-open');
    });

    document.addEventListener('click', function(e) {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('is-open');
      }
    });

    // --- Wire item actions ---
    itemsContainer.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-sparkle-type]');
      if (!btn) return;
      var type = btn.getAttribute('data-sparkle-type');

      if (type === 'darkmode') {
        var next = toggleTheme();
        btn.textContent = next === 'dark' ? '🌙' : '☀️';
        wrap.classList.remove('is-open');
      }

      if (type === 'audio' && audioEl) {
        if (audioEl.paused) {
          audioEl.play();
        } else {
          audioEl.pause();
        }
        wrap.classList.remove('is-open');
      }

      if (type === 'lab') {
        wrap.classList.remove('is-open');
      }
    });

    // Sync audio button emoji with playback state
    if (audioEl) {
      var audioBtn = itemsContainer.querySelector('[data-sparkle-type="audio"]');
      audioEl.addEventListener('play', function() {
        if (audioBtn) audioBtn.textContent = '⏸️';
      });
      audioEl.addEventListener('pause', function() {
        if (audioBtn) audioBtn.textContent = '🎧';
      });
      audioEl.addEventListener('ended', function() {
        if (audioBtn) audioBtn.textContent = '🎧';
      });
    }
  });
})();
