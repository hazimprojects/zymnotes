document.documentElement.classList.add("js-enhanced");

// =========================
// DARK MODE TOGGLE
// =========================
(function () {
  const KEY = "hazimedu-theme";

  function getTheme() {
    return localStorage.getItem(KEY) ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEY, theme);
    document.querySelectorAll(".display-fab").forEach((btn) => {
      btn.textContent = theme === "dark" ? "🌙" : "☀️";
    });
  }

  // Apply immediately to avoid flash
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
    if (!localStorage.getItem(KEY)) applyTheme(e.matches ? "dark" : "light");
  });
})();

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

accordionTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const targetId = trigger.getAttribute("data-accordion");
    if (!targetId) return;
    const targetPanel = document.getElementById(targetId);
    if (!targetPanel) return;

    const currentItem = trigger.closest(".paper-accordion-item");
    const accordionGroup = trigger.closest(".paper-accordion");
    const isOpen = currentItem?.classList.contains("is-open");

    if (!accordionGroup || !currentItem) return;

    // Tutup semua — max-height CSS transition handle animasi
    accordionGroup.querySelectorAll(".paper-accordion-item").forEach((item) => item.classList.remove("is-open"));
    accordionGroup.querySelectorAll(".paper-accordion-trigger").forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-expanded", "false");
    });
    accordionGroup.querySelectorAll(".paper-accordion-panel").forEach((panel) => panel.classList.remove("active"));

    // Buka yang baru
    if (!isOpen) {
      currentItem.classList.add("is-open");
      trigger.classList.add("active");
      trigger.setAttribute("aria-expanded", "true");
      targetPanel.classList.add("active");
    }
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
        if (rect.top < window.innerHeight - 70) el.classList.add("visible");
      });
    }
    window.addEventListener("scroll", revealFallback, { passive: true });
    window.addEventListener("load", revealFallback);
  }
}

