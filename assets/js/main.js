const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

/* =========================
   TOGGLE JAWAPAN
========================= */
document.querySelectorAll(".interactive-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    const isOpen = target.classList.toggle("show");
    button.textContent = isOpen ? "Sembunyikan jawapan" : "Tunjukkan jawapan";
  });
});

/* =========================
   PROCESS CARDS
========================= */
const processCards = document.querySelectorAll(".paper-process-card");
const processPanels = document.querySelectorAll(".paper-process-panel");

processCards.forEach((card) => {
  card.addEventListener("click", () => {
    const targetId = card.getAttribute("data-process");
    if (!targetId) return;

    processCards.forEach((item) => item.classList.remove("active"));
    processPanels.forEach((panel) => panel.classList.remove("active"));

    card.classList.add("active");
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) targetPanel.classList.add("active");
  });
});

/* PAPER ACCORDION */
const accordionTriggers = document.querySelectorAll(".paper-accordion-trigger");
const accordionPanels = document.querySelectorAll(".paper-accordion-panel");

accordionTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const targetId = trigger.getAttribute("data-accordion");
    if (!targetId) return;

    const targetPanel = document.getElementById(targetId);
    if (!targetPanel) return;

    const isOpen = trigger.classList.contains("active");

    accordionTriggers.forEach((item) => item.classList.remove("active"));
    accordionPanels.forEach((panel) => panel.classList.remove("active"));

    if (!isOpen) {
      trigger.classList.add("active");
      targetPanel.classList.add("active");
    }
  });
});

/* PAPER TIMELINE */
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

/* =========================
   REVEAL ON SCROLL
========================= */
const revealElements = document.querySelectorAll(".reveal-on-scroll");

function revealOnScroll() {
  revealElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 70) {
      el.classList.add("visible");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);
