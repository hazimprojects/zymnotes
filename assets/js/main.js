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
// HOME (/) — PWA animated loading (standalone, once per session; no image intro)
// =========================
(function () {
  var path = (location.pathname || "/").replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  var root = document.documentElement;
  var loader = document.getElementById("pwa-loader");
  var loaderDoneKey = "zym-loader-done";

  function isStandalonePwa() {
    try {
      if (window.matchMedia("(display-mode: standalone)").matches) return true;
    } catch (e) {}
    return typeof navigator.standalone === "boolean" && navigator.standalone;
  }

  function showLoader() {
    if (!loader) return;
    loader.removeAttribute("hidden");
    root.classList.add("pwa-loader-pending", "pwa-loader-show");
  }

  function removeLoaderCompletely() {
    root.classList.remove("pwa-loader-pending", "pwa-loader-show");
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
  }

  function hideLoaderAnimated() {
    if (!loader || loader.getAttribute("data-loader-dismissed") === "1") {
      removeLoaderCompletely();
      return;
    }
    loader.setAttribute("data-loader-dismissed", "1");
    loader.classList.add("pwa-loader--hide");
    root.classList.remove("pwa-loader-show");
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      removeLoaderCompletely();
    }
    loader.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 480);
  }

  try {
    if (sessionStorage.getItem(loaderDoneKey) === "1") {
      removeLoaderCompletely();
      return;
    }
  } catch (e) {}

  if (!isStandalonePwa()) {
    removeLoaderCompletely();
    return;
  }

  showLoader();

  var fontsPromise =
    document.fonts && document.fonts.ready
      ? document.fonts.ready.catch(function () {})
      : Promise.resolve();

  function runLoadSequence() {
    var minLoaderMs = 1500;
    var maxWaitMs = 10000;
    var t0 = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

    function elapsed() {
      var t = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
      return t - t0;
    }

    function waitForLoaderEnd() {
      return Promise.all([
        fontsPromise,
        new Promise(function (r) {
          setTimeout(r, minLoaderMs);
        }),
      ]).then(function () {
        return new Promise(function (r) {
          requestAnimationFrame(function () {
            requestAnimationFrame(r);
          });
        });
      });
    }

    var budget = Math.max(0, maxWaitMs - elapsed());
    Promise.race([
      waitForLoaderEnd(),
      new Promise(function (r) {
        setTimeout(r, budget);
      }),
    ]).then(function () {
      try {
        sessionStorage.setItem(loaderDoneKey, "1");
      } catch (e) {}
      hideLoaderAnimated();
    });
  }

  if (document.readyState === "complete") {
    runLoadSequence();
  } else {
    window.addEventListener("load", runLoadSequence, { once: true });
  }

  window.addEventListener("pageshow", function (ev) {
    if (ev.persisted) removeLoaderCompletely();
  });
})();

// ── SVG Icon Library (shared: bottom nav, search, theme toggle) ─────────────
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
    close:   '<svg viewBox="0 0 24 24"' + s + '><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    about:   '<svg viewBox="0 0 24 24"' + s + '><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
})();

function hzThemeToggleMarkup(theme) {
  var icon = theme === "dark" ? HZ_ICONS.sun : HZ_ICONS.moon;
  return '<span class="display-fab-icon" aria-hidden="true">' + icon + "</span>";
}

function hzThemeToggleLabel(theme) {
  return theme === "dark" ? "Aktifkan mod terang" : "Aktifkan mod gelap";
}

// =========================
// DARK MODE TOGGLE
// =========================
(function () {
  const KEY = "zymnotes-theme";

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
      btn.innerHTML = hzThemeToggleMarkup(theme);
      btn.setAttribute("aria-label", hzThemeToggleLabel(theme));
    });
    var tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.content = theme === "dark" ? "#0D0F1A" : "#ffffff";
  }

  applyTheme(getTheme());

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".nav-wrap").forEach((nav) => {
      if (nav.querySelector(".display-fab")) return;

      const btn = document.createElement("button");
      btn.className = "display-fab";
      btn.setAttribute("type", "button");
      const initial = getTheme();
      btn.innerHTML = hzThemeToggleMarkup(initial);
      btn.setAttribute("aria-label", hzThemeToggleLabel(initial));

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

  // =========================
  // AUDIO MARKER ON SUBTOPIC CARDS
  // =========================
  const SUBTOPIC_QUIZ_HREF_RE = /^bab-(?:1-[1-4]|2-[1-8])\.html$/i;

  function appendAriaHint(card, fragment) {
    const currentLabel = card.getAttribute("aria-label");
    if (!currentLabel) return;
    if (currentLabel.includes(fragment)) return;
    card.setAttribute("aria-label", `${currentLabel} (${fragment})`);
  }

  async function markSubtopicCardsWithAudio() {
    const subtopicCards = Array.from(document.querySelectorAll(".bab-card[href]")).filter((card) => {
      const href = card.getAttribute("href") || "";
      return /bab-\d+-\d+\.html$/i.test(href);
    });

    if (!subtopicCards.length) return;

    subtopicCards.forEach((card) => {
      const href = card.getAttribute("href") || "";
      const file = href.split("/").pop() || href;
      if (SUBTOPIC_QUIZ_HREF_RE.test(file)) {
        card.classList.add("has-quiz");
        card.setAttribute("data-has-quiz", "true");
        appendAriaHint(card, "ada kuiz");
      }
    });

    await Promise.all(
      subtopicCards.map(async (card) => {
        const href = card.getAttribute("href");
        if (!href) return;

        const slug = href.replace(/\.html$/i, "");
        const audioPath = `../assets/audio/${slug}.mp3`;

        try {
          const response = await fetch(audioPath, { method: "HEAD" });
          if (!response.ok) return;

          card.classList.add("has-audio");
          card.setAttribute("data-has-audio", "true");

          appendAriaHint(card, "ada audio");
        } catch (e) {
          // senyap sahaja jika audio belum wujud
        }
      })
    );
  }

  markSubtopicCardsWithAudio();
});

/**
 * Path helpers for mindmap + sparkle menu + search (must match pretty URLs).
 * - Home is "/", "/index", "/index.html", "/index/", etc. — but never under /notes/.
 * - Notes section is any path containing "/notes" as a segment ("/notes", "/repo/notes/…").
 */
function hzZymnotesIsHomePathname(p) {
  if (!p || typeof p !== "string") return false;
  if (/\/notes(?:\/|$)/i.test(p)) return false;
  var tail = p.replace(/\/+$/, "").split("/").pop() || "";
  return tail === "" || tail === "index" || tail === "index.html";
}

function hzZymnotesIsNotesPathname(p) {
  return !!p && /\/notes(?:\/|$)/i.test(p);
}

function hzZymnotesIsFeedbackPathname(p) {
  if (!p || typeof p !== "string") return false;
  var tail = p.replace(/\/+$/, "").split("/").pop() || "";
  return /^feedback\.html$/i.test(tail);
}

/** Utama, indeks nota, tentang, maklum balas — sparkle menu + mindmap; bab induk + subtopik nota. */
function hzZymnotesIsSparkleShellPathname(p) {
  if (!p || typeof p !== "string") return false;
  if (hzZymnotesIsHomePathname(p) || hzZymnotesIsNotesPathname(p)) return true;
  var tail = p.replace(/\/+$/, "").split("/").pop() || "";
  return /^about\.html$/i.test(tail) || hzZymnotesIsFeedbackPathname(p);
}

