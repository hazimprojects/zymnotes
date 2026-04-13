document.documentElement.classList.add("js-enhanced");

// Apply handedness class before first paint to avoid layout flash
(function () {
  if (localStorage.getItem("hzedu-hand") === "left") {
    document.body
      ? document.body.classList.add("hand-left")
      : document.addEventListener("DOMContentLoaded", function () {
          document.body.classList.add("hand-left");
        });
  }
})();

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

  function getOwnAccordionPanel(item) {
    return item.querySelector(":scope > .paper-accordion-panel");
  }

  function getOwnAccordionTrigger(item) {
    return item.querySelector(":scope > .paper-accordion-trigger");
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

  accordionTriggers.forEach((trigger) => {
    const item = trigger.closest(".paper-accordion-item");
    const panel = item ? getOwnAccordionPanel(item) : null;

    if (trigger) {
      trigger.setAttribute(
        "aria-expanded",
        item && item.classList.contains("is-open") ? "true" : "false"
      );
    }

    if (panel && !item.classList.contains("is-open")) {
      panel.style.maxHeight = "0px";
      panel.style.opacity = "0";
      panel.style.overflow = "hidden";
    }

    if (panel && item.classList.contains("is-open")) {
      panel.classList.add("active");
      panel.style.maxHeight = "none";
      panel.style.opacity = "1";
      panel.style.overflow = "visible";
    }
  });

  accordionTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const currentItem = trigger.closest(".paper-accordion-item");
      const accordionGroup = trigger.closest(".paper-accordion");
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
  });

  window.addEventListener("resize", refreshOpenAccordions);

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

    var hasPlayed = false;
    var dismissed = false;
    var isScrolledPast = false;

    function refreshSticky() {
      sticky.classList.toggle('is-visible', !dismissed && hasPlayed && isScrolledPast);
    }

    function fmt(s) {
      if (!isFinite(s)) return '--:--';
      var m = Math.floor(s / 60), sec = Math.floor(s % 60);
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function updateTime() {
      var t = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
      var pct = (audio.duration ? (audio.currentTime / audio.duration) * 100 : 0) + '%';
      timeEl.textContent = t;
      trackFill.style.width = pct;
      stickyTimeEl.textContent = t;
      stickyFill.style.width = pct;
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
        audio.play();
        setPlaying(true);
        if (!hasPlayed) hasPlayed = true;
        if (dismissed) dismissed = false;
        refreshSticky();
      } else {
        audio.pause();
        setPlaying(false);
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

    playBtn.addEventListener('click', togglePlay);
    player.querySelectorAll('.audio-skip-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        skip(parseInt(btn.getAttribute('data-skip'), 10));
      });
    });
    track.addEventListener('click', function(e) {
      seekFromClick(e, track);
    });

    stickyPlayBtn.addEventListener('click', togglePlay);
    sticky.querySelectorAll('.audio-skip-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        skip(parseInt(btn.getAttribute('data-skip'), 10));
      });
    });
    stickyTrack.addEventListener('click', function(e) {
      seekFromClick(e, stickyTrack);
    });

    stickyCloseBtn.addEventListener('click', function() {
      dismissed = true;
      refreshSticky();
    });

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);
    audio.addEventListener('ended', function() {
      setPlaying(false);
      updateTime();
    });

    if ('IntersectionObserver' in window) {
      var stickyObserver = new IntersectionObserver(function(entries) {
        var entry = entries[0];
        isScrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        refreshSticky();
      }, { threshold: 0 });
      stickyObserver.observe(player);
    }
  });
})();

