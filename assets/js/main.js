document.documentElement.classList.add("js-enhanced");

// =========================
// DISPLAY PANEL — Brightness + Warmth
// Floating Kindle/iBooks style control
// =========================
(function setupDisplayPanel() {
  const STORAGE_KEY = "hazimedu-display";

  // Presets: [brightness 0-100, warmth 0-100, label]
  const PRESETS = {
    terang:  { brightness: 100, warmth: 40,  label: "Terang" },
    neutral: { brightness: 72,  warmth: 55,  label: "Neutral" },
    malam:   { brightness: 28,  warmth: 72,  label: "Malam" },
    gelap:   { brightness: 12,  warmth: 60,  label: "Gelap" },
  };

  // Load saved state
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    // Default: neutral
    return { brightness: 72, warmth: 55 };
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
  }

  // Apply brightness + warmth to CSS custom properties on <html>
  function applyDisplay(brightness, warmth) {
    const root = document.documentElement;

    // Brightness: 0 = very dark, 100 = full light
    // We map to background lightness and whether dark theme applies
    const isDark = brightness < 55;
    root.setAttribute("data-theme", isDark ? "dark" : "light");

    // Fine-tune background darkness via CSS filter on a dedicated overlay
    // We use a CSS variable that controls the overlay opacity
    const darknessOverlay = isDark
      ? Math.max(0, (55 - brightness) / 55 * 0.55)  // 0 → 0.55 opacity dark overlay
      : 0;

    // Warmth: 0 = cool blue tint, 100 = warm amber tint
    // Map to sepia-like warm overlay
    const warmOverlay = (warmth - 50) / 50;  // -1 to +1
    const warmR = warmOverlay > 0 ? Math.round(warmOverlay * 22) : 0;
    const warmB = warmOverlay < 0 ? Math.round(-warmOverlay * 18) : 0;

    root.style.setProperty("--display-dark-overlay", darknessOverlay.toFixed(3));
    root.style.setProperty("--display-warm-r", warmR);
    root.style.setProperty("--display-warm-b", warmB);

    // Inject/update overlay element
    let overlay = document.getElementById("display-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "display-overlay";
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        pointer-events: none; mix-blend-mode: multiply;
        transition: background 0.3s ease;
      `;
      document.body.appendChild(overlay);
    }

    if (darknessOverlay > 0) {
      overlay.style.background = `rgba(0,0,0,${darknessOverlay.toFixed(3)})`;
    } else if (warmR > 0) {
      overlay.style.background = `rgba(${warmR * 4},${Math.round(warmR*1.5)},0,${(warmR/22*0.18).toFixed(3)})`;
    } else if (warmB > 0) {
      overlay.style.background = `rgba(0,${Math.round(warmB*0.8)},${warmB * 4},${(warmB/18*0.12).toFixed(3)})`;
    } else {
      overlay.style.background = "transparent";
    }
  }

  function buildPanel() {
    // Cari nav-wrap untuk inject display-wrap
    const navWrap = document.querySelector(".nav-wrap");
    if (!navWrap) return;

    // Wrapper (supaya panel boleh position: absolute relative to ini)
    const wrap = document.createElement("div");
    wrap.className = "display-wrap";

    // FAB button — emoji cantik, inline dalam nav
    const fab = document.createElement("button");
    fab.className = "display-fab";
    fab.setAttribute("aria-label", "Tetapan paparan");
    fab.setAttribute("type", "button");
    fab.textContent = "🌤️";

    // Panel dropdown
    const panel = document.createElement("div");
    panel.className = "display-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Tetapan paparan");
    panel.innerHTML = `
      <p class="display-panel-title">Tetapan Paparan</p>

      <div class="display-slider-row">
        <span class="display-slider-icon">🌑</span>
        <input type="range" class="display-slider" id="slider-brightness"
          min="5" max="100" step="1" value="72"
          aria-label="Kecerahan">
        <span class="display-slider-icon">☀️</span>
      </div>

      <div class="display-slider-row">
        <span class="display-slider-icon">❄️</span>
        <input type="range" class="display-slider" id="slider-warmth"
          min="0" max="100" step="1" value="55"
          aria-label="Suhu warna">
        <span class="display-slider-icon">🕯️</span>
      </div>

      <div class="display-divider"></div>

      <div class="display-presets">
        <button class="display-preset" data-preset="terang" type="button">☀️ Terang</button>
        <button class="display-preset" data-preset="neutral" type="button">🌤️ Neutral</button>
        <button class="display-preset" data-preset="malam" type="button">🌙 Malam</button>
        <button class="display-preset" data-preset="gelap" type="button">🌑 Gelap</button>
      </div>
    `;

    wrap.appendChild(fab);
    wrap.appendChild(panel);

    // Sisipkan sebelum nav-toggle (kalau ada) atau hujung nav-wrap
    const navToggle = navWrap.querySelector(".nav-toggle");
    if (navToggle) {
      navWrap.insertBefore(wrap, navToggle);
    } else {
      navWrap.appendChild(wrap);
    }

    const sliderBrightness = panel.querySelector("#slider-brightness");
    const sliderWarmth = panel.querySelector("#slider-warmth");
    const presetBtns = panel.querySelectorAll(".display-preset");

    // Load & apply saved state
    const state = loadState();
    sliderBrightness.value = state.brightness;
    sliderWarmth.value = state.warmth;
    applyDisplay(state.brightness, state.warmth);
    updateActivePreset(state.brightness, state.warmth);

    // FAB toggle
    fab.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = panel.classList.toggle("is-open");
      fab.classList.toggle("is-open", isOpen);
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== fab) {
        panel.classList.remove("is-open");
        fab.classList.remove("is-open");
      }
    });

    // Slider events
    function onSliderChange() {
      const b = parseInt(sliderBrightness.value);
      const w = parseInt(sliderWarmth.value);
      applyDisplay(b, w);
      saveState({ brightness: b, warmth: w });
      updateActivePreset(b, w);
    }

    sliderBrightness.addEventListener("input", onSliderChange);
    sliderWarmth.addEventListener("input", onSliderChange);

    // Preset buttons
    presetBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-preset");
        const preset = PRESETS[key];
        if (!preset) return;
        sliderBrightness.value = preset.brightness;
        sliderWarmth.value = preset.warmth;
        applyDisplay(preset.brightness, preset.warmth);
        saveState({ brightness: preset.brightness, warmth: preset.warmth });
        updateActivePreset(preset.brightness, preset.warmth);
      });
    });

    function updateActivePreset(b, w) {
      presetBtns.forEach((btn) => btn.classList.remove("is-active"));
      for (const [key, preset] of Object.entries(PRESETS)) {
        if (Math.abs(preset.brightness - b) < 3 && Math.abs(preset.warmth - w) < 3) {
          const match = panel.querySelector(`[data-preset="${key}"]`);
          if (match) match.classList.add("is-active");
          break;
        }
      }
      // Update fab icon ikut kecerahan
      if (b < 25) fab.textContent = "🌑";
      else if (b < 45) fab.textContent = "🌙";
      else if (b < 70) fab.textContent = "🌤️";
      else fab.textContent = "☀️";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildPanel);
  } else {
    buildPanel();
  }
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
    const clickedThemeToggle = event.target.closest(".theme-toggle");

    if (!clickedInsideNav && !clickedToggle && !clickedThemeToggle && siteNav.classList.contains("open")) {
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
// SEARCH ENGINE
// =========================
(function setupSearch() {
  const searchInput = document.querySelector(".search-input");
  if (!searchInput) return;

  const resultsContainer = document.querySelector(".search-results");
  const emptyState = document.querySelector(".search-empty");
  const countEl = document.querySelector(".search-result-count");
  if (!resultsContainer) return;

  // Determine base path (notes/ or root)
  const isInNotes = window.location.pathname.includes("/notes/");
  const base = isInNotes ? "" : "notes/";

  const SEARCH_DATA = [
    // ── BAB 1 ──
    {
      title: "Bab 1 · Warisan Negara Bangsa",
      tag: "Bab Induk",
      href: base + "bab-1.html",
      keywords: ["warisan", "negara bangsa", "alam melayu", "kesultanan melayu melaka", "johor-riau", "srivijaya", "funan", "champa"],
      excerpt: "Bab ini menerangkan bagaimana warisan negara bangsa berkembang di Alam Melayu dan diteruskan hingga zaman Kesultanan Melayu Melaka.",
    },
    {
      title: "1.1 · Latar Belakang Negara Bangsa Sebelum Kedatangan Barat",
      tag: "Subtopik 1.1",
      href: base + "bab-1-1.html",
      keywords: ["negara bangsa", "alam melayu", "funan", "champa", "kedah tua", "gangga nagara", "srivijaya", "angkor", "majapahit", "inskripsi telaga batu", "raja", "undang-undang", "wilayah", "rakyat", "berperingkat"],
      excerpt: "Asas negara bangsa telah wujud di Alam Melayu sebelum kedatangan Barat melalui raja, undang-undang, wilayah pengaruh dan rakyat.",
    },
    {
      title: "1.2 · Ciri-ciri Negara Bangsa Kesultanan Melayu Melaka",
      tag: "Subtopik 1.2",
      href: base + "bab-1-2.html",
      keywords: ["kesultanan melayu melaka", "kerajaan", "rakyat", "kedaulatan", "wilayah pengaruh", "undang-undang", "lambang kebesaran", "sultan", "pembesar", "cheng ho", "dinasti ming", "hukum kanun melaka", "undang-undang laut melaka", "cap mohor", "nobat", "regalia"],
      excerpt: "Enam ciri utama negara bangsa Melaka: kerajaan, rakyat, kedaulatan, wilayah pengaruh, undang-undang dan lambang kebesaran.",
    },
    {
      title: "1.3 · Keunggulan Sistem Pentadbiran dan Undang-undang",
      tag: "Subtopik 1.3",
      href: base + "bab-1-3.html",
      keywords: ["pentadbiran", "undang-undang", "sistem pembesar empat lipatan", "bendahara", "temenggung", "laksamana", "penghulu bendahari", "syahbandar", "hukum kanun melaka", "undang-undang laut melaka", "tun perak", "sultan mahmud shah", "kawasan pegangan", "kewangan", "cukai"],
      excerpt: "Keunggulan Melaka terbukti melalui Sistem Pembesar Empat Lipatan dan dua undang-undang bertulis: Hukum Kanun Melaka dan Undang-undang Laut Melaka.",
    },
    {
      title: "1.4 · Peranan Pemerintah dan Rakyat",
      tag: "Subtopik 1.4",
      href: base + "bab-1-4.html",
      keywords: ["waadat", "pemerintah", "rakyat", "sultan", "pembesar", "sang sapurba", "demang lebar daun", "tulah", "taat setia", "menderhaka", "timbal balik", "kerah", "serah", "hamba"],
      excerpt: "Hubungan antara pemerintah dan rakyat berasaskan konsep waadat — perjanjian timbal balik antara Sang Sapurba dan Demang Lebar Daun.",
    },

    // ── BAB 2 ──
    {
      title: "Bab 2 · Kebangkitan Nasionalisme",
      tag: "Bab Induk",
      href: base + "bab-2.html",
      keywords: ["nasionalisme", "kebangkitan", "barat", "asia", "asia tenggara", "tanah melayu"],
      excerpt: "Nota tentang maksud nasionalisme, perkembangannya di Barat, Asia dan Asia Tenggara serta kesannya di negara kita.",
    },
    {
      title: "2.1 · Maksud dan Konsep Nasionalisme",
      tag: "Subtopik 2.1",
      href: base + "bab-2-1.html",
      keywords: ["nasionalisme", "konsep", "maksud", "bangsa", "identiti", "semangat"],
      excerpt: "Nasionalisme ialah semangat cinta akan tanah air dan bangsa yang mendorong perjuangan untuk kemerdekaan.",
    },
    {
      title: "2.2 · Perkembangan Nasionalisme di Barat",
      tag: "Subtopik 2.2",
      href: base + "bab-2-2.html",
      keywords: ["nasionalisme barat", "revolusi perancis", "eropah", "perlembagaan", "demokrasi"],
      excerpt: "Nasionalisme di Barat bermula dengan Revolusi Perancis dan menyebar ke seluruh Eropah.",
    },
    {
      title: "2.3 · Perkembangan Nasionalisme di Asia",
      tag: "Subtopik 2.3",
      href: base + "bab-2-3.html",
      keywords: ["nasionalisme asia", "china", "india", "turki", "gerakan", "penjajah"],
      excerpt: "Nasionalisme di Asia berkembang sebagai reaksi terhadap penjajahan Barat.",
    },
    {
      title: "2.4 · Perkembangan Nasionalisme di Asia Tenggara",
      tag: "Subtopik 2.4",
      href: base + "bab-2-4.html",
      keywords: ["nasionalisme asia tenggara", "indonesia", "filipina", "vietnam", "myanmar", "penjajah"],
      excerpt: "Nasionalisme di Asia Tenggara lahir daripada kesedaran rakyat menentang penjajahan Barat.",
    },
    {
      title: "2.5 · Faktor Kebangkitan Nasionalisme di Tanah Melayu",
      tag: "Subtopik 2.5",
      href: base + "bab-2-5.html",
      keywords: ["faktor", "nasionalisme tanah melayu", "penjajahan british", "ekonomi", "pendidikan", "akhbar"],
      excerpt: "Faktor-faktor kebangkitan nasionalisme di Tanah Melayu termasuk penjajahan British, pendidikan dan perkembangan akhbar.",
    },
    {
      title: "2.6 · Perkembangan Nasionalisme di Tanah Melayu",
      tag: "Subtopik 2.6",
      href: base + "bab-2-6.html",
      keywords: ["nasionalisme tanah melayu", "pertubuhan", "gerakan", "perjuangan", "british"],
      excerpt: "Perkembangan nasionalisme di Tanah Melayu melalui pertubuhan dan gerakan yang menentang penjajahan.",
    },
    {
      title: "2.7 · Nasionalisme Melayu",
      tag: "Subtopik 2.7",
      href: base + "bab-2-7.html",
      keywords: ["nasionalisme melayu", "umno", "kaum muda", "kaum tua", "kesatuan melayu muda", "ibrahim yaakob"],
      excerpt: "Nasionalisme Melayu berkembang melalui pertubuhan seperti UMNO dan Kesatuan Melayu Muda.",
    },
    {
      title: "2.8 · Kesan Nasionalisme di Tanah Melayu",
      tag: "Subtopik 2.8",
      href: base + "bab-2-8.html",
      keywords: ["kesan nasionalisme", "kemerdekaan", "perlembagaan", "persekutuan tanah melayu", "merdeka"],
      excerpt: "Nasionalisme membawa kepada kemerdekaan Tanah Melayu dan pembentukan negara yang berdaulat.",
    },

    // ── BAB 3 ──
    {
      title: "Bab 3 · Konflik Dunia dan Pendudukan Jepun",
      tag: "Bab Induk",
      href: base + "bab-3.html",
      keywords: ["konflik dunia", "perang dunia", "jepun", "pendudukan", "penjajahan", "nasionalisme"],
      excerpt: "Konflik dunia, pendudukan Jepun di Negara Kita, perjuangan rakyat dan perkembangan nasionalisme tempatan.",
    },
    {
      title: "3.1 · Latar Belakang Perang Dunia Pertama",
      tag: "Subtopik 3.1",
      href: base + "bab-3-1.html",
      keywords: ["perang dunia pertama", "pdp", "triple entente", "kuasa tengah", "austria hungary", "jerman", "russia", "britain", "perancis"],
      excerpt: "Perang Dunia Pertama berlaku akibat persaingan antara kuasa besar Eropah — Kuasa Tengah menentang Triple Entente.",
    },
    {
      title: "3.2 · Kesan Perang Dunia Pertama",
      tag: "Subtopik 3.2",
      href: base + "bab-3-2.html",
      keywords: ["kesan pdp", "perjanjian versailles", "liga bangsa-bangsa", "nasionalisme", "ekonomi"],
      excerpt: "Kesan Perang Dunia Pertama termasuk Perjanjian Versailles dan penubuhan Liga Bangsa-Bangsa.",
    },
    {
      title: "3.3 · Latar Belakang Perang Dunia Kedua",
      tag: "Subtopik 3.3",
      href: base + "bab-3-3.html",
      keywords: ["perang dunia kedua", "pdk", "axis", "berikat", "jerman nazi", "hitler", "mussolini", "jepun", "fasisme"],
      excerpt: "Perang Dunia Kedua tercetus akibat dasar perkembangan Jerman Nazi, Itali Fasis dan Jepun.",
    },
    {
      title: "3.4 · Kesan Perang Dunia Kedua",
      tag: "Subtopik 3.4",
      href: base + "bab-3-4.html",
      keywords: ["kesan pdk", "bom atom", "hiroshima", "nagasaki", "pbb", "perang dingin"],
      excerpt: "Kesan Perang Dunia Kedua termasuk pengeboman atom Hiroshima dan Nagasaki serta penubuhan PBB.",
    },
    {
      title: "3.5 · Pendudukan Jepun di Negara Kita",
      tag: "Subtopik 3.5",
      href: base + "bab-3-5.html",
      keywords: ["pendudukan jepun", "tentera jepun", "asia timur raya", "perang pasifik", "tanah melayu", "singapura", "1941", "1942"],
      excerpt: "Jepun menduduki Tanah Melayu dan Singapura pada 1941–1942 dalam tempoh yang dikenali sebagai Zaman Pendudukan Jepun.",
    },
    {
      title: "3.6 · Dasar Pemerintahan Jepun",
      tag: "Subtopik 3.6",
      href: base + "bab-3-6.html",
      keywords: ["dasar jepun", "pemerintahan jepun", "romusha", "kempen menabung", "ekonomi perang", "propaganda"],
      excerpt: "Dasar pemerintahan Jepun termasuk penggunaan tenaga kerja paksa romusha dan kempen ekonomi perang.",
    },
    {
      title: "3.7 · Penentangan terhadap Pendudukan Jepun",
      tag: "Subtopik 3.7",
      href: base + "bab-3-7.html",
      keywords: ["penentangan", "rintangan", "mpaja", "force 136", "gerila", "wataniah", "perjuangan"],
      excerpt: "Rakyat menentang penjajahan Jepun melalui MPAJA, Force 136 dan gerakan rintangan yang lain.",
    },
    {
      title: "3.8 · Kesan Pendudukan Jepun",
      tag: "Subtopik 3.8",
      href: base + "bab-3-8.html",
      keywords: ["kesan pendudukan jepun", "nasionalisme", "ekonomi", "sosial", "penderitaan rakyat"],
      excerpt: "Pendudukan Jepun memberi kesan mendalam kepada ekonomi, sosial dan nasionalisme di negara kita.",
    },
    {
      title: "3.9 · Perkembangan Nasionalisme Selepas Perang",
      tag: "Subtopik 3.9",
      href: base + "bab-3-9.html",
      keywords: ["nasionalisme selepas perang", "malayan union", "umno", "parti melayu", "kemerdekaan"],
      excerpt: "Penentangan terhadap Malayan Union mencetuskan kebangkitan semangat nasionalisme Melayu selepas Perang Dunia Kedua.",
    },
  ];

  function normalize(str) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function highlight(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
  }

  function search(query) {
    const q = normalize(query.trim());
    if (!q) return [];

    return SEARCH_DATA.filter((item) => {
      const haystack = normalize(
        item.title + " " + item.excerpt + " " + item.keywords.join(" ")
      );
      return q.split(" ").every((word) => haystack.includes(word));
    });
  }

  function renderResults(results, query) {
    // Clear existing result items (keep count + empty)
    resultsContainer.querySelectorAll(".search-result-item").forEach((el) => el.remove());

    if (results.length === 0) {
      resultsContainer.classList.remove("has-results");
      if (emptyState) emptyState.classList.add("visible");
      return;
    }

    if (emptyState) emptyState.classList.remove("visible");
    resultsContainer.classList.add("has-results");

    if (countEl) countEl.textContent = `${results.length} keputusan ditemui`;

    results.forEach((item) => {
      const a = document.createElement("a");
      a.className = "search-result-item";
      a.href = item.href;
      a.innerHTML = `
        <span class="search-result-tag">${item.tag}</span>
        <p class="search-result-title">${highlight(item.title, query)}</p>
        <p class="search-result-excerpt">${highlight(item.excerpt, query)}</p>
      `;
      resultsContainer.appendChild(a);
    });
  }

  let debounceTimer;
  searchInput.addEventListener("input", function () {
    const query = this.value;
    clearTimeout(debounceTimer);

    if (!query.trim()) {
      resultsContainer.classList.remove("has-results");
      if (emptyState) emptyState.classList.remove("visible");
      if (countEl) countEl.textContent = "";
      resultsContainer.querySelectorAll(".search-result-item").forEach((el) => el.remove());
      return;
    }

    debounceTimer = setTimeout(() => {
      const results = search(query);
      renderResults(results, query.trim());
    }, 200);
  });

  // Keyboard shortcut: / to focus search
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
    }

    [data-theme="dark"] .reading-progress-pill {
      background: rgba(28, 27, 24, 0.95);
      border-color: rgba(220, 210, 190, 0.14);
    }

    .reading-progress-pill.is-visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .reading-progress-pill:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 34px rgba(36, 49, 63, 0.16);
    }

    .reading-progress-top {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 7px;
    }

    .reading-progress-label {
      font-family: "Nunito", sans-serif;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #5d6a79;
      line-height: 1;
    }

    [data-theme="dark"] .reading-progress-label { color: #8c8579; }

    .reading-progress-percent {
      font-family: "Nunito", sans-serif;
      font-size: 15px;
      font-weight: 900;
      line-height: 1;
      color: #24313f;
      transition: color 0.35s ease;
    }

    [data-theme="dark"] .reading-progress-percent { color: #ddd8cc; }

    .reading-progress-bar {
      position: relative;
      height: 7px;
      border-radius: 999px;
      overflow: hidden;
      background: #edf1f5;
      transition: background 0.35s ease;
    }

    [data-theme="dark"] .reading-progress-bar { background: rgba(220,210,190,0.1); }

    .reading-progress-fill {
      position: absolute;
      inset: 0 auto 0 0;
      width: 0%;
      border-radius: 999px;
      background: linear-gradient(90deg, #2f7a67, #d7b163);
      transition: width 0.18s ease;
    }

    .reading-progress-hint {
      margin-top: 7px;
      font-family: "Nunito", sans-serif;
      font-size: 9px;
      font-weight: 800;
      color: #6b7280;
      text-align: center;
      line-height: 1.2;
      min-height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    [data-theme="dark"] .reading-progress-hint { color: #8c8579; }

    @media (max-width: 760px) {
      .reading-progress-pill {
        right: 12px; bottom: 14px; width: 86px;
        padding: 9px 9px 8px; border-radius: 16px;
      }
      .reading-progress-percent { font-size: 14px; }
      .reading-progress-label, .reading-progress-hint { font-size: 9px; }
    }
  `;
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