/** Halaman induk bab sahaja: bab-1.html … bab-8.html (bukan subtopik). */
function hzZymnotesIsBabHubPathname(p) {
  if (!p || typeof p !== "string") return false;
  return /\/notes\/bab-[1-8](?:\.html)?(?:\/)?$/i.test(p);
}

/** Halaman nota subtopik: bab-X-Y.html (bukan bab induk). */
function hzZymnotesIsSubtopicNotePathname(p) {
  if (!p || typeof p !== "string") return false;
  return /\/notes\/bab-\d+-\d+(?:\.html)?(?:\/)?$/i.test(p);
}

/** Halaman kuiz bawah /quiz/ (contoh: bab-1-1.html). */
function hzZymnotesIsQuizPathname(p) {
  if (!p || typeof p !== "string") return false;
  return /\/quiz\/bab-\d+-\d+(?:\.html)?(?:\/)?$/i.test(p);
}

/** Site path prefix before "/notes/…" ("" or "/repo" style); always without trailing slash except "/". */
function hzZymnotesSiteRootPath() {
  var p = (window.location.pathname || "/").split("?")[0].split("#")[0];
  var m = p.match(/^(.*?)\/notes(?:\/|$)/i);
  if (m) {
    var prefix = m[1] || "";
    return prefix.replace(/\/+$/, "") || "/";
  }
  var trimmed = p.replace(/\/+$/, "");
  if (trimmed === "" || trimmed === "/") return "/";
  var dir = trimmed.replace(/\/[^/]+$/, "");
  return dir === "" ? "/" : dir;
}

/** Absolute URL to a file inside /notes/ (correct from homepage, chapter pages, and subtopics). */
function hzZymnotesNoteHref(filename) {
  var root = hzZymnotesSiteRootPath();
  var path = (root === "/" ? "/notes/" : root + "/notes/") + filename;
  try {
    return new URL(path, window.location.origin).href;
  } catch (e) {
    return path;
  }
}