// =========================
// NOTE PAGE: SPARKLE MENU — draggable corner FAB
// =========================
(function setupNoteFeatures() {
  document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.note-sparkle-wrap')) return;

    var audioEl = document.querySelector('.note-audio-player .audio-src');
    var labHref = document.body.dataset.labHref ||
      (function() {
        var el = document.querySelector('#learning-lab-entry .btn[href]');
        return el ? el.getAttribute('href') : null;
      })();

    // Only show sparkle if there's at least one item
    if (!audioEl && !labHref) return;

    var wrap = document.createElement('div');
    wrap.className = 'note-sparkle-wrap';

    var itemsContainer = document.createElement('div');
    itemsContainer.className = 'note-sparkle-items';

    function makeSparkleItem(svgIcon, tooltip, type, href) {
      var el = href ? document.createElement('a') : document.createElement('button');
      if (href) { el.href = href; }
      else { el.type = 'button'; }
      el.className = 'note-sparkle-item';
      el.setAttribute('aria-label', tooltip);
      el.setAttribute('data-tooltip', tooltip);
      el.setAttribute('data-sparkle-type', type);
      el.innerHTML = svgIcon;
      return el;
    }

    if (audioEl) itemsContainer.appendChild(makeSparkleItem(HZ_ICONS.audio, 'Main audio', 'audio'));
    if (labHref) itemsContainer.appendChild(makeSparkleItem(HZ_ICONS.archive, 'Arkib', 'lab', labHref));

    var fab = document.createElement('button');
    fab.className = 'note-sparkle-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Menu pembelajaran');
    fab.innerHTML = HZ_ICONS.sparkle;

    wrap.appendChild(itemsContainer);
    wrap.appendChild(fab);
    document.body.appendChild(wrap);

    // ── Corner Position ───────────────────────────────────────────────
    var FAB_KEY = 'hzedu-fab-corner';
    var corner = localStorage.getItem(FAB_KEY) || 'br';
    wrap.classList.add('fab-corner-' + corner);

    function snapToCorner(c) {
      ['br','bl','tr','tl'].forEach(function(cc) { wrap.classList.remove('fab-corner-' + cc); });
      wrap.style.cssText = '';
      corner = c;
      localStorage.setItem(FAB_KEY, corner);
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

    // ── Menu Toggle (tap only) ────────────────────────────────────────
    fab.addEventListener('click', function(e) {
      e.stopPropagation();
      if (didDrag) return;
      wrap.classList.toggle('is-open');
    });

    document.addEventListener('click', function(e) {
      if (!wrap.contains(e.target)) wrap.classList.remove('is-open');
    });

    // ── Item Actions ──────────────────────────────────────────────────
    itemsContainer.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-sparkle-type]');
      if (!btn) return;
      var type = btn.getAttribute('data-sparkle-type');
      if (type === 'audio' && audioEl) {
        audioEl.paused ? audioEl.play() : audioEl.pause();
        wrap.classList.remove('is-open');
      }
      if (type === 'lab') {
        wrap.classList.remove('is-open');
      }
    });

    // ── Audio Icon Sync ───────────────────────────────────────────────
    if (audioEl) {
      var audioBtn = itemsContainer.querySelector('[data-sparkle-type="audio"]');
      audioEl.addEventListener('play',  function() { if (audioBtn) audioBtn.innerHTML = HZ_ICONS.audioPause; });
      audioEl.addEventListener('pause', function() { if (audioBtn) audioBtn.innerHTML = HZ_ICONS.audio; });
      audioEl.addEventListener('ended', function() { if (audioBtn) audioBtn.innerHTML = HZ_ICONS.audio; });
    }
  });
})();

