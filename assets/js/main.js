const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}
/* =========================
   BAB 1 INTERACTIVE
========================= */

// Toggle jawapan utama
document.querySelectorAll(".interactive-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    const target = document.getElementById(targetId);
    if (!target) return;

    const isOpen = target.classList.toggle("show");
    button.textContent = isOpen ? "Sembunyikan jawapan" : "Tunjukkan jawapan";
  });
});

// Tab unsur utama
const tabCards = document.querySelectorAll(".tab-card");
const tabPanels = document.querySelectorAll(".tab-panel");

tabCards.forEach((card) => {
  card.addEventListener("click", () => {
    const targetId = card.getAttribute("data-tab");

    tabCards.forEach((item) => item.classList.remove("active"));
    tabPanels.forEach((panel) => panel.classList.remove("active"));

    card.classList.add("active");
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) targetPanel.classList.add("active");
  });
});

// Timeline accordion
const timelineTriggers = document.querySelectorAll(".timeline-trigger");
const timelinePanels = document.querySelectorAll(".timeline-panel");

timelineTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const targetId = trigger.getAttribute("data-timeline");

    timelineTriggers.forEach((item) => item.classList.remove("active"));
    timelinePanels.forEach((panel) => panel.classList.remove("active"));

    trigger.classList.add("active");
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) targetPanel.classList.add("active");
  });
});

// Reveal on scroll
const revealElements = document.querySelectorAll(".reveal-on-scroll");

const revealOnScroll = () => {
  revealElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      el.classList.add("visible");
    }
  });
};

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);