// =========================
// SEARCH INDEX SOURCE (single source of truth)
// =========================
var HZ_NOTES_SEARCH_PAGES = [
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

  { title: "Bab 5 · Persekutuan Tanah Melayu 1948", tag: "Bab Induk", href: "bab-5.html" },
  { title: "5.1 · Latar Belakang Penubuhan Persekutuan Tanah Melayu 1948", tag: "Subtopik 5.1", href: "bab-5-1.html" },
  { title: "5.2 · Faktor Penubuhan Persekutuan Tanah Melayu 1948", tag: "Subtopik 5.2", href: "bab-5-2.html" },
  { title: "5.3 · Ciri-ciri Persekutuan Tanah Melayu 1948", tag: "Subtopik 5.3", href: "bab-5-3.html" },
  { title: "5.4 · Kesan Penubuhan Persekutuan Tanah Melayu 1948", tag: "Subtopik 5.4", href: "bab-5-4.html" },

  { title: "Bab 6 · Ancaman Komunis dan Perisytiharan Darurat", tag: "Bab Induk", href: "bab-6.html" },
  { title: "6.1 · Kemasukan Pengaruh Komunis di Negara Kita", tag: "Subtopik 6.1", href: "bab-6-1.html" },
  { title: "6.2 · Ancaman Komunis di Negara Kita", tag: "Subtopik 6.2", href: "bab-6-2.html" },
  { title: "6.3 · Usaha Menangani Ancaman Komunis", tag: "Subtopik 6.3", href: "bab-6-3.html" },
  { title: "6.4 · Kesan Zaman Darurat terhadap Negara Kita", tag: "Subtopik 6.4", href: "bab-6-4.html" },

  { title: "Bab 7 · Usaha Ke Arah Kemerdekaan", tag: "Bab Induk", href: "bab-7.html" },
  { title: "7.1 · Latar Belakang Idea Negara Merdeka", tag: "Subtopik 7.1", href: "bab-7-1.html" },
  { title: "7.2 · Jawatankuasa Hubungan Antara Kaum (CLC)", tag: "Subtopik 7.2", href: "bab-7-2.html" },
  { title: "7.3 · Sistem Ahli", tag: "Subtopik 7.3", href: "bab-7-3.html" },
  { title: "7.4 · Sistem Pendidikan Kebangsaan", tag: "Subtopik 7.4", href: "bab-7-4.html" },
  { title: "7.5 · Penubuhan Parti Politik", tag: "Subtopik 7.5", href: "bab-7-5.html" },

  { title: "Bab 8 · Pilihan Raya", tag: "Bab Induk", href: "bab-8.html" },
  { title: "8.1 · Perkembangan Pilihan Raya di Persekutuan Tanah Melayu", tag: "Subtopik 8.1", href: "bab-8-1.html" },
  { title: "8.2 · Proses Pilihan Raya Umum Pertama", tag: "Subtopik 8.2", href: "bab-8-2.html" },
  { title: "8.3 · Penubuhan Majlis Perundangan Persekutuan", tag: "Subtopik 8.3", href: "bab-8-3.html" },
  { title: "8.4 · Peranan Kabinet Pertama Persekutuan Tanah Melayu", tag: "Subtopik 8.4", href: "bab-8-4.html" },
];

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

  const isInNotes = hzZymnotesIsNotesPathname(window.location.pathname);
  const base = isInNotes ? "" : "notes/";

  const PAGES = HZ_NOTES_SEARCH_PAGES;

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
// QUICK NAV DATA
// =========================
var ZYMNOTES_NAV = { chapters: [
  { num: 1, title: 'Warisan Negara Bangsa', url: 'bab-1.html',
    color: { bg: '#eef2ff', text: '#312e81', accent: '#6366f1' },
    subtopics: [
    { num: '1.1', title: 'Latar Belakang Negara Bangsa Sebelum Kedatangan Barat', url: 'bab-1-1.html' },
    { num: '1.2', title: 'Ciri-ciri Negara Bangsa Kesultanan Melayu Melaka', url: 'bab-1-2.html' },
    { num: '1.3', title: 'Keunggulan Sistem Pentadbiran dan Undang-undang', url: 'bab-1-3.html' },
    { num: '1.4', title: 'Peranan Pemerintah dan Rakyat', url: 'bab-1-4.html' },
  ]},
  { num: 2, title: 'Kebangkitan Nasionalisme', url: 'bab-2.html',
    color: { bg: '#e0f2fe', text: '#0c4a6e', accent: '#0284c7' },
    subtopics: [
    { num: '2.1', title: 'Maksud Nasionalisme', url: 'bab-2-1.html' },
    { num: '2.2', title: 'Perkembangan Idea Nasionalisme di Barat', url: 'bab-2-2.html' },
    { num: '2.3', title: 'Perkembangan Nasionalisme di Asia', url: 'bab-2-3.html' },
    { num: '2.4', title: 'Perkembangan Nasionalisme di Asia Tenggara', url: 'bab-2-4.html' },
    { num: '2.5', title: 'Kesedaran Nasionalisme di Negara Kita', url: 'bab-2-5.html' },
    { num: '2.6', title: 'Faktor Kemunculan Gerakan Nasionalisme', url: 'bab-2-6.html' },
    { num: '2.7', title: 'Perkembangan Nasionalisme', url: 'bab-2-7.html' },
    { num: '2.8', title: 'Kesan Perkembangan Nasionalisme', url: 'bab-2-8.html' },
  ]},
  { num: 3, title: 'Konflik Dunia dan Pendudukan Jepun di Negara Kita', url: 'bab-3.html',
    color: { bg: '#f1f5f9', text: '#334155', accent: '#64748b' },
    subtopics: [
    { num: '3.1', title: 'Nasionalisme di Negara Kita Sebelum Perang Dunia', url: 'bab-3-1.html' },
    { num: '3.2', title: 'Latar Belakang Perang Dunia', url: 'bab-3-2.html' },
    { num: '3.3', title: 'Perang Dunia Kedua', url: 'bab-3-3.html' },
    { num: '3.4', title: 'Perang Dunia Kedua di Asia Pasifik', url: 'bab-3-4.html' },
    { num: '3.5', title: 'Faktor Kedatangan Jepun ke Negara Kita', url: 'bab-3-5.html' },
    { num: '3.6', title: 'Dasar Pendudukan Jepun di Negara Kita', url: 'bab-3-6.html' },
    { num: '3.7', title: 'Perjuangan Rakyat Menentang Pendudukan Jepun', url: 'bab-3-7.html' },
    { num: '3.8', title: 'Perkembangan Gerakan Nasionalisme Tempatan dan Pendudukan Jepun', url: 'bab-3-8.html' },
    { num: '3.9', title: 'Keadaan Negara Kita Selepas Kekalahan Jepun', url: 'bab-3-9.html' },
  ]},
  { num: 4, title: 'Era Peralihan Kuasa British di Negara Kita', url: 'bab-4.html',
    color: { bg: '#ede9fe', text: '#4c1d95', accent: '#7c3aed' },
    subtopics: [
    { num: '4.1', title: 'British Military Administration (BMA)', url: 'bab-4-1.html' },
    { num: '4.2', title: 'Gagasan Malayan Union', url: 'bab-4-2.html' },
    { num: '4.3', title: 'Reaksi Penduduk Tempatan terhadap Malayan Union', url: 'bab-4-3.html' },
    { num: '4.4', title: 'Penyerahan Sarawak kepada Kerajaan British', url: 'bab-4-4.html' },
    { num: '4.5', title: 'Reaksi Penduduk Tempatan terhadap Penyerahan Sarawak', url: 'bab-4-5.html' },
    { num: '4.6', title: 'Penyerahan Sabah kepada Kerajaan British', url: 'bab-4-6.html' },
    { num: '4.7', title: 'Reaksi Penduduk Tempatan terhadap Penyerahan Sabah', url: 'bab-4-7.html' },
  ]},
  { num: 5, title: 'Persekutuan Tanah Melayu 1948', url: 'bab-5.html',
    color: { bg: '#ecfdf5', text: '#065f46', accent: '#059669' },
    subtopics: [
    { num: '5.1', title: 'Latar Belakang Penubuhan Persekutuan Tanah Melayu 1948', url: 'bab-5-1.html' },
    { num: '5.2', title: 'Faktor Penubuhan Persekutuan Tanah Melayu 1948', url: 'bab-5-2.html' },
    { num: '5.3', title: 'Ciri-ciri Persekutuan Tanah Melayu 1948', url: 'bab-5-3.html' },
    { num: '5.4', title: 'Kesan Penubuhan Persekutuan Tanah Melayu 1948', url: 'bab-5-4.html' },
  ]},
  { num: 6, title: 'Ancaman Komunis dan Perisytiharan Darurat', url: 'bab-6.html',
    color: { bg: '#fef2f2', text: '#9f1239', accent: '#e11d48' },
    subtopics: [
    { num: '6.1', title: 'Kemasukan Pengaruh Komunis di Negara Kita', url: 'bab-6-1.html' },
    { num: '6.2', title: 'Ancaman Komunis di Negara Kita', url: 'bab-6-2.html' },
    { num: '6.3', title: 'Usaha Menangani Ancaman Komunis', url: 'bab-6-3.html' },
    { num: '6.4', title: 'Kesan Zaman Darurat terhadap Negara Kita', url: 'bab-6-4.html' },
  ]},
  { num: 7, title: 'Usaha ke Arah Kemerdekaan', url: 'bab-7.html',
    color: { bg: '#faf5ff', text: '#6b21a8', accent: '#9333ea' },
    subtopics: [
    { num: '7.1', title: 'Latar Belakang Idea Negara Merdeka', url: 'bab-7-1.html' },
    { num: '7.2', title: 'Jawatankuasa Hubungan Antara Kaum', url: 'bab-7-2.html' },
    { num: '7.3', title: 'Sistem Ahli', url: 'bab-7-3.html' },
    { num: '7.4', title: 'Sistem Pendidikan Kebangsaan', url: 'bab-7-4.html' },
    { num: '7.5', title: 'Penubuhan Parti Politik', url: 'bab-7-5.html' },
  ]},
  { num: 8, title: 'Pilihan Raya', url: 'bab-8.html',
    color: { bg: '#ecfeff', text: '#155e75', accent: '#0891b2' },
    subtopics: [
    { num: '8.1', title: 'Perkembangan Pilihan Raya di Persekutuan Tanah Melayu', url: 'bab-8-1.html' },
    { num: '8.2', title: 'Proses Pilihan Raya Umum Pertama', url: 'bab-8-2.html' },
    { num: '8.3', title: 'Penubuhan Majlis Perundangan Persekutuan', url: 'bab-8-3.html' },
    { num: '8.4', title: 'Peranan Kabinet Pertama Persekutuan Tanah Melayu', url: 'bab-8-4.html' },
  ]},
]};

// =========================
// AUDIO PLAYER
// =========================
(function setupAudioPlayers() {
  // Audio kini dikawal sepenuhnya oleh Sparkle Menu (setupNoteFeatures).
})();