// ── Nota Feedback Widget ──────────────────────────────────────────────────────
(function () {
  if (!window.location.pathname.match(/\/notes\/bab-\d+-\d+\.html/)) return;

  var STORAGE_KEY = 'hzfb-' + window.location.pathname;
  if (localStorage.getItem(STORAGE_KEY)) return;

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

  var navSection = document.querySelector('.note-subsection .hero-actions');
  if (!navSection) return;
  var insertBefore = navSection.closest('.note-subsection');
  if (!insertBefore) return;

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

// ── PWA Install Nudge ─────────────────────────────────────────────────────────
(function () {
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (navigator.standalone) return;

  var DISMISSED_KEY = 'hzedu-pwa-dismissed-until';
  var dismissed = localStorage.getItem(DISMISSED_KEY);
  if (dismissed && Date.now() < parseInt(dismissed, 10)) return;

  var ua        = navigator.userAgent;
  var isIOS     = /iphone|ipad|ipod/i.test(ua);
  var isSafari  = isIOS && /safari/i.test(ua) && !/crios|fxios|opios/i.test(ua);
  var isAndroid = /android/i.test(ua);

  if (!isSafari && !isAndroid) return;

  var deferredPrompt = null;
  if (isAndroid) {
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
    });
  }

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

  function tryShow() {
    if (isAndroid && !deferredPrompt) return;
    buildNudge();
  }

  if (isIOS && isSafari) {
    setTimeout(buildNudge, 7000);
  } else {
    setTimeout(tryShow, 7000);
    window.addEventListener('beforeinstallprompt', function () {
      if (!document.getElementById('pwa-nudge')) setTimeout(tryShow, 1000);
    });
  }
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
      img.src = '/icons/icon.svg';
      img.alt = '';
      img.width = 22;
      img.height = 22;
      img.className = 'brand-icon';
      el.insertBefore(img, el.firstChild);
    });

    document.querySelectorAll('.footer-brand').forEach(function (el) {
      var img = document.createElement('img');
      img.src = '/icons/icon.svg';
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
  var isNotePage = /\/notes\/bab-\d+-\d+\.html$/.test(location.pathname);
  if (!isNotePage) return;
  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.createElement('div');
    bar.className = 'reading-progress-bar is-active';
    var header = document.querySelector('.site-header');
    if (header) header.appendChild(bar);
    var raf;
    window.addEventListener('scroll', function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var scrolled = window.scrollY;
        var total = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (total > 0 ? Math.min(scrolled / total * 100, 100) : 0) + '%';
      });
    }, { passive: true });
  });
})();

// ── Keyboard Shortcuts: ← → prev/next on note pages ─────────────────────────
(function () {
  var isNotePage = /\/notes\/bab-\d+(-\d+)?\.html$/.test(location.pathname);
  if (!isNotePage) return;
  document.addEventListener('keydown', function (e) {
    if (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(document.activeElement.tagName) !== -1) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var actions = document.querySelectorAll('.hero-actions a.btn');
    if (!actions.length) return;
    if (e.key === 'ArrowRight') actions[actions.length - 1].click();
    if (e.key === 'ArrowLeft')  actions[0].click();
  });
})();

