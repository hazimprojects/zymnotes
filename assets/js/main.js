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
      items.push({ emoji: '⚗️', tooltip: 'Makmal Latihan', type: 'lab', href: labHref });
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

// ── Nota Feedback Widget ──────────────────────────────────────────────────────
(function () {
  // Only on subtopic note pages (e.g. /notes/bab-1-1.html)
  if (!window.location.pathname.match(/\/notes\/bab-\d+-\d+\.html/)) return;

  var STORAGE_KEY = 'hzfb-' + window.location.pathname;
  if (localStorage.getItem(STORAGE_KEY)) return; // already voted on this page

  // Inject styles once
  var style = document.createElement('style');
  style.textContent = [
    '.nota-feedback{text-align:center;padding:1.4rem 1rem 0.6rem;opacity:0;animation:nfb-in 0.4s ease 0.5s forwards}',
    '@keyframes nfb-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}',
    '.nota-feedback-label{margin:0 0 0.7rem;font-size:0.8rem;font-weight:700;color:#8c7d6a;letter-spacing:0.01em}',
    '.nota-feedback-options{display:flex;justify-content:center;gap:0.55rem}',
    '.nota-feedback-btn{width:46px;height:46px;border-radius:999px;border:1.5px solid rgba(92,110,132,0.14);background:rgba(255,253,248,0.9);font-size:1.3rem;cursor:pointer;transition:transform 0.14s ease,box-shadow 0.14s ease;display:inline-flex;align-items:center;justify-content:center;line-height:1}',
    '.nota-feedback-btn:hover{transform:scale(1.2);box-shadow:0 4px 14px rgba(0,0,0,0.08)}',
    '.nota-feedback-btn:active{transform:scale(0.95)}',
    '.nota-feedback-thanks{margin:0;font-size:0.86rem;font-weight:700;color:#2f7a67;animation:nfb-in 0.25s ease forwards;padding:1.2rem 1rem 0.6rem;text-align:center}',
    '[data-theme="dark"] .nota-feedback-label{color:#b8aea1}',
    '[data-theme="dark"] .nota-feedback-btn{background:rgba(50,48,44,0.9);border-color:rgba(220,210,190,0.13)}',
    '[data-theme="dark"] .nota-feedback-thanks{color:#7dd4be}'
  ].join('');
  document.head.appendChild(style);

  // Find the nav section at the bottom of the note
  var navSection = document.querySelector('.note-subsection .hero-actions');
  if (!navSection) return;
  var insertBefore = navSection.closest('.note-subsection');
  if (!insertBefore) return;

  // Build widget
  var widget = document.createElement('div');
  widget.className = 'nota-feedback';
  widget.innerHTML =
    '<p class="nota-feedback-label">Nota ini membantu?</p>' +
    '<div class="nota-feedback-options">' +
      '<button class="nota-feedback-btn" type="button" data-reaction="mudah" title="Mudah difahami">😊</button>' +
      '<button class="nota-feedback-btn" type="button" data-reaction="boleh-baik" title="Boleh diperbaiki">🤔</button>' +
      '<button class="nota-feedback-btn" type="button" data-reaction="kurang-jelas" title="Kurang jelas">😕</button>' +
    '</div>';

  insertBefore.parentNode.insertBefore(widget, insertBefore);

  widget.querySelectorAll('.nota-feedback-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var reaction = btn.getAttribute('data-reaction');
      // Fire GA4 custom event (GA already on every page)
      if (typeof gtag === 'function') {
        gtag('event', 'nota_reaction', { reaction: reaction, page_path: window.location.pathname });
      }
      localStorage.setItem(STORAGE_KEY, reaction);
      var thanks = document.createElement('p');
      thanks.className = 'nota-feedback-thanks';
      thanks.textContent = 'Terima kasih! 🙏';
      widget.replaceWith(thanks);
    });
  });
})();