// =========================
// NOTE PAGE: SPARKLE MENU — draggable corner FAB
// =========================
(function setupNoteFeatures() {
  document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.note-sparkle-wrap')) return;
    var _p = window.location.pathname;
    if (
      !hzZymnotesIsSparkleShellPathname(_p) &&
      !hzZymnotesIsBabHubPathname(_p) &&
      !hzZymnotesIsSubtopicNotePathname(_p) &&
      !hzZymnotesIsQuizPathname(_p)
    )
      return;

    var audioEl = document.querySelector('.note-audio-player .audio-src');
    var zhModeApi = window.HzZhMode || null;

    var NOTICE_KEY = 'hzaudio-notice' + window.location.pathname;
    var noticeShown = false;

    function showAudioNotice() {
      if (noticeShown || localStorage.getItem(NOTICE_KEY)) return;
      noticeShown = true;

      var sheet = document.createElement('div');
      sheet.className = 'audio-notice-sheet';
      sheet.setAttribute('role', 'status');
      sheet.setAttribute('aria-live', 'polite');
      sheet.innerHTML =
        '<span class="audio-notice-icon" aria-hidden="true">\uD83C\uDFA7</span>' +
        '<div class="audio-notice-content">' +
          '<span class="audio-notice-title">Makluman audio</span>' +
          '<span class="audio-notice-text">Audio mungkin mengandungi ringkasan \u2014 nota adalah rujukan utama.</span>' +
        '</div>' +
        '<button class="audio-notice-close" type="button" aria-label="Tutup">\u2715</button>';
      document.body.appendChild(sheet);

      function dismiss() {
        localStorage.setItem(NOTICE_KEY, '1');
        sheet.classList.remove('zh-toast-show');
        sheet.classList.add('zh-toast-hide');
        setTimeout(function() { sheet.remove(); }, 300);
      }

      sheet.querySelector('.audio-notice-close').addEventListener('click', dismiss);

      requestAnimationFrame(function () {
        requestAnimationFrame(function () { sheet.classList.add('zh-toast-show'); });
      });
    }

    var labHref = document.body.dataset.labHref ||
      (function() {
        var el = document.querySelector('#learning-lab-entry .btn[href]');
        return el ? el.getAttribute('href') : null;
      })();
    var labEmojiRaw = document.body.dataset.labEmoji || '🧩';
    var labEmoji = labEmojiRaw;
    if (labHref && /(?:^|\/)quiz\/bab-(?:1-[1-4]|2-[1-8])\.html(?:$|[?#])/.test(labHref)) {
      labEmoji = '🧩';
    }

    if (!audioEl && !labHref && !zhModeApi) {
      document.dispatchEvent(new CustomEvent('hz:zh-legacy-controls'));
    }

    var wrap = document.createElement('div');
    wrap.className = 'note-sparkle-wrap';

    function syncSparklePanelState() {
      var hasOpenPanel =
        wrap.classList.contains('is-open') ||
        wrap.classList.contains('controls-open') ||
        wrap.classList.contains('audio-active');
      document.body.classList.toggle('sparkle-panel-open', hasOpenPanel);
    }

    var itemsContainer = document.createElement('div');
    itemsContainer.className = 'note-sparkle-items';

    function makeSparkleItem(content, tooltip, type, href) {
      var el = href ? document.createElement('a') : document.createElement('button');
      if (href) { el.href = href; }
      else { el.type = 'button'; }
      el.className = 'note-sparkle-item';
      el.setAttribute('aria-label', tooltip);
      el.setAttribute('data-tooltip', tooltip);
      el.setAttribute('data-sparkle-type', type);
      el.textContent = content;
      return el;
    }

    itemsContainer.appendChild(makeSparkleItem('🗺️', 'Navigasi Cepat', 'nav'));
    if (audioEl) itemsContainer.appendChild(makeSparkleItem('🎧', 'Main audio', 'audio'));
    if (labHref) itemsContainer.appendChild(makeSparkleItem(labEmoji, 'Kuiz', 'lab', labHref));
    if (zhModeApi) itemsContainer.appendChild(makeSparkleItem('华', 'Mod Bahasa Cina (Versi Awal)', 'zh-mode'));

    var fab = document.createElement('button');
    fab.className = 'note-sparkle-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Menu pembelajaran');
    fab.textContent = '✨';

    // ── Audio Progress Ring (around FAB) ──────────────────────────────
    var CIRC = 2 * Math.PI * 30;
    var svgNS = 'http://www.w3.org/2000/svg';
    var ringDiv = document.createElement('div');
    ringDiv.className = 'sparkle-audio-ring';

    var ringsvg = document.createElementNS(svgNS, 'svg');
    ringsvg.setAttribute('viewBox', '0 0 68 68');
    ringsvg.setAttribute('aria-hidden', 'true');

    var ringDefs = document.createElementNS(svgNS, 'defs');
    var grad = document.createElementNS(svgNS, 'linearGradient');
    grad.setAttribute('id', 'sparkleRingGrad');
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
    var stop1 = document.createElementNS(svgNS, 'stop');
    stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#38bdf8');
    var stop2 = document.createElementNS(svgNS, 'stop');
    stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#818cf8');
    grad.appendChild(stop1); grad.appendChild(stop2);
    ringDefs.appendChild(grad); ringsvg.appendChild(ringDefs);

    var trackCircle = document.createElementNS(svgNS, 'circle');
    trackCircle.setAttribute('cx', '34'); trackCircle.setAttribute('cy', '34');
    trackCircle.setAttribute('r', '30'); trackCircle.setAttribute('fill', 'none');
    trackCircle.setAttribute('stroke', 'rgba(109,99,255,0.18)');
    trackCircle.setAttribute('stroke-width', '3.5');
    ringsvg.appendChild(trackCircle);

    var progCircle = document.createElementNS(svgNS, 'circle');
    progCircle.setAttribute('cx', '34'); progCircle.setAttribute('cy', '34');
    progCircle.setAttribute('r', '30'); progCircle.setAttribute('fill', 'none');
    progCircle.setAttribute('stroke', 'url(#sparkleRingGrad)');
    progCircle.setAttribute('stroke-width', '3.5');
    progCircle.setAttribute('stroke-linecap', 'round');
    progCircle.setAttribute('stroke-dasharray', CIRC);
    progCircle.setAttribute('stroke-dashoffset', '0');
    ringsvg.appendChild(progCircle);
    ringDiv.appendChild(ringsvg);

    // ── Countdown text (below FAB) ────────────────────────────────────
    var countdownEl = document.createElement('span');
    countdownEl.className = 'sparkle-audio-countdown';
    countdownEl.setAttribute('aria-hidden', 'true');

    var fabInner = document.createElement('div');
    fabInner.className = 'note-sparkle-fab-inner';
    fabInner.appendChild(fab);
    fabInner.appendChild(ringDiv);

    var fabGroup = document.createElement('div');
    fabGroup.className = 'note-sparkle-fab-group';
    fabGroup.appendChild(fabInner);
    fabGroup.appendChild(countdownEl);

    // ── Audio Side Controls ───────────────────────────────────────────
    function makeCtrlBtn(icon, action) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sparkle-ctrl-btn';
      btn.setAttribute('data-ctrl', action);
      btn.setAttribute('aria-label', action);
      btn.textContent = icon;
      return btn;
    }

    var ctrlStop     = makeCtrlBtn('■',   'stop');
    var ctrlBack     = makeCtrlBtn('−10', 'skip-back');
    var ctrlPlayPause = makeCtrlBtn('', 'play-pause');
    var ctrlFwd      = makeCtrlBtn('+10', 'skip-fwd');

    var audioControls = document.createElement('div');
    audioControls.className = 'sparkle-audio-controls';
    audioControls.appendChild(ctrlStop);
    audioControls.appendChild(ctrlBack);
    audioControls.appendChild(ctrlPlayPause);
    audioControls.appendChild(ctrlFwd);

    var fabRow = document.createElement('div');
    fabRow.className = 'sparkle-fab-row';
    fabRow.appendChild(audioControls);
    fabRow.appendChild(fabGroup);

    wrap.appendChild(itemsContainer);
    wrap.appendChild(fabRow);
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
        syncSparklePanelState();
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

    // ── Menu / Controls Toggle (tap only) ────────────────────────────
    fab.addEventListener('click', function(e) {
      e.stopPropagation();
      if (didDrag) return;
      wrap.classList.toggle('is-open');
      syncSparklePanelState();
    });

    document.addEventListener('click', function(e) {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('is-open');
        wrap.classList.remove('controls-open');
        syncSparklePanelState();
      }
    });

    // ── Item Actions ──────────────────────────────────────────────────
    itemsContainer.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-sparkle-type]');
      if (!btn) return;
      var type = btn.getAttribute('data-sparkle-type');
      if (type === 'nav') {
        wrap.classList.remove('is-open');
        syncSparklePanelState();
        if (window.HzMindmap) window.HzMindmap.open();
        return;
      }
      if (type === 'audio' && audioEl) {
        showAudioNotice();
        audioEl.paused ? audioEl.play() : audioEl.pause();
        wrap.classList.remove('is-open');
        syncSparklePanelState();
      }
      if (type === 'lab') {
        wrap.classList.remove('is-open');
        syncSparklePanelState();
      }
      if (type === 'zh-mode' && zhModeApi) {
        zhModeApi.toggle();
        wrap.classList.remove('is-open');
        syncSparklePanelState();
      }
    });

    // ── Audio State Machine ───────────────────────────────────────────
    if (audioEl) {
      var audioBtn = itemsContainer.querySelector('[data-sparkle-type="audio"]');

      function fmtRemaining() {
        if (!isFinite(audioEl.duration)) return '';
        var rem = Math.max(0, Math.ceil(audioEl.duration - audioEl.currentTime));
        var m = Math.floor(rem / 60), s = rem % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
      }

      function updateRing() {
        if (!audioEl.duration) return;
        progCircle.setAttribute('stroke-dashoffset',
          CIRC * (audioEl.currentTime / audioEl.duration));
        countdownEl.textContent = fmtRemaining();
      }

      function stopAudio() {
        audioEl.pause();
        audioEl.currentTime = 0;
        fab.textContent = '✨';
        wrap.classList.remove('audio-active');
        wrap.classList.remove('controls-open');
        syncSparklePanelState();
        progCircle.setAttribute('stroke-dashoffset', '0');
        countdownEl.textContent = '';
        ctrlPlayPause.classList.remove('is-paused');
        if (audioBtn) audioBtn.textContent = '🎧';
      }

      audioEl.addEventListener('timeupdate', updateRing);

      audioEl.addEventListener('play', function() {
        fab.textContent = '🎧';
        wrap.classList.add('audio-active');
        wrap.classList.remove('is-open');
        syncSparklePanelState();
        ctrlPlayPause.classList.remove('is-paused');
        countdownEl.textContent = fmtRemaining();
        if (audioBtn) audioBtn.textContent = '⏸️';
      });

      audioEl.addEventListener('pause', function() {
        ctrlPlayPause.classList.add('is-paused');
        if (audioBtn) audioBtn.textContent = '🎧';
        // FAB stays 🎧, ring stays visible
      });

      audioEl.addEventListener('ended', stopAudio);

      // ── Control button actions ──────────────────────────────────────
      audioControls.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-ctrl]');
        if (!btn) return;
        e.stopPropagation();
        var action = btn.getAttribute('data-ctrl');
        if (action === 'stop') {
          stopAudio();
        } else if (action === 'skip-back') {
          audioEl.currentTime = Math.max(0, audioEl.currentTime - 10);
        } else if (action === 'skip-fwd') {
          audioEl.currentTime = Math.min(audioEl.duration || 0, audioEl.currentTime + 10);
        } else if (action === 'play-pause') {
          audioEl.paused ? audioEl.play() : audioEl.pause();
        }
      });
    }
  });
})();