// ── SVG Icon Library ──────────────────────────────────────────────────────────
var HZ_ICONS = (function () {
  var s = ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  return {
    home:    '<svg viewBox="0 0 24 24"' + s + '><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    notes:   '<svg viewBox="0 0 24 24"' + s + '><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
    search:  '<svg viewBox="0 0 24 24"' + s + '><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    sun:     '<svg viewBox="0 0 24 24"' + s + '><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon:    '<svg viewBox="0 0 24 24"' + s + '><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H23l-7.5 5.4 2.4 7.5L12 17.7l-5.9 4.6 2.4-7.5L1 9.4h8.6L12 2z"/></svg>',
    audio:      '<svg viewBox="0 0 24 24"' + s + '><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>',
    audioPause: '<svg viewBox="0 0 24 24"' + s + '><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    archive: '<svg viewBox="0 0 24 24"' + s + '><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
    close:   '<svg viewBox="0 0 24 24"' + s + '><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };
})();

// ── Global Search Overlay ─────────────────────────────────────────────────────
(function () {
  var PAGES = [
    { title: 'Bab 1 · Warisan Negara Bangsa', tag: 'Bab Induk', href: 'bab-1.html' },
    { title: '1.1 · Latar Belakang Negara Bangsa Sebelum Kedatangan Barat', tag: 'Subtopik 1.1', href: 'bab-1-1.html' },
    { title: '1.2 · Ciri-ciri Negara Bangsa Kesultanan Melayu Melaka', tag: 'Subtopik 1.2', href: 'bab-1-2.html' },
    { title: '1.3 · Keunggulan Sistem Pentadbiran dan Undang-undang', tag: 'Subtopik 1.3', href: 'bab-1-3.html' },
    { title: '1.4 · Peranan Pemerintah dan Rakyat', tag: 'Subtopik 1.4', href: 'bab-1-4.html' },
    { title: 'Bab 2 · Kebangkitan Nasionalisme', tag: 'Bab Induk', href: 'bab-2.html' },
    { title: '2.1 · Maksud Nasionalisme', tag: 'Subtopik 2.1', href: 'bab-2-1.html' },
    { title: '2.2 · Perkembangan Idea Nasionalisme di Barat', tag: 'Subtopik 2.2', href: 'bab-2-2.html' },
    { title: '2.3 · Perkembangan Nasionalisme di Asia', tag: 'Subtopik 2.3', href: 'bab-2-3.html' },
    { title: '2.4 · Perkembangan Nasionalisme di Asia Tenggara', tag: 'Subtopik 2.4', href: 'bab-2-4.html' },
    { title: '2.5 · Kesedaran Nasionalisme di Negara Kita', tag: 'Subtopik 2.5', href: 'bab-2-5.html' },
    { title: '2.6 · Faktor Kemunculan Gerakan Nasionalisme', tag: 'Subtopik 2.6', href: 'bab-2-6.html' },
    { title: '2.7 · Perkembangan Nasionalisme', tag: 'Subtopik 2.7', href: 'bab-2-7.html' },
    { title: '2.8 · Kesan Perkembangan Nasionalisme', tag: 'Subtopik 2.8', href: 'bab-2-8.html' },
    { title: 'Bab 3 · Konflik Dunia dan Pendudukan Jepun di Negara Kita', tag: 'Bab Induk', href: 'bab-3.html' },
    { title: '3.1 · Nasionalisme di Negara Kita Sebelum Perang Dunia', tag: 'Subtopik 3.1', href: 'bab-3-1.html' },
    { title: '3.2 · Latar Belakang Perang Dunia', tag: 'Subtopik 3.2', href: 'bab-3-2.html' },
    { title: '3.3 · Perang Dunia Kedua', tag: 'Subtopik 3.3', href: 'bab-3-3.html' },
    { title: '3.4 · Perang Dunia Kedua di Asia Pasifik', tag: 'Subtopik 3.4', href: 'bab-3-4.html' },
    { title: '3.5 · Faktor Kedatangan Jepun ke Negara Kita', tag: 'Subtopik 3.5', href: 'bab-3-5.html' },
    { title: '3.6 · Dasar Pendudukan Jepun di Negara Kita', tag: 'Subtopik 3.6', href: 'bab-3-6.html' },
    { title: '3.7 · Perjuangan Rakyat Menentang Pendudukan Jepun', tag: 'Subtopik 3.7', href: 'bab-3-7.html' },
    { title: '3.8 · Perkembangan Gerakan Nasionalisme Tempatan dan Pendudukan Jepun', tag: 'Subtopik 3.8', href: 'bab-3-8.html' },
    { title: '3.9 · Keadaan Negara Kita Selepas Kekalahan Jepun', tag: 'Subtopik 3.9', href: 'bab-3-9.html' },
    { title: 'Bab 4 · Era Peralihan Kuasa British di Negara Kita', tag: 'Bab Induk', href: 'bab-4.html' },
    { title: '4.1 · British Military Administration (BMA)', tag: 'Subtopik 4.1', href: 'bab-4-1.html' },
    { title: '4.2 · Gagasan Malayan Union', tag: 'Subtopik 4.2', href: 'bab-4-2.html' },
    { title: '4.3 · Reaksi Penduduk Tempatan terhadap Malayan Union', tag: 'Subtopik 4.3', href: 'bab-4-3.html' },
    { title: '4.4 · Penyerahan Sarawak kepada Kerajaan British', tag: 'Subtopik 4.4', href: 'bab-4-4.html' },
    { title: '4.5 · Reaksi Penduduk Tempatan terhadap Penyerahan Sarawak', tag: 'Subtopik 4.5', href: 'bab-4-5.html' },
    { title: '4.6 · Penyerahan Sabah kepada Kerajaan British', tag: 'Subtopik 4.6', href: 'bab-4-6.html' },
    { title: '4.7 · Reaksi Penduduk Tempatan terhadap Penyerahan Sabah', tag: 'Subtopik 4.7', href: 'bab-4-7.html' },
    { title: 'Bab 5 · Persekutuan Tanah Melayu 1948', tag: 'Bab Induk', href: 'bab-5.html' },
    { title: '5.1 · Latar Belakang Penubuhan Persekutuan Tanah Melayu 1948', tag: 'Subtopik 5.1', href: 'bab-5-1.html' },
    { title: '5.2 · Faktor Penubuhan Persekutuan Tanah Melayu 1948', tag: 'Subtopik 5.2', href: 'bab-5-2.html' },
    { title: '5.3 · Ciri-ciri Persekutuan Tanah Melayu 1948', tag: 'Subtopik 5.3', href: 'bab-5-3.html' },
    { title: '5.4 · Kesan Penubuhan Persekutuan Tanah Melayu 1948', tag: 'Subtopik 5.4', href: 'bab-5-4.html' },
    { title: 'Bab 6 · Ancaman Komunis dan Perisytiharan Darurat', tag: 'Bab Induk', href: 'bab-6.html' },
    { title: '6.1 · Kemasukan Pengaruh Komunis di Negara Kita', tag: 'Subtopik 6.1', href: 'bab-6-1.html' },
    { title: '6.2 · Ancaman Komunis di Negara Kita', tag: 'Subtopik 6.2', href: 'bab-6-2.html' },
    { title: '6.3 · Usaha Menangani Ancaman Komunis', tag: 'Subtopik 6.3', href: 'bab-6-3.html' },
    { title: '6.4 · Kesan Zaman Darurat terhadap Negara Kita', tag: 'Subtopik 6.4', href: 'bab-6-4.html' }
  ];

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
          '<input class="hz-search-input" type="search" placeholder="Cari nota..." autocomplete="off" />' +
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
  document.addEventListener('DOMContentLoaded', function () {
    var p = location.pathname;
    function isActive(href) {
      var hp = href.replace(/\/?(index\.html)?$/, '').replace(/^\//, '');
      var pp = p.replace(/\/?(index\.html)?$/, '').replace(/^\//, '');
      if (href.includes('/notes/') && !href.endsWith('index.html')) {
        return p.includes('/notes/') && !p.endsWith('index.html');
      }
      if (href.includes('/notes/')) return p.includes('/notes/');
      if (href === '/index.html') return pp === '' || pp === 'index.html';
      return pp === hp;
    }
    var isDark = (document.documentElement.getAttribute('data-theme') || localStorage.getItem('hazimedu-theme') || 'light') === 'dark';
    var tabs = [
      { icon: HZ_ICONS.home,   label: 'Utama', href: '/index.html' },
      { icon: HZ_ICONS.notes,  label: 'Nota',  href: '/notes/index.html' },
      { icon: HZ_ICONS.search, label: 'Cari',  href: null, action: 'search' },
      { icon: isDark ? HZ_ICONS.moon : HZ_ICONS.sun, label: 'Tema', href: null, action: 'theme' }
    ];
    var nav = document.createElement('nav');
    nav.className = 'hz-bottom-nav';
    nav.setAttribute('aria-label', 'Navigasi utama');
    tabs.forEach(function (tab) {
      var el;
      if (tab.href) {
        el = document.createElement('a');
        el.href = tab.href;
        if (isActive(tab.href)) el.classList.add('is-active');
      } else {
        el = document.createElement('button');
        el.type = 'button';
        if (tab.action === 'search') {
          el.addEventListener('click', function () {
            document.dispatchEvent(new CustomEvent('hz:search-open'));
          });
        } else if (tab.action === 'theme') {
          el.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme') || 'light';
            var next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('hazimedu-theme', next);
            document.querySelectorAll('.display-fab').forEach(function (b) {
              b.textContent = next === 'dark' ? '🌙' : '☀️';
            });
            var icon = el.querySelector('.hz-nav-icon');
            if (icon) icon.innerHTML = next === 'dark' ? HZ_ICONS.moon : HZ_ICONS.sun;
          });
        }
      }
      el.className = 'hz-bottom-nav-item';
      el.innerHTML = '<span class="hz-nav-icon">' + tab.icon + '</span><span>' + tab.label + '</span>';
      nav.appendChild(el);
    });
    document.body.appendChild(nav);
  });
})();

// ── Desktop Floating TOC (note subtopic pages, wide screens) ─────────────────
(function () {
  var isNotePage = /\/notes\/bab-\d+-\d+\.html$/.test(location.pathname);
  if (!isNotePage) return;
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


// =========================
// SERVICE WORKER REGISTRATION
// =========================
(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (error) {
      console.warn('Service worker registration failed:', error);
    });
  });
})();