// ── Personal Identity (Phase 1) ───────────────────────────────────────────────
(function () {
  var NAME_KEY   = 'hzedu-name';
  var QUOTES_KEY = 'hzedu-quotes';

  var DEFAULT_QUOTES = [
    'Sedikit demi sedikit, lama-lama menjadi bukit.',
    'Ilmu itu cahaya. Semakin kamu belajar, semakin terang jalanmu.',
    'Ulang kaji hari ini, keyakinan esok hari.',
    'Setiap minit yang kamu luangkan hari ini adalah pelaburan untuk masa hadapan.',
    'Bukan soal cerdas atau tidak — soal usaha dan istiqamah.'
  ];

  // Inject shared styles once
  var ps = document.createElement('style');
  ps.textContent = [
    // Greeting chip on homepage
    '.hzedu-greeting{display:inline-flex;align-items:center;gap:0.4rem;font-size:0.82rem;font-weight:800;color:#2f7a67;background:rgba(47,122,103,0.08);border:1px solid rgba(47,122,103,0.18);border-radius:999px;padding:0.3rem 0.8rem;margin-bottom:0.7rem;animation:ps-in 0.4s ease forwards}',
    '[data-theme="dark"] .hzedu-greeting{color:#7dd4be;background:rgba(47,122,103,0.14);border-color:rgba(47,122,103,0.26)}',
    // Quote banner on note pages
    '.hzedu-quote{margin:0.9rem 0 0;padding:0.72rem 1rem;border-left:3px solid rgba(47,122,103,0.35);border-radius:0 10px 10px 0;background:rgba(47,122,103,0.05);font-size:0.83rem;font-style:italic;color:#5a4f42;line-height:1.6;animation:ps-in 0.4s ease 0.2s both}',
    '[data-theme="dark"] .hzedu-quote{background:rgba(47,122,103,0.09);border-left-color:rgba(47,122,103,0.4);color:#b8aea1}',
    // Name setup card
    '.hzedu-setup{position:fixed;bottom:0;left:0;right:0;z-index:200;padding:1.2rem 1.25rem 1.6rem;background:rgba(247,244,238,0.97);border-top:1px solid rgba(92,110,132,0.12);box-shadow:0 -8px 30px rgba(70,60,40,0.1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.34,1.26,0.64,1);max-width:520px;margin:0 auto;border-radius:20px 20px 0 0}',
    '.hzedu-setup.is-visible{transform:translateY(0)}',
    '[data-theme="dark"] .hzedu-setup{background:rgba(30,28,26,0.97);border-top-color:rgba(255,255,255,0.07)}',
    '.hzedu-setup-title{margin:0 0 0.15rem;font-size:1rem;font-weight:900;color:#1e2a34}',
    '[data-theme="dark"] .hzedu-setup-title{color:#f0e8da}',
    '.hzedu-setup-sub{margin:0 0 0.9rem;font-size:0.8rem;color:#8c7d6a}',
    '[data-theme="dark"] .hzedu-setup-sub{color:#a89a8c}',
    '.hzedu-setup-row{display:flex;gap:0.55rem}',
    '.hzedu-setup-input{flex:1;padding:0.6rem 0.85rem;border-radius:12px;border:1.5px solid rgba(92,110,132,0.2);background:#fff;font-family:inherit;font-size:0.88rem;font-weight:700;color:#1e2a34;outline:none}',
    '.hzedu-setup-input:focus{border-color:#2f7a67}',
    '[data-theme="dark"] .hzedu-setup-input{background:#2a2824;border-color:rgba(220,210,190,0.15);color:#e8e0d4}',
    '.hzedu-setup-btn{padding:0.6rem 1.1rem;border-radius:12px;background:#2f7a67;color:#fff;border:none;font-family:inherit;font-size:0.88rem;font-weight:800;cursor:pointer}',
    '.hzedu-setup-close{position:absolute;top:0.9rem;right:1rem;background:none;border:none;font-size:1.1rem;cursor:pointer;color:#9b8f82;line-height:1;padding:0.2rem}',
    // Quote panel in sparkle
    '.hzedu-quote-sheet{position:fixed;inset:0;z-index:300;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,0.3);opacity:0;pointer-events:none;transition:opacity 0.25s}',
    '.hzedu-quote-sheet.is-open{opacity:1;pointer-events:all}',
    '.hzedu-quote-inner{background:#f7f4ee;border-radius:22px 22px 0 0;padding:1.3rem 1.25rem 2rem;max-height:75dvh;overflow-y:auto;transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.34,1.26,0.64,1)}',
    '[data-theme="dark"] .hzedu-quote-inner{background:#1e1c1a}',
    '.hzedu-quote-sheet.is-open .hzedu-quote-inner{transform:translateY(0)}',
    '.hzedu-quote-sheet-title{margin:0 0 1rem;font-size:1rem;font-weight:900;color:#1e2a34}',
    '[data-theme="dark"] .hzedu-quote-sheet-title{color:#f0e8da}',
    '.hzedu-quote-list{list-style:none;margin:0 0 1rem;padding:0;display:flex;flex-direction:column;gap:0.5rem}',
    '.hzedu-quote-item{display:flex;align-items:flex-start;gap:0.6rem;padding:0.65rem 0.8rem;border-radius:12px;background:rgba(47,122,103,0.06);font-size:0.83rem;font-style:italic;color:#5a4f42;line-height:1.55}',
    '[data-theme="dark"] .hzedu-quote-item{background:rgba(47,122,103,0.1);color:#b8aea1}',
    '.hzedu-quote-del{background:none;border:none;font-size:0.9rem;cursor:pointer;color:#c0a090;padding:0;line-height:1;flex-shrink:0;margin-left:auto}',
    '.hzedu-quote-add-row{display:flex;gap:0.5rem;margin-top:0.6rem}',
    '.hzedu-quote-add-input{flex:1;padding:0.6rem 0.8rem;border-radius:11px;border:1.5px solid rgba(92,110,132,0.18);background:#fff;font-family:inherit;font-size:0.82rem;font-style:italic;color:#1e2a34;outline:none}',
    '.hzedu-quote-add-input:focus{border-color:#2f7a67}',
    '[data-theme="dark"] .hzedu-quote-add-input{background:#2a2824;border-color:rgba(220,210,190,0.14);color:#e8e0d4}',
    '.hzedu-quote-add-btn{padding:0.6rem 0.9rem;border-radius:11px;background:#2f7a67;color:#fff;border:none;font-family:inherit;font-size:0.82rem;font-weight:800;cursor:pointer}',
    '@keyframes ps-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}'
  ].join('');
  document.head.appendChild(ps);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getName()   { return localStorage.getItem(NAME_KEY) || ''; }
  function getQuotes() {
    try { return JSON.parse(localStorage.getItem(QUOTES_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveQuotes(arr) { localStorage.setItem(QUOTES_KEY, JSON.stringify(arr)); }
  function pickQuote() {
    var q = getQuotes();
    var pool = q.length ? q : DEFAULT_QUOTES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ── 1. Homepage greeting ──────────────────────────────────────────────────
  var isHome = window.location.pathname === '/' ||
               window.location.pathname.endsWith('/index.html') && !window.location.pathname.includes('/notes/');
  if (isHome) {
    document.addEventListener('DOMContentLoaded', function () {
      var name = getName();
      if (!name) {
        // Show name-setup card after 1.8s (first visit feel)
        setTimeout(showSetupCard, 1800);
        return;
      }
      // Inject greeting before <h1> in .hero-copy
      var heroCopy = document.querySelector('.hero-copy');
      if (!heroCopy) return;
      var h1 = heroCopy.querySelector('h1');
      if (!h1) return;
      var chip = document.createElement('div');
      chip.className = 'hzedu-greeting';
      chip.textContent = 'Selamat datang semula, ' + name + ' \uD83D\uDC4B';
      heroCopy.insertBefore(chip, h1);
    });
  }

  // ── 2. Name setup card ────────────────────────────────────────────────────
  function showSetupCard() {
    if (document.getElementById('hzedu-setup')) return;
    var card = document.createElement('div');
    card.className = 'hzedu-setup';
    card.id = 'hzedu-setup';
    card.innerHTML =
      '<button class="hzedu-setup-close" id="hzedu-setup-close" aria-label="Tutup">\u2715</button>' +
      '<p class="hzedu-setup-title">Siapa nama kamu? \uD83D\uDC4B</p>' +
      '<p class="hzedu-setup-sub">Nama ini hanya disimpan di peranti kamu sahaja.</p>' +
      '<div class="hzedu-setup-row">' +
        '<input class="hzedu-setup-input" id="hzedu-name-input" type="text" placeholder="Nama atau gelaran..." maxlength="30" autocomplete="off" />' +
        '<button class="hzedu-setup-btn" id="hzedu-name-save">Simpan</button>' +
      '</div>';
    document.body.appendChild(card);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { card.classList.add('is-visible'); });
    });

    document.getElementById('hzedu-setup-close').addEventListener('click', function () {
      card.classList.remove('is-visible');
      setTimeout(function () { card.remove(); }, 350);
    });

    function saveName() {
      var val = document.getElementById('hzedu-name-input').value.trim();
      if (!val) return;
      localStorage.setItem(NAME_KEY, val);
      card.classList.remove('is-visible');
      setTimeout(function () {
        card.remove();
        // Show greeting immediately
        var heroCopy = document.querySelector('.hero-copy');
        if (!heroCopy) return;
        var h1 = heroCopy.querySelector('h1');
        if (!h1) return;
        var chip = document.createElement('div');
        chip.className = 'hzedu-greeting';
        chip.textContent = 'Selamat datang, ' + val + ' \uD83D\uDC4B';
        heroCopy.insertBefore(chip, h1);
      }, 350);
    }

    document.getElementById('hzedu-name-save').addEventListener('click', saveName);
    document.getElementById('hzedu-name-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') saveName();
    });
    setTimeout(function () {
      var inp = document.getElementById('hzedu-name-input');
      if (inp) inp.focus();
    }, 400);
  }

  // ── 3. Motivational quote on note pages ───────────────────────────────────
  var isNotePage = window.location.pathname.match(/\/notes\/bab-\d+-\d+\.html/);
  if (isNotePage) {
    document.addEventListener('DOMContentLoaded', function () {
      var lead = document.querySelector('.page-hero .lead, .note-hero .lead');
      if (!lead) return;
      var quote = pickQuote();
      var el = document.createElement('p');
      el.className = 'hzedu-quote';
      el.textContent = '\u201C' + quote + '\u201D';
      lead.after(el);
    });
  }

  // ── 4. Quote management via sparkle menu ──────────────────────────────────
  // Attach to existing sparkle — inject ✍️ item and handle sheet
  document.addEventListener('DOMContentLoaded', function () {
    // Only on pages that have the sparkle menu
    var sparkleItems = document.querySelector('.note-sparkle-items');
    if (!sparkleItems) return;

    // Add ✍️ button
    var quoteBtn = document.createElement('button');
    quoteBtn.className = 'note-sparkle-item';
    quoteBtn.type = 'button';
    quoteBtn.setAttribute('data-tooltip', 'Kata Motivasi');
    quoteBtn.textContent = '\u270D\uFE0F';
    sparkleItems.appendChild(quoteBtn);

    // Build sheet
    var sheet = document.createElement('div');
    sheet.className = 'hzedu-quote-sheet';
    sheet.id = 'hzedu-quote-sheet';
    sheet.innerHTML =
      '<div class="hzedu-quote-inner">' +
        '<p class="hzedu-quote-sheet-title">\u270D\uFE0F Kata Motivasi Kamu</p>' +
        '<ul class="hzedu-quote-list" id="hzedu-qlist"></ul>' +
        '<div class="hzedu-quote-add-row">' +
          '<input class="hzedu-quote-add-input" id="hzedu-qadd" type="text" placeholder="Tambah kata-kata baru..." maxlength="120" />' +
          '<button class="hzedu-quote-add-btn" id="hzedu-qadd-btn">+</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(sheet);

    function renderList() {
      var list = document.getElementById('hzedu-qlist');
      if (!list) return;
      var quotes = getQuotes();
      list.innerHTML = quotes.length
        ? quotes.map(function (q, i) {
            return '<li class="hzedu-quote-item">\u201C' + q + '\u201D' +
              '<button class="hzedu-quote-del" data-idx="' + i + '" aria-label="Padam">\uD83D\uDDD1\uFE0F</button></li>';
          }).join('')
        : '<li style="font-size:0.8rem;color:#a89a8c;font-style:normal;padding:0.3rem 0">Tiada kata-kata disimpan lagi.</li>';
      list.querySelectorAll('.hzedu-quote-del').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.getAttribute('data-idx'), 10);
          var q = getQuotes();
          q.splice(idx, 1);
          saveQuotes(q);
          renderList();
        });
      });
    }

    function openSheet() {
      renderList();
      sheet.classList.add('is-open');
      var wrap = document.querySelector('.note-sparkle-wrap');
      if (wrap) wrap.classList.remove('is-open');
    }
    function closeSheet() { sheet.classList.remove('is-open'); }

    quoteBtn.addEventListener('click', openSheet);
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet) closeSheet();
    });

    document.getElementById('hzedu-qadd-btn').addEventListener('click', function () {
      var inp = document.getElementById('hzedu-qadd');
      var val = inp.value.trim();
      if (!val) return;
      var q = getQuotes();
      if (q.length >= 10) return;
      q.push(val);
      saveQuotes(q);
      inp.value = '';
      renderList();
    });
    document.getElementById('hzedu-qadd').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('hzedu-qadd-btn').click();
    });
  });
})();