// =========================
// MINDMAP NAVIGATION OVERLAY
// =========================
(function () {
  var _p = window.location.pathname;
  if (
    !hzZymnotesIsSparkleShellPathname(_p) &&
    !hzZymnotesIsBabHubPathname(_p) &&
    !hzZymnotesIsSubtopicNotePathname(_p) &&
    !hzZymnotesIsQuizPathname(_p)
  )
    return;

  var overlay = null;
  var svgEl = null;
  var centerEl = null;
  var nodesWrap = null;
  var backBtn = null;
  var closeBtn = null;
  var state = 'subject'; // 'subject' | 'chapter'
  var activeChapterIdx = -1;
  var svgNS = 'http://www.w3.org/2000/svg';
  /** Half-size of .hz-mm-node (72×60 default; 78×60 ≥480px) — keep in sync with ui.css */
  var NODE_HALF_W = 40;
  var NODE_HALF_H = 30;
  var stageResizeObserver = null;

  /**
   * Filename of the active notes page (e.g. bab-3-2.html) for matching nav data.
   * pathname.split('/').pop() fails for extensionless URLs (/notes/bab-3-2).
   */
  function getNotesPageSlug() {
    var p = window.location.pathname;
    var m = p.match(/\/(bab-\d+(?:-\d+)?)(?:\.html)?\/?$/i);
    if (m) {
      var slug = m[1];
      return /\.html$/i.test(slug) ? slug : slug + '.html';
    }
    var last = p.split('/').filter(Boolean).pop();
    return last && /\.html$/i.test(last) ? last : '';
  }

  function noteHref(filename) {
    return hzZymnotesNoteHref(filename);
  }

  function buildOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'hz-mindmap-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Navigasi Nota Mindmap');

    var stage = document.createElement('div');
    stage.className = 'hz-mindmap-stage';

    svgEl = document.createElementNS(svgNS, 'svg');
    svgEl.setAttribute('class', 'hz-mindmap-svg');
    svgEl.setAttribute('aria-hidden', 'true');

    centerEl = document.createElement('div');
    centerEl.className = 'hz-mm-center';

    nodesWrap = document.createElement('div');
    nodesWrap.className = 'hz-mm-nodes';

    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'hz-mm-close';
    closeBtn.setAttribute('aria-label', 'Tutup navigasi');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', close);

    backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'hz-mm-back';
    backBtn.setAttribute('aria-label', 'Kembali ke semua bab');
    backBtn.innerHTML = '← Semua Bab';
    backBtn.style.display = 'none';
    backBtn.addEventListener('click', function () { showSubjectView(true); });

    stage.appendChild(svgEl);
    stage.appendChild(centerEl);
    stage.appendChild(nodesWrap);
    stage.appendChild(closeBtn);
    stage.appendChild(backBtn);
    overlay.appendChild(stage);
    document.body.appendChild(overlay);

    if (typeof ResizeObserver !== 'undefined') {
      stageResizeObserver = new ResizeObserver(function () {
        if (overlay && overlay.classList.contains('is-open')) refreshMindmapLayout();
      });
      stageResizeObserver.observe(stage);
    } else {
      window.addEventListener('resize', refreshMindmapLayout);
    }

    centerEl.addEventListener('click', function (e) {
      if (state !== 'chapter') return;
      e.stopPropagation();
      showSubjectView(true);
    });
    centerEl.addEventListener('keydown', onCenterKeydown);

    overlay.addEventListener('click', function (e) {
      var st = overlay.querySelector('.hz-mindmap-stage');
      if (!st) { close(); return; }
      // Use composedPath() so the check survives DOM mutations that happen inside
      // click handlers (e.g. clearNodes() removes the clicked chapter button before
      // this handler runs, making st.contains(e.target) incorrectly return false).
      var path = e.composedPath ? e.composedPath() : [];
      if (st.contains(e.target) || path.indexOf(st) !== -1) return;
      close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('is-open')) close();
    });
  }

  function onCenterKeydown(e) {
    if (state !== 'chapter') return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showSubjectView(true);
    }
  }

  function getIdealRadius(count) {
    if (count <= 4) return 140;
    if (count <= 6) return 155;
    if (count <= 8) return 168;
    return 182;
  }

  /** Largest |cos θ| and |sin θ| for equally spaced nodes (start −90°). */
  function maxAxisExtents(count) {
    var maxC = 0;
    var maxS = 0;
    for (var i = 0; i < count; i++) {
      var ang = (2 * Math.PI * i / count) - Math.PI / 2;
      var ac = Math.abs(Math.cos(ang));
      var asn = Math.abs(Math.sin(ang));
      if (ac > maxC) maxC = ac;
      if (asn > maxS) maxS = asn;
    }
    return { cos: maxC, sin: maxS };
  }

  /**
   * Cap radial distance so node boxes stay inside the stage (mobile has a small
   * fixed stage vs desktop ideal radius).
   */
  function getRadiusForStage(sw, sh, count) {
    var ideal = getIdealRadius(count);
    if (!sw || !sh || count < 1) return ideal;
    var margin = 8;
    var ax = maxAxisExtents(count);
    var capX = ax.cos > 0.001 ? (sw / 2 - margin - NODE_HALF_W) / ax.cos : ideal;
    var capY = ax.sin > 0.001 ? (sh / 2 - margin - NODE_HALF_H) / ax.sin : ideal;
    var cap = Math.min(capX, capY);
    return Math.max(48, Math.min(ideal, cap));
  }

  function calcPositions(count, radius) {
    var positions = [];
    for (var i = 0; i < count; i++) {
      var angle = (2 * Math.PI * i / count) - Math.PI / 2;
      positions.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    return positions;
  }

  function makeSvgLines(positions, stageW, stageH, lineColor) {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    var cx = stageW / 2, cy = stageH / 2;
    positions.forEach(function (pos) {
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', cx + pos.x);
      line.setAttribute('y2', cy + pos.y);
      line.setAttribute('class', 'hz-mm-line');
      if (lineColor) line.style.stroke = lineColor;
      svgEl.appendChild(line);
    });
  }

  function clearNodes() {
    while (nodesWrap.firstChild) nodesWrap.removeChild(nodesWrap.firstChild);
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  }

  function makeNode(label, sublabel, href, onClick, extraClass, color) {
    var el = href ? document.createElement('a') : document.createElement('button');
    if (href) {
      el.href = href;
      el.addEventListener('click', function () {
        setTimeout(close, 0);
      });
    } else {
      el.type = 'button';
      if (onClick) el.addEventListener('click', function (e) {
        e.stopPropagation();
        onClick();
      });
    }
    el.className = 'hz-mm-node' + (extraClass ? ' ' + extraClass : '');
    if (color) {
      el.style.setProperty('--mm-node-bg', color.bg);
      el.style.setProperty('--mm-node-text', color.text);
      el.style.setProperty('--mm-node-accent', color.accent);
    }
    el.innerHTML =
      '<span class="hz-mm-node-num">' + label + '</span>' +
      (sublabel ? '<span class="hz-mm-node-sub">' + sublabel + '</span>' : '');
    return el;
  }

  function applyChapterCenter(chapter) {
    centerEl.className = 'hz-mm-center hz-mm-center--chapter';
    if (chapter && chapter.color) {
      centerEl.style.setProperty('--mm-ch-bg', chapter.color.bg);
      centerEl.style.setProperty('--mm-ch-text', chapter.color.text);
      centerEl.style.setProperty('--mm-ch-accent', chapter.color.accent);
    }
  }

  function showSubjectView(animated) {
    state = 'subject';
    activeChapterIdx = -1;

    clearNodes();
    centerEl.className = 'hz-mm-center';
    centerEl.removeAttribute('style');
    centerEl.innerHTML =
      '<span class="hz-mm-center-title">Sejarah</span>' +
      '<span class="hz-mm-center-sub">Tingkatan 4</span>';

    var chapters = ZYMNOTES_NAV.chapters;
    var stage = overlay.querySelector('.hz-mindmap-stage');
    var sw = stage.offsetWidth || window.innerWidth;
    var sh = stage.offsetHeight || window.innerHeight;
    var positions = calcPositions(chapters.length, getRadiusForStage(sw, sh, chapters.length));
    makeSvgLines(positions, sw, sh, null);

    var currentFile = getNotesPageSlug();

    chapters.forEach(function (ch, i) {
      var isCurrent = ch.subtopics.some(function (s) { return s.url === currentFile; }) ||
                      ch.url === currentFile;
      var node = makeNode(
        'Bab ' + ch.num,
        ch.title.split(' ').slice(0, 3).join(' ') + (ch.title.split(' ').length > 3 ? '…' : ''),
        null,
        (function (c, idx) { return function () { showChapterView(c, idx); }; })(ch, i),
        isCurrent ? 'is-current' : '',
        ch.color
      );
      node.style.setProperty('--mm-x', positions[i].x + 'px');
      node.style.setProperty('--mm-y', positions[i].y + 'px');
      node.classList.add('mm-anim-in');
      node.style.animationDelay = (i * 48) + 'ms';
      nodesWrap.appendChild(node);
    });

    backBtn.style.display = 'none';
    centerEl.removeAttribute('title');
    centerEl.removeAttribute('role');
    centerEl.removeAttribute('tabindex');
    centerEl.removeAttribute('aria-label');
    if (animated) {
      centerEl.classList.add('mm-fade');
      setTimeout(function () { centerEl.classList.remove('mm-fade'); }, 280);
    }
  }

  function showChapterView(chapter, chIdx, animated) {
    state = 'chapter';
    activeChapterIdx = chIdx;
    if (animated === undefined) animated = true;

    clearNodes();
    applyChapterCenter(chapter);
    centerEl.innerHTML =
      '<span class="hz-mm-center-title">Bab ' + chapter.num + '</span>' +
      '<span class="hz-mm-center-sub">' + chapter.title.split(' ').slice(0, 4).join(' ') + (chapter.title.split(' ').length > 4 ? '…' : '') + '</span>';
    centerEl.setAttribute('title', 'Ketik untuk kembali ke mindmap semua bab');
    centerEl.setAttribute('role', 'button');
    centerEl.setAttribute('tabindex', '0');
    centerEl.setAttribute('aria-label', 'Kembali ke mindmap semua bab');

    var subs = chapter.subtopics;
    var stage = overlay.querySelector('.hz-mindmap-stage');
    var sw = stage.offsetWidth || window.innerWidth;
    var sh = stage.offsetHeight || window.innerHeight;
    var positions = calcPositions(subs.length, getRadiusForStage(sw, sh, subs.length));
    var lineColor = chapter.color ? chapter.color.accent : null;
    makeSvgLines(positions, sw, sh, lineColor);

    var currentFile = getNotesPageSlug();

    subs.forEach(function (sub, i) {
      var isCurrent = sub.url === currentFile;
      var node = makeNode(
        sub.num,
        sub.title.split(' ').slice(0, 3).join(' ') + (sub.title.split(' ').length > 3 ? '…' : ''),
        noteHref(sub.url),
        null,
        isCurrent ? 'is-current' : '',
        chapter.color
      );
      node.style.setProperty('--mm-x', positions[i].x + 'px');
      node.style.setProperty('--mm-y', positions[i].y + 'px');
      node.classList.add('mm-anim-in');
      node.style.animationDelay = (i * 40) + 'ms';
      nodesWrap.appendChild(node);
    });

    backBtn.style.display = '';
    if (animated) {
      centerEl.classList.add('mm-fade');
      setTimeout(function () { centerEl.classList.remove('mm-fade'); }, 280);
    }
  }

  function refreshMindmapLayout() {
    if (!overlay || !overlay.classList.contains('is-open')) return;
    if (state === 'subject') {
      showSubjectView(false);
    } else if (activeChapterIdx >= 0 && ZYMNOTES_NAV.chapters[activeChapterIdx]) {
      showChapterView(ZYMNOTES_NAV.chapters[activeChapterIdx], activeChapterIdx, false);
    }
  }

  function open(startChapterIdx) {
    buildOverlay();
    overlay.classList.add('is-open');
    document.body.classList.add('mindmap-open');

    if (typeof startChapterIdx === 'number') {
      showChapterView(ZYMNOTES_NAV.chapters[startChapterIdx], startChapterIdx, false);
    } else {
      var currentFile = getNotesPageSlug();
      var autoIdx = -1;
      ZYMNOTES_NAV.chapters.forEach(function (ch, i) {
        if (ch.subtopics.some(function (s) { return s.url === currentFile; })) autoIdx = i;
      });
      if (autoIdx >= 0) {
        showChapterView(ZYMNOTES_NAV.chapters[autoIdx], autoIdx, false);
      } else {
        showSubjectView(false);
      }
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(refreshMindmapLayout);
    });
    setTimeout(function () { closeBtn.focus(); }, 80);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('mindmap-open');
  }

  window.HzMindmap = { open: open, close: close };
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
      img.src = '/icons/icon.svg?v=4';
      img.alt = '';
      img.width = 22;
      img.height = 22;
      img.className = 'brand-icon';
      el.insertBefore(img, el.firstChild);
    });

    document.querySelectorAll('.footer-brand').forEach(function (el) {
      var img = document.createElement('img');
      img.src = '/icons/icon.svg?v=4';
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

// ── Global Search Overlay ─────────────────────────────────────────────────────
(function () {
  var PAGES = HZ_NOTES_SEARCH_PAGES;


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
          '<input class="hz-search-input" type="text" inputmode="search" enterkeyhint="search" placeholder="Cari nota..." autocomplete="off" />' +
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
  if (document.body && document.body.classList.contains('no-bottom-nav')) return;
  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('no-bottom-nav')) return;
    var p = location.pathname;
    function isActive(href) {
      var hp = href.replace(/\/?(index\.html)?$/, '').replace(/^\//, '');
      var pp = p.replace(/\/?(index\.html)?$/, '').replace(/^\//, '');
      if (href === 'hz:search') {
        return false;
      }
      if (href.includes('/notes/') && !href.endsWith('index.html')) {
        return p.includes('/notes/') && !p.endsWith('index.html');
      }
      if (href.includes('/notes/')) return p.includes('/notes/');
      if (href === '/index.html') return pp === '' || pp === 'index.html';
      return pp === hp;
    }
    var tabs = [
      { icon: HZ_ICONS.home,   label: 'Utama',   href: '/index.html' },
      { icon: HZ_ICONS.notes,  label: 'Nota',    href: '/notes/index.html' },
      { icon: HZ_ICONS.search, label: 'Cari',    href: 'hz:search' },
      { icon: HZ_ICONS.about,  label: 'Tentang', href: '/about.html' }
    ];
    var nav = document.createElement('nav');
    nav.className = 'hz-bottom-nav';
    nav.setAttribute('aria-label', 'Navigasi utama');
    tabs.forEach(function (tab) {
      var el;
      if (tab.href === 'hz:search') {
        el = document.createElement('button');
        el.type = 'button';
        el.className = 'hz-bottom-nav-item';
        el.setAttribute('aria-label', 'Buka carian nota');
        el.innerHTML = '<span class="hz-nav-icon">' + tab.icon + '</span><span>' + tab.label + '</span>';
        el.addEventListener('click', function () {
          document.dispatchEvent(new CustomEvent('hz:search-open'));
        });
      } else {
        el = document.createElement('a');
        el.href = tab.href;
        el.className = 'hz-bottom-nav-item' + (isActive(tab.href) ? ' is-active' : '');
        el.innerHTML = '<span class="hz-nav-icon">' + tab.icon + '</span><span>' + tab.label + '</span>';
      }
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


// ── Pull-to-refresh tersuai — anak panah membulat (gaya Chrome) + warna ZymNotes ─
(function setupZymPullToRefresh() {
  if (!window.matchMedia || !window.matchMedia('(max-width: 760px)').matches) return;

  document.documentElement.classList.add('hz-ptr-enabled');

  var indicator = document.createElement('div');
  indicator.className = 'hz-ptr-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  indicator.innerHTML =
    '<div class="hz-ptr-sheen">' +
      '<svg class="hz-ptr-arrow-svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="hzPtrSpinGrad" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#9B77FF"/>' +
            '<stop offset="100%" stop-color="#55B5FF"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<g transform="translate(12,12)">' +
          '<g class="hz-ptr-arrow-rot">' +
            '<circle class="hz-ptr-arrow-arc" cx="0" cy="0" r="7.5" fill="none" stroke="url(#hzPtrSpinGrad)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="34 14" transform="rotate(-88)"/>' +
          '</g>' +
        '</g>' +
      '</svg>' +
    '</div>';
  document.body.appendChild(indicator);

  /* Jarak + halaju: refresh bila niat jelas — jarak commit lebih pendek (rapat Chrome), scrollY guard kekal */
  var DIST_MIN = 200;
  var DIST_STRONG = 278;
  var VEL_MS_WINDOW = 110;
  var VEL_MIN = 0.48;
  var MIN_SAMPLES_FOR_VEL_COMMIT = 6;
  /* Paparan “getah”: sedikit kurang rintangan — anak panah ikut jari lebih rapat */
  var RUBBER_MAX_PX = 66;
  var RUBBER_TAU = 118;
  var startY = 0;
  var active = false;
  var pulling = false;
  var lastDy = 0;
  var lastVisualPx = 0;
  var moveSamples = [];
  var sheen = indicator.querySelector('.hz-ptr-sheen');

  function rubberVisualPx(dy) {
    if (dy <= 0) return 0;
    return RUBBER_MAX_PX * (1 - Math.exp(-dy / RUBBER_TAU));
  }

  function overlaysOpen() {
    return (
      document.querySelector('.hz-search-overlay.is-open') ||
      document.body.classList.contains('mindmap-open') ||
      document.body.classList.contains('sparkle-panel-open')
    );
  }

  /** True if element can scroll vertically (overflow + content taller than box). */
  function isVerticallyScrollable(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    var st = window.getComputedStyle(el);
    var oy = st.overflowY;
    var yScroll =
      oy === 'auto' || oy === 'scroll' || oy === 'overlay' ||
      st.overflow === 'auto' || st.overflow === 'scroll';
    if (!yScroll) return false;
    return el.scrollHeight > el.clientHeight + 1;
  }

  /**
   * Walk ancestors from node: if any vertically scrollable ancestor is scrolled
   * down (scrollTop > 0), pull-to-refresh must not steal the gesture — window.scrollY
   * stays 0 while inner scrollables move (quiz notice card, game card, feedback).
   */
  function innerVerticalScrollNotAtTop(node) {
    for (var el = node; el && el !== document.documentElement; el = el.parentElement) {
      if (!el || el.nodeType !== 1) continue;
      if (!isVerticallyScrollable(el)) continue;
      if (el.scrollTop > 1) return true;
    }
    return false;
  }

  function innerVerticalScrollNotAtTopAtPoint(clientX, clientY) {
    if (typeof document.elementFromPoint !== 'function') return false;
    var top = document.elementFromPoint(clientX, clientY);
    if (!top || top === document.documentElement) return false;
    return innerVerticalScrollNotAtTop(top);
  }

  function setPull(dy, ready) {
    lastDy = dy;
    lastVisualPx = rubberVisualPx(dy);
    indicator.style.setProperty('--hz-ptr-pull', lastVisualPx + 'px');
    indicator.classList.toggle('hz-ptr-pulling', dy > 6);
    indicator.classList.toggle('hz-ptr-ready', ready);
  }

  function reset() {
    pulling = false;
    active = false;
    lastDy = 0;
    lastVisualPx = 0;
    moveSamples.length = 0;
    indicator.classList.remove('hz-ptr-snapping', 'hz-ptr-pulling', 'hz-ptr-ready', 'hz-ptr-releasing');
    indicator.style.setProperty('--hz-ptr-pull', '0px');
  }

  function snapBackThenReset() {
    if (!sheen || lastVisualPx < 2) {
      reset();
      return;
    }
    indicator.classList.add('hz-ptr-snapping');
    indicator.classList.remove('hz-ptr-ready');
    void sheen.offsetWidth;
    indicator.style.setProperty('--hz-ptr-pull', '0px');
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      sheen.removeEventListener('transitionend', onTransEnd);
      indicator.classList.remove('hz-ptr-snapping');
      reset();
    }
    function onTransEnd(e) {
      if (e.propertyName !== 'transform') return;
      finish();
    }
    sheen.addEventListener('transitionend', onTransEnd);
    window.setTimeout(finish, 480);
  }

  function endVelocityPxPerMs() {
    var now = performance.now();
    var t0 = now - VEL_MS_WINDOW;
    var i = moveSamples.length - 1;
    while (i >= 0 && moveSamples[i].t < t0) i--;
    if (i < 1) return 0;
    var a = moveSamples[i - 1];
    var b = moveSamples[moveSamples.length - 1];
    var dt = b.t - a.t;
    if (dt < 12) return 0;
    return (b.y - a.y) / dt;
  }

  function shouldCommitRefresh() {
    if (lastDy < DIST_MIN) return false;
    if (lastDy >= DIST_STRONG) return true;
    if (moveSamples.length < MIN_SAMPLES_FOR_VEL_COMMIT) return false;
    return endVelocityPxPerMs() >= VEL_MIN;
  }

  window.addEventListener(
    'touchstart',
    function (e) {
      if (overlaysOpen()) return;
      if (window.scrollY > 18) return;
      if (innerVerticalScrollNotAtTop(e.target)) return;
      indicator.classList.remove('hz-ptr-snapping');
      active = true;
      lastDy = 0;
      lastVisualPx = 0;
      moveSamples.length = 0;
      startY = e.touches[0].clientY;
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    function (e) {
      if (!active || overlaysOpen()) return;
      if (window.scrollY > 18) {
        reset();
        return;
      }
      var t = e.touches[0];
      if (innerVerticalScrollNotAtTopAtPoint(t.clientX, t.clientY)) {
        reset();
        return;
      }
      var dy = t.clientY - startY;
      if (dy <= 0) return;
      pulling = true;
      var now = performance.now();
      var y = e.touches[0].clientY;
      moveSamples.push({ t: now, y: y });
      if (moveSamples.length > 12) moveSamples.shift();
      var ready =
        dy >= DIST_STRONG ||
        (dy >= DIST_MIN &&
          moveSamples.length >= MIN_SAMPLES_FOR_VEL_COMMIT &&
          endVelocityPxPerMs() >= VEL_MIN * 0.92);
      setPull(dy, ready);
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    function () {
      if (!active) return;
      if (pulling && shouldCommitRefresh()) {
        indicator.classList.add('hz-ptr-releasing');
        window.location.reload();
        return;
      }
      if (pulling) snapBackThenReset();
      else reset();
    },
    { passive: true }
  );

  window.addEventListener(
    'touchcancel',
    function () {
      if (!active) return;
      if (pulling) snapBackThenReset();
      else reset();
    },
    { passive: true }
  );
})();

// =========================
// ABOUT PAGE — PWA INSTALL (hide when installed; re-show after uninstall)
// =========================
(function () {
  var KEY = "zymnotes-pwa-installed";
  var FORCE_KEY = "zymnotes-about-pwa-force-show";
  var card = document.getElementById("about-pwa-card");
  var btn = document.getElementById("about-pwa-install-btn");
  var recoverWrap = document.getElementById("about-pwa-recover");
  var recoverBtn = document.getElementById("about-pwa-recover-btn");
  if (!card || !btn) return;

  function isStandaloneDisplay() {
    try {
      if (window.matchMedia("(display-mode: standalone)").matches) return true;
      if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
      if (window.matchMedia("(display-mode: window-controls-overlay)").matches) return true;
    } catch (e) {}
    if (typeof navigator.standalone === "boolean" && navigator.standalone) return true;
    return false;
  }

  function storageSaysInstalled() {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function skipStorageHide() {
    try {
      return sessionStorage.getItem(FORCE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function clearInstalledFlag() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
  }

  function syncRecoverUI() {
    if (!recoverWrap) return;
    if (!document.documentElement.classList.contains("about-pwa-hide-card")) {
      recoverWrap.hidden = true;
      return;
    }
    recoverWrap.hidden = isStandaloneDisplay();
  }

  function hidePwaCard() {
    document.documentElement.classList.add("about-pwa-hide-card");
    syncRecoverUI();
  }

  function showPwaCard() {
    document.documentElement.classList.remove("about-pwa-hide-card");
    if (recoverWrap) recoverWrap.hidden = true;
  }

  function markInstalled() {
    try {
      localStorage.setItem(KEY, "1");
    } catch (e) {}
    hidePwaCard();
  }

  function getRelatedAppsResult() {
    if (!navigator.getInstalledRelatedApps) {
      return Promise.resolve({ supported: false });
    }
    return navigator
      .getInstalledRelatedApps()
      .then(function (apps) {
        return { supported: true, apps: apps || [] };
      })
      .catch(function () {
        return { supported: false };
      });
  }

  function applyAboutPwaVisibility() {
    if (isStandaloneDisplay()) {
      markInstalled();
      return;
    }
    getRelatedAppsResult().then(function (result) {
      if (isStandaloneDisplay()) {
        markInstalled();
        return;
      }
      if (result.supported && result.apps.length) {
        markInstalled();
        return;
      }
      if (result.supported && result.apps.length === 0) {
        clearInstalledFlag();
      }
      if (storageSaysInstalled() && !skipStorageHide()) {
        hidePwaCard();
        return;
      }
      showPwaCard();
    });
  }

  if (recoverBtn) {
    recoverBtn.addEventListener("click", function () {
      try {
        sessionStorage.setItem(FORCE_KEY, "1");
      } catch (e) {}
      clearInstalledFlag();
      showPwaCard();
    });
  }

  applyAboutPwaVisibility();

  var deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    clearInstalledFlag();
    deferredPrompt = e;
    btn.hidden = false;
    showPwaCard();
  });

  window.addEventListener("appinstalled", function () {
    markInstalled();
    deferredPrompt = null;
  });

  btn.addEventListener("click", function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choice) {
      if (choice && choice.outcome === "accepted") {
        markInstalled();
      } else {
        btn.hidden = true;
      }
      deferredPrompt = null;
    });
  });
})();

// =========================
// SERVICE WORKER REGISTRATION
// =========================
(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js?v=224').catch(function (error) {
      console.warn('Service worker registration failed:', error);
    });
  });
})();