// =========================
// SEARCH ENGINE — Full text dari setiap halaman
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

  // Senarai semua halaman — title, tag, href
  const PAGES = [
    { title: "Bab 1 · Warisan Negara Bangsa", tag: "Bab Induk", href: "bab-1.html" },
    { title: "1.1 · Latar Belakang Negara Bangsa Sebelum Kedatangan Barat", tag: "Subtopik 1.1", href: "bab-1-1.html" },
    { title: "1.2 · Ciri-ciri Negara Bangsa Kesultanan Melayu Melaka", tag: "Subtopik 1.2", href: "bab-1-2.html" },
    { title: "1.3 · Keunggulan Sistem Pentadbiran dan Undang-undang", tag: "Subtopik 1.3", href: "bab-1-3.html" },
    { title: "1.4 · Peranan Pemerintah dan Rakyat", tag: "Subtopik 1.4", href: "bab-1-4.html" },
    { title: "Bab 2 · Kebangkitan Nasionalisme", tag: "Bab Induk", href: "bab-2.html" },
    { title: "2.1 · Maksud dan Konsep Nasionalisme", tag: "Subtopik 2.1", href: "bab-2-1.html" },
    { title: "2.2 · Perkembangan Nasionalisme di Barat", tag: "Subtopik 2.2", href: "bab-2-2.html" },
    { title: "2.3 · Perkembangan Nasionalisme di Asia", tag: "Subtopik 2.3", href: "bab-2-3.html" },
    { title: "2.4 · Perkembangan Nasionalisme di Asia Tenggara", tag: "Subtopik 2.4", href: "bab-2-4.html" },
    { title: "2.5 · Faktor Kebangkitan Nasionalisme di Tanah Melayu", tag: "Subtopik 2.5", href: "bab-2-5.html" },
    { title: "2.6 · Perkembangan Nasionalisme di Tanah Melayu", tag: "Subtopik 2.6", href: "bab-2-6.html" },
    { title: "2.7 · Nasionalisme Melayu", tag: "Subtopik 2.7", href: "bab-2-7.html" },
    { title: "2.8 · Kesan Nasionalisme di Tanah Melayu", tag: "Subtopik 2.8", href: "bab-2-8.html" },
    { title: "Bab 3 · Konflik Dunia dan Pendudukan Jepun", tag: "Bab Induk", href: "bab-3.html" },
    { title: "3.1 · Latar Belakang Perang Dunia Pertama", tag: "Subtopik 3.1", href: "bab-3-1.html" },
    { title: "3.2 · Kesan Perang Dunia Pertama", tag: "Subtopik 3.2", href: "bab-3-2.html" },
    { title: "3.3 · Latar Belakang Perang Dunia Kedua", tag: "Subtopik 3.3", href: "bab-3-3.html" },
    { title: "3.4 · Kesan Perang Dunia Kedua", tag: "Subtopik 3.4", href: "bab-3-4.html" },
    { title: "3.5 · Pendudukan Jepun di Negara Kita", tag: "Subtopik 3.5", href: "bab-3-5.html" },
    { title: "3.6 · Dasar Pemerintahan Jepun", tag: "Subtopik 3.6", href: "bab-3-6.html" },
    { title: "3.7 · Penentangan terhadap Pendudukan Jepun", tag: "Subtopik 3.7", href: "bab-3-7.html" },
    { title: "3.8 · Kesan Pendudukan Jepun", tag: "Subtopik 3.8", href: "bab-3-8.html" },
    { title: "3.9 · Perkembangan Nasionalisme Selepas Perang", tag: "Subtopik 3.9", href: "bab-3-9.html" },
  ];

  // Index cache — will be built lazily on first search
  let INDEX = null;
  let indexBuilding = false;

  // Extract teks bersih dari HTML string — termasuk accordion, chip, timeline dll
  function extractText(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    // Buang nav, footer, script, style
    doc.querySelectorAll("header, footer, script, style, .site-nav, .hero-actions, .keyword-legend-wrap").forEach(el => el.remove());
    // Ambil semua teks dari main
    const main = doc.querySelector("main") || doc.body;
    return main ? main.textContent.replace(/\s+/g, " ").trim() : "";
  }

  // Build full-text index dengan fetch semua halaman
  async function buildIndex() {
    if (INDEX || indexBuilding) return;
    indexBuilding = true;
    INDEX = [];

    const fetches = PAGES.map(async (page) => {
      try {
        const url = base + page.href;
        const res = await fetch(url);
        if (!res.ok) return;
        const html = await res.text();
        const fullText = extractText(html);
        // Excerpt — ambil 150 chars pertama dari teks badan
        const excerpt = fullText.replace(page.title, "").trim().slice(0, 160) + "...";
        INDEX.push({
          title: page.title,
          tag: page.tag,
          href: base + page.href,
          fullText: fullText.toLowerCase(),
          excerpt: excerpt,
        });
      } catch (e) {
        // Kalau fetch gagal (offline), skip
      }
    });

    await Promise.all(fetches);
    indexBuilding = false;
  }

  function normalize(str) {
    return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function highlight(text, query) {
    if (!query) return text;
    const words = query.trim().split(/\s+/).filter(Boolean);
    let result = text;
    words.forEach(word => {
      const escaped = word.replace(/[.*+?^${}()|[\]\]/g, "\$&");
      result = result.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
    });
    return result;
  }

  // Cari excerpt yang mengandungi query untuk paparan lebih relevan
  function findRelevantExcerpt(fullText, query) {
    const words = query.toLowerCase().trim().split(/\s+/);
    const lowerText = fullText.toLowerCase();
    // Cari posisi pertama mana-mana kata query
    let bestPos = -1;
    words.forEach(word => {
      const pos = lowerText.indexOf(word);
      if (pos !== -1 && (bestPos === -1 || pos < bestPos)) bestPos = pos;
    });
    if (bestPos === -1) return fullText.slice(0, 160) + "...";
    const start = Math.max(0, bestPos - 40);
    const end = Math.min(fullText.length, bestPos + 160);
    const excerpt = (start > 0 ? "..." : "") + fullText.slice(start, end) + (end < fullText.length ? "..." : "");
    return excerpt;
  }

  function search(query) {
    if (!INDEX) return [];
    const q = normalize(query.trim());
    if (!q) return [];
    const words = q.split(/\s+/).filter(Boolean);

    return INDEX.filter(item => {
      const haystack = normalize(item.fullText + " " + item.title);
      return words.every(word => haystack.includes(word));
    }).map(item => ({
      ...item,
      relevantExcerpt: findRelevantExcerpt(item.fullText, q),
    }));
  }

  function clearResults() {
    resultsContainer.querySelectorAll(".search-result-item").forEach(el => el.remove());
    resultsContainer.classList.remove("has-results");
    if (emptyState) emptyState.classList.remove("visible");
    if (countEl) countEl.textContent = "";
  }

  function renderResults(results, query) {
    resultsContainer.querySelectorAll(".search-result-item").forEach(el => el.remove());

    if (results.length === 0) {
      resultsContainer.classList.remove("has-results");
      if (emptyState) emptyState.classList.add("visible");
      return;
    }

    if (emptyState) emptyState.classList.remove("visible");
    resultsContainer.classList.add("has-results");
    if (countEl) countEl.textContent = `${results.length} keputusan ditemui`;

    results.forEach(item => {
      const a = document.createElement("a");
      a.className = "search-result-item";
      a.href = item.href;
      a.innerHTML = `
        <span class="search-result-tag">${item.tag}</span>
        <p class="search-result-title">${highlight(item.title, query)}</p>
        <p class="search-result-excerpt">${highlight(item.relevantExcerpt || item.excerpt, query)}</p>
      `;
      resultsContainer.appendChild(a);
    });
  }

  // Show loading state
  function showLoading() {
    resultsContainer.querySelectorAll(".search-result-item").forEach(el => el.remove());
    resultsContainer.classList.add("has-results");
    if (countEl) countEl.textContent = "Sedang memuat indeks...";
  }

  let debounceTimer;
  let pendingQuery = null;

  searchInput.addEventListener("input", async function () {
    const query = this.value.trim();
    clearTimeout(debounceTimer);

    if (!query) {
      clearResults();
      return;
    }

    debounceTimer = setTimeout(async () => {
      // Build index on first search
      if (!INDEX) {
        showLoading();
        await buildIndex();
      }
      const results = search(query);
      renderResults(results, query);
    }, 250);
  });

  // Preload index bila page idle
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => buildIndex(), { timeout: 3000 });
  } else {
    setTimeout(() => buildIndex(), 2000);
  }

  // Keyboard shortcut: / to focus
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
// READING PROGRESS INDICATOR
// =========================
(function setupReadingProgress() {
  const path = window.location.pathname.toLowerCase();

  const isReadingPage =
    path.includes("/notes/bab-") &&
    !path.endsWith("/notes/bab-1.html") &&
    !path.endsWith("/notes/bab-1") &&
    !path.endsWith("/notes/bab-2.html") &&
    !path.endsWith("/notes/bab-2") &&
    !path.endsWith("/notes/bab-3.html") &&
    !path.endsWith("/notes/bab-3");

  if (!isReadingPage) return;

  const mainContent = document.querySelector("main");
  if (!mainContent) return;

  const style = document.createElement("style");
  style.innerHTML = `
    .reading-progress-pill {
      position: fixed;
      right: 16px;
      bottom: 18px;
      z-index: 60;
      width: 92px;
      padding: 10px 10px 9px;
      border-radius: 18px;
      background: rgba(255, 253, 248, 0.95);
      border: 1px solid rgba(92, 110, 132, 0.16);
      box-shadow: 0 12px 30px rgba(36, 49, 63, 0.12);
      backdrop-filter: blur(10px);
      cursor: pointer;
      user-select: none;
      transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease, background 0.35s ease;
      opacity: 0;
      pointer-events: none;
      transform: translateY(10px);
    }`;
  document.head.appendChild(style);

  const pill = document.createElement("button");
  pill.className = "reading-progress-pill";
  pill.setAttribute("type", "button");
  pill.setAttribute("aria-label", "Kemajuan bacaan. Klik untuk kembali ke atas.");
  pill.innerHTML = `
    <div class="reading-progress-top">
      <span class="reading-progress-label">Baca</span>
      <span class="reading-progress-percent">0%</span>
    </div>
    <div class="reading-progress-bar">
      <div class="reading-progress-fill"></div>
    </div>
    <div class="reading-progress-hint">Permulaan yang baik</div>
  `;
  document.body.appendChild(pill);

  const percentEl = pill.querySelector(".reading-progress-percent");
  const fillEl = pill.querySelector(".reading-progress-fill");
  const hintEl = pill.querySelector(".reading-progress-hint");

  function getReadingProgress() {
    const mainRect = mainContent.getBoundingClientRect();
    const scrollTop = window.scrollY || window.pageYOffset;
    const mainTop = scrollTop + mainRect.top;
    const mainHeight = mainContent.offsetHeight;
    const viewportHeight = window.innerHeight;
    const start = mainTop;
    const end = Math.max(mainTop + mainHeight - viewportHeight, start + 1);
    return Math.max(0, Math.min(100, ((scrollTop - start) / (end - start)) * 100));
  }

  function getProgressMessage(progress) {
    if (progress >= 100) return "Selesai dibaca ✓";
    if (progress >= 75) return "Sedikit lagi";
    if (progress >= 50) return "Separuh jalan";
    if (progress >= 25) return "Teruskan membaca";
    return "Permulaan yang baik";
  }

  function updateReadingProgress() {
    const progress = Math.round(getReadingProgress());
    percentEl.textContent = `${progress}%`;
    fillEl.style.width = `${progress}%`;
    hintEl.textContent = getProgressMessage(progress);
    pill.classList.toggle("is-visible", window.scrollY > 120);
  }

  pill.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  window.addEventListener("resize", updateReadingProgress);
  window.addEventListener("load", updateReadingProgress);
  updateReadingProgress();
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
        display: flex !important;
        width: 100% !important;
        max-width: 100% !important;
        flex: none !important;
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