// ── PWA Install Nudge ─────────────────────────────────────────────────────────
(function () {
  // Skip if already running as installed PWA
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (navigator.standalone) return; // iOS standalone check

  var DISMISSED_KEY = 'hzedu-pwa-dismissed-until';
  var dismissed = localStorage.getItem(DISMISSED_KEY);
  if (dismissed && Date.now() < parseInt(dismissed, 10)) return;

  var ua        = navigator.userAgent;
  var isIOS     = /iphone|ipad|ipod/i.test(ua);
  var isSafari  = isIOS && /safari/i.test(ua) && !/crios|fxios|opios/i.test(ua);
  var isAndroid = /android/i.test(ua);

  // Only show on platforms that support PWA install
  if (!isSafari && !isAndroid) return;

  var deferredPrompt = null;
  if (isAndroid) {
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
    });
  }

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '.pwa-nudge{position:fixed;bottom:1rem;left:50%;transform:translateX(-50%) translateY(calc(100% + 1.5rem));z-index:250;width:calc(100% - 2rem);max-width:400px;background:rgba(247,244,238,0.97);border:1px solid rgba(92,110,132,0.13);border-radius:20px;box-shadow:0 8px 32px rgba(70,60,40,0.14);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:1rem 1rem 1rem 0.9rem;display:flex;align-items:flex-start;gap:0.75rem;transition:transform 0.4s cubic-bezier(0.34,1.26,0.64,1),opacity 0.4s ease;opacity:0}',
    '.pwa-nudge.is-visible{transform:translateX(-50%) translateY(0);opacity:1}',
    '[data-theme="dark"] .pwa-nudge{background:rgba(28,26,24,0.97);border-color:rgba(255,255,255,0.08);box-shadow:0 8px 32px rgba(0,0,0,0.3)}',
    '.pwa-nudge-icon{width:40px;height:40px;border-radius:11px;flex-shrink:0;overflow:hidden}',
    '.pwa-nudge-icon svg{width:40px;height:40px}',
    '.pwa-nudge-body{flex:1;min-width:0}',
    '.pwa-nudge-title{margin:0 0 0.12rem;font-size:0.87rem;font-weight:900;color:#1e2a34;line-height:1.2}',
    '[data-theme="dark"] .pwa-nudge-title{color:#f0e8da}',
    '.pwa-nudge-sub{margin:0 0 0.65rem;font-size:0.76rem;color:#7b6d59;line-height:1.4}',
    '[data-theme="dark"] .pwa-nudge-sub{color:#a89a8c}',
    '.pwa-nudge-ios{margin:0 0 0.65rem;font-size:0.76rem;color:#7b6d59;line-height:1.55;display:flex;align-items:center;gap:0.3rem;flex-wrap:wrap}',
    '[data-theme="dark"] .pwa-nudge-ios{color:#a89a8c}',
    '.pwa-nudge-ios-share{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#2f7a67;border-radius:4px;flex-shrink:0}',
    '.pwa-nudge-actions{display:flex;gap:0.45rem;align-items:center}',
    '.pwa-nudge-btn{padding:0.42rem 0.9rem;border-radius:999px;background:#2f7a67;color:#fff;border:none;font-family:inherit;font-size:0.78rem;font-weight:800;cursor:pointer;white-space:nowrap}',
    '.pwa-nudge-skip{background:none;border:none;font-family:inherit;font-size:0.75rem;color:#9b8f82;cursor:pointer;padding:0.4rem 0.3rem}',
    '[data-theme="dark"] .pwa-nudge-skip{color:#6a6058}',
    '.pwa-nudge-close{background:none;border:none;font-size:1rem;color:#a89a8c;cursor:pointer;padding:0.1rem 0.2rem;line-height:1;flex-shrink:0;margin-top:-0.1rem}'
  ].join('');
  document.head.appendChild(style);

  function dismiss(days) {
    var until = Date.now() + (days || 14) * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, until);
    var nudge = document.getElementById('pwa-nudge');
    if (nudge) {
      nudge.classList.remove('is-visible');
      setTimeout(function () { nudge.remove(); }, 420);
    }
  }

  function buildNudge() {
    var iconSVG =
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="100" height="100" rx="22" fill="#2f7a67"/>' +
        '<rect x="18" y="24" width="13" height="52" rx="3" fill="white"/>' +
        '<rect x="69" y="24" width="13" height="52" rx="3" fill="white"/>' +
        '<path d="M31 44 Q50 38 69 44 L69 56 Q50 50 31 56 Z" fill="white"/>' +
        '<circle cx="50" cy="21" r="3.2" fill="rgba(255,255,255,0.55)"/>' +
        '<circle cx="58" cy="16" r="2" fill="rgba(255,255,255,0.35)"/>' +
        '<circle cx="42" cy="16" r="2" fill="rgba(255,255,255,0.35)"/>' +
      '</svg>';

    var nudge = document.createElement('div');
    nudge.className = 'pwa-nudge';
    nudge.id = 'pwa-nudge';
    nudge.setAttribute('role', 'complementary');
    nudge.setAttribute('aria-label', 'Jemput simpan sebagai app');

    if (isAndroid) {
      nudge.innerHTML =
        '<div class="pwa-nudge-icon">' + iconSVG + '</div>' +
        '<div class="pwa-nudge-body">' +
          '<p class="pwa-nudge-title">Simpan HazimEdu ke telefon</p>' +
          '<p class="pwa-nudge-sub">Buka terus dari skrin utama, tanpa perlu ingat alamat web.</p>' +
          '<div class="pwa-nudge-actions">' +
            '<button class="pwa-nudge-btn" id="pwa-install-btn">Simpan sebagai app</button>' +
            '<button class="pwa-nudge-skip" id="pwa-skip-btn">Mungkin lain kali</button>' +
          '</div>' +
        '</div>' +
        '<button class="pwa-nudge-close" id="pwa-close-btn" aria-label="Tutup">\u2715</button>';
    } else {
      // iOS — manual instruction
      var shareIcon =
        '<span class="pwa-nudge-ios-share">' +
          '<svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M5.5 8.5V1M5.5 1L3 3.5M5.5 1L8 3.5" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<rect x="1" y="5" width="9" height="7" rx="1.5" stroke="white" stroke-width="1.4"/>' +
          '</svg>' +
        '</span>';
      nudge.innerHTML =
        '<div class="pwa-nudge-icon">' + iconSVG + '</div>' +
        '<div class="pwa-nudge-body">' +
          '<p class="pwa-nudge-title">Simpan HazimEdu ke skrin utama</p>' +
          '<p class="pwa-nudge-ios">Ketik ' + shareIcon + ' lalu pilih <strong>&ldquo;Add to Home Screen&rdquo;</strong></p>' +
          '<div class="pwa-nudge-actions">' +
            '<button class="pwa-nudge-skip" id="pwa-skip-btn">Faham, terima kasih</button>' +
          '</div>' +
        '</div>' +
        '<button class="pwa-nudge-close" id="pwa-close-btn" aria-label="Tutup">\u2715</button>';
    }

    document.body.appendChild(nudge);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { nudge.classList.add('is-visible'); });
    });

    document.getElementById('pwa-close-btn').addEventListener('click', function () { dismiss(14); });
    document.getElementById('pwa-skip-btn').addEventListener('click', function () { dismiss(14); });

    if (isAndroid) {
      document.getElementById('pwa-install-btn').addEventListener('click', function () {
        if (!deferredPrompt) { dismiss(14); return; }
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (result) {
          if (result.outcome === 'accepted') {
            localStorage.setItem(DISMISSED_KEY, Date.now() + 365 * 24 * 60 * 60 * 1000);
          } else {
            dismiss(14);
          }
          deferredPrompt = null;
          var nudge = document.getElementById('pwa-nudge');
          if (nudge) { nudge.classList.remove('is-visible'); setTimeout(function () { nudge.remove(); }, 420); }
        });
      });
    }
  }

  // Show after 7s — enough time to read content, not too intrusive
  function tryShow() {
    // For Android, only show if deferredPrompt was captured
    if (isAndroid && !deferredPrompt) return;
    buildNudge();
  }

  // Android: wait for beforeinstallprompt + 7s
  // iOS Safari: just wait 7s (no prompt event)
  if (isIOS && isSafari) {
    setTimeout(buildNudge, 7000);
  } else {
    setTimeout(tryShow, 7000);
    // Also listen in case prompt fires after our timer
    window.addEventListener('beforeinstallprompt', function () {
      if (!document.getElementById('pwa-nudge')) setTimeout(tryShow, 1000);
    });
  }
})();
