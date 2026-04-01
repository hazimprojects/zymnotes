document.documentElement.classList.add("js-enhanced");
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

    if (!clickedInsideNav && !clickedToggle && siteNav.classList.contains("open")) {
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

    accordionGroup.querySelectorAll(".paper-accordion-item").forEach((item) => {
      item.classList.remove("is-open");
    });

    accordionGroup.querySelectorAll(".paper-accordion-trigger").forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-expanded", "false");
    });

    accordionGroup.querySelectorAll(".paper-accordion-panel").forEach((panel) => {
      panel.classList.remove("active");
    });

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
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    function revealOnScrollFallback() {
      revealElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 70) {
          el.classList.add("visible");
        }
      });
    }

    window.addEventListener("scroll", revealOnScrollFallback, { passive: true });
    window.addEventListener("load", revealOnScrollFallback);
  }
}

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
    !path.endsWith("/notes/bab-2");

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
      transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
      opacity: 0;
      pointer-events: none;
      transform: translateY(10px);
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

    .reading-progress-percent {
      font-family: "Nunito", sans-serif;
      font-size: 15px;
      font-weight: 900;
      line-height: 1;
      color: #24313f;
    }

    .reading-progress-bar {
      position: relative;
      height: 7px;
      border-radius: 999px;
      overflow: hidden;
      background: #edf1f5;
    }

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

    @media (max-width: 760px) {
      .reading-progress-pill {
        right: 12px;
        bottom: 14px;
        width: 86px;
        padding: 9px 9px 8px;
        border-radius: 16px;
      }

      .reading-progress-percent {
        font-size: 14px;
      }

      .reading-progress-label,
      .reading-progress-hint {
        font-size: 9px;
      }
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
    const progress = ((scrollTop - start) / (end - start)) * 100;

    return Math.max(0, Math.min(100, progress));
  }

  function getProgressMessage(progress) {
    if (progress >= 100) return "Selesai dibaca";
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

    if (window.scrollY > 120) {
      pill.classList.add("is-visible");
    } else {
      pill.classList.remove("is-visible");
    }
  }

  pill.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

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
